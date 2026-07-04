'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/dashboard/StatCard';
import { useVendorOverview, useVendorRevenueChart, useMyBookings, useVendorServicePerformance } from '@/lib/hooks/useQueries';
import { CardSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import {
LayoutDashboard,
Package,
Calendar,
CreditCard,
Star,
MessageSquare,
Bell,
User,
Plus,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/authStore';
import { useMyApplication } from '@/lib/hooks/useQueries';
import { PageLoader } from '@/components/ui/Skeleton';

const navItems = [
  { label: 'Dashboard', href: '/dashboard/vendor', icon: <LayoutDashboard size={18} /> },
  { label: 'My Services', href: '/dashboard/vendor/services', icon: <Package size={18} /> },
  { label: 'Bookings', href: '/dashboard/vendor/bookings', icon: <Calendar size={18} /> },
  { label: 'Earnings', href: '/dashboard/vendor/earnings', icon: <CreditCard size={18} /> },
  { label: 'Reviews', href: '/dashboard/vendor/reviews', icon: <Star size={18} /> },
  { label: 'Messages', href: '/chat', icon: <MessageSquare size={18} /> },
  { label: 'Notifications', href: '/notifications', icon: <Bell size={18} /> },
  { label: 'Profile', href: '/profile', icon: <User size={18} /> },
];

export default function VendorDashboard() {
  const router = useRouter();

const { user } = useAuthStore();

const {
  data: applicationResponse,
  isLoading: applicationLoading,
} = useMyApplication();

const application =
  (applicationResponse as any)?.data ??
  applicationResponse;
  const { data: overviewResponse, isLoading } = useVendorOverview();
const { data: revenueResponse } = useVendorRevenueChart(6);
const { data: bookingsResponse } = useMyBookings({
  status: 'pending',
  limit: 5,
});
const { data: servicePerfResponse } =
  useVendorServicePerformance();

const overview =
  (overviewResponse as any)?.data ??
  overviewResponse;

const revenueRaw =
  (revenueResponse as any)?.data ??
  revenueResponse;

const revenueData = Array.isArray(revenueRaw)
  ? revenueRaw
  : [];

const bookings =
  (bookingsResponse as any)?.data ??
  bookingsResponse;

const servicePerfRaw =
  (servicePerfResponse as any)?.data ??
  servicePerfResponse;

const servicePerf = Array.isArray(servicePerfRaw)
  ? servicePerfRaw
  : [];

  useEffect(() => {
  if (!user) return;

  // Customer → Become Vendor page
  if (user.role === 'customer') {
    router.replace('/vendor/apply');
    return;
  }

  // Vendor not yet approved
  if (
    user.role === 'vendor' &&
    !user.isVendorApproved
  ) {
    router.replace('/vendor/apply');
  }
}, [user, router]);
if (applicationLoading) {
  return <PageLoader />;
}
if (
  application &&
  application.status === 'pending'
) {
  return (
    <DashboardLayout
      navItems={navItems}
      title="Vendor Dashboard"
    >
      <EmptyState
        icon="⏳"
        title="Application Under Review"
        description="Your vendor application is currently being reviewed by the OMIQORA admin team."
      />
    </DashboardLayout>
  );
}
if (
  application &&
  application.status === 'rejected'
) {
  return (
    <DashboardLayout
      navItems={navItems}
      title="Vendor Dashboard"
    >
      <EmptyState
        icon="❌"
        title="Application Rejected"
        description={
          application.rejectionReason ||
          'Please update your application and apply again.'
        }
        action={{
          label: 'Update Application',
          href: '/vendor/apply',
        }}
      />
    </DashboardLayout>
  );
}
  return (
    <DashboardLayout navItems={navItems} title="Vendor Dashboard">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-royal-blue">Vendor Dashboard</h2>
          <p className="text-muted text-sm mt-1">Manage your services and bookings</p>
        </div>
        <Link href="/dashboard/vendor/services/new" className="btn-primary flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl">
          <Plus size={16} /> Add Service
        </Link>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard title="Total Services" value={overview?.totalServices ?? 0} icon={<Package size={20} />} color="blue" />
          <StatCard title="Pending Requests" value={overview?.pendingBookings ?? 0} icon={<Calendar size={20} />} color="gold" subtitle="Needs attention" />
          <StatCard title="Revenue This Month" value={formatCurrency(overview?.revenueThisMonth ?? 0)} icon={<CreditCard size={20} />} color="green" />
          <StatCard
  title="Avg Rating"
  value={`${(overview?.avgRating ?? 0).toFixed(1)} ⭐`}
  icon={<Star size={20} />}
  color="purple"
  subtitle={`${overview?.reviewCount ?? 0} reviews`}
/>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-royal-blue">Revenue Overview</h3>
            <span className="text-xs text-muted">Last 6 months</span>
          </div>
          {Array.isArray(revenueData) && revenueData.length > 0 ? (
  <ResponsiveContainer width="100%" height={220}>
    <AreaChart data={revenueData}>
      <defs>
        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#0B1F5B" stopOpacity={0.15} />
          <stop offset="95%" stopColor="#0B1F5B" stopOpacity={0} />
        </linearGradient>
      </defs>

      <XAxis
        dataKey="month"
        tick={{ fontSize: 11 }}
        axisLine={false}
        tickLine={false}
      />

      <YAxis
        tick={{ fontSize: 11 }}
        axisLine={false}
        tickLine={false}
        tickFormatter={(v: number) =>
  v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`
}
      />

      <Tooltip
        formatter={(v: number) => [formatCurrency(v ?? 0), 'Revenue']}
      />

      <Area
        type="monotone"
        dataKey="revenue"
        stroke="#0B1F5B"
        strokeWidth={2}
        fill="url(#revenueGrad)"
      />
    </AreaChart>
  </ResponsiveContainer>
) : (
  <EmptyState
    icon="📊"
    title="No revenue data yet"
    description="Complete bookings to see your earnings trend."
  />
)}
</div>

        {/* Pending bookings */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-royal-blue">Pending Requests</h3>
            <Link href="/dashboard/vendor/bookings" className="text-sm text-royal-blue hover:underline">View all</Link>
          </div>
          {!bookings?.bookings?.length ? (
            <EmptyState icon="✅" title="All clear!" description="No pending booking requests" />
          ) : (
            <div className="space-y-3">
              {bookings.bookings.map((b: any) => (
                <Link key={b._id} href={`/bookings/${b._id}`}>
                  <div className="p-3 rounded-xl hover:bg-royal-50 transition-colors border border-border">
                    <p className="font-medium text-sm text-foreground truncate">
  {b.bookingNumber || 'Booking'}
</p>
                    <p className="text-xs text-muted">
  {`${(b.customerId as any)?.firstName ?? ''} ${(b.customerId as any)?.lastName ?? ''}`.trim() || 'Customer'}
</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-medium text-royal-blue">{formatCurrency(b.amount ?? 0)}</span>
                      <StatusBadge status={b.status || 'pending'} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

            {/* Service performance */}
      {Array.isArray(servicePerf) && servicePerf.length > 0 ? (
        <div className="mt-6 card">
          <h3 className="font-semibold text-royal-blue mb-4">
            Service Performance
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted border-b border-border">
                  <th className="pb-3 font-medium">Service</th>
                  <th className="pb-3 font-medium">Bookings</th>
                  <th className="pb-3 font-medium">Views</th>
                  <th className="pb-3 font-medium">Rating</th>
                </tr>
              </thead>

              <tbody>
                {servicePerf.slice(0, 5).map((s: any) => (
                  <tr
                    key={s._id || s.name}
                    className="border-b border-border last:border-0"
                  >
                    <td className="py-3 font-medium text-foreground">
                      {s.name || 'Unnamed Service'}
                    </td>

                    <td className="py-3 text-muted">
                      {s.bookingCount ?? 0}
                    </td>

                    <td className="py-3 text-muted">
                      {s.viewCount ?? 0}
                    </td>

                    <td className="py-3">
                      <span className="flex items-center gap-1">
                        ⭐ {(s.rating ?? 0).toFixed(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            icon="📦"
            title="No services published"
            description="Create your first service to start receiving bookings."
            action={{
    label: 'Create Service',
    href: '/dashboard/vendor/services/new',
  }}
          />
        </div>
      )}
    </DashboardLayout>
  );
}