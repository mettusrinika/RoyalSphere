import {
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

import {
  ApiProperty,
} from '@nestjs/swagger';

export class EditMessageDto {
  @ApiProperty({
    example: 'Updated message',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content: string;
}