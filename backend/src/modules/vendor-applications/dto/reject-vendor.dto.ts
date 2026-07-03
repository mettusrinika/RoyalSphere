import {
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class RejectVendorDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10, {
    message: 'Rejection reason must be at least 10 characters.',
  })
  @MaxLength(500)
  reason: string;
}