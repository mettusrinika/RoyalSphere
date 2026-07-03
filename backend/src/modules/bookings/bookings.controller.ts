import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Request,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BookingStatus } from './schemas/booking.schema';

@ApiTags('Bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  @Post()
  @Roles('customer')
  create(@Request() req, @Body() dto: any) {
    return this.bookingsService.createBooking(req.user._id.toString(), dto);
  }

  @Get('my')
  getMyBookings(@Request() req, @Query('status') status?: string, @Query('page') page = 1, @Query('limit') limit = 10) {
    if (req.user.role === 'vendor') {
      return this.bookingsService.getVendorBookings(req.user._id.toString(), status, +page, +limit);
    }
    return this.bookingsService.getCustomerBookings(req.user._id.toString(), status, +page, +limit);
  }

  @Get('upcoming')
  getUpcoming(@Request() req) {
    return this.bookingsService.getUpcomingBookings(req.user._id.toString(), req.user.role);
  }

  @Get('admin/all')
  @Roles('admin')
  getAll(@Query('page') page = 1, @Query('limit') limit = 20, @Query('status') status?: string) {
    return this.bookingsService.getAdminBookings(+page, +limit, status);
  }

  @Get(':id')
  getById(@Request() req, @Param('id') id: string) {
    return this.bookingsService.getBookingById(id, req.user._id.toString());
  }

  @Patch(':id/status')
@Roles('vendor')
updateStatus(
  @Request() req,
  @Param('id') id: string,
  @Body()
  body: {
    status: BookingStatus;
    note?: string;
    reason?: string;
  },
) {
  return this.bookingsService.updateStatus(
    id,
    req.user._id.toString(),
    body.status,
    body.note,
    body.reason,
  );
}

  @Patch(':id/cancel')
  cancel(@Request() req, @Param('id') id: string, @Body('reason') reason: string) {
    return this.bookingsService.cancelBooking(id, req.user._id.toString(), reason);
  }
}
