import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  Service,
  ServiceDocument,
} from '../../services/schemas/service.schema';

import {
  Booking,
  BookingDocument,
  BookingStatus,
} from '../../bookings/schemas/booking.schema';

@Injectable()
export class AnalyticsScheduler {
  private readonly logger = new Logger(
    AnalyticsScheduler.name,
  );

  constructor(
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,

    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
  ) {}

  /**
   * Runs every hour.
   *
   * Reconciles service booking counts from
   * real completed booking documents and
   * updates trending scores.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async updateTrendingScores() {
    this.logger.log(
      'Reconciling booking counts and updating trending scores...',
    );

    const services = await this.serviceModel
      .find()
      .lean();

    const bookingCounts =
      await this.bookingModel.aggregate<{
        _id: Types.ObjectId;
        bookingCount: number;
      }>([
        {
          $match: {
            status: BookingStatus.COMPLETED,
          },
        },
        {
          $group: {
            _id: '$serviceId',
            bookingCount: {
              $sum: 1,
            },
          },
        },
      ]);

    const bookingCountMap = new Map(
      bookingCounts.map((item) => [
        item._id.toString(),
        item.bookingCount,
      ]),
    );

    const operations = services.map(
      (service) => {
        const bookingCount =
          bookingCountMap.get(
            service._id.toString(),
          ) ?? 0;

        const score =
          bookingCount * 5 +
          (service.rating ?? 0) * 20 +
          (service.reviewCount ?? 0) * 3 +
          (service.viewCount ?? 0);

        const conversionRate =
          (service.viewCount ?? 0) > 0
            ? (bookingCount /
                (service.viewCount ?? 0)) *
              100
            : 0;

        return {
          updateOne: {
            filter: {
              _id: service._id,
            },
            update: {
              $set: {
                bookingCount,
                trendingScore: Number(
                  score.toFixed(2),
                ),
                conversionRate: Number(
                  conversionRate.toFixed(2),
                ),
              },
            },
          },
        };
      },
    );

    if (operations.length > 0) {
      await this.serviceModel.bulkWrite(
        operations,
      );
    }

    this.logger.log(
      `${services.length} services reconciled and updated.`,
    );
  }

  /**
   * Runs every day.
   *
   * Recalculates service conversion rates
   * using real completed booking counts.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async updateConversionRates() {
    this.logger.log(
      'Updating conversion rates...',
    );

    const services = await this.serviceModel
      .find()
      .lean();

    const bookingCounts =
      await this.bookingModel.aggregate<{
        _id: Types.ObjectId;
        bookingCount: number;
      }>([
        {
          $match: {
            status: BookingStatus.COMPLETED,
          },
        },
        {
          $group: {
            _id: '$serviceId',
            bookingCount: {
              $sum: 1,
            },
          },
        },
      ]);

    const bookingCountMap = new Map(
      bookingCounts.map((item) => [
        item._id.toString(),
        item.bookingCount,
      ]),
    );

    const operations = services.map(
      (service) => {
        const bookingCount =
          bookingCountMap.get(
            service._id.toString(),
          ) ?? 0;

        const viewCount =
          service.viewCount ?? 0;

        const conversionRate =
          viewCount > 0
            ? (bookingCount / viewCount) *
              100
            : 0;

        return {
          updateOne: {
            filter: {
              _id: service._id,
            },
            update: {
              $set: {
                bookingCount,
                conversionRate: Number(
                  conversionRate.toFixed(2),
                ),
              },
            },
          },
        };
      },
    );

    if (operations.length > 0) {
      await this.serviceModel.bulkWrite(
        operations,
      );
    }

    this.logger.log(
      `${services.length} conversion rates updated.`,
    );
  }
}