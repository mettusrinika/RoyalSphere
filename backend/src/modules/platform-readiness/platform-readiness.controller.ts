import { Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PlatformReadinessService } from './platform-readiness.service';

@ApiTags('Platform Readiness')
@Controller('platform')
export class PlatformReadinessController {
  constructor(private readonly service: PlatformReadinessService) {}

  @Post('vendor/kyc/submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  submitKyc(@Request() req, @Body() body: { provider?: string }) {
    return this.service.submitKyc(req.user._id.toString(), body.provider);
  }

  @Post('vendor/payout-onboarding')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  payout(@Request() req, @Body() body: {
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  }) {
    return this.service.submitPayout(req.user._id.toString(), body);
  }

  @Get('vendor/readiness')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  readiness(@Request() req) {
    return this.service.vendorReadiness(req.user._id.toString());
  }

  @Get('serviceability')
  serviceability(
    @Query('serviceId') serviceId: string,
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
  ) {
    return this.service.checkServiceability(
      serviceId,
      Number(latitude),
      Number(longitude),
    );
  }
}