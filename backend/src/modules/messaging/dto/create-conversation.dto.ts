import { IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConversationDto {
  @ApiProperty({
    description: 'Booking ID associated with the conversation',
    example: '6860a65fc7f5f31b61f6d912',
  })
  @IsMongoId()
  bookingId: string;
}
