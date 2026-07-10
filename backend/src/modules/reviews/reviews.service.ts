import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import {
  Model,
  Types,
} from 'mongoose';

import {
  Review,
  ReviewDocument,
  ReviewReportStatus,
  ReviewStatus,
} from './schemas/review.schema';

import {
  Booking,
  BookingDocument,
  BookingStatus,
} from '../bookings/schemas/booking.schema';

import {
  User,
  UserDocument,
} from '../users/schemas/user.schema';

import {
  Service,
  ServiceDocument,
} from '../services/schemas/service.schema';

import { NotificationsService } from '../notifications/notifications.service';

import { NotificationType } from '../notifications/schemas/notification.schema';

import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewQueryDto } from './dto/review-query.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';
import { ReportReviewDto } from './dto/report-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,

    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,

    private readonly notificationsService: NotificationsService,
  ) {}

  private objectId(
    value: string,
    label: string,
  ): Types.ObjectId {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(
        `Invalid ${label}`,
      );
    }

    return new Types.ObjectId(value);
  }

  async createReview(
    customerId: string,
    dto: CreateReviewDto,
  ) {
    const customerObjectId = this.objectId(
      customerId,
      'customer ID',
    );

    const bookingObjectId = this.objectId(
      dto.bookingId,
      'booking ID',
    );

    const booking =
      await this.bookingModel.findById(
        bookingObjectId,
      );

    if (!booking) {
      throw new NotFoundException(
        'Booking not found',
      );
    }

    if (
      booking.customerId.toString() !== customerId
    ) {
      throw new ForbiddenException(
        'You can only review your own booking',
      );
    }

    if (
      booking.status !== BookingStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'Can only review completed bookings',
      );
    }

    const existingReview =
      await this.reviewModel.findOne({
        bookingId: bookingObjectId,
      });

    if (
      booking.reviewSubmitted ||
      existingReview
    ) {
      throw new ConflictException(
        'Review already submitted for this booking',
      );
    }

    let review: ReviewDocument;

    try {
      review = await this.reviewModel.create({
        customerId: customerObjectId,
        vendorId: booking.vendorId,
        serviceId: booking.serviceId,
        bookingId: bookingObjectId,
        rating: dto.rating,
        comment: dto.comment,
        images: dto.images ?? [],
        isVerifiedPurchase: true,
        status: ReviewStatus.APPROVED,
      });
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException(
          'Review already submitted for this booking',
        );
      }

      throw error;
    }

    await this.bookingModel.findByIdAndUpdate(
      bookingObjectId,
      {
        reviewSubmitted: true,
      },
    );

    await this.recalculateRatings(
      booking.vendorId.toString(),
      booking.serviceId.toString(),
    );

    await this.notificationsService.createNotification({
      userId: booking.vendorId,
      title: 'New Review Received',
      message: `A customer left a ${dto.rating}-star review for your service.`,
      type: NotificationType.REVIEW_RECEIVED,
      actionUrl: '/dashboard/vendor/reviews',
    });

    return review;
  }

  async updateReview(
    reviewId: string,
    customerId: string,
    dto: UpdateReviewDto,
  ) {
    const review =
      await this.reviewModel.findById(
        this.objectId(reviewId, 'review ID'),
      );

    if (!review) {
      throw new NotFoundException(
        'Review not found',
      );
    }

    if (
      review.customerId.toString() !== customerId
    ) {
      throw new ForbiddenException(
        'You can only edit your own review',
      );
    }

    if (dto.rating !== undefined) {
      review.rating = dto.rating;
    }

    if (dto.comment !== undefined) {
      review.comment = dto.comment;
    }

    if (dto.images !== undefined) {
      review.images = dto.images;
    }

    review.edited = true;
    review.editedAt = new Date();

    await review.save();

    await this.recalculateRatings(
      review.vendorId.toString(),
      review.serviceId.toString(),
    );

    return review;
  }

  async deleteReview(
    reviewId: string,
    customerId: string,
  ) {
    const review =
      await this.reviewModel.findById(
        this.objectId(reviewId, 'review ID'),
      );

    if (!review) {
      throw new NotFoundException(
        'Review not found',
      );
    }

    if (
      review.customerId.toString() !== customerId
    ) {
      throw new ForbiddenException(
        'You can only delete your own review',
      );
    }

    await this.reviewModel.deleteOne({
      _id: review._id,
    });

    await this.bookingModel.findByIdAndUpdate(
      review.bookingId,
      {
        reviewSubmitted: false,
      },
    );

    await this.recalculateRatings(
      review.vendorId.toString(),
      review.serviceId.toString(),
    );

    return {
      success: true,
      message: 'Review deleted successfully',
    };
  }

  async markHelpful(
    reviewId: string,
    userId: string,
  ) {
    const reviewObjectId = this.objectId(
      reviewId,
      'review ID',
    );

    const userObjectId = this.objectId(
      userId,
      'user ID',
    );

    const review =
      await this.reviewModel.findOneAndUpdate(
        {
          _id: reviewObjectId,
          status: ReviewStatus.APPROVED,
          helpfulUserIds: {
            $ne: userObjectId,
          },
        },
        {
          $addToSet: {
            helpfulUserIds: userObjectId,
          },
          $inc: {
            helpfulCount: 1,
          },
        },
        {
          new: true,
        },
      );

    if (review) {
      return {
        helpfulCount: review.helpfulCount,
        helpful: true,
      };
    }

    const existing =
      await this.reviewModel.findById(
        reviewObjectId,
      );

    if (!existing) {
      throw new NotFoundException(
        'Review not found',
      );
    }

    if (
      existing.status !== ReviewStatus.APPROVED
    ) {
      throw new BadRequestException(
        'This review is not publicly available',
      );
    }

    throw new ConflictException(
      'You have already marked this review as helpful',
    );
  }

  async reportReview(
    reviewId: string,
    reporterId: string,
    dto: ReportReviewDto,
  ) {
    const reviewObjectId = this.objectId(
      reviewId,
      'review ID',
    );

    const reporterObjectId = this.objectId(
      reporterId,
      'reporter ID',
    );

    const review =
      await this.reviewModel.findById(
        reviewObjectId,
      );

    if (!review) {
      throw new NotFoundException(
        'Review not found',
      );
    }

    if (
      review.customerId.toString() === reporterId
    ) {
      throw new BadRequestException(
        'You cannot report your own review',
      );
    }

    const alreadyReported = (
      review.reports ?? []
    ).some(
      (report: any) =>
        report.reporterId?.toString() ===
        reporterId,
    );

    if (alreadyReported) {
      throw new ConflictException(
        'You have already reported this review',
      );
    }

    review.reports.push({
      reporterId: reporterObjectId,
      reason: dto.reason,
      description:
        (dto as any).description ?? '',
      status: ReviewReportStatus.PENDING,
      reportedAt: new Date(),
    } as any);

    review.reportCount =
      (review.reportCount ?? 0) + 1;

    await review.save();

    return {
      success: true,
      message: 'Review reported successfully',
      reportCount: review.reportCount,
    };
  }

  async moderateReview(
    reviewId: string,
    dto: ModerateReviewDto,
  ) {
    const review =
      await this.reviewModel.findById(
        this.objectId(reviewId, 'review ID'),
      );

    if (!review) {
      throw new NotFoundException(
        'Review not found',
      );
    }

    if (
      !Object.values(ReviewStatus).includes(
        dto.status as ReviewStatus,
      )
    ) {
      throw new BadRequestException(
        'Invalid review status',
      );
    }

    review.status =
      dto.status as ReviewStatus;

    review.rejectionReason =
      dto.rejectionReason ?? null;

    if (
      review.status === ReviewStatus.APPROVED
    ) {
      review.rejectionReason = null;
    }

    if (review.reports?.length) {
      review.reports.forEach(
        (report: any) => {
          if (
            report.status ===
            ReviewReportStatus.PENDING
          ) {
            report.status =
              ReviewReportStatus.REVIEWED;
          }
        },
      );
    }

    await review.save();

    await this.recalculateRatings(
      review.vendorId.toString(),
      review.serviceId.toString(),
    );

    return review;
  }

  async getMyReviews(customerId: string) {
    const customerObjectId = this.objectId(customerId, 'customer ID');

    return this.reviewModel
      .find({ customerId: customerObjectId })
      .populate('serviceId', 'name images')
      .populate('vendorId', 'firstName lastName businessName')
      .sort({ createdAt: -1 })
      .lean();
  }

  async getServiceReviews(
    serviceId: string,
    query: ReviewQueryDto,
  ) {
    const serviceObjectId = this.objectId(
      serviceId,
      'service ID',
    );

    const page = Math.max(
      Number(query.page) || 1,
      1,
    );

    const limit = Math.min(
      Math.max(Number(query.limit) || 10, 1),
      50,
    );

    const skip = (page - 1) * limit;

    const filter = {
      serviceId: serviceObjectId,
      status: ReviewStatus.APPROVED,
    };

    const [reviews, total, stats] =
      await Promise.all([
        this.reviewModel
          .find(filter)
          .populate(
            'customerId',
            'firstName lastName avatar',
          )
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limit)
          .lean(),

        this.reviewModel.countDocuments(
          filter,
        ),

        this.reviewModel.aggregate([
          {
            $match: filter,
          },
          {
            $group: {
              _id: null,
              avgRating: {
                $avg: '$rating',
              },
              distribution: {
                $push: '$rating',
              },
            },
          },
        ]),
      ]);

    const ratings =
      stats[0]?.distribution ?? [];

    const distribution = [
      1,
      2,
      3,
      4,
      5,
    ].map((star) => ({
      star,
      count: ratings.filter(
        (rating: number) =>
          rating === star,
      ).length,
    }));

    return {
      reviews,
      total,
      page,
      totalPages: Math.ceil(
        total / limit,
      ),
      avgRating:
        Math.round(
          (stats[0]?.avgRating ?? 0) * 10,
        ) / 10,
      distribution,
    };
  }

  async getVendorReviews(
    vendorId: string,
    page = 1,
    limit = 10,
  ) {
    const vendorObjectId = this.objectId(
      vendorId,
      'vendor ID',
    );

    page = Math.max(Number(page) || 1, 1);

    limit = Math.min(
      Math.max(Number(limit) || 10, 1),
      50,
    );

    const skip = (page - 1) * limit;

    const filter = {
      vendorId: vendorObjectId,
      status: ReviewStatus.APPROVED,
    };

    const [reviews, total] =
      await Promise.all([
        this.reviewModel
          .find(filter)
          .populate(
            'customerId',
            'firstName lastName avatar',
          )
          .populate(
            'serviceId',
            'name',
          )
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limit)
          .lean(),

        this.reviewModel.countDocuments(
          filter,
        ),
      ]);

    return {
      reviews,
      total,
      page,
      totalPages: Math.ceil(
        total / limit,
      ),
    };
  }

  async replyToReview(
    reviewId: string,
    vendorId: string,
    reply: string,
  ) {
    const review =
      await this.reviewModel.findById(
        this.objectId(reviewId, 'review ID'),
      );

    if (!review) {
      throw new NotFoundException(
        'Review not found',
      );
    }

    if (
      review.vendorId.toString() !== vendorId
    ) {
      throw new ForbiddenException(
        'You can only reply to reviews for your services',
      );
    }

    if (
      review.status !== ReviewStatus.APPROVED
    ) {
      throw new BadRequestException(
        'You cannot reply to a non-public review',
      );
    }

    if (review.vendorReply) {
      throw new ConflictException(
        'Vendor has already replied to this review',
      );
    }

    const cleanReply = reply?.trim();

    if (!cleanReply) {
      throw new BadRequestException(
        'Reply cannot be empty',
      );
    }

    review.vendorReply = cleanReply;
    review.vendorRepliedAt = new Date();

    await review.save();

    await this.notificationsService.createNotification({
      userId: review.customerId,
      title: 'Vendor Replied to Your Review',
      message:
        'The vendor replied to your review.',
      type: NotificationType.REVIEW_RECEIVED,
      actionUrl: `/services/${review.serviceId.toString()}`,
    });

    return review;
  }

  async getReviewAnalytics(
    vendorId: string,
  ) {
    const vendorObjectId = this.objectId(
      vendorId,
      'vendor ID',
    );

    const stats =
      await this.reviewModel.aggregate([
        {
          $match: {
            vendorId: vendorObjectId,
            status: ReviewStatus.APPROVED,
          },
        },
        {
          $group: {
            _id: null,
            totalReviews: {
              $sum: 1,
            },
            averageRating: {
              $avg: '$rating',
            },
            fiveStar: {
              $sum: {
                $cond: [
                  {
                    $eq: ['$rating', 5],
                  },
                  1,
                  0,
                ],
              },
            },
            fourStar: {
              $sum: {
                $cond: [
                  {
                    $eq: ['$rating', 4],
                  },
                  1,
                  0,
                ],
              },
            },
            threeStar: {
              $sum: {
                $cond: [
                  {
                    $eq: ['$rating', 3],
                  },
                  1,
                  0,
                ],
              },
            },
            twoStar: {
              $sum: {
                $cond: [
                  {
                    $eq: ['$rating', 2],
                  },
                  1,
                  0,
                ],
              },
            },
            oneStar: {
              $sum: {
                $cond: [
                  {
                    $eq: ['$rating', 1],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]);

    const result = stats[0];

    if (!result) {
      return {
        totalReviews: 0,
        averageRating: 0,
        fiveStar: 0,
        fourStar: 0,
        threeStar: 0,
        twoStar: 0,
        oneStar: 0,
      };
    }

    return {
      ...result,
      averageRating:
        Math.round(
          (result.averageRating ?? 0) * 10,
        ) / 10,
    };
  }

  private async recalculateRatings(
    vendorId: string,
    serviceId: string,
  ) {
    const vendorObjectId = this.objectId(
      vendorId,
      'vendor ID',
    );

    const serviceObjectId = this.objectId(
      serviceId,
      'service ID',
    );

    const [vendorStats, serviceStats] =
      await Promise.all([
        this.reviewModel.aggregate([
          {
            $match: {
              vendorId: vendorObjectId,
              status: ReviewStatus.APPROVED,
            },
          },
          {
            $group: {
              _id: null,
              avgRating: {
                $avg: '$rating',
              },
              count: {
                $sum: 1,
              },
            },
          },
        ]),

        this.reviewModel.aggregate([
          {
            $match: {
              serviceId: serviceObjectId,
              status: ReviewStatus.APPROVED,
            },
          },
          {
            $group: {
              _id: null,
              avgRating: {
                $avg: '$rating',
              },
              count: {
                $sum: 1,
              },
            },
          },
        ]),
      ]);

    await Promise.all([
      this.userModel.findByIdAndUpdate(
        vendorObjectId,
        {
          'vendorProfile.rating':
            Math.round(
              (vendorStats[0]?.avgRating ?? 0) *
                10,
            ) / 10,

          'vendorProfile.reviewCount':
            vendorStats[0]?.count ?? 0,
        },
      ),

      this.serviceModel.findByIdAndUpdate(
        serviceObjectId,
        {
          rating:
            Math.round(
              (serviceStats[0]?.avgRating ?? 0) *
                10,
            ) / 10,

          reviewCount:
            serviceStats[0]?.count ?? 0,
        },
      ),
    ]);
  }
}