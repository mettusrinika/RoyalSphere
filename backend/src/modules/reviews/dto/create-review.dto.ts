import {
  IsMongoId,
  IsInt,
  Min,
  Max,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsArray,
  ArrayMaxSize,
  IsUrl,
} from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({
    example: '685a3a4c0e8cfd3c5c76d111',
    description: 'Booking ID',
  })
  @IsMongoId()
  bookingId: string;

  @ApiProperty({
    example: 5,
    minimum: 1,
    maximum: 5,
    description: 'Rating from 1 to 5',
  })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    example:
      'Excellent service. The vendor arrived on time and exceeded expectations.',
    description: 'Customer review',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  comment: string;

  @ApiPropertyOptional({
    type: [String],
    example: [
      'https://cdn.royalsphere.com/reviews/image1.jpg',
      'https://cdn.royalsphere.com/reviews/image2.jpg',
    ],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsUrl({}, { each: true })
  images?: string[];
}