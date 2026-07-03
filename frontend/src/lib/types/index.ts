export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'customer' | 'vendor' | 'admin';
  status: string;
  phone?: string;
  avatar?: string;
  address?: { street: string; city: string; state: string; pincode: string; country: string };
  emailVerified: boolean;
  profileCompletion: number;
  isVendorApproved?: boolean;
  vendorApplicationId?: string;
  vendorProfile?: VendorProfile;
  savedServices?: string[];
  createdAt: string;
}

export interface VendorProfile {
  businessName: string;
  businessDescription: string;
  categories: string[];
  rating: number;
  reviewCount: number;
  totalEarnings: number;
  isVerified: boolean;
  verificationBadge?: string;
  completedBookings: number;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  image?: string;
  isActive: boolean;
  serviceCount: number;
}

export interface Service {
  _id: string;
  vendorId: User | string;
  categoryId: Category | string;
  name: string;
  description: string;
  images: string[];
  basePrice: number;
  currency: string;
  priceType: string;
  tags: string[];
  location: { city: string; state: string; serviceRadius: number };
  status: string;
  rating: number;
  reviewCount: number;
  bookingCount: number;
  viewCount: number;
  availability?: { workingDays: string[]; startTime: string; endTime: string; blockedDates: string[] };
  packages?: Array<{ name: string; description: string; price: number; features: string[] }>;
  trendingScore: number;
  createdAt: string;
}

export interface Booking {
  _id: string;
  bookingNumber: string;
  customerId: User | string;
  vendorId: User | string;
  serviceId: Service | string;
  status: 'pending' | 'accepted' | 'rejected' | 'in_progress' | 'completed' | 'cancelled';
  eventDate: string;
  eventEndDate?: string;
  eventLocation: string;
  eventDetails?: { eventType: string; guestCount: number; specialRequirements: string; packageName: string };
  amount: number;
  commission: number;
  vendorPayout: number;
  paymentStatus: string;
  rejectionReason?: string;
  cancellationReason?: string;
  reviewSubmitted: boolean;
  statusHistory: Array<{ status: string; updatedAt: string; note: string }>;
  createdAt: string;
}

export interface Payment {
  _id: string;
  bookingId: Booking | string;
  customerId: User | string;
  vendorId: User | string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  amount: number;
  currency: string;
  status: string;
  commissionAmount: number;
  vendorPayoutAmount: number;
  createdAt: string;
}

export interface Review {
  _id: string;
  customerId: User | string;
  vendorId: User | string;
  serviceId: Service | string;
  bookingId: Booking | string;
  rating: number;
  comment: string;
  vendorReply?: string;
  vendorRepliedAt?: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  actionUrl?: string;
  data?: Record<string, any>;
  createdAt: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: User | string;
  receiverId: User | string;
  content: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface VendorApplication {
  _id: string;
  userId: User | string;
  businessName: string;
  businessDescription: string;
  categories: string[];
  experience: string;
  businessLocation: { city: string; state: string; pincode: string };
  phone: string;
  documents: Array<{
    type: string;
    url: string;
    publicId?: string;
    uploadedAt: string;
}>;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
}
