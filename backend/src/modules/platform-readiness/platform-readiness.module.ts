import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlatformReadinessController } from './platform-readiness.controller';
import { PlatformReadinessService } from './platform-readiness.service';
import {
  VendorApplication,
  VendorApplicationSchema,
} from '../vendor-applications/schemas/vendor-application.schema';
import { Service, ServiceSchema } from '../services/schemas/service.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VendorApplication.name, schema: VendorApplicationSchema },
      { name: Service.name, schema: ServiceSchema },
    ]),
  ],
  controllers: [PlatformReadinessController],
  providers: [PlatformReadinessService],
})
export class PlatformReadinessModule {}