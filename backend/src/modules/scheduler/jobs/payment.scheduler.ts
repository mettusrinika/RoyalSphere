import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Payment,
  PaymentDocument,
} from '../../payments/schemas/payment.schema';

import {
  Booking,
  BookingDocument,
  BookingStatus,
  PaymentStatus,
} from '../../bookings/schemas/booking.schema';

@Injectable()
export class PaymentScheduler {
  private readonly logger = new Logger(
    PaymentScheduler.name,
  );

  constructor(
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,

    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
  ) {}

  /**
   * Every 30 minutes
   * Expire old pending payments
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async expirePendingPayments() {

    this.logger.log(
      'Checking pending payments...',
    );

    const cutoff = new Date();
    cutoff.setMinutes(
      cutoff.getMinutes() - 30,
    );

    const pendingPayments =
      await this.paymentModel.find({
        status: PaymentStatus.PENDING,
        createdAt: {
          $lte: cutoff,
        },
      });

    for (const payment of pendingPayments) {

      payment.status =
        PaymentStatus.FAILED;

      await payment.save();

      await this.bookingModel.updateOne(
        {
          _id: payment.bookingId,
        },
        {
          status:
            BookingStatus.CANCELLED,
        },
      );

      this.logger.log(
        `Expired payment ${payment._id}`,
      );
    }

    this.logger.log(
      `Processed ${pendingPayments.length} pending payments.`,
    );
  }

  /**
   * Daily reconciliation
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async reconcilePayments() {

    this.logger.log(
      'Running payment reconciliation...',
    );

    const totalPaid =
      await this.paymentModel.countDocuments({
        status: PaymentStatus.PAID,
      });

    const totalPending =
      await this.paymentModel.countDocuments({
        status: PaymentStatus.PENDING,
      });

    const totalFailed =
      await this.paymentModel.countDocuments({
        status: PaymentStatus.FAILED,
      });

    this.logger.log(
      `
Paid: ${totalPaid}
Pending: ${totalPending}
Failed: ${totalFailed}
      `,
    );
  }
}