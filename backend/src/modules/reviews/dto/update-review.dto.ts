import {
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

import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateReviewDto {
  @ApiPropertyOptional({
    example: 4,
    minimum: 1,
    maximum: 5,
    description: 'Updated rating',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({
    example:
      'Updating my review after the event. Overall the experience was very good.',
    description: 'Updated review comment',
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  comment?: string;

  @ApiPropertyOptional({
    type: [String],
    example: [
      'https://cdn.OMIQORA.com/reviews/image1.jpg',
      'https://cdn.OMIQORA.com/reviews/image2.jpg',
    ],
    description: 'Updated review images',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsUrl({}, { each: true })
  images?: string[];
}