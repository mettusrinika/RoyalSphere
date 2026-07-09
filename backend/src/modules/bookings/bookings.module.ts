import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { Booking, BookingSchema } from './schemas/booking.schema';
import { Service, ServiceSchema } from '../services/schemas/service.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { PlatformReadinessModule } from '../platform-readiness/platform-readiness.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: Service.name, schema: ServiceSchema },
    ]),
    NotificationsModule,
    PlatformReadinessModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService, MongooseModule],
})
export class BookingsModule {}
