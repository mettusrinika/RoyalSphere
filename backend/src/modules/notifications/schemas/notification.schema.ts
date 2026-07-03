import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  BOOKING_REQUEST = 'booking_request',
  BOOKING_ACCEPTED = 'booking_accepted',
  BOOKING_REJECTED = 'booking_rejected',
  BOOKING_COMPLETED = 'booking_completed',
  BOOKING_CANCELLED = 'booking_cancelled',

  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAILED = 'payment_failed',
  PAYMENT_REFUNDED = 'payment_refunded',

  REVIEW_RECEIVED = 'review_received',
  REVIEW_REPLY = 'review_reply',

  VENDOR_APPROVED = 'vendor_approved',
  VENDOR_REJECTED = 'vendor_rejected',

  SERVICE_APPROVED = 'service_approved',
  SERVICE_REJECTED = 'service_rejected',

  NEW_MESSAGE = 'new_message',

  SYSTEM = 'system',
  ADMIN = 'admin',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

@Schema({
  timestamps: true,
  collection: 'notifications',
})
export class Notification {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
    maxlength: 120,
  })
  title: string;

  @Prop({
    required: true,
    trim: true,
    maxlength: 1000,
  })
  message: string;

  @Prop({
    enum: NotificationType,
    required: true,
    index: true,
  })
  type: NotificationType;

  @Prop({
    enum: NotificationPriority,
    default: NotificationPriority.NORMAL,
    index: true,
  })
  priority: NotificationPriority;

  @Prop({
    type: [String],
    enum: NotificationChannel,
    default: [NotificationChannel.IN_APP],
  })
  channels: NotificationChannel[];

  @Prop({
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @Prop({
    default: false,
  })
  isRead: boolean;

  @Prop()
  readAt?: Date;

  @Prop({
    type: Object,
    default: {},
  })
  data: Record<string, any>;

  @Prop()
  actionUrl?: string;

  @Prop({
    default: false,
  })
  isArchived: boolean;

  @Prop({
    default: false,
  })
  isDeleted: boolean;

  @Prop()
  deletedAt?: Date;

  @Prop()
  expiresAt?: Date;

  @Prop()
  scheduledFor?: Date;

  @Prop({
    default: 0,
  })
  retryCount: number;

  @Prop()
  lastAttemptAt?: Date;

  @Prop()
  deliveredAt?: Date;
}

export const NotificationSchema =
  SchemaFactory.createForClass(Notification);

/* ===========================
   Indexes
=========================== */

NotificationSchema.index({
  userId: 1,
  isRead: 1,
  createdAt: -1,
});

NotificationSchema.index({
  userId: 1,
  createdAt: -1,
});

NotificationSchema.index({
  userId: 1,
  type: 1,
});

NotificationSchema.index({
  priority: 1,
});

NotificationSchema.index({
  status: 1,
});

NotificationSchema.index({
  scheduledFor: 1,
});

NotificationSchema.index({
  expiresAt: 1,
});

NotificationSchema.index({
  createdAt: -1,
});

/* Auto delete after 90 days */

NotificationSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 60 * 60 * 24 * 90,
  },
);