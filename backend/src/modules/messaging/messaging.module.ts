import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { MessagingController } from './messaging.controller';
import { MessagingService } from './messaging.service';
import { ChatGateway } from './chat.gateway';

import { Message, MessageSchema } from './schemas/message.schema';
import {
  Conversation,
  ConversationSchema,
} from './schemas/conversation.schema';

import {
  User,
  UserSchema,
} from '../users/schemas/user.schema';

import {
  Booking,
  BookingSchema,
} from '../bookings/schemas/booking.schema';

import {
  Service,
  ServiceSchema,
} from '../services/schemas/service.schema';

import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Message.name,
        schema: MessageSchema,
      },
      {
        name: Conversation.name,
        schema: ConversationSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: Booking.name,
        schema: BookingSchema,
      },
      {
        name: Service.name,
        schema: ServiceSchema,
      },
    ]),

    NotificationsModule,

    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: {
          expiresIn:
            config.get('JWT_EXPIRES_IN') || '15m',
        },
      }),
    }),
  ],

  controllers: [MessagingController],

  providers: [
    MessagingService,
    ChatGateway,
  ],

  exports: [
    MessagingService,
  ],
})
export class MessagingModule {}