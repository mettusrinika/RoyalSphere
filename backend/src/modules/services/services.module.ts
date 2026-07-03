import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';

import { Service, ServiceSchema } from './schemas/service.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Service.name,
        schema: ServiceSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService, MongooseModule],
})
export class ServicesModule {}