import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VendorApplicationDocument = VendorApplication & Document;

export enum ApplicationStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Schema({ timestamps: true, collection: 'vendor_applications' })
export class VendorApplication {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  businessName: string;

  @Prop({ enum: ['individual', 'business'], required: true, default: 'individual' })
  vendorType: 'individual' | 'business';

  @Prop()
  businessRegistrationNumber?: string;

  @Prop({ required: true })
  businessDescription: string;

  @Prop({ type: [String], required: true })
  categories: string[];

  @Prop()
experience?: string;

@Prop({ required: true })
city: string;

@Prop({ required: true })
state: string;

@Prop({ required: true })
address: string;

@Prop({ required: true })
businessPhone: string;

@Prop()
website?: string;

@Prop()
instagram?: string;

@Prop()
facebook?: string;

@Prop()
youtube?: string;

  @Prop({ type: [Object], default: [] })
documents: Array<{
  type: string;
  url: string;
  publicId: string;
  uploadedAt: Date;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verifiedBy?: Types.ObjectId;
  verifiedAt?: Date;
  rejectionReason?: string;
}>;

  @Prop({ enum: ApplicationStatus, default: ApplicationStatus.PENDING })
  status: ApplicationStatus;

  @Prop()
  adminNotes: string;

  @Prop()
  rejectionReason: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reviewedBy: Types.ObjectId;

  @Prop()
  reviewedAt: Date;

  @Prop()
  gstNumber: string;

  @Prop()
  panNumber: string;

  @Prop({ type: Object, select: false })
  bankDetails: {
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };

  @Prop({ type: Object, default: {} })
  payoutOnboarding: {
    status: 'not_started' | 'details_submitted' | 'provider_pending' | 'active' | 'restricted';
    provider?: string;
    providerAccountId?: string;
    accountLast4?: string;
    ifscCode?: string;
    bankName?: string;
    submittedAt?: Date;
    activatedAt?: Date;
    restrictionReason?: string;
  };

  @Prop({ type: Object, default: {} })
  kyc: {
    status: 'not_started' | 'documents_submitted' | 'provider_pending' | 'verified' | 'rejected';
    provider?: string;
    providerReference?: string;
    submittedAt?: Date;
    verifiedAt?: Date;
    rejectionReason?: string;
  };

  @Prop({ type: [String], default: [] })
  portfolioLinks?: string[];

  @Prop({ type: Object })
  serviceLocation?: {
    formattedAddress?: string;
    city?: string;
    state?: string;
    pincode?: string;
    latitude?: number;
    longitude?: number;
    placeId?: string;
    serviceRadiusKm?: number;
  };
}

export const VendorApplicationSchema = SchemaFactory.createForClass(VendorApplication);
VendorApplicationSchema.index({ userId: 1 });
VendorApplicationSchema.index({ status: 1, createdAt: -1 });
