import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { Payment, PaymentDocument } from '../payments/schemas/payment.schema';
import { Service, ServiceDocument } from '../services/schemas/service.schema';
import { Review, ReviewDocument } from '../reviews/schemas/review.schema';
import { Category, CategoryDocument } from '../categories/schemas/category.schema';
import {
  BookingStatus,
} from '../bookings/schemas/booking.schema';
import {
  UserRole,
  UserStatus,
} from '../users/schemas/user.schema';
import {
  ServiceStatus,
} from '../services/schemas/service.schema';
import {
  ReviewStatus,
} from '../reviews/schemas/review.schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  // ── Admin Dashboard ────────────────────────────────────────────────────────

  async getAdminOverview() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalUsers, totalVendors, totalServices, totalBookings,
      pendingApplications, activeBookings,
      revenueThisMonth, revenueLastMonth,
      bookingsThisMonth, bookingsLastMonth,
      newUsersThisMonth, newUsersLastMonth,
    ] = await Promise.all([
      this.userModel.countDocuments({ role: { $ne: 'admin' } }),
      this.userModel.countDocuments({ role: 'vendor', isVendorApproved: true }),
      this.serviceModel.countDocuments({ status: 'active' }),
      this.bookingModel.countDocuments(),
      this.userModel.countDocuments({ vendorApplicationId: { $exists: true }, isVendorApproved: false }),
      this.bookingModel.countDocuments({ status: { $in: ['pending', 'accepted', 'in_progress'] } }),
      this.paymentModel.aggregate([
        { $match: { status: 'paid', createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$commissionAmount' } } },
      ]),
      this.paymentModel.aggregate([
        { $match: { status: 'paid', createdAt: { $gte: lastMonth, $lte: endLastMonth } } },
        { $group: { _id: null, total: { $sum: '$commissionAmount' } } },
      ]),
      this.bookingModel.countDocuments({ createdAt: { $gte: startOfMonth } }),
      this.bookingModel.countDocuments({ createdAt: { $gte: lastMonth, $lte: endLastMonth } }),
      this.userModel.countDocuments({ createdAt: { $gte: startOfMonth } }),
      this.userModel.countDocuments({ createdAt: { $gte: lastMonth, $lte: endLastMonth } }),
    ]);

    const revThis = revenueThisMonth[0]?.total || 0;
    const revLast = revenueLastMonth[0]?.total || 0;

    return {
      totalUsers,
      totalVendors,
      totalServices,
      totalBookings,
      pendingApplications,
      activeBookings,
      revenueThisMonth: revThis,
      revenueGrowth: revLast > 0 ? ((revThis - revLast) / revLast) * 100 : 0,
      bookingsThisMonth,
      bookingsGrowth: bookingsLastMonth > 0 ? ((bookingsThisMonth - bookingsLastMonth) / bookingsLastMonth) * 100 : 0,
      newUsersThisMonth,
      usersGrowth: newUsersLastMonth > 0 ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100 : 0,
    };
  }

  async getRevenueChart(months = 12) {
    const data = [];
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      const start = new Date(date.getFullYear(), date.getMonth() - i, 1);
      const end = new Date(date.getFullYear(), date.getMonth() - i + 1, 0);
      const result = await this.paymentModel.aggregate([
        { $match: { status: 'paid', createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: null, revenue: { $sum: '$amount' }, commission: { $sum: '$commissionAmount' } } },
      ]);
      data.push({
        month: start.toLocaleString('default', { month: 'short', year: '2-digit' }),
        revenue: result[0]?.revenue || 0,
        commission: result[0]?.commission || 0,
      });
    }
    return data;
  }

  async getUserGrowthChart(months = 12) {
    const data = [];
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      const start = new Date(date.getFullYear(), date.getMonth() - i, 1);
      const end = new Date(date.getFullYear(), date.getMonth() - i + 1, 0);
      const [customers, vendors] = await Promise.all([
        this.userModel.countDocuments({ role: 'customer', createdAt: { $gte: start, $lte: end } }),
        this.userModel.countDocuments({ role: 'vendor', createdAt: { $gte: start, $lte: end } }),
      ]);
      data.push({
        month: start.toLocaleString('default', { month: 'short', year: '2-digit' }),
        customers,
        vendors,
      });
    }
    return data;
  }

  async getTopCategories() {
    return this.bookingModel.aggregate([
      { $lookup: { from: 'services', localField: 'serviceId', foreignField: '_id', as: 'service' } },
      { $unwind: '$service' },
      { $group: { _id: '$service.categoryId', bookingCount: { $sum: 1 } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: '$category' },
      { $project: { name: '$category.name', icon: '$category.icon', bookingCount: 1 } },
      { $sort: { bookingCount: -1 } },
      { $limit: 8 },
    ]);
  }

  async getTopVendors(limit = 10) {
    return this.userModel
      .find({ role: 'vendor', isVendorApproved: true })
      .sort({ 'vendorProfile.rating': -1, 'vendorProfile.reviewCount': -1 })
      .limit(limit)
      .select('firstName lastName vendorProfile avatar');
  }

  async getBookingStatusDistribution() {
    return this.bookingModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { status: '$_id', count: 1, _id: 0 } },
    ]);
  }

  // ── Vendor Dashboard ──────────────────────────────────────────────────────

  async getVendorOverview(vendorId: string) {
    const vendorObjId = new Types.ObjectId(vendorId);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalServices, totalBookings, pendingBookings, completedBookings,
      revenueThisMonth, totalRevenue, avgRating, reviewCount,
      upcomingCount,
    ] = await Promise.all([
      this.serviceModel.countDocuments({ vendorId: vendorObjId, status: 'active' }),
      this.bookingModel.countDocuments({ vendorId: vendorObjId }),
      this.bookingModel.countDocuments({ vendorId: vendorObjId, status: 'pending' }),
      this.bookingModel.countDocuments({ vendorId: vendorObjId, status: 'completed' }),
      this.paymentModel.aggregate([
        { $match: { vendorId: vendorObjId, status: 'paid', createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$vendorPayoutAmount' } } },
      ]),
      this.paymentModel.aggregate([
        { $match: { vendorId: vendorObjId, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$vendorPayoutAmount' } } },
      ]),
      this.reviewModel.aggregate([
        { $match: { vendorId: vendorObjId, status: 'approved' } },
        { $group: { _id: null, avg: { $avg: '$rating' } } },
      ]),
      this.reviewModel.countDocuments({ vendorId: vendorObjId, status: 'approved' }),
      this.bookingModel.countDocuments({
        vendorId: vendorObjId,
        status: { $in: ['accepted', 'in_progress'] },
        eventDate: { $gte: now },
      }),
    ]);

    return {
      totalServices,
      totalBookings,
      pendingBookings,
      completedBookings,
      revenueThisMonth: revenueThisMonth[0]?.total || 0,
      totalRevenue: totalRevenue[0]?.total || 0,
      avgRating: Math.round((avgRating[0]?.avg || 0) * 10) / 10,
      reviewCount,
      upcomingCount,
    };
  }

  async getVendorRevenueChart(vendorId: string, months = 6) {
    const vendorObjId = new Types.ObjectId(vendorId);
    const data = [];
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      const start = new Date(date.getFullYear(), date.getMonth() - i, 1);
      const end = new Date(date.getFullYear(), date.getMonth() - i + 1, 0);
      const result = await this.paymentModel.aggregate([
        { $match: { vendorId: vendorObjId, status: 'paid', createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: null, revenue: { $sum: '$vendorPayoutAmount' }, bookings: { $sum: 1 } } },
      ]);
      data.push({
        month: start.toLocaleString('default', { month: 'short', year: '2-digit' }),
        revenue: result[0]?.revenue || 0,
        bookings: result[0]?.bookings || 0,
      });
    }
    return data;
  }

  async getVendorServicePerformance(vendorId: string) {
    return this.serviceModel.aggregate([
      { $match: { vendorId: new Types.ObjectId(vendorId), status: 'active' } },
      { $lookup: { from: 'bookings', localField: '_id', foreignField: 'serviceId', as: 'bookings' } },
      { $project: {
        name: 1, rating: 1, reviewCount: 1, viewCount: 1,
        bookingCount: { $size: '$bookings' },
        revenue: { $sum: '$bookings.vendorPayout' },
      }},
      { $sort: { bookingCount: -1 } },
    ]);
  }

  // ── Customer Dashboard ────────────────────────────────────────────────────

  async getCustomerOverview(customerId: string) {
    const customerObjId = new Types.ObjectId(customerId);

    const [
      totalBookings, completedBookings, cancelledBookings,
      totalSpent, reviewsGiven, savedServices,
    ] = await Promise.all([
      this.bookingModel.countDocuments({ customerId: customerObjId }),
      this.bookingModel.countDocuments({ customerId: customerObjId, status: 'completed' }),
      this.bookingModel.countDocuments({ customerId: customerObjId, status: 'cancelled' }),
      this.paymentModel.aggregate([
        { $match: { customerId: customerObjId, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      this.reviewModel.countDocuments({ customerId: customerObjId }),
      this.userModel.findById(customerId).select('savedServices').then(u => u?.savedServices?.length || 0),
    ]);

    return {
      totalBookings,
      completedBookings,
      cancelledBookings,
      totalSpent: totalSpent[0]?.total || 0,
      reviewsGiven,
      savedServices,
    };
  }

  async getRevenueAnalytics() {
  const now = new Date();

  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);

  const monthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  );

  const yearStart = new Date(
    now.getFullYear(),
    0,
    1,
  );

  const [
    totalRevenue,
    todayRevenue,
    weekRevenue,
    monthRevenue,
    yearRevenue,
    successfulPayments,
    failedPayments,
    refundedPayments,
    averageBooking,
  ] = await Promise.all([
    this.paymentModel.aggregate([
      {
        $match: {
          status: 'paid',
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: '$amount',
          },
        },
      },
    ]),

    this.paymentModel.aggregate([
      {
        $match: {
          status: 'paid',
          createdAt: {
            $gte: todayStart,
          },
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: '$amount',
          },
        },
      },
    ]),

    this.paymentModel.aggregate([
      {
        $match: {
          status: 'paid',
          createdAt: {
            $gte: weekStart,
          },
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: '$amount',
          },
        },
      },
    ]),

    this.paymentModel.aggregate([
      {
        $match: {
          status: 'paid',
          createdAt: {
            $gte: monthStart,
          },
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: '$amount',
          },
        },
      },
    ]),

    this.paymentModel.aggregate([
      {
        $match: {
          status: 'paid',
          createdAt: {
            $gte: yearStart,
          },
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: '$amount',
          },
        },
      },
    ]),

    this.paymentModel.countDocuments({
      status: 'paid',
    }),

    this.paymentModel.countDocuments({
      status: 'failed',
    }),

    this.paymentModel.countDocuments({
      status: 'refunded',
    }),

    this.paymentModel.aggregate([
      {
        $match: {
          status: 'paid',
        },
      },
      {
        $group: {
          _id: null,
          average: {
            $avg: '$amount',
          },
        },
      },
    ]),
  ]);

  const totalTransactions =
    successfulPayments +
    failedPayments +
    refundedPayments;

  return {
    totalRevenue:
      totalRevenue[0]?.total ?? 0,

    todayRevenue:
      todayRevenue[0]?.total ?? 0,

    weekRevenue:
      weekRevenue[0]?.total ?? 0,

    monthRevenue:
      monthRevenue[0]?.total ?? 0,

    yearRevenue:
      yearRevenue[0]?.total ?? 0,

    averageBookingValue:
      Math.round(
        averageBooking[0]?.average ?? 0,
      ),

    successfulPayments,

    failedPayments,

    refundedPayments,

    paymentSuccessRate:
      totalTransactions === 0
        ? 0
        : Number(
            (
              (successfulPayments /
                totalTransactions) *
              100
            ).toFixed(2),
          ),
  };
}

