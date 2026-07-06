import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConversationDocument = Conversation & Document;

export enum ConversationStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  CLOSED = 'closed',
}

@Schema({
  timestamps: true,
  collection: 'conversations',
})
export class Conversation {
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
    ref: 'Booking',
    required: true,
    unique: true,
    index: true,
  })
  bookingId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Service',
    required: true,
    index: true,
  })
  serviceId: Types.ObjectId;

  @Prop({
    default: '',
    trim: true,
  })
  lastMessage: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
  })
  lastMessageBy?: Types.ObjectId;

  @Prop({
    default: null,
  })
  lastMessageAt?: Date;

  @Prop({
    default: 0,
    min: 0,
  })
  unreadCustomer: number;

  @Prop({
    default: 0,
    min: 0,
  })
  unreadVendor: number;

  @Prop({
    enum: ConversationStatus,
    default: ConversationStatus.ACTIVE,
  })
  status: ConversationStatus;

  @Prop({
    default: false,
  })
  customerArchived: boolean;

  @Prop({
    default: false,
  })
  vendorArchived: boolean;

  @Prop({
    default: false,
  })
  customerMuted: boolean;

  @Prop({
    default: false,
  })
  vendorMuted: boolean;

  @Prop({
    default: false,
  })
  isBlocked: boolean;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
  })
  blockedBy?: Types.ObjectId;

  @Prop()
  blockedAt?: Date;

  @Prop({
    default: false,
  })
  isDeleted: boolean;

  @Prop()
  deletedAt?: Date;
}

export const ConversationSchema =
  SchemaFactory.createForClass(Conversation);


ConversationSchema.index({
  customerId: 1,
  lastMessageAt: -1,
});

ConversationSchema.index({
  vendorId: 1,
  lastMessageAt: -1,
});


ConversationSchema.index({
  serviceId: 1,
});

ConversationSchema.index(
  { customerId: 1, vendorId: 1, bookingId: 1, serviceId: 1 },
  { unique: true, name: 'uniq_customer_vendor_booking_service' },
);

ConversationSchema.index({
  status: 1,
});