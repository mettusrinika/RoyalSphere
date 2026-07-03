import {
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class ReplyReviewDto {
  @ApiProperty({
    example:
      'Thank you for your valuable feedback. We are happy you enjoyed our service.',
    description: 'Vendor reply to the customer review',
  })
  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  reply: string;
}