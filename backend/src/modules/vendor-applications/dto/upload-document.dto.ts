import { IsEnum, IsNotEmpty } from 'class-validator';

export enum VendorDocumentType {
  AADHAAR = 'aadhaar',
  PAN = 'pan',
  GST = 'gst',
  BUSINESS_LICENSE = 'business_license',
  PROFILE_PHOTO = 'profile_photo',
  SHOP_PHOTO = 'shop_photo',
  PORTFOLIO = 'portfolio',
  WORK_PROOF = 'work_proof',
  ADDRESS_PROOF = 'address_proof',
  OTHER = 'other',
}

export class UploadDocumentDto {
  @IsEnum(VendorDocumentType, {
    message:
      'Document type must be one of: aadhaar, pan, gst, business_license, profile_photo, shop_photo, portfolio, work_proof, address_proof, other',
  })
  @IsNotEmpty()
  type: VendorDocumentType;
}