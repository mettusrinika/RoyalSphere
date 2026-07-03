import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  User,
  UserDocument,
  UserRole,
} from '../../users/schemas/user.schema';

import {
  Review,
  ReviewDocument,
} from '../../reviews/schemas/review.schema';

import {
  Booking,
  BookingDocument,
  BookingStatus,
} from '../../bookings/schemas/booking.schema';

@Injectable()
export class VendorScheduler {
  private readonly logger = new Logger(
    VendorScheduler.name,
  );

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,

    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
  ) {}

  /**
   * Runs every day at 1 AM.
   * Refreshes vendor statistics.
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async refreshVendorStatistics() {
    this.logger.log(
      'Refreshing vendor statistics...',
    );

    const vendors = await this.userModel.find({
      role: UserRole.VENDOR,
      isVendorApproved: true,
    });

    for (const vendor of vendors) {
      const vendorId = vendor._id as Types.ObjectId;

      const reviewStats =
        await this.reviewModel.aggregate([
          {
            $match: {
              vendorId,
            },
          },
          {
            $group: {
              _id: null,
              averageRating: {
                $avg: '$rating',
              },
              totalReviews: {
                $sum: 1,
              },
            },
          },
        ]);

      const completedBookings =
        await this.bookingModel.countDocuments({
          vendorId,
          status: BookingStatus.COMPLETED,
        });

      const totalRevenue =
        await this.bookingModel.aggregate([
          {
            $match: {
              vendorId,
              status: BookingStatus.COMPLETED,
            },
          },
          {
            $group: {
              _id: null,
              revenue: {
                $sum: '$vendorPayout',
              },
            },
          },
        ]);

      vendor.vendorProfile.rating =
        Number(
          (
            reviewStats[0]?.averageRating ??
            0
          ).toFixed(2),
        );

      vendor.vendorProfile.reviewCount =
        reviewStats[0]?.totalReviews ?? 0;

      vendor.vendorProfile.totalEarnings =
        totalRevenue[0]?.revenue ?? 0;
        vendor.vendorProfile.completedBookings =
  completedBookings;

      await vendor.save();

      this.logger.log(
        `Updated vendor ${vendor.email}`,
      );

      this.logger.log(
        `Completed bookings: ${completedBookings}`,
      );
    }

    this.logger.log(
      'Vendor statistics refreshed.',
    );
  }
}