import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

import { ReviewStatus } from '../schemas/review.schema';

export class ModerateReviewDto {
  @ApiProperty({
    enum: ReviewStatus,
    example: ReviewStatus.APPROVED,
    description: 'Review status after moderation',
  })
  @IsEnum(ReviewStatus)
  status: ReviewStatus;

  @ApiPropertyOptional({
    example: 'Contains abusive language.',
    description: 'Reason for rejection (required when status is REJECTED)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;
}