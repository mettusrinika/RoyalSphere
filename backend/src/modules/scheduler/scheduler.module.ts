import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';

import { SchedulerService } from './scheduler.service';

import { BookingScheduler } from './jobs/booking.scheduler';
import { PaymentScheduler } from './jobs/payment.scheduler';
import { AnalyticsScheduler } from './jobs/analytics.scheduler';
import { VendorScheduler } from './jobs/vendor.scheduler';
import { NotificationScheduler } from './jobs/notification.scheduler';
import { CleanupScheduler } from './jobs/cleanup.scheduler';

import {
  Booking,
  BookingSchema,
} from '../bookings/schemas/booking.schema';

import {
  Notification,
  NotificationSchema,
} from '../notifications/schemas/notification.schema';

import {
  User,
  UserSchema,
} from '../users/schemas/user.schema';

import {
  Review,
  ReviewSchema,
} from '../reviews/schemas/review.schema';

import {
  Service,
  ServiceSchema,
} from '../services/schemas/service.schema';

import {
  Payment,
  PaymentSchema,
} from '../payments/schemas/payment.schema';

@Module({
  imports: [
    ScheduleModule.forRoot(),

    MongooseModule.forFeature([
      {
        name: Booking.name,
        schema: BookingSchema,
      },
      {
        name: Notification.name,
        schema: NotificationSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: Review.name,
        schema: ReviewSchema,
      },
      {
        name: Service.name,
        schema: ServiceSchema,
      },
      {
        name: Payment.name,
        schema: PaymentSchema,
      },
    ]),
  ],

  providers: [
    SchedulerService,
    BookingScheduler,
    PaymentScheduler,
    AnalyticsScheduler,
    VendorScheduler,
    NotificationScheduler,
    CleanupScheduler,
  ],

  exports: [
    SchedulerService,
  ],
})
export class SchedulerModule {}

