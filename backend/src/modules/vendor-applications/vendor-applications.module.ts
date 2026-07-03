import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VendorApplicationsController } from './vendor-applications.controller';
import { VendorApplicationsService } from './vendor-applications.service';
import { VendorApplication, VendorApplicationSchema } from './schemas/vendor-application.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VendorApplication.name, schema: VendorApplicationSchema },
      { name: User.name, schema: UserSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [VendorApplicationsController],
  providers: [VendorApplicationsService],
  exports: [VendorApplicationsService],
})
export class VendorApplicationsModule {}
