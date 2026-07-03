
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class RefundPaymentDto {
  @ApiProperty({
    example: 5000,
    description: 'Refund amount',
  })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({
    example: 'Customer cancelled the booking',
    description: 'Reason for refund',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({
    example: 'full',
    description: 'Refund type (full/partial)',
    required: false,
  })
  @IsOptional()
  @IsString()
  refundType?: string;
}
