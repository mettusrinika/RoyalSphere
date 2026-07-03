import {
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType } from '../schemas/message.schema';

export class SendMessageDto {
  @ApiProperty({
    description: 'Message content',
    example: 'Hello! I would like to discuss my booking.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content: string;

  @ApiPropertyOptional({ enum: MessageType, default: MessageType.TEXT })
  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType = MessageType.TEXT;

  @ApiPropertyOptional({
    description: 'Attachment URL',
    example: 'https://cdn.example.com/uploads/image.jpg',
  })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  fileUrl?: string;

  @ApiPropertyOptional({
    description: 'Reply to another message',
    example: '6860a65fc7f5f31b61f6d999',
  })
  @IsOptional()
  @IsMongoId()
  replyTo?: string;
}
