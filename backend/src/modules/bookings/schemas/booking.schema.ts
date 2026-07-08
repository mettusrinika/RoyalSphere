import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BookingDocument = Booking & Document;

export enum BookingStatus {
  PENDING = 'pending',

  ACCEPTED = 'accepted',

  REJECTED = 'rejected',

  PAYMENT_PENDING = 'payment_pending',

  CONFIRMED = 'confirmed',

  IN_PROGRESS = 'in_progress',

  COMPLETED = 'completed',

  CANCELLED = 'cancelled',

  REFUNDED = 'refunded',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

@Schema({
  timestamps: true,
  collection: 'bookings',
})
export class Booking {
  @Prop({
    unique: true,
    required: true,
    index: true,
  })
  bookingNumber: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  customerId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  vendorId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Service',
    required: true,
    index: true,
  })
  serviceId: Types.ObjectId;

  @Prop({
    enum: BookingStatus,
    default: BookingStatus.PENDING,
    index: true,
  })
  status: BookingStatus;

  @Prop({
    required: true,
  })
  eventDate: Date;

  @Prop()
  eventEndDate?: Date;

  @Prop({
    required: true,
    trim: true,
  })
  eventLocation: string;

  @Prop()
  eventLatitude?: number;

  @Prop()
  eventLongitude?: number;

  @Prop({
    type: {
      eventType: String,
      guestCount: Number,
      specialRequirements: String,
      packageName: String,
    },
    default: {},
  })
  eventDetails: {
    eventType: string;
    guestCount: number;
    specialRequirements: string;
    packageName: string;
  };

  @Prop({
    required: true,
    min: 0,
  })
  amount: number;

  @Prop({
    default: 0,
    min: 0,
  })
  commission: number;

  @Prop({
    default: 0,
    min: 0,
  })
  vendorPayout: number;

  @Prop({
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
    index: true,
  })
  paymentStatus: PaymentStatus;

  @Prop({
    type: Types.ObjectId,
    ref: 'Payment',
    default: null,
  })
  paymentId?: Types.ObjectId;

  // -------------------------
  // Vendor Decision
  // -------------------------

  @Prop({
    default: null,
  })
  rejectionReason?: string;

  @Prop({
    default: null,
  })
  vendorAcceptedAt?: Date;

  @Prop({
    default: null,
  })
  rejectedAt?: Date;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    default: null,
  })
  acceptedBy?: Types.ObjectId;

  // -------------------------
  // Cancellation
  // -------------------------

  @Prop({
    default: null,
  })
  cancellationReason?: string;

  @Prop({
    default: null,
  })
  cancelledAt?: Date;

  @Prop({
  type: String,
  enum: ['customer', 'vendor', 'admin'],
  required: false,
})
cancelledBy?: 'customer' | 'vendor' | 'admin';

  // -------------------------
  // Completion
  // -------------------------

  @Prop({
    default: null,
  })
  startedAt?: Date;

  @Prop({
    default: null,
  })
  completedAt?: Date;

  @Prop({
    default: false,
  })
  reviewSubmitted: boolean;

  // -------------------------
  // Timeline
  // -------------------------

  @Prop({
    type: [
      {
        status: String,
        updatedAt: Date,
        updatedBy: String,
        note: String,
      },
    ],
    default: [],
  })
  statusHistory: {
    status: string;
    updatedAt: Date;
    updatedBy: string;
    note: string;
  }[];

  // -------------------------
  // Internal Notes
  // -------------------------

  @Prop({
    default: null,
  })
  adminNotes?: string;

  @Prop({
    default: null,
  })
  vendorNotes?: string;

  @Prop({
    default: null,
  })
  customerNotes?: string;
}

export const BookingSchema =
  SchemaFactory.createForClass(Booking);

BookingSchema.index({ bookingNumber: 1 });

BookingSchema.index({
  customerId: 1,
  createdAt: -1,
});

BookingSchema.index({
  vendorId: 1,
  createdAt: -1,
});

BookingSchema.index({
  serviceId: 1,
});

BookingSchema.index({
  status: 1,
});

BookingSchema.index({
  paymentStatus: 1,
});

BookingSchema.index({
  eventDate: 1,
});

BookingSchema.index({
  vendorId: 1,
  status: 1,
});

BookingSchema.index({
  customerId: 1,
  status: 1,
});