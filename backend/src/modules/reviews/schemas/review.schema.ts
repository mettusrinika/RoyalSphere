import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReviewDocument = Review & Document;

export enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum ReviewReportStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  DISMISSED = 'dismissed',
}

@Schema({
  _id: false,
})
export class ReviewReport {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  reporterId: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
    maxlength: 100,
  })
  reason: string;

  @Prop({
    default: '',
    trim: true,
    maxlength: 1000,
  })
  description: string;

  @Prop({
    enum: ReviewReportStatus,
    default: ReviewReportStatus.PENDING,
  })
  status: ReviewReportStatus;

  @Prop({
    default: Date.now,
  })
  reportedAt: Date;
}

export const ReviewReportSchema =
  SchemaFactory.createForClass(ReviewReport);

@Schema({
  timestamps: true,
  collection: 'reviews',
})
export class Review {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  customerId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  vendorId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Service',
    required: true,
  })
  serviceId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true,
  })
  bookingId: Types.ObjectId;

  @Prop({
    required: true,
    min: 1,
    max: 5,
  })
  rating: number;

  @Prop({
    required: true,
    minlength: 10,
    maxlength: 1000,
    trim: true,
  })
  comment: string;

  @Prop({
    type: [String],
    default: [],
  })
  images: string[];

  @Prop({
    enum: ReviewStatus,
    default: ReviewStatus.APPROVED,
  })
  status: ReviewStatus;

  @Prop({
    default: null,
  })
  vendorReply: string | null;

  @Prop({
    default: null,
  })
  vendorRepliedAt: Date | null;

  @Prop({
    default: false,
  })
  isVerifiedPurchase: boolean;

  @Prop({
    default: 0,
    min: 0,
  })
  helpfulCount: number;

  @Prop({
    type: [
      {
        type: Types.ObjectId,
        ref: 'User',
      },
    ],
    default: [],
  })
  helpfulUserIds: Types.ObjectId[];

  @Prop({
    type: [ReviewReportSchema],
    default: [],
  })
  reports: ReviewReport[];

  @Prop({
    default: 0,
    min: 0,
  })
  reportCount: number;

  @Prop({
    default: null,
  })
  rejectionReason: string | null;

  @Prop({
    default: false,
  })
  edited: boolean;

  @Prop({
    default: null,
  })
  editedAt: Date | null;
}

export const ReviewSchema =
  SchemaFactory.createForClass(Review);

ReviewSchema.index({
  vendorId: 1,
  createdAt: -1,
});

ReviewSchema.index({
  serviceId: 1,
  createdAt: -1,
});

ReviewSchema.index({
  customerId: 1,
  createdAt: -1,
});

ReviewSchema.index(
  {
    bookingId: 1,
  },
  {
    unique: true,
  },
);

ReviewSchema.index({
  rating: -1,
});

ReviewSchema.index({
  status: 1,
});

ReviewSchema.index({
  reportCount: -1,
  status: 1,
});