import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { VerifyPaymentDto } from './dto/verify-payment.dto';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
  ) {}

  @Post('create-order/:bookingId')
  @Roles('customer')
  createOrder(
    @Request() req,
    @Param('bookingId') bookingId: string,
  ) {
    return this.paymentsService.createOrder(
      bookingId,
      req.user._id.toString(),
    );
  }

  @Post('verify')
  @Roles('customer')
  verify(
    @Request() req,
    @Body() dto: VerifyPaymentDto,
  ) {
    return this.paymentsService.verifyPayment(
      dto,
      req.user._id.toString(),
    );
  }

  @Get('history')
  getHistory(
    @Request() req,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.paymentsService.getPaymentHistory(
      req.user._id.toString(),
      req.user.role,
      +page,
      +limit,
    );
  }

  @Get('admin/all')
  @Roles('admin')
  getAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.paymentsService.getAdminPayments(
      +page,
      +limit,
    );
  }

  @Post('refund/:paymentId')
  @Roles('admin')
  refund(
    @Param('paymentId') paymentId: string,
    @Body() body: { amount: number; reason: string },
  ) {
    return this.paymentsService.refundPayment(
      paymentId,
      body.amount,
      body.reason,
    );
  }
}
