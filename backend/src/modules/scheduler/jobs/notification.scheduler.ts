import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Notification,
  NotificationDocument,
} from '../../notifications/schemas/notification.schema';

@Injectable()
export class NotificationScheduler {
  private readonly logger = new Logger(
    NotificationScheduler.name,
  );

  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  /**
   * Every night at 2 AM
   * Delete notifications older than 90 days.
   */
  @Cron('0 2 * * *')
  async cleanupOldNotifications() {
    this.logger.log(
      'Cleaning old notifications...',
    );

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);

    const result =
      await this.notificationModel.deleteMany({
        createdAt: {
          $lt: cutoff,
        },
      });

    this.logger.log(
      `Deleted ${result.deletedCount} old notifications.`,
    );
  }

  /**
   * Every 30 minutes.
   * Placeholder for future push notifications.
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async processPendingNotifications() {
    this.logger.log(
      'Checking pending notifications...',
    );

    /**
     * Future:
     * - Firebase Push
     * - Email
     * - SMS
     * - WhatsApp
     */
  }
}