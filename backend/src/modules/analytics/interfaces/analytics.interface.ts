export interface DashboardCard {
  title: string;
  value: number;
  change?: number;
  trend?: 'up' | 'down' | 'flat';
}

export interface ChartPoint {
  label: string;
  value: number;
}

export interface RevenueSummary {
  totalRevenue: number;
  monthlyRevenue: number;
  averageBookingValue: number;
}

export interface BookingSummary {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  pendingBookings: number;
}

export interface UserSummary {
  totalUsers: number;
  customers: number;
  vendors: number;
  admins: number;
}