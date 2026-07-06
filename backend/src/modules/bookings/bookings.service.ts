import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Booking, BookingDocument, BookingStatus } from './schemas/booking.schema';
import { Service, ServiceDocument } from '../services/schemas/service.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
    private notificationsService: NotificationsService,
  ) {}

  async createBooking(customerId: string, dto: any) {
  const service = await this.serviceModel.findById(dto.serviceId);

  if (!service)
    throw new NotFoundException('Service not found');

  if (service.status !== 'active')
    throw new BadRequestException(
      'Service is not available',
    );

  if (service.vendorId.toString() === customerId) {
    throw new BadRequestException(
      'You cannot book your own service',
    );
  }

  const existingBooking =
    await this.bookingModel.findOne({
      customerId: new Types.ObjectId(customerId),
      serviceId: new Types.ObjectId(dto.serviceId),
      eventDate: dto.eventDate,
      status: {
        $in: [
          BookingStatus.PENDING,
          BookingStatus.ACCEPTED,
          BookingStatus.IN_PROGRESS,
        ],
      },
    });

  if (existingBooking) {
    throw new BadRequestException(
      'You already have a booking for this service on the selected date.',
    );
  }

  const bookingNumber = `RS-${Date.now()}-${uuidv4()
    .slice(0, 6)
    .toUpperCase()}`;

  const authoritativeAmount = Number(service.basePrice);
  if (!Number.isFinite(authoritativeAmount) || authoritativeAmount <= 0) {
    throw new BadRequestException('Service price is invalid');
  }

  const booking = await this.bookingModel.create({
    bookingNumber,
    customerId: new Types.ObjectId(customerId),
    vendorId: service.vendorId,
    serviceId: new Types.ObjectId(dto.serviceId),
    eventDate: dto.eventDate,
    eventEndDate: dto.eventEndDate,
    eventLocation: dto.eventLocation,
    eventDetails: dto.eventDetails,
    amount: authoritativeAmount,
    commission: authoritativeAmount * 0.1,
    vendorPayout: authoritativeAmount * 0.9,
    statusHistory: [
      {
        status: BookingStatus.PENDING,
        updatedAt: new Date(),
        updatedBy: 'customer',
        note: 'Booking created',
      },
    ],
  });

  // Notify vendor
  await this.notificationsService.createNotification({
    userId: service.vendorId,
    title: 'New Booking Request',
    message: `You have a new booking request â€“ ${bookingNumber}`,
    type: NotificationType.BOOKING_REQUEST,
    actionUrl: `/dashboard/vendor/bookings/${booking._id}`,
    notifData: {
      bookingId: booking._id,
      bookingNumber,
    },
  });

  return booking;
}
  async getCustomerBookings(customerId: string, status?: string, page = 1, limit = 10) {
    const query: any = { customerId: new Types.ObjectId(customerId) };
    if (status) query.status = status;
    const skip = (page - 1) * limit;
    const [bookings, total] = await Promise.all([
      this.bookingModel.find(query)
        .populate('serviceId', 'name images basePrice')
        .populate('vendorId', 'firstName lastName vendorProfile avatar')
        .sort({ createdAt: -1 }).skip(skip).limit(limit),
      this.bookingModel.countDocuments(query),
    ]);
    return { bookings, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getVendorBookings(vendorId: string, status?: string, page = 1, limit = 10) {
    const query: any = { vendorId: new Types.ObjectId(vendorId) };
    if (status) query.status = status;
    const skip = (page - 1) * limit;
    const [bookings, total] = await Promise.all([
      this.bookingModel.find(query)
        .populate('serviceId', 'name images basePrice')
        .populate('customerId', 'firstName lastName email phone avatar')
        .sort({ createdAt: -1 }).skip(skip).limit(limit),
      this.bookingModel.countDocuments(query),
    ]);
    return { bookings, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getBookingById(id: string, userId: string) {
    const booking = await this.bookingModel.findById(id)
      .populate('serviceId')
      .populate('customerId', 'firstName lastName email phone avatar')
      .populate('vendorId', 'firstName lastName email phone avatar vendorProfile');
    if (!booking) throw new NotFoundException('Booking not found');

    const isOwner = booking.customerId._id.toString() === userId || booking.vendorId._id.toString() === userId;
    if (!isOwner) throw new ForbiddenException('Access denied');
    return booking;
  }

 async updateStatus(
  id: string,
  vendorId: string,
  status: BookingStatus,
  note?: string,
  reason?: string,
) {
  const booking = await this.bookingModel.findById(id);

  if (!booking)
    throw new NotFoundException(
      'Booking not found',
    );

  if (booking.vendorId.toString() !== vendorId)
    throw new ForbiddenException();

  const allowed: Partial<
    Record<BookingStatus, BookingStatus[]>
  > = {
    [BookingStatus.PENDING]: [
      BookingStatus.ACCEPTED,
      BookingStatus.REJECTED,
    ],

    [BookingStatus.ACCEPTED]: [
      BookingStatus.IN_PROGRESS,
      BookingStatus.CANCELLED,
    ],

    [BookingStatus.IN_PROGRESS]: [
      BookingStatus.COMPLETED,
    ],
  };

  if (
    !allowed[booking.status]?.includes(status)
  ) {
    throw new BadRequestException(
      `Cannot transition from ${booking.status} to ${status}`,
    );
  }

  booking.status = status;

  if (reason)
    booking.rejectionReason = reason;

  if (status === BookingStatus.ACCEPTED) {
    booking.vendorAcceptedAt = new Date();
  }

  if (status === BookingStatus.COMPLETED) {
    booking.completedAt = new Date();
  }

  booking.statusHistory.push({
    status,
    updatedAt: new Date(),
    updatedBy: 'vendor',
    note: note || '',
  });

  await booking.save();

  // Update service booking count
  if (
    status === BookingStatus.COMPLETED
  ) {
    await this.serviceModel.findByIdAndUpdate(
      booking.serviceId,
      {
        $inc: {
          bookingCount: 1,
        },
      },
    );
  }

  // Notify customer
  const notifMap: Partial<
    Record<
      BookingStatus,
      {
        title: string;
        type: NotificationType;
      }
    >
  > = {
    [BookingStatus.ACCEPTED]: {
      title: 'Booking Accepted!',
      type: NotificationType.BOOKING_ACCEPTED,
    },

    [BookingStatus.REJECTED]: {
      title: 'Booking Rejected',
      type: NotificationType.BOOKING_REJECTED,
    },

    [BookingStatus.COMPLETED]: {
      title: 'Service Completed',
      type: NotificationType.BOOKING_COMPLETED,
    },
  };

  if (notifMap[status]) {
    await this.notificationsService.createNotification({
      userId: booking.customerId,
      title: notifMap[status]!.title,
      message: `Your booking ${booking.bookingNumber} has been ${status}.`,
      type: notifMap[status]!.type,
      actionUrl: `/bookings/${booking._id}`,
      notifData: {
        bookingId: booking._id,
      },
    });
  }

  return booking;
}

  async cancelBooking(id: string, userId: string, reason: string) {
  const booking = await this.bookingModel.findById(id);
  if (!booking) throw new NotFoundException('Booking not found');

  const isCustomer = booking.customerId.toString() === userId;
  const isVendor = booking.vendorId.toString() === userId;

  if (!isCustomer && !isVendor) {
    throw new ForbiddenException();
  }

  if (
    [BookingStatus.COMPLETED, BookingStatus.CANCELLED].includes(
      booking.status,
    )
  ) {
    throw new BadRequestException('Cannot cancel this booking');
  }

  booking.status = BookingStatus.CANCELLED;
  booking.cancellationReason = reason;
  booking.cancelledBy = isCustomer ? 'customer' : 'vendor';

  booking.statusHistory.push({
  status: BookingStatus.CANCELLED,
  updatedAt: new Date(),
  updatedBy: isCustomer ? 'customer' : 'vendor',
  note: reason,
});
  await booking.save();

  return booking;
}


async getAdminBookings(
  page = 1,
  limit = 20,
  status?: string,
) {
  const query: any = {};

  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    this.bookingModel
      .find(query)
      .populate(
        'customerId',
        'firstName lastName email',
      )
      .populate(
        'vendorId',
        'firstName lastName email vendorProfile',
      )
      .populate(
        'serviceId',
        'name',
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    this.bookingModel.countDocuments(query),
  ]);

  return {
    bookings,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}
  async getUpcomingBookings(userId: string, role: string) {
    const now = new Date();
    const query: any = {
      eventDate: { $gte: now },
      status: { $in: [BookingStatus.ACCEPTED, BookingStatus.IN_PROGRESS] },
    };
    if (role === 'customer') query.customerId = new Types.ObjectId(userId);
    if (role === 'vendor') query.vendorId = new Types.ObjectId(userId);

    return this.bookingModel.find(query)
      .populate('serviceId', 'name images')
      .populate('customerId', 'firstName lastName')
      .populate('vendorId', 'firstName lastName vendorProfile')
      .sort({ eventDate: 1 })
      .limit(5);
  }
}

