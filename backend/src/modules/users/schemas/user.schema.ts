import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  CUSTOMER = 'customer',
  VENDOR = 'vendor',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
  DELETED = 'deleted',
}

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ enum: UserRole, default: UserRole.CUSTOMER })
  role: UserRole;

  @Prop({ enum: UserStatus, default: UserStatus.PENDING_VERIFICATION })
  status: UserStatus;

  @Prop({ trim: true })
  phone: string;

  @Prop({ default: false })
  phoneVerified: boolean;

  @Prop({ select: false })
  phoneOtpHash?: string;

  @Prop({ select: false })
  phoneOtpExpiry?: Date;

  @Prop({ default: 0, select: false })
  phoneOtpAttempts: number;

  @Prop({ select: false })
  phoneOtpLastSentAt?: Date;

  @Prop()
  avatar: string;

  @Prop()
  avatarPublicId: string;

  @Prop({ type: Object })
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    formattedAddress?: string;
    latitude?: number;
    longitude?: number;
    placeId?: string;
  };

  @Prop({ default: false })
  profileCompleted: boolean;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop()
  emailVerificationToken: string;

  @Prop()
  emailVerificationExpiry: Date;

  @Prop()
  passwordResetToken: string;

  @Prop()
  passwordResetExpiry: Date;

  @Prop({ type: [String], default: [] })
  refreshTokens: string[];

  @Prop({ default: 0 })
  profileCompletion: number;

  // Vendor-specific
  @Prop({ type: Types.ObjectId, ref: 'VendorApplication' })
  vendorApplicationId: Types.ObjectId;

  @Prop({ default: false })
  isVendorApproved: boolean;

  @Prop({
  type: {
    businessName: String,
    businessDescription: String,
    categories: [String],
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    completedBookings: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    verificationBadge: { type: String, default: '' },
  },
  default: {},
})
vendorProfile: {
  businessName: string;
  businessDescription: string;
  categories: string[];
  rating: number;
  reviewCount: number;
  completedBookings: number;
  totalEarnings: number;
  isVerified: boolean;
  verificationBadge: string;
};

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Service' }] })
  savedServices: Types.ObjectId[];

  @Prop()
  lastLoginAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ phone: 1 }, { unique: true, sparse: true });
UserSchema.index({ role: 1, status: 1 });
UserSchema.index({ 'vendorProfile.rating': -1 });
UserSchema.index({ createdAt: -1 });

// Virtual: full name
UserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Auto-calculate profile completion
UserSchema.pre('save', function (next) {
  let score = 0;
  if (this.firstName && this.lastName) score += 20;
  if (this.email && this.emailVerified) score += 20;
  if (this.phone && this.phoneVerified) score += 20;
  if (this.avatar) score += 20;
  if (this.address?.city) score += 20;
  this.profileCompletion = score;
  this.profileCompleted = score >= 60;
  next();
});
