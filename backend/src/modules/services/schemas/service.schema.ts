import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ServiceDocument = Service & Document;

export enum ServiceStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

@Schema({
  timestamps: true,
  collection: 'services',
})
export class Service {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  vendorId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Category',
    required: true,
  })
  categoryId: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    required: true,
    trim: true,
  })
  description: string;

  @Prop({
    type: [String],
    default: [],
  })
  images: string[];

  @Prop({
    type: [String],
    default: [],
  })
  imagePublicIds: string[];

  @Prop({
    required: true,
    min: 0,
  })
  basePrice: number;

  @Prop({
    default: 'INR',
  })
  currency: string;

  @Prop({
    enum: ['per_hour', 'per_day', 'per_event', 'fixed'],
    default: 'fixed',
  })
  priceType: string;

  @Prop({
    type: [String],
    default: [],
  })
  tags: string[];

  @Prop({
    type: {
      city: String,
      state: String,
      serviceRadius: Number,
    },
  })
  location: {
    city: string;
    state: string;
    serviceRadius: number;
  };

  // ===========================
  // SERVICE MODERATION
  // ===========================

  @Prop({
  enum: ServiceStatus,
  default: ServiceStatus.ACTIVE,
})
status: ServiceStatus;

  @Prop({
    default: null,
  })
  rejectionReason?: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    default: null,
  })
  approvedBy?: Types.ObjectId;

  @Prop({
    default: null,
  })
  approvedAt?: Date;

  @Prop({
    default: false,
  })
  featured: boolean;

  // ===========================
  // ANALYTICS
  // ===========================

  @Prop({
    default: 0,
  })
  rating: number;

  @Prop({
    default: 0,
  })
  reviewCount: number;

  @Prop({
    default: 0,
  })
  bookingCount: number;

  @Prop({
    default: 0,
  })
  viewCount: number;

  @Prop({
    default: 0,
  })
  conversionRate: number;

  // ===========================
  // AVAILABILITY
  // ===========================

  @Prop({
    type: {
      workingDays: [String],
      startTime: String,
      endTime: String,
      blockedDates: [Date],
    },
  })
  availability: {
    workingDays: string[];
    startTime: string;
    endTime: string;
    blockedDates: Date[];
  };

  // ===========================
  // PACKAGES
  // ===========================

  @Prop({
    type: [
      {
        name: String,
        description: String,
        price: Number,
        features: [String],
      },
    ],
    default: [],
  })
  packages: Array<{
    name: string;
    description: string;
    price: number;
    features: string[];
  }>;

  // ===========================
  // AI
  // ===========================

  @Prop({
    default: 0,
  })
  relevanceScore: number;

  @Prop({
    default: 0,
  })
  trendingScore: number;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);

// ===========================
// INDEXES
// ===========================

ServiceSchema.index({ vendorId: 1 });

ServiceSchema.index({ categoryId: 1 });

ServiceSchema.index({
  status: 1,
  rating: -1,
});

ServiceSchema.index({
  'location.city': 1,
});

ServiceSchema.index({
  tags: 1,
});

ServiceSchema.index({
  basePrice: 1,
});

ServiceSchema.index({
  trendingScore: -1,
});

ServiceSchema.index({
  featured: 1,
});

ServiceSchema.index({
  name: 'text',
  description: 'text',
  tags: 'text',
});