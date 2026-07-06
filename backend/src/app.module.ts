import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { VendorApplicationsModule } from './modules/vendor-applications/vendor-applications.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ServicesModule } from './modules/services/services.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AiModule } from './modules/ai/ai.module';
import { LoggerModule } from './modules/logger/logger.module';
import {
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { UploadsModule } from './modules/uploads/uploads.module';

import { SecurityMiddleware } from './common/middleware/security.middleware';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { PhoneAuthModule } from './modules/phone-auth/phone-auth.module';
import { PlatformReadinessModule } from './modules/platform-readiness/platform-readiness.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI'),
        connectionFactory: (connection) => {
          connection.on('connected', () => console.log('✅ MongoDB connected'));
          connection.on('error', (err) => console.error('❌ MongoDB error:', err));
          return connection;
        },
      }),
    }),
    LoggerModule,
    UploadsModule,
    SchedulerModule,
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    AuthModule,
    PhoneAuthModule,
    PlatformReadinessModule,
    UsersModule,
    VendorApplicationsModule,
    CategoriesModule,
    ServicesModule,
    BookingsModule,
    PaymentsModule,
    ReviewsModule,
    MessagingModule,
    NotificationsModule,
    AnalyticsModule,
    AiModule,
  ],
})
export class AppModule implements NestModule {

  configure(
    consumer: MiddlewareConsumer,
  ) {
    consumer
      .apply(SecurityMiddleware)
      .forRoutes('*');
  }

}
