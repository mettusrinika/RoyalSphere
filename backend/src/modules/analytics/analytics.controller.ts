import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  // Admin
  @Get('admin/overview')
  @Roles('admin')
  adminOverview() { return this.analyticsService.getAdminOverview(); }

  @Get('admin/revenue-chart')
  @Roles('admin')
  revenueChart(@Query('months') months = 12) { return this.analyticsService.getRevenueChart(+months); }

  @Get('admin/user-growth')
  @Roles('admin')
  userGrowth(@Query('months') months = 12) { return this.analyticsService.getUserGrowthChart(+months); }

  @Get('admin/top-categories')
  @Roles('admin')
  topCategories() { return this.analyticsService.getTopCategories(); }

  @Get('admin/top-vendors')
  @Roles('admin')
  topVendors(@Query('limit') limit = 10) { return this.analyticsService.getTopVendors(+limit); }

  @Get('admin/booking-distribution')
  @Roles('admin')
  bookingDist() { return this.analyticsService.getBookingStatusDistribution(); }

  // Vendor
  @Get('vendor/overview')
  @Roles('vendor')
  vendorOverview(@Request() req) { return this.analyticsService.getVendorOverview(req.user._id.toString()); }

  @Get('vendor/revenue-chart')
  @Roles('vendor')
  vendorRevenue(@Request() req, @Query('months') months = 6) {
    return this.analyticsService.getVendorRevenueChart(req.user._id.toString(), +months);
  }

  @Get('vendor/service-performance')
  @Roles('vendor')
  servicePerf(@Request() req) { return this.analyticsService.getVendorServicePerformance(req.user._id.toString()); }

  // Customer
  @Get('customer/overview')
  @Roles('customer')
  customerOverview(@Request() req) { return this.analyticsService.getCustomerOverview(req.user._id.toString()); }
  @Get('admin/revenue')
@Roles('admin')
@ApiBearerAuth()
getRevenueAnalytics() {
  return this.analyticsService.getRevenueAnalytics();
}
@Get('admin/bookings')
@Roles('admin')
@ApiBearerAuth()
getBookingAnalytics() {
  return this.analyticsService.getBookingAnalytics();
}

@Get('admin/users')
@Roles('admin')
@ApiBearerAuth()
getUserAnalytics() {
  return this.analyticsService.getUserAnalytics();
}
@Get('admin/vendors')
@Roles('admin')
@ApiBearerAuth()
getVendorAnalytics() {
  return this.analyticsService.getVendorAnalytics();
}
@Get('admin/services')
@Roles('admin')
@ApiBearerAuth()
getServiceAnalytics() {
  return this.analyticsService.getServiceAnalytics();
}
@Get('admin/reviews')
@Roles('admin')
@ApiBearerAuth()
getReviewAnalytics() {
  return this.analyticsService.getReviewAnalytics();
}
// ===============================
// Dashboard Charts
// ===============================

@Get('admin/charts/revenue')
@Roles('admin')
getRevenueTrend(
  @Query('days') days = 30,
) {
  return this.analyticsService.getRevenueTrend(+days);
}

@Get('admin/charts/bookings')
@Roles('admin')
getBookingTrend(
  @Query('days') days = 30,
) {
  return this.analyticsService.getBookingTrend(+days);
}

@Get('admin/charts/users')
@Roles('admin')
getUserTrend(
  @Query('days') days = 30,
) {
  return this.analyticsService.getUserTrend(+days);
}

@Get('admin/charts/vendors')
@Roles('admin')
getVendorTrend(
  @Query('days') days = 30,
) {
  return this.analyticsService.getVendorTrend(+days);
}

@Get('admin/charts/reviews')
@Roles('admin')
getReviewTrend(
  @Query('days') days = 30,
) {
  return this.analyticsService.getReviewTrend(+days);
}

@Get('admin/charts/categories')
@Roles('admin')
getCategoryAnalytics() {
  return this.analyticsService.getCategoryAnalytics();
}

@Get('admin/charts/cities')
@Roles('admin')
getCityAnalytics() {
  return this.analyticsService.getCityAnalytics();
}

@Get('admin/charts/status')
@Roles('admin')
getBookingStatusChart() {
  return this.analyticsService.getBookingStatusChart();
}

@Get('admin/charts/ratings')
@Roles('admin')
getRatingDistribution() {
  return this.analyticsService.getRatingDistribution();
}

@Get('admin/ai-insights')
@Roles('admin')
getAIInsights() {
  return this.analyticsService.getAIInsights();
}

// ======================================
// Public Analytics (Homepage)
// ======================================

@Public()
@Get('public/stats')
getPublicStats() {
  return this.analyticsService.getPublicStats();
}
}