import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Booking,
  BookingDocument,
  BookingStatus,
} from '../../bookings/schemas/booking.schema';

@Injectable()
export class BookingScheduler {
  private readonly logger = new Logger(
    BookingScheduler.name,
  );

  constructor(
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
  ) {}

  /**
   * Runs every hour.
   * Finds bookings that are over 24 hours past their event date
   * and automatically marks them as completed.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async autoCompleteBookings() {
    this.logger.log(
      'Checking bookings for auto completion...',
    );

    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 24);

    const result =
      await this.bookingModel.updateMany(
        {
          status: BookingStatus.IN_PROGRESS,
          eventDate: {
            $lte: cutoff,
          },
        },
        {
          $set: {
            status: BookingStatus.COMPLETED,
            completedAt: new Date(),
          },
          $push: {
            statusHistory: {
              status: BookingStatus.COMPLETED,
              updatedAt: new Date(),
              updatedBy: 'system',
              note: 'Automatically completed by scheduler',
            },
          },
        },
      );

    this.logger.log(
      `${result.modifiedCount} bookings auto completed.`,
    );
  }

  /**
   * Runs every day at 9:00 AM.
   * For now it only logs.
   * Later we'll integrate Notifications + Socket.IO.
   */
  @Cron('0 9 * * *')
  async bookingReminders() {
    this.logger.log(
      'Running booking reminder scheduler...',
    );

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const start = new Date(tomorrow);
    start.setHours(0, 0, 0, 0);

    const end = new Date(tomorrow);
    end.setHours(23, 59, 59, 999);

    const bookings =
      await this.bookingModel.find({
        status: BookingStatus.CONFIRMED,
        eventDate: {
          $gte: start,
          $lte: end,
        },
      });

    this.logger.log(
      `Found ${bookings.length} bookings requiring reminders.`,
    );

    /**
     * Next phase:
     * - NotificationService
     * - EventEmitter
     * - Socket.IO
     * - Email
     */
  }
}