async getBookingAnalytics() {
  const now = new Date();

  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);

  const monthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  );

  const [
    totalBookings,
    pending,
    accepted,
    paymentPending,
    confirmed,
    inProgress,
    completed,
    cancelled,
    refunded,
    todayBookings,
    weekBookings,
    monthBookings,
  ] = await Promise.all([
    this.bookingModel.countDocuments(),

    this.bookingModel.countDocuments({
      status: BookingStatus.PENDING,
    }),

    this.bookingModel.countDocuments({
      status: BookingStatus.ACCEPTED,
    }),

    this.bookingModel.countDocuments({
      status: BookingStatus.PAYMENT_PENDING,
    }),

    this.bookingModel.countDocuments({
      status: BookingStatus.CONFIRMED,
    }),

    this.bookingModel.countDocuments({
      status: BookingStatus.IN_PROGRESS,
    }),

    this.bookingModel.countDocuments({
      status: BookingStatus.COMPLETED,
    }),

    this.bookingModel.countDocuments({
      status: BookingStatus.CANCELLED,
    }),

    this.bookingModel.countDocuments({
      status: BookingStatus.REFUNDED,
    }),

    this.bookingModel.countDocuments({
      createdAt: {
        $gte: todayStart,
      },
    }),

    this.bookingModel.countDocuments({
      createdAt: {
        $gte: weekStart,
      },
    }),

    this.bookingModel.countDocuments({
      createdAt: {
        $gte: monthStart,
      },
    }),
  ]);

  const completionRate =
    totalBookings === 0
      ? 0
      : Number(
          (
            (completed / totalBookings) *
            100
          ).toFixed(2),
        );

  const cancellationRate =
    totalBookings === 0
      ? 0
      : Number(
          (
            (cancelled / totalBookings) *
            100
          ).toFixed(2),
        );

  return {
    totalBookings,

    pending,

    accepted,

    paymentPending,

    confirmed,

    inProgress,

    completed,

    cancelled,

    refunded,

    completionRate,

    cancellationRate,

    todayBookings,

    weekBookings,

    monthBookings,

    averageBookingsPerDay: Number(
      (
        monthBookings /
        Math.max(now.getDate(), 1)
      ).toFixed(2),
    ),
  };
}
async getUserAnalytics() {
  const now = new Date();

  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);

  const monthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  );

  const [
    totalUsers,
    customers,
    vendors,
    admins,
    activeUsers,
    inactiveUsers,
    suspendedUsers,
    pendingVerification,
    verifiedUsers,
    unverifiedUsers,
    newUsersToday,
    newUsersWeek,
    newUsersMonth,
    averageProfileCompletion,
    roleDistribution,
  ] = await Promise.all([
    this.userModel.countDocuments(),

    this.userModel.countDocuments({
      role: UserRole.CUSTOMER,
    }),

    this.userModel.countDocuments({
      role: UserRole.VENDOR,
    }),

    this.userModel.countDocuments({
      role: UserRole.ADMIN,
    }),

    this.userModel.countDocuments({
      status: UserStatus.ACTIVE,
    }),

    this.userModel.countDocuments({
      status: UserStatus.INACTIVE,
    }),

    this.userModel.countDocuments({
      status: UserStatus.SUSPENDED,
    }),

    this.userModel.countDocuments({
      status: UserStatus.PENDING_VERIFICATION,
    }),

    this.userModel.countDocuments({
      emailVerified: true,
    }),

    this.userModel.countDocuments({
      emailVerified: false,
    }),

    this.userModel.countDocuments({
      createdAt: {
        $gte: todayStart,
      },
    }),

    this.userModel.countDocuments({
      createdAt: {
        $gte: weekStart,
      },
    }),

    this.userModel.countDocuments({
      createdAt: {
        $gte: monthStart,
      },
    }),

    this.userModel.aggregate([
      {
        $group: {
          _id: null,
          average: {
            $avg: '$profileCompletion',
          },
        },
      },
    ]),

    this.userModel.aggregate([
      {
        $group: {
          _id: '$role',
          count: {
            $sum: 1,
          },
        },
      },
      {
        $project: {
          _id: 0,
          role: '$_id',
          count: 1,
        },
      },
    ]),
  ]);

  return {
    totalUsers,

    customers,

    vendors,

    admins,

    activeUsers,

    inactiveUsers,

    suspendedUsers,

    pendingVerification,

    verifiedUsers,

    unverifiedUsers,

    newUsersToday,

    newUsersThisWeek: newUsersWeek,

    newUsersThisMonth: newUsersMonth,

    averageProfileCompletion: Number(
      (
        averageProfileCompletion[0]?.average ?? 0
      ).toFixed(2),
    ),

    verificationRate:
      totalUsers === 0
        ? 0
        : Number(
            (
              (verifiedUsers / totalUsers) *
              100
            ).toFixed(2),
          ),

    roleDistribution,
  };
}
async getVendorAnalytics() {

  const [
    totalVendors,
    approvedVendors,
    verifiedVendors,
    pendingApplications,
    rejectedApplications,
    averageRating,
    averageReviews,
    totalRevenue,
    topVendors,
    topRated,
  ] = await Promise.all([

    this.userModel.countDocuments({
      role: UserRole.VENDOR,
    }),

    this.userModel.countDocuments({
      role: UserRole.VENDOR,
      isVendorApproved: true,
    }),

    this.userModel.countDocuments({
      role: UserRole.VENDOR,
      'vendorProfile.isVerified': true,
    }),

    this.userModel.countDocuments({
    role: UserRole.VENDOR,
    isVendorApproved: false,
}),

    Promise.resolve(0),
    this.userModel.aggregate([
      {
        $match:{
          role:UserRole.VENDOR,
          isVendorApproved:true,
        }
      },
      {
        $group:{
          _id:null,
          average:{
            $avg:'$vendorProfile.rating'
          }
        }
      }
    ]),

    this.userModel.aggregate([
      {
        $match:{
          role:UserRole.VENDOR,
          isVendorApproved:true,
        }
      },
      {
        $group:{
          _id:null,
          average:{
            $avg:'$vendorProfile.reviewCount'
          }
        }
      }
    ]),

    this.paymentModel.aggregate([
      {
        $match:{
          status:'paid',
        }
      },
      {
        $group:{
          _id:null,
          total:{
            $sum:'$vendorPayoutAmount'
          }
        }
      }
    ]),

    this.userModel.find({
      role:UserRole.VENDOR,
      isVendorApproved:true,
    })
    .sort({
      'vendorProfile.totalEarnings':-1,
    })
    .limit(10)
    .select(
      'firstName lastName vendorProfile avatar'
    ),

    this.userModel.find({
      role:UserRole.VENDOR,
      isVendorApproved:true,
    })
    .sort({
      'vendorProfile.rating':-1,
    })
    .limit(10)
    .select(
      'firstName lastName vendorProfile avatar'
    ),

  ]);

  return {

    totalVendors,

    approvedVendors,

    pendingApproval:
      pendingApplications,

    rejectedApplications,

    approvalRate:
  totalVendors === 0
    ? 0
    : Number(
        (
          (approvedVendors / totalVendors) * 100
        ).toFixed(2),
      ),

    verifiedVendors,

    averageRating:Number(
      (
        averageRating[0]?.average??0
      ).toFixed(2)
    ),

    averageReviews:Number(
      (
        averageReviews[0]?.average??0
      ).toFixed(2)
    ),

    totalVendorRevenue:
      totalRevenue[0]?.total??0,

    topVendors,

    topRatedVendors:topRated,
  };

}
async getServiceAnalytics() {
  const [
    totalServices,
    activeServices,
    pendingServices,
    rejectedServices,
    suspendedServices,

    averagePrice,
    averageRating,

    featuredServices,

    topBooked,

    topRated,

    trending,

    mostViewed,

    highestConversion,

    categoryDistribution,

    cityDistribution,
  ] = await Promise.all([

    this.serviceModel.countDocuments(),

    this.serviceModel.countDocuments({
      status: ServiceStatus.ACTIVE,
    }),

    this.serviceModel.countDocuments({
      status: ServiceStatus.PENDING,
    }),

    this.serviceModel.countDocuments({
      status: ServiceStatus.REJECTED,
    }),

    this.serviceModel.countDocuments({
      status: ServiceStatus.SUSPENDED,
    }),

    this.serviceModel.aggregate([
      {
        $group: {
          _id: null,
          average: {
            $avg: '$basePrice',
          },
        },
      },
    ]),

    this.serviceModel.aggregate([
      {
        $group: {
          _id: null,
          average: {
            $avg: '$rating',
          },
        },
      },
    ]),

    this.serviceModel.countDocuments({
      featured: true,
    }),

    this.serviceModel
      .find({
        status: ServiceStatus.ACTIVE,
      })
      .sort({
        bookingCount: -1,
      })
      .limit(10)
      .populate('vendorId', 'firstName lastName')
      .populate('categoryId', 'name'),

    this.serviceModel
      .find({
        status: ServiceStatus.ACTIVE,
      })
      .sort({
        rating: -1,
      })
      .limit(10)
      .populate('vendorId', 'firstName lastName')
      .populate('categoryId', 'name'),

    this.serviceModel
      .find({
        status: ServiceStatus.ACTIVE,
      })
      .sort({
        trendingScore: -1,
      })
      .limit(10)
      .populate('vendorId', 'firstName lastName')
      .populate('categoryId', 'name'),

    this.serviceModel
      .find({
        status: ServiceStatus.ACTIVE,
      })
      .sort({
        viewCount: -1,
      })
      .limit(10)
      .populate('vendorId', 'firstName lastName')
      .populate('categoryId', 'name'),

    this.serviceModel
      .find({
        status: ServiceStatus.ACTIVE,
      })
      .sort({
        conversionRate: -1,
      })
      .limit(10)
      .populate('vendorId', 'firstName lastName')
      .populate('categoryId', 'name'),

    this.serviceModel.aggregate([
      {
        $group: {
          _id: '$categoryId',
          totalServices: {
            $sum: 1,
          },
          averageRating: {
            $avg: '$rating',
          },
          averagePrice: {
            $avg: '$basePrice',
          },
          bookings: {
            $sum: '$bookingCount',
          },
        },
      },
      {
        $sort: {
          bookings: -1,
        },
      },
    ]),

    this.serviceModel.aggregate([
      {
        $group: {
          _id: '$location.city',
          totalServices: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          totalServices: -1,
        },
      },
    ]),
  ]);

  return {

    totalServices,

    activeServices,

    pendingServices,

    rejectedServices,

    suspendedServices,

    featuredServices,

    averagePrice: Math.round(
      averagePrice[0]?.average ?? 0,
    ),

    averageRating: Number(
      (
        averageRating[0]?.average ?? 0
      ).toFixed(2),
    ),

    topBookedServices: topBooked,

    highestRatedServices: topRated,

    trendingServices: trending,

    mostViewedServices: mostViewed,

    highestConversionServices:
      highestConversion,

    categoryDistribution,

    cityDistribution,
  };
}
async getReviewAnalytics() {
  const now = new Date();

  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);

  const monthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  );

  const [
    totalReviews,
    approvedReviews,
    pendingReviews,
    rejectedReviews,

    averageRating,

    verifiedReviews,

    repliedReviews,

    editedReviews,

    helpfulVotes,

    todayReviews,

    weekReviews,

    monthReviews,

    ratingDistribution,

    topRatedVendors,

    mostReviewedServices,

    recentReviews,
  ] = await Promise.all([

    this.reviewModel.countDocuments(),

    this.reviewModel.countDocuments({
      status: ReviewStatus.APPROVED,
    }),

    this.reviewModel.countDocuments({
      status: ReviewStatus.PENDING,
    }),

    this.reviewModel.countDocuments({
      status: ReviewStatus.REJECTED,
    }),

    this.reviewModel.aggregate([
      {
        $group: {
          _id: null,
          average: {
            $avg: '$rating',
          },
        },
      },
    ]),

    this.reviewModel.countDocuments({
      isVerifiedPurchase: true,
    }),

    this.reviewModel.countDocuments({
      vendorReply: {
        $ne: null,
      },
    }),

    this.reviewModel.countDocuments({
      edited: true,
    }),

    this.reviewModel.aggregate([
      {
        $group: {
          _id: null,
          total: {
            $sum: '$helpfulCount',
          },
        },
      },
    ]),

    this.reviewModel.countDocuments({
      createdAt: {
        $gte: todayStart,
      },
    }),

    this.reviewModel.countDocuments({
      createdAt: {
        $gte: weekStart,
      },
    }),

    this.reviewModel.countDocuments({
      createdAt: {
        $gte: monthStart,
      },
    }),

    this.reviewModel.aggregate([
      {
        $group: {
          _id: '$rating',
          count: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          _id: -1,
        },
      },
    ]),

    this.reviewModel.aggregate([
      {
        $group: {
          _id: '$vendorId',
          reviews: {
            $sum: 1,
          },
          averageRating: {
            $avg: '$rating',
          },
        },
      },
      {
        $sort: {
          reviews: -1,
        },
      },
      {
        $limit: 10,
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'vendor',
        },
      },
    ]),

    this.reviewModel.aggregate([
      {
        $group: {
          _id: '$serviceId',
          reviews: {
            $sum: 1,
          },
          averageRating: {
            $avg: '$rating',
          },
        },
      },
      {
        $sort: {
          reviews: -1,
        },
      },
      {
        $limit: 10,
      },
      {
        $lookup: {
          from: 'services',
          localField: '_id',
          foreignField: '_id',
          as: 'service',
        },
      },
    ]),

    this.reviewModel
      .find()
      .sort({
        createdAt: -1,
      })
      .limit(10)
      .populate(
        'customerId',
        'firstName lastName avatar',
      )
      .populate(
        'vendorId',
        'firstName lastName vendorProfile',
      )
      .populate(
        'serviceId',
        'name',
      ),
  ]);

  return {

    totalReviews,

    approvedReviews,

    pendingReviews,

    rejectedReviews,

    averageRating: Number(
      (
        averageRating[0]?.average ?? 0
      ).toFixed(2),
    ),

    verifiedReviews,

    repliedReviews,

    editedReviews,

    totalHelpfulVotes:
      helpfulVotes[0]?.total ?? 0,

    todayReviews,

    weekReviews,

    monthReviews,

    responseRate:
      totalReviews === 0
        ? 0
        : Number(
            (
              (repliedReviews /
                totalReviews) *
              100
            ).toFixed(2),
          ),

    ratingDistribution,

    topRatedVendors,

    mostReviewedServices,

    recentReviews,
  };
}

