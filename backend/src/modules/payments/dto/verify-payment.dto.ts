
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class VerifyPaymentDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Booking ID',
  })
  @IsString()
  @IsNotEmpty()
  bookingId: string;
  @ApiProperty({
    example: 'order_Q2d8hQdR2qX2ab',
    description: 'Razorpay Order ID',
  })
  @IsString()
  @IsNotEmpty()
  razorpayOrderId: string;

  @ApiProperty({
    example: 'pay_Q2d9hQdR2qX2ab',
    description: 'Razorpay Payment ID',
  })
  @IsString()
  @IsNotEmpty()
  razorpayPaymentId: string;

  @ApiProperty({
    example: '8d7c1d6e9f8a5b4c3d2e1f...',
    description: 'Razorpay Signature',
  })
  @IsString()
  @IsNotEmpty()
  razorpaySignature: string;
}
