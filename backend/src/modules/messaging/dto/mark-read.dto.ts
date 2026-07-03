import { IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MarkReadDto {
  @ApiProperty({
    description: 'Conversation ID',
    example: '6860a65fc7f5f31b61f6d912',
  })
  @IsMongoId()
  conversationId: string;
}
