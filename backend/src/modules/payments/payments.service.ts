
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
const Razorpay = require('razorpay');

import { Payment, PaymentDocument } from './schemas/payment.schema';
import {
  Booking,
  BookingDocument,
  BookingStatus,
} from '../bookings/schemas/booking.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';
import { MessagingService } from '../messaging/messaging.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private razorpay: any;

  constructor(
    @InjectModel(Payment.name)
    private paymentModel: Model<PaymentDocument>,

    @InjectModel(Booking.name)
    private bookingModel: Model<BookingDocument>,

    private configService: ConfigService,

    private notificationsService: NotificationsService,
    private readonly messagingService: MessagingService,
  ) {
    this.razorpay = new Razorpay({
      key_id: this.configService.get('RAZORPAY_KEY_ID'),
      key_secret: this.configService.get('RAZORPAY_KEY_SECRET'),
    });
  }
  

  async createOrder(
    bookingId: string,
    customerId: string,
  ) {
    const booking = await this.bookingModel.findById(
      bookingId,
    );

    if (!booking) {
      throw new NotFoundException(
        'Booking not found',
      );
    }
    
    if (
      booking.customerId.toString() !== customerId
    ) {
      throw new BadRequestException(
        'Access denied',
      );
    }
    await this.messagingService.createConversation(
  booking._id.toString(),
  booking.customerId.toString(),
);

    if (booking.paymentStatus === 'paid') {
      throw new BadRequestException(
        'Booking already paid',
      );
    }
    


    const amountInPaise = Math.round(
      booking.amount * 100,
    );

    let order;

try {
  order = await this.razorpay.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt: booking.bookingNumber,
    notes: {
      bookingId,
      customerId,
    },
  });
} catch (error: any) {
  this.logger.error(
    'Razorpay order creation failed',
    error?.error || error,
  );

  throw new BadRequestException(
    error?.error?.description ||
      'Unable to create payment order.',
  );
}

    const payment =
      await this.paymentModel.create({
        bookingId: new Types.ObjectId(
          bookingId,
        ),
        customerId: new Types.ObjectId(
          customerId,
        ),
        vendorId: booking.vendorId,

        razorpayOrderId: order.id,

        amount: booking.amount,

        commissionAmount:
          booking.commission,

        vendorPayoutAmount:
          booking.vendorPayout,
      });

    return {
      orderId: order.id,
      amount: amountInPaise,
      currency: 'INR',
      key: this.configService.get(
        'RAZORPAY_KEY_ID',
      ),
      paymentId: payment._id,
      bookingNumber:
        booking.bookingNumber,
    };
  }

  async verifyPayment(
    dto: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
      bookingId: string;
    },
    customerId: string,
  ) {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      bookingId,
    } = dto;
    const paymentRecord = await this.paymentModel.findOne({
      razorpayOrderId,
    });

    if (!paymentRecord) {
      throw new NotFoundException(
        'Payment order not found',
      );
    }

    if (
      paymentRecord.customerId.toString() !== customerId ||
      paymentRecord.bookingId.toString() !== bookingId
    ) {
      throw new BadRequestException(
        'Payment does not belong to this booking',
      );
    }

    if (paymentRecord.status === 'paid') {
      return {
        success: true,
        message: 'Payment already verified',
        payment: paymentRecord,
      };
    }

    const body =
      razorpayOrderId +
      '|' +
      razorpayPaymentId;

    const expectedSignature = crypto
      .createHmac(
        'sha256',
        this.configService.get(
          'RAZORPAY_KEY_SECRET',
        ),
      )
      .update(body)
      .digest('hex');

    if (
      expectedSignature !==
      razorpaySignature
    ) {
      await this.paymentModel.findOneAndUpdate(
        {
          razorpayOrderId,
        },
        {
          status: 'failed',
          failureReason:
            'Signature mismatch',
        },
      );

      throw new BadRequestException(
        'Payment verification failed',
      );
    }
    const razorpayPayment =
      await this.razorpay.payments.fetch(
        razorpayPaymentId,
      );

    if (
      razorpayPayment.order_id !== razorpayOrderId ||
      Number(razorpayPayment.amount) !==
        Math.round(paymentRecord.amount * 100)
    ) {
      throw new BadRequestException(
        'Payment order or amount mismatch',
      );
    }
    const payment =
      await this.paymentModel.findOneAndUpdate(
        {
          razorpayOrderId,
        },
        {
          razorpayPaymentId,
          razorpaySignature,
          transactionId:
            razorpayPaymentId,
          razorpayResponse: dto,
          paymentMethod: razorpayPayment.method,
bank: razorpayPayment.bank,
wallet: razorpayPayment.wallet,
email: razorpayPayment.email,
contact: razorpayPayment.contact,
          status: 'paid',
        },
        {
          new: true,
        },
      );

    if (!payment) {
      throw new NotFoundException(
        'Payment not found',
      );
    }

    await this.bookingModel.findByIdAndUpdate(
      bookingId,
      {
        paymentStatus: 'paid',
        paymentId: payment._id,

        status:
          BookingStatus.ACCEPTED,

        $push: {
          statusHistory: {
            status:
              BookingStatus.ACCEPTED,
            updatedAt: new Date(),
            updatedBy: 'system',
            note:
              'Payment received successfully',
          },
        },
      },
    );

    const booking =
      await this.bookingModel.findById(
        bookingId,
      );

    if (!booking) {
      throw new NotFoundException(
        'Booking not found',
      );
    }

    await Promise.all([
      this.notificationsService.createNotification(
        {
          userId: booking.customerId,

          title:
            'Payment Successful',

          message: `Payment of â‚¹${booking.amount} for booking ${booking.bookingNumber} was successful.`,

          type:
            NotificationType.PAYMENT_SUCCESS,

          actionUrl: `/bookings/${bookingId}`,
        },
      ),

      this.notificationsService.createNotification(
        {
          userId: booking.vendorId,

          title:
            'Payment Received',

          message: `Payment received for booking ${booking.bookingNumber}. Vendor payout: â‚¹${booking.vendorPayout}`,

          type:
            NotificationType.PAYMENT_SUCCESS,

          actionUrl: `/dashboard/vendor/bookings/${bookingId}`,
        },
      ),
    ]);

    return {
      success: true,
      payment,
      booking,
    };
  }
  
  async getPaymentHistory(
    userId: string,
    role: string,
    page = 1,
    limit = 10,
  ) {
    const query: any = {};

    if (role === 'customer') {
      query.customerId = new Types.ObjectId(userId);
    }

    if (role === 'vendor') {
      query.vendorId = new Types.ObjectId(userId);
    }

    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      this.paymentModel
        .find(query)
        .populate(
          'bookingId',
          'bookingNumber eventDate eventLocation',
        )
        .populate(
          'customerId',
          'firstName lastName',
        )
        .populate(
          'vendorId',
          'firstName lastName vendorProfile',
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      this.paymentModel.countDocuments(query),
    ]);

    return {
      payments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPaymentDetail(paymentId: string, userId: string, role: string) {
    if (!Types.ObjectId.isValid(paymentId)) throw new BadRequestException('Invalid payment ID');
    const payment: any = await this.paymentModel.findById(paymentId)
      .populate({ path: 'bookingId', select: 'bookingNumber eventDate eventEndDate eventLocation serviceId amount paymentStatus status', populate: { path: 'serviceId', select: 'name images priceType basePrice' } })
      .populate('customerId', 'firstName lastName email')
      .populate('vendorId', 'firstName lastName vendorProfile')
      .lean();
    if (!payment) throw new NotFoundException('Payment not found');
    const customerId = payment.customerId?._id?.toString?.() ?? payment.customerId?.toString?.();
    const vendorId = payment.vendorId?._id?.toString?.() ?? payment.vendorId?.toString?.();
    if (role !== 'admin' && customerId !== userId && vendorId !== userId) throw new ForbiddenException('You cannot access this payment');
    return payment;
  }

  async getAdminPayments(
    page = 1,
    limit = 20,
  ) {
    const skip = (page - 1) * limit;

    const [payments, total, stats] =
      await Promise.all([
        this.paymentModel
          .find()
          .populate(
            'bookingId',
            'bookingNumber',
          )
          .populate(
            'customerId',
            'firstName lastName email',
          )
          .populate(
            'vendorId',
            'firstName lastName vendorProfile',
          )
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),

        this.paymentModel.countDocuments(),

        this.paymentModel.aggregate([
          {
            $match: {
              status: 'paid',
            },
          },
          {
            $group: {
              _id: null,
              totalRevenue: {
                $sum: '$amount',
              },
              totalCommission: {
                $sum: '$commissionAmount',
              },
              totalVendorPayout: {
                $sum: '$vendorPayoutAmount',
              },
            },
          },
        ]),
      ]);

    return {
      payments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: stats[0] || {
        totalRevenue: 0,
        totalCommission: 0,
        totalVendorPayout: 0,
      },
    };
  }

  async refundPayment(
    paymentId: string,
    amount: number,
    reason: string,
  ) {
    const payment =
      await this.paymentModel.findById(
        paymentId,
      );

    if (!payment) {
      throw new NotFoundException(
        'Payment not found',
      );
    }

    if (payment.status !== 'paid') {
      throw new BadRequestException(
        'Only paid payments can be refunded',
      );
    }

    payment.status = 'refunded';
    payment.refundedAt = new Date();
    payment.failureReason = reason;
    payment.refundAmount = amount;

    await payment.save();

    await this.bookingModel.findByIdAndUpdate(
      payment.bookingId,
      {
        paymentStatus: 'refunded',
        status: BookingStatus.REFUNDED,
        $push: {
          statusHistory: {
            status:
              BookingStatus.REFUNDED,
            updatedAt: new Date(),
            updatedBy: 'admin',
            note: reason,
          },
        },
      },
    );

    await this.notificationsService.createNotification(
      {
        userId: payment.customerId,
        title: 'Refund Processed',
        message: `â‚¹${amount} has been refunded successfully.`,
        type:
          NotificationType.PAYMENT_SUCCESS,
        actionUrl: `/payments`,
      },
    );

    return {
      success: true,
      message:
        'Refund processed successfully',
    };
  }
}
