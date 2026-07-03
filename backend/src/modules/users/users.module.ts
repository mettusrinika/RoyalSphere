import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User, UserSchema } from './schemas/user.schema';
import { Service, ServiceSchema } from '../services/schemas/service.schema';

@Module({
  imports: [
  MongooseModule.forFeature([
    { name: User.name, schema: UserSchema },
    { name: Service.name, schema: ServiceSchema },
  ]),
],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, MongooseModule],
})
export class UsersModule {}

