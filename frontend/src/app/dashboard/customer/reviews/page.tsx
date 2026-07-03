'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { reviewsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/stores/authStore';
import EmptyState from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { timeAgo } from '@/lib/utils';
import { LayoutDashboard, Calendar, CreditCard, Star, Heart, Bell, User } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/dashboard/customer', icon: <LayoutDashboard size={18} /> },
  { label: 'My Bookings', href: '/dashboard/customer/bookings', icon: <Calendar size={18} /> },
  { label: 'Payments', href: '/dashboard/customer/payments', icon: <CreditCard size={18} /> },
  { label: 'Saved Services', href: '/dashboard/customer/saved', icon: <Heart size={18} /> },
  { label: 'Reviews', href: '/dashboard/customer/reviews', icon: <Star size={18} /> },
  { label: 'Notifications', href: '/notifications', icon: <Bell size={18} /> },
  { label: 'Profile', href: '/profile', icon: <User size={18} /> },
];

export default function CustomerReviewsPage() {
  const { user } = useAuthStore();

  // We fetch vendor reviews by vendorId — for customer we'd need a separate endpoint
  // Here we get bookings and show review status per booking
  const { data, isLoading } = useQuery({
    queryKey: ['customer-reviews'],
    queryFn: () => import('@/lib/api').then(m => m.bookingsApi.getMyBookings({ status: 'completed', limit: 50 }).then(r => r.data)),
    enabled: !!user,
  });

  return (
    <DashboardLayout navItems={navItems} title="My Reviews">
      <div className="mb-4 text-sm text-muted">Track the reviews you've submitted for completed bookings.</div>

      {isLoading ? <TableSkeleton rows={4} /> : !data?.bookings?.length ? (
        <EmptyState icon="⭐" title="No completed bookings yet" description="Once you complete a booking, you'll be able to review the service."
          action={{ label: 'Browse Services', href: '/services' }} />
      ) : (
        <div className="space-y-4">
          {data.bookings.map((b: any) => {
            const service = b.serviceId as any;
            const vendor = b.vendorId as any;
            return (
              <div key={b._id} className="card flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-royal-50 flex-shrink-0">
                 {service?.images?.[0] ? (
  <img
    src={service.images[0]}
    alt={service?.name || 'Unnamed Service'}
    className="w-full h-full object-cover"
    onError={(e) => {
      e.currentTarget.src = '/placeholder-service.jpg';
    }}
  />
) : (
  <div className="w-full h-full flex items-center justify-center text-2xl">
    📸
  </div>
)}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{service?.name}</p>
                  <p className="text-sm text-muted">{vendor?.vendorProfile?.businessName ||
 `${vendor?.firstName ?? ''} ${vendor?.lastName ?? ''}`.trim() ||
 'Unknown Vendor'}</p>
                  <p className="text-xs text-muted mt-1">{b.createdAt ? timeAgo(b.createdAt) : 'Recently'}</p>
                </div>
                <div>
                  {b.reviewSubmitted ? (
                    <span className="badge bg-green-100 text-green-700 flex items-center gap-1">
                      <Star size={12} className="fill-green-600 text-green-600" /> Reviewed
                    </span>
                  ) : (
                    <span className="badge bg-yellow-100 text-yellow-700">Pending Review</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
