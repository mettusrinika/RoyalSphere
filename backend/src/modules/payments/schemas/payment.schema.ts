import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';


export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true, collection: 'payments' })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'Booking', required: true })
  bookingId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  customerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  vendorId: Types.ObjectId;

  @Prop({ required: true })
  razorpayOrderId: string;

  @Prop()
  razorpayPaymentId: string;

  @Prop()
  razorpaySignature: string;

  // Added for transaction tracking
  @Prop()
  transactionId: string;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ default: 'INR' })
  currency: string;

  @Prop({
    enum: ['created', 'attempted', 'paid', 'failed', 'refunded'],
    default: 'created',
  })
  status: string;

  @Prop({ default: 10 })
  commissionPercent: number;

  @Prop({ default: 0 })
  commissionAmount: number;

  @Prop({ default: 0 })
  vendorPayoutAmount: number;

  @Prop({
    enum: ['pending', 'processed', 'failed'],
    default: 'pending',
  })
  payoutStatus: string;

  @Prop()
  payoutProcessedAt: Date;

  @Prop({ type: Object })
  razorpayResponse: Record<string, any>;

  @Prop()
  failureReason: string;

  @Prop()
  refundId: string;

  // Added for partial/full refund tracking
  @Prop({ default: 0, min: 0 })
  refundAmount: number;

  @Prop()
  refundedAt: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

PaymentSchema.index({ bookingId: 1 });
PaymentSchema.index({ customerId: 1 });
PaymentSchema.index({ vendorId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ createdAt: -1 });
PaymentSchema.index({ razorpayOrderId: 1 });
PaymentSchema.index({ transactionId: 1 });