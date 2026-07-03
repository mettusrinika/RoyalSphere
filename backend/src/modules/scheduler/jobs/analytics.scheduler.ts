import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Service,
  ServiceDocument,
} from '../../services/schemas/service.schema';

@Injectable()
export class AnalyticsScheduler {
  private readonly logger = new Logger(
    AnalyticsScheduler.name,
  );

  constructor(
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
  ) {}

  /**
   * Runs every hour.
   * Updates service trending scores.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async updateTrendingScores() {

    this.logger.log(
      'Updating trending scores...',
    );

    const services =
      await this.serviceModel.find();

    for (const service of services) {

      /**
       * Formula:
       *
       * bookingCount × 5
       * +
       * rating × 20
       * +
       * reviewCount × 3
       * +
       * viewCount × 1
       */

      const score =

        service.bookingCount * 5 +

        service.rating * 20 +

        service.reviewCount * 3 +

        service.viewCount;

      service.trendingScore = Number(
        score.toFixed(2),
      );

      await service.save();
    }

    this.logger.log(
      `${services.length} services updated.`,
    );
  }

  /**
   * Runs every day.
   * Calculates conversion rate.
   */

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async updateConversionRates() {

    this.logger.log(
      'Updating conversion rates...',
    );
const services =
await this.serviceModel.find().lean();

const operations = services.map(service => {

    const score =

        service.bookingCount * 5 +

        service.rating * 20 +

        service.reviewCount * 3 +

        service.viewCount;

    return {

        updateOne:{

            filter:{
                _id:service._id,
            },

            update:{
                $set:{
                    trendingScore:Number(
                        score.toFixed(2),
                    ),
                },
            },

        },

    };

});

if(operations.length){

    await this.serviceModel.bulkWrite(
        operations,
    );

}

    this.logger.log(
      'Conversion rates updated.',
    );
  }
}