import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  User,
  UserDocument,
} from '../../users/schemas/user.schema';

@Injectable()
export class CleanupScheduler {
  private readonly logger = new Logger(
    CleanupScheduler.name,
  );

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Every day at 4 AM
   *
   * Removes expired email verification tokens
   * and password reset tokens.
   */
  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async cleanupExpiredTokens() {
    this.logger.log(
      'Cleaning expired authentication tokens...',
    );

    const now = new Date();

    // Email verification tokens
    const emailResult =
      await this.userModel.updateMany(
        {
          emailVerificationExpiry: {
            $lt: now,
          },
        },
        {
          $unset: {
            emailVerificationToken: '',
            emailVerificationExpiry: '',
          },
        },
      );

    // Password reset tokens
    const resetResult =
      await this.userModel.updateMany(
        {
          passwordResetExpiry: {
            $lt: now,
          },
        },
        {
          $unset: {
            passwordResetToken: '',
            passwordResetExpiry: '',
          },
        },
      );

    this.logger.log(
      `Email tokens cleared: ${emailResult.modifiedCount}`,
    );

    this.logger.log(
      `Password reset tokens cleared: ${resetResult.modifiedCount}`,
    );
  }

  /**
   * Every Sunday at 5 AM
   *
   * Remove duplicate refresh tokens.
   */
  @Cron('0 5 * * 0')
  async cleanupRefreshTokens() {
    this.logger.log(
      'Cleaning refresh tokens...',
    );

    const users =
      await this.userModel.find({
        refreshTokens: {
          $exists: true,
        },
      });

    let updated = 0;

    for (const user of users) {
      const uniqueTokens = [
        ...new Set(user.refreshTokens),
      ];

      if (
        uniqueTokens.length !==
        user.refreshTokens.length
      ) {
        user.refreshTokens =
          uniqueTokens;

        await user.save();

        updated++;
      }
    }

    this.logger.log(
      `${updated} users updated.`,
    );
  }

  /**
   * Every day at midnight
   *
   * Future cleanup hook.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async housekeeping() {
    this.logger.log(
      'Running housekeeping tasks...',
    );

    /**
     * Future:
     *
     * Delete orphan uploads
     * Delete AI cache
     * Remove stale sessions
     * Compress logs
     * Archive reports
     */
  }
}