export type Category = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
  isActive?: boolean;
  sortOrder?: number;
  serviceCount?: number;
  bookingCount?: number;
};

export type Vendor = {
  _id?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  phone?: string;
  vendorProfile?: {
    businessName?: string;
    businessDescription?: string;
    rating?: number;
    reviewCount?: number;
    completedBookings?: number;
    isVerified?: boolean;
    verificationBadge?: string;
  };
};

export type ServicePackage = {
  name?: string;
  description?: string;
  price?: number;
  features?: string[];
};

export type Service = {
  _id: string;
  vendorId?: Vendor | string;
  categoryId?: Category | string;
  name: string;
  description?: string;
  images?: string[];
  basePrice?: number;
  currency?: string;
  priceType?: string;
  tags?: string[];
  location?: {
    city?: string;
    state?: string;
    serviceRadius?: number;
  };
  status?: string;
  featured?: boolean;
  rating?: number;
  reviewCount?: number;
  bookingCount?: number;
  viewCount?: number;
  availability?: {
    workingDays?: string[];
    startTime?: string;
    endTime?: string;
    blockedDates?: string[];
  };
  packages?: ServicePackage[];
};

export type ServiceSearchResponse = {
  services: Service[];
  total: number;
  page: number;
  totalPages: number;
};
