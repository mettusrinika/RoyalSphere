'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/dashboard/StatCard';
import { useCustomerOverview, useUpcomingBookings, useNotifications } from '@/lib/hooks/useQueries';
import { useAuthStore } from '@/lib/stores/authStore';
import { CardSkeleton, PageLoader } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate, timeAgo } from '@/lib/utils';
import Link from 'next/link';
import {
  LayoutDashboard,
  Calendar,
  CreditCard,
  Star,
  Heart,
  Bell,
  User,
  Search,
  Settings,
  Store,
  Clock,
  CheckCircle,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/dashboard/customer', icon: <LayoutDashboard size={18} /> },
  { label: 'My Bookings', href: '/dashboard/customer/bookings', icon: <Calendar size={18} /> },
  { label: 'Payments', href: '/dashboard/customer/payments', icon: <CreditCard size={18} /> },
  { label: 'Saved Services', href: '/dashboard/customer/saved', icon: <Heart size={18} /> },
  { label: 'Reviews', href: '/dashboard/customer/reviews', icon: <Star size={18} /> },
  { label: 'Notifications', href: '/notifications', icon: <Bell size={18} /> },
  { label: 'Profile', href: '/profile', icon: <User size={18} /> },
];

export default function CustomerDashboard() {
  const { user } = useAuthStore();

const isVendor = user?.role === 'vendor';
const vendorApproved = user?.isVendorApproved;

  const { data: overview, isLoading: loadingOverview } = useCustomerOverview();
  const { data: upcoming, isLoading: loadingUpcoming } = useUpcomingBookings();
  const { data: notifData } = useNotifications({ limit: 5 });

  return (
    <DashboardLayout navItems={navItems} title="Customer Dashboard">
      {/* Welcome */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-royal-blue">Welcome back, {user?.firstName || 'Customer'}! 👋</h2>
        <p className="text-muted text-sm mt-1">Here's what's happening with your bookings</p>
      </div>

      {/* Stats */}
      {loadingOverview ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard title="Total Bookings" value={overview?.totalBookings ?? 0} icon={<Calendar size={20} />} color="blue" />
          <StatCard title="Completed" value={overview?.completedBookings ?? 0} icon={<Star size={20} />} color="green" />
          <StatCard title="Total Spent" value={formatCurrency(overview?.totalSpent ?? 0)} icon={<CreditCard size={20} />} color="gold" />
          <StatCard title="Saved Services" value={overview?.savedServices ?? 0} icon={<Heart size={20} />} color="purple" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming bookings */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-royal-blue">Upcoming Bookings</h3>
            <Link href="/dashboard/customer/bookings" className="text-sm text-royal-blue hover:underline">View all</Link>
          </div>
          {loadingUpcoming ? <PageLoader /> : !upcoming?.length ? (
            <EmptyState icon="📅" title="No upcoming bookings" description="You don't have any upcoming bookings yet." action={{ label: 'Browse Services', href: '/services' }} />
          ) : (
            <div className="space-y-3">
              {(upcoming as any[]).map((booking: any) => (
                <Link key={booking._id} href={`/bookings/${booking._id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-royal-50 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-royal-50 overflow-hidden flex-shrink-0">
                      {(booking.serviceId as any)?.images?.[0] ? (
  <img
    src={(booking.serviceId as any).images[0]}
    alt={(booking.serviceId as any)?.name || 'Service'}
    className="w-full h-full object-cover"
    onError={(e) => {
      e.currentTarget.src = '/placeholder-service.jpg';
    }}
  />
) : (
  <div className="w-full h-full flex items-center justify-center text-xl">
    📸
  </div>
)}
</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{(booking.serviceId as any)?.name || 'Unnamed Service'}</p>
                      <p className="text-xs text-muted">{formatDate(booking.eventDate)}</p>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent notifications */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-royal-blue">Recent Activity</h3>
            <Link href="/notifications" className="text-sm text-royal-blue hover:underline">View all</Link>
          </div>
          {!notifData?.notifications?.length ? (
            <EmptyState icon="🔔" title="No notifications" description="You have no recent notifications." />
          ) : (
            <div className="space-y-3">
              {notifData.notifications.map((n: any) => (
                <div key={n._id} className={`p-3 rounded-xl ${n.isRead ? 'bg-gray-50' : 'bg-royal-50 border border-royal-200'}`}>
                  <p className="text-sm font-medium text-foreground">{n.title || 'Notification'}</p>
                  <p className="text-xs text-muted mt-0.5">{n.message || 'No message available'}</p>
                  <p className="text-xs text-muted mt-1">{n.createdAt ? timeAgo(n.createdAt) : 'Just now'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Become Vendor */}
{!isVendor && (
  <div className="mt-6 card border-2 border-royal-gold/30">

    <div className="flex items-start justify-between">

      <div>

        <h3 className="text-xl font-bold text-royal-gold flex items-center gap-2">
          <Store size={22} />
          Become a Vendor
        </h3>

        <p className="text-muted mt-2">
          Start selling your services on OMIQORA.
          Submit your business details, upload the required
          verification documents and once approved by our
          admin team you'll receive your Vendor Dashboard.
        </p>

      </div>

      <Store
        size={44}
        className="text-royal-gold"
      />

    </div>

    <div className="mt-6">

      <Link
        href="/vendor/apply"
        className="btn-primary inline-flex items-center gap-2"
      >
        <Store size={18} />
        Join as Vendor
      </Link>

    </div>

  </div>
)}
{/* Vendor Pending */}
{isVendor && !vendorApproved && (

<div className="mt-6 card border-yellow-300 bg-yellow-50">

<div className="flex items-center gap-3">

<Clock className="text-yellow-600" />

<div>

<h3 className="font-semibold text-yellow-700">
Vendor Application Under Review
</h3>

<p className="text-sm text-yellow-700 mt-1">
Your documents are being verified by the OMIQORA Admin.
You'll receive access to your Vendor Dashboard once approved.
</p>

</div>

</div>

</div>

)}
{/* Vendor Approved */}
{isVendor && vendorApproved && (

<div className="mt-6 card border-green-300 bg-green-50">

<div className="flex items-center justify-between">

<div className="flex items-center gap-3">

<CheckCircle className="text-green-600" />

<div>

<h3 className="font-semibold text-green-700">
Vendor Account Approved
</h3>

<p className="text-sm text-green-700">
You can now manage your services and bookings.
</p>

</div>

</div>

<Link
href="/dashboard/vendor"
className="btn-primary"
>
Vendor Dashboard
</Link>

</div>

</div>

)}

      {/* Quick actions */}
      <div className="mt-6 card">
       <h3 className="font-semibold text-royal-gold mb-4">
  Quick Actions
</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Browse Services', href: '/services', icon: <Search size={20} />, color: 'bg-royal-50 text-royal-blue' },
            { label: 'AI Budget Planner', href: '/ai/budget-planner', icon: '✨', color: 'bg-gold-50 text-royal-blue' },
            { label: 'My Bookings', href: '/dashboard/customer/bookings', icon: <Calendar size={20} />, color: 'bg-purple-50 text-purple-700' },
            { label: 'Saved Services', href: '/dashboard/customer/saved', icon: <Heart size={20} />, color: 'bg-red-50 text-red-600' },
          ].map(({ label, href, icon, color }) => (
            <Link key={href} href={href} className={`p-4 rounded-xl ${color} flex flex-col items-center gap-2 hover:shadow-md transition-shadow text-center`}>
              <span className="text-2xl">
  {icon}
</span>
              <span className="text-xs font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
