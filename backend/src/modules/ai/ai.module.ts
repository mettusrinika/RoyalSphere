import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { Service, ServiceSchema } from '../services/schemas/service.schema';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Review, ReviewSchema } from '../reviews/schemas/review.schema';
import { OpenAIProvider } from './providers/openai.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { ClaudeProvider } from './providers/claude.provider';
import { LocalProvider } from './providers/local.provider';
import { AIProviderFactory } from './providers/provider.factory';
import {
  Category,
  CategorySchema,
} from '../categories/schemas/category.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Service.name, schema: ServiceSchema },
      { name: Booking.name, schema: BookingSchema },
      { name: User.name, schema: UserSchema },
      { name: Review.name, schema: ReviewSchema },
      {
  name: Category.name,
  schema: CategorySchema,
},
    ]),
  ],
  controllers: [AiController],
  providers: [
  AiService,
  OpenAIProvider,
  GeminiProvider,
  ClaudeProvider,
  LocalProvider,
  AIProviderFactory,
],
  exports: [AiService],
})
export class AiModule {}
