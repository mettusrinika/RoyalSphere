import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsPhoneNumber,
  IsUrl,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateVendorApplicationDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  businessName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(20)
  @MaxLength(1000)
  businessDescription: string;

  @IsArray()
  @IsString({ each: true })
  categories: string[];

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  city: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  state: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  address: string;

  @IsPhoneNumber('IN')
  businessPhone: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsString()
  gstNumber?: string;

  @IsOptional()
  @IsString()
  panNumber?: string;

  @IsOptional()
  @IsString()
  experience?: string;

  @IsOptional()
  @IsString()
  instagram?: string;

  @IsOptional()
  @IsString()
  facebook?: string;

  @IsOptional()
  @IsString()
  youtube?: string;
}