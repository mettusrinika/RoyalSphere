import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsBooleanString,
} from 'class-validator';

import { Type } from 'class-transformer';

import {
  ApiPropertyOptional,
} from '@nestjs/swagger';

export enum ReviewSortBy {
  NEWEST = 'newest',
  OLDEST = 'oldest',
  HIGHEST = 'highest',
  LOWEST = 'lowest',
  HELPFUL = 'helpful',
}

export class ReviewQueryDto {
  @ApiPropertyOptional({
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    example: 5,
    description: 'Filter by rating (1-5)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({
    enum: ReviewSortBy,
    default: ReviewSortBy.NEWEST,
  })
  @IsOptional()
  @IsEnum(ReviewSortBy)
  sortBy?: ReviewSortBy =
    ReviewSortBy.NEWEST;

  @ApiPropertyOptional({
    example: 'true',
    description:
      'Return only verified purchase reviews',
  })
  @IsOptional()
  @IsBooleanString()
  verifiedOnly?: string;
}