async getRevenueTrend(days = 30) {
  const start = new Date();
  start.setDate(start.getDate() - days);

  return this.paymentModel.aggregate([
    {
      $match: {
        status: 'paid',
        createdAt: {
          $gte: start,
        },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$createdAt',
          },
        },
        revenue: {
          $sum: '$amount',
        },
        transactions: {
          $sum: 1,
        },
      },
    },
    {
      $sort: {
        _id: 1,
      },
    },
    {
      $project: {
        _id: 0,
        date: '$_id',
        revenue: 1,
        transactions: 1,
      },
    },
  ]);
}
async getBookingTrend(days = 30) {
  const start = new Date();
  start.setDate(start.getDate() - days);

  return this.bookingModel.aggregate([
    {
      $match: {
        createdAt: {
          $gte: start,
        },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$createdAt',
          },
        },
        bookings: {
          $sum: 1,
        },
      },
    },
    {
      $sort: {
        _id: 1,
      },
    },
    {
      $project: {
        _id: 0,
        date: '$_id',
        bookings: 1,
      },
    },
  ]);
}
async getUserTrend(days = 30) {
  const start = new Date();
  start.setDate(start.getDate() - days);

  return this.userModel.aggregate([
    {
      $match: {
        createdAt: {
          $gte: start,
        },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$createdAt',
          },
        },
        users: {
          $sum: 1,
        },
      },
    },
    {
      $sort: {
        _id: 1,
      },
    },
    {
      $project: {
        _id: 0,
        date: '$_id',
        users: 1,
      },
    },
  ]);
}
async getVendorTrend(days = 30) {
  const start = new Date();
  start.setDate(start.getDate() - days);

  return this.userModel.aggregate([
    {
      $match: {
        role: UserRole.VENDOR,
        createdAt: {
          $gte: start,
        },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$createdAt',
          },
        },
        vendors: {
          $sum: 1,
        },
      },
    },
    {
      $sort: {
        _id: 1,
      },
    },
    {
      $project: {
        _id: 0,
        date: '$_id',
        vendors: 1,
      },
    },
  ]);
}
async getReviewTrend(days = 30) {
  const start = new Date();
  start.setDate(start.getDate() - days);

  return this.reviewModel.aggregate([
    {
      $match: {
        createdAt: {
          $gte: start,
        },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$createdAt',
          },
        },
        reviews: {
          $sum: 1,
        },
      },
    },
    {
      $sort: {
        _id: 1,
      },
    },
    {
      $project: {
        _id: 0,
        date: '$_id',
        reviews: 1,
      },
    },
  ]);
}
async getCategoryAnalytics() {
  return this.serviceModel.aggregate([
    {
      $lookup: {
        from: 'categories',
        localField: 'categoryId',
        foreignField: '_id',
        as: 'category',
      },
    },
    {
      $unwind: '$category',
    },
    {
      $group: {
        _id: '$category.name',

        services: {
          $sum: 1,
        },

        bookings: {
          $sum: '$bookingCount',
        },

        averageRating: {
          $avg: '$rating',
        },

        averagePrice: {
          $avg: '$basePrice',
        },
      },
    },
    {
      $sort: {
        bookings: -1,
      },
    },
    {
      $project: {
        _id: 0,

        category: '$_id',

        services: 1,

        bookings: 1,

        averageRating: {
          $round: ['$averageRating', 2],
        },

        averagePrice: {
          $round: ['$averagePrice', 0],
        },
      },
    },
  ]);
}
async getCityAnalytics() {
  return this.serviceModel.aggregate([
    {
      $group: {
        _id: '$location.city',

        services: {
          $sum: 1,
        },

        bookings: {
          $sum: '$bookingCount',
        },

        averageRating: {
          $avg: '$rating',
        },
      },
    },
    {
      $sort: {
        bookings: -1,
      },
    },
    {
      $project: {
        _id: 0,

        city: '$_id',

        services: 1,

        bookings: 1,

        averageRating: {
          $round: ['$averageRating', 2],
        },
      },
    },
  ]);
}
async getBookingStatusChart() {
  return this.bookingModel.aggregate([
    {
      $group: {
        _id: '$status',

        count: {
          $sum: 1,
        },
      },
    },
    {
      $sort: {
        count: -1,
      },
    },
    {
      $project: {
        _id: 0,

        status: '$_id',

        count: 1,
      },
    },
  ]);
}
async getRatingDistribution() {
  return this.reviewModel.aggregate([
    {
      $group: {
        _id: '$rating',

        count: {
          $sum: 1,
        },
      },
    },
    {
      $sort: {
        _id: -1,
      },
    },
    {
      $project: {
        _id: 0,

        rating: '$_id',

        count: 1,
      },
    },
  ]);
}
async getAIInsights() {

  const [
    topCategory,
    topVendor,
    topService,
    city,
    avgRating,
    pendingVendors,
  ] = await Promise.all([

    this.getCategoryAnalytics(),

    this.getTopVendors(1),

    this.serviceModel
      .findOne()
      .sort({
        trendingScore:-1,
      })
      .populate(
        'vendorId',
        'firstName lastName vendorProfile',
      )
      .populate(
        'categoryId',
        'name',
      ),

    this.getCityAnalytics(),

    this.reviewModel.aggregate([
      {
        $group:{
          _id:null,
          avg:{
            $avg:'$rating',
          },
        },
      },
    ]),

    this.userModel.countDocuments({
  role: UserRole.VENDOR,
  isVendorApproved: false,
}),

  ]);

  const recommendations:string[] = [];

  if (pendingVendors > 10) {
    recommendations.push(
      'There are many pending vendor applications awaiting review.',
    );
  }

  if ((avgRating[0]?.avg ?? 0) < 4.2) {
    recommendations.push(
      'Customer satisfaction has dropped below the target rating.',
    );
  }

  if ((topCategory[0]?.bookings ?? 0) > 100) {
    recommendations.push(
      `${topCategory[0].category} is currently the highest-demand category.`,
    );
  }

  if (!recommendations.length) {
    recommendations.push(
      'Platform performance is healthy with no significant operational concerns.',
    );
  }

  return {

    fastestGrowingCategory:
      topCategory[0] ?? null,

    topPerformingVendor:
      topVendor[0] ?? null,

    highestRatedService:
      topService,

    mostPopularCity:
      city[0] ?? null,

    averagePlatformRating:
      Number(
        (
          avgRating[0]?.avg ?? 0
        ).toFixed(2),
      ),

    pendingVendorApprovals:
      pendingVendors,

    recommendations,

  };

}

async getPublicStats() {
  const [
    customers,
    vendors,
    services,
    completedBookings,
  ] = await Promise.all([
    this.userModel.countDocuments({
      role: 'customer',
    }),

    this.userModel.countDocuments({
      role: 'vendor',
      isVendorApproved: true,
    }),

    this.serviceModel.countDocuments({
      status: 'active',
    }),

    this.bookingModel.countDocuments({
      status: 'completed',
    }),
  ]);

  return {
    customers,
    vendors,
    services,
    completedBookings,
  };
}
}
