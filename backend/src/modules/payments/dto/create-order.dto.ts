
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsMongoId,
  IsOptional,
  IsString,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({
    example: '686a1234567890abcdef1234',
    description: 'Booking ID',
  })
  @IsMongoId()
  bookingId: string;

  @ApiPropertyOptional({
    example: 25000,
    description: 'Override booking amount (optional)',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  amount?: number;

  @ApiPropertyOptional({
    example: 'INR',
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    example: 'Advance payment for booking',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
