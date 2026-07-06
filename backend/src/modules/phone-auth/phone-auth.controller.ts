import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PhoneAuthService } from './phone-auth.service';

@ApiTags('Auth')
@Controller('auth')
export class PhoneAuthController {
  constructor(private readonly service: PhoneAuthService) {}

  @Post('phone-otp/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request mobile OTP' })
  request(@Body() body: { phone: string }) {
    return this.service.requestOtp(body.phone);
  }

  @Post('phone-otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify mobile OTP and login/register' })
  verify(@Body() body: { phone: string; otp: string }) {
    return this.service.verifyOtp(body.phone, body.otp);
  }
}