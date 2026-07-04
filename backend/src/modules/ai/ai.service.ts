import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AIProviderFactory } from './providers/provider.factory';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Service, ServiceDocument } from '../services/schemas/service.schema';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Review, ReviewDocument } from '../reviews/schemas/review.schema';
import { Payment, PaymentDocument } from '../payments/schemas/payment.schema';
import {
  Category,
  CategoryDocument,
} from '../categories/schemas/category.schema';

@Injectable()
export class AiService {
  constructor(
    private readonly aiProviderFactory: AIProviderFactory,
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,

    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,

    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
    @InjectModel(Category.name)
private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  // =========================================================================
  // SMART VENDOR RECOMMENDATIONS
  // =========================================================================

  async getVendorRecommendations(
    params: {
      categoryId?: string;
      city?: string;
      budget?: number;
      userId?: string;
      limit?: number;
    },
  ): Promise<any[]> {
    const {
      categoryId,
      city,
      budget,
      userId,
      limit = 8,
    } = params;

    const filter: Record<string, any> = {
      status: 'active',
    };

    if (categoryId && Types.ObjectId.isValid(categoryId)) {
      filter.categoryId = new Types.ObjectId(categoryId);
    }

    if (city) {
      filter['location.city'] = {
        $regex: city,
        $options: 'i',
      };
    }

    if (budget) {
      filter.basePrice = {
        $lte: budget * 1.2,
      };
    }

    const services = await this.serviceModel
      .find(filter)
      .populate(
        'vendorId',
        'firstName lastName vendorProfile avatar isVendorApproved',
      )
      .populate(
        'categoryId',
        'name slug icon',
      )
      .lean();

    const scored = services.map((service: any) => {
      let score = 0;

      // Rating
      score += (service.rating ?? 0) * 8;

      // Reviews
      score += Math.min(
        Math.log(1 + (service.reviewCount ?? 0)) * 5,
        15,
      );

      // Bookings
      score += Math.min(
        Math.log(1 + (service.bookingCount ?? 0)) * 3,
        15,
      );

      // Budget Match
      if (budget) {
        if (service.basePrice <= budget) {
          score += 20;
        } else if (service.basePrice <= budget * 1.1) {
          score += 10;
        }
      }

      // Vendor Verification
      const vendor = service.vendorId as any;

      if (vendor?.vendorProfile?.isVerified) {
        score += 10;
      }

      // Trending
      score += (service.trendingScore ?? 0) * 5;

      return {
        ...service,
        aiScore: Math.round(score),
      };
    });

    scored.sort((a, b) => b.aiScore - a.aiScore);

    return scored.slice(0, limit);
  }
    // =========================================================================
  // SMART SERVICE RECOMMENDATIONS
  // =========================================================================

  async getServiceRecommendations(
    userId?: string,
    limit = 8,
  ): Promise<any[]> {

    // -----------------------------------------------------------------------
    // Anonymous User
    // -----------------------------------------------------------------------

    if (!userId) {
      return await this.serviceModel
        .find({ status: 'active' })
        .sort({
          trendingScore: -1,
          rating: -1,
        })
        .limit(limit)
        .populate(
          'vendorId',
          'firstName lastName vendorProfile avatar',
        )
        .populate(
          'categoryId',
          'name slug icon',
        )
        .lean();
    }

    // -----------------------------------------------------------------------
    // Booking History
    // -----------------------------------------------------------------------

    const history = await this.bookingModel
      .find({
        customerId: new Types.ObjectId(userId),
      })
      .populate('serviceId', 'categoryId')
      .sort({
        createdAt: -1,
      })
      .limit(10)
      .lean();

    const categoryIds = history
      .map((booking: any) => booking.serviceId?.categoryId?.toString())
      .filter(Boolean);

    const preferredCategories = [...new Set(categoryIds)];

    // -----------------------------------------------------------------------
    // Saved Services
    // -----------------------------------------------------------------------

    const user = await this.userModel
      .findById(userId)
      .populate({
        path: 'savedServices',
        select: 'categoryId',
      })
      .lean();

    const savedCategoryIds =
      (user?.savedServices as any[])
        ?.map(service => service?.categoryId?.toString())
        ?.filter(Boolean) ?? [];

    const allPreferredCategories = [
      ...new Set([
        ...preferredCategories,
        ...savedCategoryIds,
      ]),
    ];

    // -----------------------------------------------------------------------
    // No Preferences
    // -----------------------------------------------------------------------

    if (allPreferredCategories.length === 0) {
      return await this.serviceModel
        .find({
          status: 'active',
        })
        .sort({
          trendingScore: -1,
          rating: -1,
        })
        .limit(limit)
        .populate(
          'vendorId',
          'firstName lastName vendorProfile avatar',
        )
        .populate(
          'categoryId',
          'name slug icon',
        )
        .lean();
    }

    // -----------------------------------------------------------------------
    // Preferred Categories
    // -----------------------------------------------------------------------

    const boostedServices = await this.serviceModel
      .find({
        status: 'active',
        categoryId: {
          $in: allPreferredCategories.map(
            id => new Types.ObjectId(id),
          ),
        },
      })
      .sort({
        trendingScore: -1,
        rating: -1,
      })
      .limit(limit)
      .populate(
        'vendorId',
        'firstName lastName vendorProfile avatar',
      )
      .populate(
        'categoryId',
        'name slug icon',
      )
      .lean();

    // -----------------------------------------------------------------------
    // Fill Remaining Recommendations
    // -----------------------------------------------------------------------

    if (boostedServices.length < limit) {
      const remaining = await this.serviceModel
        .find({
          status: 'active',
          categoryId: {
            $nin: allPreferredCategories.map(
              id => new Types.ObjectId(id),
            ),
          },
        })
        .sort({
          trendingScore: -1,
          rating: -1,
        })
        .limit(limit - boostedServices.length)
        .populate(
          'vendorId',
          'firstName lastName vendorProfile avatar',
        )
        .populate(
          'categoryId',
          'name slug icon',
        )
        .lean();

      return [
        ...boostedServices,
        ...remaining,
      ];
    }

    return boostedServices;
  }
    // =========================================================================
  // AI BUDGET PLANNER
  // =========================================================================

  async planBudget(
    params: {
      eventType: string;
      totalBudget: number;
      guestCount: number;
      city?: string;
      preferences?: string[];
    },
  ): Promise<any> {
    const {
      eventType,
      totalBudget,
      guestCount,
      city,
      preferences = [],
    } = params;

    // -----------------------------------------------------------------------
    // Budget Allocation Templates
    // -----------------------------------------------------------------------

    const allocationMap: Record<string, Record<string, number>> = {
      wedding: {
        photography: 20,
        decoration: 25,
        catering: 30,
        makeup: 10,
        entertainment: 10,
        miscellaneous: 5,
      },

      birthday: {
        decoration: 30,
        catering: 35,
        photography: 15,
        entertainment: 15,
        miscellaneous: 5,
      },

      corporate: {
        catering: 40,
        decoration: 20,
        photography: 15,
        entertainment: 15,
        miscellaneous: 10,
      },

      engagement: {
        photography: 25,
        decoration: 30,
        catering: 25,
        makeup: 15,
        miscellaneous: 5,
      },

      default: {
        photography: 20,
        decoration: 20,
        catering: 30,
        makeup: 10,
        entertainment: 10,
        miscellaneous: 10,
      },
    };

    const allocation =
      allocationMap[eventType.toLowerCase()] ??
      allocationMap.default;

    // -----------------------------------------------------------------------
    // Budget Breakdown
    // -----------------------------------------------------------------------

    const budgetBreakdown = Object.entries(allocation).map(
      ([category, percentage]) => ({
        category,
        percentage,
        allocatedBudget: Math.round(
          (totalBudget * percentage) / 100,
        ),
      }),
    );

    // -----------------------------------------------------------------------
    // Vendor Recommendations
    // -----------------------------------------------------------------------

    const recommendations: any[] = [];

    for (const item of budgetBreakdown) {
      if (item.category === 'miscellaneous') {
        continue;
      }

     const category = await this.categoryModel
  .findOne({
    $or: [
      {
        name: {
          $regex: `^${item.category}$`,
          $options: 'i',
        },
      },
      {
        slug: {
          $regex: `^${item.category}$`,
          $options: 'i',
        },
      },
    ],
    isActive: true,
  })
  .lean();

const query: Record<string, any> = {
  status: 'active',
  basePrice: {
    $lte: item.allocatedBudget,
  },
};

if (category?._id) {
  query.categoryId = category._id;
} else {
  recommendations.push({
    category: item.category,
    allocatedBudget: item.allocatedBudget,
    percentage: item.percentage,
    suggestedServices: [],
  });

  continue;
}

if (city?.trim()) {
  query['location.city'] = {
    $regex: city.trim(),
    $options: 'i',
  };
}

const services = await this.serviceModel
  .find(query)
  .sort({
    rating: -1,
    trendingScore: -1,
  })
  .limit(3)
  .populate(
    'vendorId',
    'firstName lastName vendorProfile avatar',
  )
  .populate(
    'categoryId',
    'name slug icon',
  )
  .lean();

      recommendations.push({
        category: item.category,
        allocatedBudget: item.allocatedBudget,
        percentage: item.percentage,
        suggestedServices: services,
      });
    }

    // -----------------------------------------------------------------------
    // Response
    // -----------------------------------------------------------------------

    return {
      eventType,
      totalBudget,
      guestCount,

      budgetPerPerson:
        guestCount > 0
          ? Math.round(totalBudget / guestCount)
          : 0,

      preferences,

      recommendations,

      tips: this.getBudgetTips(
        eventType,
        totalBudget,
        guestCount,
      ),
    };
  }
    // =========================================================================
  // UPDATE TRENDING SCORES
  // =========================================================================

  async updateTrendingScores(): Promise<{ updated: number }> {
    const thirtyDaysAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000,
    );

    const recentBookings = await this.bookingModel.aggregate([
      {
        $match: {
          createdAt: {
            $gte: thirtyDaysAgo,
          },
        },
      },
      {
        $group: {
          _id: '$serviceId',
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    let updated = 0;

    for (const item of recentBookings) {
      const service = await this.serviceModel.findById(item._id);

      if (!service) {
        continue;
      }

      const views = service.viewCount ?? 0;

      const bookings = item.count ?? 0;

      const conversionRate =
        views > 0
          ? (bookings / views) * 100
          : 0;

      const trendingScore =
        (service.rating ?? 0) * 10 +
        Math.log(1 + bookings) * 20 +
        conversionRate * 5;

      await this.serviceModel.findByIdAndUpdate(
        item._id,
        {
          trendingScore: Math.round(trendingScore),
          conversionRate:
            Math.round(conversionRate * 10) / 10,
        },
      );

      updated++;
    }

    return {
      updated,
    };
  }

  // =========================================================================
  // AI BUDGET TIPS
  // =========================================================================

  private getBudgetTips(
    eventType: string,
    budget: number,
    guests: number,
  ): string[] {
    const tips: string[] = [];

    const budgetPerPerson =
      guests > 0
        ? budget / guests
        : 0;

    if (budgetPerPerson < 500) {
      tips.push(
        'Consider reducing guest count to improve per-person quality.',
      );
    }

    switch (eventType.toLowerCase()) {
      case 'wedding':
        tips.push(
          'Book photography and makeup vendors 3-6 months in advance.',
        );
        break;

      case 'birthday':
        tips.push(
          'Choose package deals to reduce overall event cost.',
        );
        break;

      case 'corporate':
        tips.push(
          'Book vendors early to secure weekday corporate discounts.',
        );
        break;

      case 'engagement':
        tips.push(
          'Focus more budget on photography and decoration.',
        );
        break;

      default:
        break;
    }

    tips.push(
      'Compare at least three vendors before making a booking.',
    );

    tips.push(
      'Keep 5-10% of your budget reserved for unexpected expenses.',
    );

    if (budget >= 100000) {
      tips.push(
        'Negotiate package discounts when booking multiple vendors together.',
      );
    }

    return tips;
  }
  // ============================================================================
// AI SIMILAR SERVICES
// ============================================================================

async getSimilarServices(
  serviceId: string,
  limit = 10,
) {
  const service =
    await this.serviceModel
      .findById(serviceId)
      .lean();

  if (!service) {
    throw new NotFoundException(
      'Service not found',
    );
  }

  const services =
    await this.serviceModel
      .find({
        _id: {
          $ne: service._id,
        },

        status: 'active',

        categoryId: service.categoryId,
      })
      .populate(
        'vendorId',
        'firstName lastName vendorProfile avatar',
      )
      .populate(
        'categoryId',
        'name slug icon',
      )
      .lean();

  const recommendations =
    services
      .map((candidate: any) => {
        let score = 0;

        const reasons: string[] = [];

        // Same category
        score += 40;
        reasons.push('Same category');

        // Same city
        if (
          candidate.location?.city &&
          service.location?.city &&
          candidate.location.city ===
            service.location.city
        ) {
          score += 15;
          reasons.push('Same city');
        }

        // Similar price
        const priceDiff =
          Math.abs(
            candidate.basePrice -
              service.basePrice,
          );

        if (
          priceDiff <=
          service.basePrice * 0.2
        ) {
          score += 15;
          reasons.push(
            'Similar pricing',
          );
        }

        // Rating

        score +=
          (candidate.rating || 0) * 4;

        // Trending

        score +=
          candidate.trendingScore || 0;

        // Verified vendor

        if (
          candidate.vendorId
            ?.vendorProfile?.isVerified
        ) {
          score += 10;

          reasons.push(
            'Verified vendor',
          );
        }

        return {
          ...candidate,
          aiScore: Math.round(score),
          reasons,
        };
      })
      .sort(
        (a, b) =>
          b.aiScore - a.aiScore,
      )
      .slice(0, limit);

  return recommendations;
}

// ============================================================================
// FREQUENTLY BOOKED TOGETHER
// ============================================================================

async getFrequentlyBookedTogether(
  serviceId: string,
  limit = 5,
) {
  const bookings =
    await this.bookingModel
      .find({
        serviceId: new Types.ObjectId(
          serviceId,
        ),
      })
      .select('customerId')
      .lean();

  if (!bookings.length) {
    return [];
  }

  const customerIds =
    bookings.map(
      booking => booking.customerId,
    );

  const relatedBookings =
    await this.bookingModel
      .find({
        customerId: {
          $in: customerIds,
        },

        serviceId: {
          $ne: new Types.ObjectId(
            serviceId,
          ),
        },
      })
      .populate({
        path: 'serviceId',
        populate: [
          {
            path: 'vendorId',
            select:
              'firstName lastName vendorProfile avatar',
          },
          {
            path: 'categoryId',
            select:
              'name slug icon',
          },
        ],
      })
      .lean();

  const map =
    new Map<string, any>();

  for (const booking of relatedBookings) {
    const id =
      booking.serviceId._id.toString();

    if (!map.has(id)) {
      map.set(id, {
        service: booking.serviceId,
        count: 0,
      });
    }

    map.get(id).count++;
  }

  return [...map.values()]
    .sort(
      (a, b) => b.count - a.count,
    )
    .slice(0, limit)
    .map(item => ({
      ...item.service,
      bookedTogetherCount:
        item.count,
    }));
}

// ============================================================================
// AI HOME FEED
// ============================================================================

async getHomeFeed(
  userId: string,
) {
  const [
    recommendedVendors,
    recommendedServices,
    trendingServices,
    trendingVendors,
    recentBookings,
  ] = await Promise.all([

    this.getVendorRecommendations({
  userId,
  limit: 6,
}),

    this.getServiceRecommendations(
      userId,
      8,
    ),

    this.serviceModel
      .find({
        status: 'active',
      })
      .sort({
        trendingScore: -1,
        rating: -1,
      })
      .limit(8)
      .populate(
        'vendorId',
        'firstName lastName vendorProfile avatar',
      )
      .populate(
        'categoryId',
        'name slug icon',
      )
      .lean(),

    this.userModel
      .find({
        role: 'vendor',
        'vendorProfile.isApproved': true,
      })
      .sort({
        'vendorProfile.rating': -1,
        'vendorProfile.reviewCount': -1,
      })
      .limit(6)
      .lean(),

    this.bookingModel
      .find({
        customerId: new Types.ObjectId(userId),
      })
      .sort({
        createdAt: -1,
      })
      .limit(5)
      .populate({
        path: 'serviceId',
        populate: [
          {
            path: 'vendorId',
            select:
              'firstName lastName vendorProfile avatar',
          },
          {
            path: 'categoryId',
            select:
              'name slug icon',
          },
        ],
      })
      .lean(),
  ]);

  return {

    recommendedVendors,

    recommendedServices,

    trendingServices,

    trendingVendors,

    recentBookings,

    generatedAt: new Date(),
  };
}

// ============================================================================
// AI SMART SEARCH
// ============================================================================

async smartSearch(params: {
  q?: string;
  city?: string;
  category?: string;
  budget?: number;
  limit?: number;
}) {
  const {
    q,
    city,
    category,
    budget,
    limit = 20,
  } = params;

  const filter: any = {
    status: 'active',
  };

  if (q) {
    filter.$or = [
      {
        name: {
          $regex: q,
          $options: 'i',
        },
      },
      {
        description: {
          $regex: q,
          $options: 'i',
        },
      },
    ];
  }

  if (city) {
    filter['location.city'] = {
      $regex: city,
      $options: 'i',
    };
  }

  if (category) {
    filter.categoryId = new Types.ObjectId(
      category,
    );
  }

  const services =
    await this.serviceModel
      .find(filter)
      .populate(
        'vendorId',
        'firstName lastName vendorProfile avatar',
      )
      .populate(
        'categoryId',
        'name slug icon',
      )
      .lean();

  const ranked = services
    .map((service: any) => {

      let score = 0;

      // Rating (0–25)
      score += (service.rating || 0) * 5;

      // Reviews (0–15)
      score += Math.min(
        service.reviewCount || 0,
        15,
      );

      // Trending (0–20)
      score += Math.min(
        service.trendingScore || 0,
        20,
      );

      // Booking popularity
      score += Math.min(
        service.bookingCount || 0,
        15,
      );

      // Verified vendor
      if (
        service.vendorId?.vendorProfile
          ?.isVerified
      ) {
        score += 10;
      }

      // Budget relevance
      if (
        budget &&
        service.basePrice <= budget
      ) {
        score += 10;
      }

      return {
        ...service,
        aiScore: Math.round(score),
      };
    })
    .sort(
      (a, b) =>
        b.aiScore - a.aiScore,
    )
    .slice(0, limit);

  return ranked;
}

// ============================================================================
// SEASONAL AI RECOMMENDATIONS
// ============================================================================

async getSeasonalRecommendations(
  city?: string,
) {
  const month =
    new Date().getMonth() + 1;

  let keywords: string[] = [];

  switch (month) {
    case 1:
      keywords = ['new year'];
      break;

    case 2:
      keywords = [
        'valentine',
        'romantic',
      ];
      break;

    case 3:
    case 4:
      keywords = [
        'wedding',
        'engagement',
      ];
      break;

    case 5:
    case 6:
      keywords = [
        'summer',
      ];
      break;

    case 7:
    case 8:
      keywords = [
        'indoor',
      ];
      break;

    case 9:
    case 10:
      keywords = [
        'festival',
      ];
      break;

    case 11:
      keywords = [
        'wedding',
        'diwali',
      ];
      break;

    case 12:
      keywords = [
        'christmas',
        'new year',
      ];
      break;
  }

  const filter: any = {
    status: 'active',
  };

  if (city) {
    filter['location.city'] = {
      $regex: city,
      $options: 'i',
    };
  }

  const services =
    await this.serviceModel
      .find(filter)
      .populate(
        'vendorId',
        'firstName lastName vendorProfile avatar',
      )
      .populate(
        'categoryId',
        'name slug icon',
      )
      .lean();

  const ranked =
    services
      .map((service: any) => {

        let score = 0;

        score +=
          service.trendingScore || 0;

        score +=
          (service.rating || 0) * 5;

        const text = (
          service.name +
          ' ' +
          service.description
        ).toLowerCase();

        for (const keyword of keywords) {
          if (text.includes(keyword)) {
            score += 30;
          }
        }

        return {
          ...service,
          seasonalScore: score,
        };
      })
      .sort(
        (a, b) =>
          b.seasonalScore -
          a.seasonalScore,
      )
      .slice(0, 10);

  return {
    month,
    keywords,
    recommendations: ranked,
  };
}
// ============================================================================
// SMART BUDGET OPTIMIZER
// ============================================================================

async optimizeBudget(params: {
  eventType: string;
  totalBudget: number;
  guestCount: number;
  city?: string;
}) {
  const {
    eventType,
    totalBudget,
    guestCount,
    city,
  } = params;

  const services =
    await this.serviceModel
      .find({
        status: 'active',
      })
      .populate(
        'categoryId',
        'name',
      )
      .lean();

  const categoryStats = new Map<
    string,
    {
      totalPrice: number;
      count: number;
    }
  >();

  for (const service of services as any[]) {
    const category =
      service.categoryId?.name ??
      'Other';

    if (!categoryStats.has(category)) {
      categoryStats.set(category, {
        totalPrice: 0,
        count: 0,
      });
    }

    const current =
      categoryStats.get(category)!;

    current.totalPrice +=
      service.basePrice || 0;

    current.count++;
  }

  const recommendations = [];

  for (const [category, stats] of categoryStats) {

    const averagePrice =
      stats.count > 0
        ? Math.round(
            stats.totalPrice /
              stats.count,
          )
        : 0;

    const suggestedBudget =
      Math.min(
        averagePrice,
        totalBudget * 0.35,
      );

    recommendations.push({
      category,

      averageMarketPrice:
        averagePrice,

      suggestedBudget,

      estimatedSavings:
        Math.max(
          suggestedBudget -
            averagePrice,
          0,
        ),
    });
  }

  recommendations.sort(
    (a, b) =>
      b.suggestedBudget -
      a.suggestedBudget,
  );

  return {
    eventType,

    totalBudget,

    guestCount,

    city,

    budgetPerGuest:
      guestCount > 0
        ? Math.round(
            totalBudget /
              guestCount,
          )
        : 0,

    recommendations,
  };
}
// ============================================================================
// VENDOR AI INSIGHTS
// ============================================================================

async getVendorInsights(
  vendorId: string,
) {
  const vendor =
    await this.userModel.findById(vendorId);

  if (!vendor) {
    throw new NotFoundException(
      'Vendor not found',
    );
  }

  const [
    services,
    bookings,
    reviews,
  ] = await Promise.all([

    this.serviceModel.find({
      vendorId: new Types.ObjectId(vendorId),
    }),

    this.bookingModel.find({
      vendorId: new Types.ObjectId(vendorId),
    }),

    this.reviewModel.find({
      vendorId: new Types.ObjectId(vendorId),
      status: 'approved',
    }),
  ]);

  const completedBookings =
    bookings.filter(
      booking =>
        booking.status === 'completed',
    );

  const cancelledBookings =
    bookings.filter(
      booking =>
        booking.status === 'cancelled',
    );

  const totalRevenue =
    completedBookings.reduce(
      (sum, booking: any) =>
        sum + (booking.totalAmount || 0),
      0,
    );

  const averageBookingValue =
    completedBookings.length
      ? Math.round(
          totalRevenue /
            completedBookings.length,
        )
      : 0;

  const averageRating =
    reviews.length
      ? reviews.reduce(
          (sum, review) =>
            sum + review.rating,
          0,
        ) / reviews.length
      : 0;

  const conversionRate =
    bookings.length
      ? Math.round(
          (completedBookings.length /
            bookings.length) *
            100,
        )
      : 0;

  const cancellationRate =
    bookings.length
      ? Math.round(
          (cancelledBookings.length /
            bookings.length) *
            100,
        )
      : 0;

  const recommendations: string[] = [];

  if (averageRating < 4.5) {
    recommendations.push(
      'Improve customer satisfaction to increase ratings.',
    );
  }

  if (conversionRate < 70) {
    recommendations.push(
      'Improve response time to convert more enquiries.',
    );
  }

  if (cancellationRate > 10) {
    recommendations.push(
      'Reduce booking cancellations to improve trust.',
    );
  }

  if (services.length < 5) {
    recommendations.push(
      'Add more services to improve marketplace visibility.',
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      'Excellent performance. Continue maintaining high service quality.',
    );
  }

  return {

    overview: {

      totalServices: services.length,

      totalBookings: bookings.length,

      completedBookings:
        completedBookings.length,

      cancelledBookings:
        cancelledBookings.length,

      totalRevenue,

      averageBookingValue,

      averageRating:
        Math.round(
          averageRating * 10,
        ) / 10,

      conversionRate,

      cancellationRate,
    },

    aiRecommendations:
      recommendations,
  };
}
// ============================================================================
// CUSTOMER AI INSIGHTS
// ============================================================================

async getCustomerInsights(
  customerId: string,
) {
  const [
    bookings,
    reviews,
    savedServices,
  ] = await Promise.all([

    this.bookingModel.find({
      customerId: new Types.ObjectId(customerId),
    }),

    this.reviewModel.find({
      customerId: new Types.ObjectId(customerId),
    }),

    this.serviceModel.find({
      savedBy: new Types.ObjectId(customerId),
    }).limit(5),
  ]);

  const completed =
    bookings.filter(
      booking => booking.status === 'completed',
    );

  const cancelled =
    bookings.filter(
      booking => booking.status === 'cancelled',
    );

  const totalSpent =
    completed.reduce(
      (sum, booking: any) =>
        sum + (booking.totalAmount || 0),
      0,
    );

  const averageBookingValue =
    completed.length
      ? Math.round(
          totalSpent / completed.length,
        )
      : 0;

  const insights: string[] = [];

  if (completed.length === 0) {
    insights.push(
      'Complete your first booking to unlock personalized recommendations.',
    );
  }

  if (cancelled.length > completed.length) {
    insights.push(
      'You cancel bookings frequently. Consider confirming availability before booking.',
    );
  }

  if (reviews.length < completed.length) {
    insights.push(
      'Leaving reviews helps improve future recommendations.',
    );
  }

  if (savedServices.length > 0) {
    insights.push(
      'Some saved services may have updated prices or availability.',
    );
  }

  if (averageBookingValue > 100000) {
    insights.push(
      'You often book premium services. Explore exclusive verified vendors.',
    );
  }

  return {

    overview: {

      totalBookings: bookings.length,

      completedBookings:
        completed.length,

      cancelledBookings:
        cancelled.length,

      totalSpent,

      averageBookingValue,

      totalReviews:
        reviews.length,

      savedServices:
        savedServices.length,
    },

    aiInsights:
      insights,
  };
}
// ============================================================================
// AI TRUST & FRAUD ANALYSIS
// ============================================================================

async getTrustAnalysis(
  vendorId: string,
) {
  const [
    vendor,
    bookings,
    reviews,
    services,
  ] = await Promise.all([

    this.userModel.findById(vendorId),

    this.bookingModel.find({
      vendorId: new Types.ObjectId(vendorId),
    }),

    this.reviewModel.find({
      vendorId: new Types.ObjectId(vendorId),
    }),

    this.serviceModel.find({
      vendorId: new Types.ObjectId(vendorId),
    }),
  ]);

  if (!vendor) {
    throw new NotFoundException(
      'Vendor not found',
    );
  }

  const completed =
    bookings.filter(
      booking => booking.status === 'completed',
    );

  const cancelled =
    bookings.filter(
      booking => booking.status === 'cancelled',
    );

  const suspiciousReviews =
    reviews.filter(
      review =>
        review.rating === 5 &&
        review.comment.length < 20,
    );

  const trustScore = Math.max(
    0,
    Math.min(
      100,

      50 +

      completed.length * 2 +

      (vendor.vendorProfile?.isVerified ? 15 : 0) +

      Math.round(
        (vendor.vendorProfile?.rating || 0) * 5,
      )

      -

      cancelled.length

      -

      suspiciousReviews.length * 5,
    ),
  );

  const risks: string[] = [];

  if (cancelled.length > completed.length * 0.3) {
    risks.push(
      'High booking cancellation rate detected.',
    );
  }

  if (suspiciousReviews.length > 3) {
    risks.push(
      'Multiple short 5-star reviews detected.',
    );
  }

  if (!vendor.vendorProfile?.isVerified) {
    risks.push(
      'Vendor is not verified.',
    );
  }

  if (services.length === 0) {
    risks.push(
      'Vendor has no active services.',
    );
  }

  return {

    trustScore,

    suspiciousReviews:
      suspiciousReviews.length,

    completedBookings:
      completed.length,

    cancelledBookings:
      cancelled.length,

    verified:
      vendor.vendorProfile?.isVerified,

    risks,
  };
}
// ============================================================================
// AI PACKAGE RECOMMENDATION
// ============================================================================

async recommendPackage(
  serviceId: string,
) {
  const baseService =
    await this.serviceModel
      .findById(serviceId)
      .populate(
        'categoryId',
        'name',
      )
      .populate(
        'vendorId',
        'firstName lastName vendorProfile',
      );

  if (!baseService) {
    throw new NotFoundException(
      'Service not found',
    );
  }

  const categories = await this.serviceModel.distinct(
    'categoryId',
    {
      status: 'active',
    },
  );

  const packageServices: any[] = [];

  let totalPrice =
    baseService.basePrice || 0;

  packageServices.push(baseService);

  for (const categoryId of categories) {

    if (
      categoryId.toString() ===
      baseService.categoryId['_id'].toString()
    ) {
      continue;
    }

    const service =
      await this.serviceModel
        .findOne({
          status: 'active',
          categoryId,
        })
        .sort({
          rating: -1,
          trendingScore: -1,
        })
        .populate(
          'vendorId',
          'firstName lastName vendorProfile',
        )
        .populate(
          'categoryId',
          'name',
        );

    if (service) {

      packageServices.push(service);

      totalPrice +=
        service.basePrice || 0;
    }
  }

  const bundleDiscount =
    Math.round(totalPrice * 0.08);

  return {

    packageName:
      `${baseService.categoryId['name']} Premium Package`,

    services:
      packageServices,

    originalPrice:
      totalPrice,

    bundleDiscount,

    finalPrice:
      totalPrice - bundleDiscount,

    estimatedSavings:
      bundleDiscount,

    aiConfidence:
      95,
  };
}



  // =========================================================================
  // AI ADVANTAGE - DATA-DRIVEN MVP INTELLIGENCE
  // =========================================================================

  async getVendorPerformanceScore(vendorId: string) {
    const vendorObjId = new Types.ObjectId(vendorId);
    const [services, bookings, reviews] = await Promise.all([
      this.serviceModel.find({ vendorId: vendorObjId, status: 'active' }).lean(),
      this.bookingModel.find({ vendorId: vendorObjId }).lean(),
      this.reviewModel.find({ vendorId: vendorObjId, status: 'approved' }).lean(),
    ]);

    const completed = bookings.filter((b: any) => b.status === 'completed').length;
    const avgRating = reviews.length
      ? reviews.reduce((sum: number, r: any) => sum + Number(r.rating || 0), 0) / reviews.length
      : 0;
    const views = services.reduce((sum: number, s: any) => sum + Number(s.viewCount || 0), 0);
    const conversion = bookings.length ? completed / bookings.length : 0;
    const score = Math.min(100, Math.round(
      avgRating * 12 + Math.min(completed * 4, 20) +
      Math.min(reviews.length * 2, 10) + Math.min(views / 25, 5) + conversion * 5
    ));

    return { vendorId, score, metrics: { activeServices: services.length, totalBookings: bookings.length, completedBookings: completed, averageRating: Number(avgRating.toFixed(2)), reviewCount: reviews.length, totalViews: views, conversionRate: Number((conversion * 100).toFixed(2)) } };
  }

  async getCustomerSentiment(vendorId: string) {
    const reviews = await this.reviewModel.find({
      vendorId: new Types.ObjectId(vendorId),
      status: 'approved',
    }).lean();

    const positive = ['excellent','amazing','great','good','professional','love','best','happy','perfect','recommend','quality'];
    const negative = ['bad','poor','late','worst','terrible','rude','delay','disappointed','issue','problem','awful'];
    const analysed = reviews.map((review: any) => {
      const text = String(review.comment || '').toLowerCase();
      const lexical = positive.filter(w => text.includes(w)).length - negative.filter(w => text.includes(w)).length;
      const ratingSignal = Number(review.rating || 3) - 3;
      const value = lexical + ratingSignal;
      return { reviewId: review._id, sentiment: value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral', score: value };
    });
    const summary = analysed.reduce((a: any, x: any) => { a[x.sentiment]++; return a; }, { positive: 0, neutral: 0, negative: 0 });
    const overall = summary.positive > summary.negative ? 'positive' : summary.negative > summary.positive ? 'negative' : 'neutral';
    return { vendorId, overall, totalReviews: reviews.length, summary, analysed };
  }

  async getRevenueForecast(vendorId: string) {
    const since = new Date();
    since.setMonth(since.getMonth() - 6);
    const payments: any[] = await this.paymentModel.find({
      vendorId: new Types.ObjectId(vendorId),
      status: 'paid',
      createdAt: { $gte: since },
    } as any).lean();

    const monthly = new Map();
    for (const p of payments) {
      const d = new Date((p as any).createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthly.set(key, (monthly.get(key) || 0) + Number(p.vendorPayoutAmount || 0));
    }
    const history = [...monthly.entries()].sort(([a],[b]) => a.localeCompare(b)).map(([month, revenue]) => ({ month, revenue }));
    const values = history.map(x => Number(x.revenue));
    const recent = values.slice(-3);
    const baseline = recent.length ? recent.reduce((a,b) => a+b, 0) / recent.length : 0;
    const trend = recent.length > 1 ? (recent[recent.length - 1] - recent[0]) / (recent.length - 1) : 0;
    const forecast = [1,2,3].map(i => ({ monthAhead: i, projectedRevenue: Math.max(0, Math.round(baseline + trend * i)) }));
    return { vendorId, basis: 'paid_vendor_payout_history', history, forecast, confidence: payments.length >= 6 ? 'medium' : 'low' };
  }

  async getDemandForecast() {
    const since = new Date();
    since.setMonth(since.getMonth() - 6);
    const rows = await this.bookingModel.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $lookup: { from: 'services', localField: 'serviceId', foreignField: '_id', as: 'service' } },
      { $unwind: '$service' },
      { $lookup: { from: 'categories', localField: 'service.categoryId', foreignField: '_id', as: 'category' } },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      { $group: { _id: { categoryId: '$service.categoryId', month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } } }, category: { $first: '$category.name' }, demand: { $sum: 1 } } },
      { $sort: { '_id.month': 1 } },
    ]);
    const grouped = new Map();
    for (const r of rows) {
      const key = String(r._id.categoryId);
      if (!grouped.has(key)) grouped.set(key, { categoryId: key, category: r.category || 'Unknown', history: [] });
      grouped.get(key).history.push({ month: r._id.month, demand: r.demand });
    }
    return [...grouped.values()].map((x: any) => {
      const v = x.history.map((h: any) => h.demand);
      const change = v.length > 1 ? v[v.length - 1] - v[v.length - 2] : 0;
      return { ...x, trend: change > 0 ? 'rising' : change < 0 ? 'declining' : 'stable', nextPeriodEstimate: Math.max(0, (v[v.length - 1] || 0) + change) };
    });
  }

  async getFraudDetection() {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const payments: any[] = await this.paymentModel.find({ createdAt: { $gte: since } } as any).lean();
    const byCustomer = new Map();
    for (const p of payments) {
      const key = String(p.customerId);
      if (!byCustomer.has(key)) byCustomer.set(key, []);
      byCustomer.get(key).push(p);
    }
    const alerts: any[] = [];
    for (const [customerId, rows] of byCustomer.entries()) {
      const failed = rows.filter((p: any) => p.status === 'failed').length;
      const refunded = rows.filter((p: any) => p.status === 'refunded').length;
      const highValue = rows.filter((p: any) => Number(p.amount || 0) >= 100000).length;
      let riskScore = Math.min(100, failed * 15 + refunded * 20 + highValue * 10);
      if (riskScore >= 30) alerts.push({ customerId, riskScore, signals: { failedPayments: failed, refunds: refunded, highValuePayments: highValue } });
    }
    return { windowDays: 30, analysedPayments: payments.length, flagged: alerts.length, alerts: alerts.sort((a,b) => b.riskScore - a.riskScore) };
  }

  async moderateContent(text: string) {
    const value = String(text || '').trim();
    const lower = value.toLowerCase();
    const abusive = ['idiot','stupid','hate','kill','scam'];
    const spamPatterns = [/(https?:\/\/\S+\s*){3,}/i, /(.)\1{9,}/, /\b(buy now|click here|limited offer)\b/i];
    const reasons: string[] = [];
    if (abusive.some(w => lower.includes(w))) reasons.push('potentially_abusive_language');
    if (spamPatterns.some(p => p.test(value))) reasons.push('spam_or_promotional_pattern');
    if (value.length > 2000) reasons.push('excessive_length');
    return { allowed: reasons.length === 0, action: reasons.length ? 'review' : 'allow', reasons };
  }

  async getSmartAnalytics() {
    const [users, vendors, services, bookings, paid, reviews] = await Promise.all([
      this.userModel.countDocuments({ role: { $ne: 'admin' } }),
      this.userModel.countDocuments({ role: 'vendor', isVendorApproved: true }),
      this.serviceModel.countDocuments({ status: 'active' }),
      this.bookingModel.countDocuments(),
      this.paymentModel.countDocuments({ status: 'paid' }),
      this.reviewModel.countDocuments({ status: 'approved' }),
    ]);
    const completed = await this.bookingModel.countDocuments({ status: 'completed' });
    const insights: string[] = [];
    if (services === 0) insights.push('No active services are available; service supply is the immediate platform constraint.');
    if (vendors > 0 && services / vendors < 2) insights.push('Average active service coverage per approved vendor is below two.');
    if (bookings > 0 && completed / bookings < 0.5) insights.push('Less than half of recorded bookings are completed; booking lifecycle conversion needs attention.');
    if (bookings > 0 && paid / bookings < 0.5) insights.push('Paid-payment conversion is below 50% of recorded bookings.');
    if (!insights.length) insights.push('Current platform indicators do not show a critical threshold alert.');
    return { metrics: { users, approvedVendors: vendors, activeServices: services, bookings, paidPayments: paid, approvedReviews: reviews, completedBookings: completed }, insights, generatedAt: new Date().toISOString() };
  }

  async supportAssistant(message: string) {
    const text = String(message || '').toLowerCase();
    let intent = 'general';
    let answer = 'I can help with services, bookings, payments, vendor applications, reviews, and account guidance on OMIQORA.';
    if (/book|booking/.test(text)) { intent = 'booking'; answer = 'Open a service, review its details, choose the booking option, provide event details, and follow the booking status from your dashboard.'; }
    else if (/pay|payment|refund/.test(text)) { intent = 'payment'; answer = 'Open the relevant booking or Payments section to check payment status. For failed or refunded transactions, use the recorded transaction details and status shown in OMIQORA.'; }
    else if (/vendor|application|approve/.test(text)) { intent = 'vendor'; answer = 'Use Join as Vendor to submit your application. After admin approval, vendor dashboard access and vendor workflows become available.'; }
    else if (/service|find|search|photograph|cater|decor/.test(text)) { intent = 'discovery'; answer = 'Use Find Services or Intelligent Search to filter services by category, city, price, and rating.'; }
    else if (/review|rating/.test(text)) { intent = 'review'; answer = 'Verified review workflows are linked to completed service experiences and are managed through the customer review area.'; }
    return { intent, answer, source: 'royal-sphere-support-rules' };
  }



  private async generateGeminiInsight(prompt: string, fallback: string): Promise<string> {
    if ((process.env.AI_PROVIDER || 'gemini') !== 'gemini') return fallback;
    try {
      return await this.aiProviderFactory.getProvider('gemini').generateText(prompt);
    } catch {
      return fallback;
    }
  }

  async getAIHealth() {
    const configured = Boolean(process.env.GEMINI_API_KEY);
    if (!configured) return { provider: 'gemini', configured: false, live: false, message: 'GEMINI_API_KEY is not configured' };
    try {
      const reply = await this.aiProviderFactory.getProvider('gemini').generateText(
        'Reply with exactly: ROYAL_SPHERE_AI_OK',
      );
      return { provider: 'gemini', configured: true, live: reply.includes('ROYAL_SPHERE_AI_OK'), model: process.env.GEMINI_MODEL || 'gemini-2.5-flash' };
    } catch (error: any) {
      return { provider: 'gemini', configured: true, live: false, message: error?.message || 'Gemini check failed' };
    }
  }

  async getAIExecutiveBrief() {
    const analytics = await this.getSmartAnalytics();
    const fallback = analytics.insights.join(' ');
    const insight = await this.generateGeminiInsight(
      `You are OMIQORA's AI strategy analyst. Based only on this real platform JSON, give a concise 3-sentence operational brief. Do not invent numbers. JSON: ${JSON.stringify(analytics.metrics)}`,
      fallback,
    );
    return { ...analytics, aiInsight: insight };
  }

  async getVendorAIBrief(vendorId: string) {
    const [performance, sentiment, revenue] = await Promise.all([
      this.getVendorPerformanceScore(vendorId),
      this.getCustomerSentiment(vendorId),
      this.getRevenueForecast(vendorId),
    ]);
    const fallback = `Performance score is ${performance.score}/100. Overall customer sentiment is ${sentiment.overall}. Revenue forecast confidence is ${revenue.confidence}.`;
    const aiInsight = await this.generateGeminiInsight(
      `Act as a vendor growth analyst for OMIQORA. Use only the supplied data. Give 3 short actionable recommendations and do not invent metrics. DATA: ${JSON.stringify({ performance, sentiment, revenue })}`,
      fallback,
    );
    return { performance, sentiment, revenue, aiInsight };
  }

  async supportAssistantAI(message: string) {
    const fallback = await this.supportAssistant(message);
    const answer = await this.generateGeminiInsight(
      `You are OMIQORA AI Support. OMIQORA is an AI-powered services ecosystem for discovering, comparing, booking and managing trusted services. Answer the user's question briefly and helpfully. Never invent booking, payment, vendor, refund, or account status. If live account data is required, tell the user to check the relevant dashboard. User: ${String(message || '').slice(0, 1500)}`,
      fallback.answer,
    );
    return { intent: fallback.intent, answer, source: answer === fallback.answer ? fallback.source : 'gemini' };
  }

}

