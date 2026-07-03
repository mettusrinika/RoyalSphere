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

export enum ReviewReportReason {
  SPAM = 'spam',
  OFFENSIVE = 'offensive',
  FAKE = 'fake',
  HARASSMENT = 'harassment',
  MISLEADING = 'misleading',
  OTHER = 'other',
}

export class ReportReviewDto {
  @ApiProperty({
    enum: ReviewReportReason,
    example: ReviewReportReason.SPAM,
    description: 'Reason for reporting the review',
  })
  @IsEnum(ReviewReportReason)
  reason: ReviewReportReason;

  @ApiPropertyOptional({
    example:
      'This review contains promotional spam links.',
    description:
      'Additional details about the report',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}