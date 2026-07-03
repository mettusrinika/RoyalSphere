'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/dashboard/StatCard';
import {
  useAdminOverview, useRevenueChart, useUserGrowth,
  useTopCategories, useTopVendors, useVendorApplications,
} from '@/lib/hooks/useQueries';
import { CardSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatCurrency, timeAgo, getInitials } from '@/lib/utils';
import Link from 'next/link';
import {
  LayoutDashboard, Users, Store, Calendar, CreditCard,
  ShieldCheck, Tag, BarChart2, Settings, Bell, FileText,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

const navItems = [
  { label: 'Dashboard', href: '/dashboard/admin', icon: <LayoutDashboard size={18} /> },
  { label: 'Users', href: '/dashboard/admin/users', icon: <Users size={18} /> },
  { label: 'Vendor Applications', href: '/dashboard/admin/applications', icon: <ShieldCheck size={18} /> },
  { label: 'Services', href: '/dashboard/admin/services', icon: <Store size={18} /> },
  { label: 'Bookings', href: '/dashboard/admin/bookings', icon: <Calendar size={18} /> },
  { label: 'Payments', href: '/dashboard/admin/payments', icon: <CreditCard size={18} /> },
  { label: 'Categories', href: '/dashboard/admin/categories', icon: <Tag size={18} /> },
  { label: 'Analytics', href: '/dashboard/admin/analytics', icon: <BarChart2 size={18} /> },
];

const PIE_COLORS = ['#0B1F5B', '#D4AF37', '#10B981', '#EF4444', '#8B5CF6', '#F59E0B'];

export default function AdminDashboard() {
  const { data: overview, isLoading } = useAdminOverview();
  const { data: revenue } = useRevenueChart(12);
  const { data: userGrowth } = useUserGrowth(12);
  const { data: topCategories } = useTopCategories();
  const { data: topVendors } = useTopVendors();
  const { data: applications } = useVendorApplications({ status: 'pending', limit: 5 });


  return (
    <DashboardLayout navItems={navItems} title="Admin Dashboard">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-royal-blue">Platform Overview</h2>
        <p className="text-muted text-sm mt-1">Real-time platform metrics from MongoDB</p>
      </div>

      {/* KPI Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(8)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard title="Total Users" value={overview?.totalUsers ?? 0} icon={<Users size={20} />} color="blue" change={overview?.usersGrowth} />
          <StatCard title="Active Vendors" value={overview?.totalVendors ?? 0} icon={<Store size={20} />} color="gold" />
          <StatCard title="Revenue This Month" value={formatCurrency(overview?.revenueThisMonth ?? 0)} icon={<CreditCard size={20} />} color="green" change={overview?.revenueGrowth} />
          <StatCard title="Active Bookings" value={overview?.activeBookings ?? 0} icon={<Calendar size={20} />} color="purple" />
          <StatCard title="Total Services" value={overview?.totalServices ?? 0} icon={<Store size={20} />} color="blue" />
          <StatCard title="Total Bookings" value={overview?.totalBookings ?? 0} icon={<FileText size={20} />} color="gold" change={overview?.bookingsGrowth} />
          <StatCard title="Pending Applications" value={overview?.pendingApplications ?? 0} icon={<ShieldCheck size={20} />} color="green" subtitle="Needs review" />
          <StatCard title="New Users (Month)" value={overview?.newUsersThisMonth ?? 0} icon={<Users size={20} />} color="purple" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue chart */}
        <div className="card">
          <h3 className="font-semibold text-royal-blue mb-4">Revenue Trend (12 months)</h3>
          {!Array.isArray(revenue) || revenue.length === 0 ? (
    <EmptyState
      icon="📈"
      title="No revenue data"
      description="Revenue will appear as payments are processed"
    />
) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenue}>
                <defs>
                  <linearGradient id="adminRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => formatCurrency(v)} />
                <Tooltip formatter={(v: any) => [formatCurrency(v)]} />
                <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2.5} fill="url(#adminRevGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* User growth */}
        <div className="card">
          <h3 className="font-semibold text-royal-blue mb-4">User Growth (12 months)</h3>
          {!Array.isArray(userGrowth) || userGrowth.length === 0 ? (
            <EmptyState icon="👥" title="No user data" description="Growth data will appear as users register" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={userGrowth}>
                <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="customers" name="Customers" fill="#0B1F5B" radius={[4,4,0,0]} />
                <Bar dataKey="vendors" name="Vendors" fill="#D4AF37" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top categories */}
        <div className="card">
          <h3 className="font-semibold text-royal-blue mb-4">Top Categories</h3>
          {!Array.isArray(topCategories) || topCategories.length === 0 ? (
            <EmptyState icon="🏷️" title="No data" description="Category bookings will appear here" />
          ) : (
            <div className="space-y-3">
              {(topCategories ?? []).slice(0, 6).map((cat: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-royal-50 flex items-center justify-center text-lg flex-shrink-0">{cat.icon || '📦'}</div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-foreground">{cat.name}</span>
                      <span className="text-muted">{cat.bookingCount ?? 0}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div className="h-full bg-royal-blue rounded-full" style={{ width: `${Math.min(((cat.bookingCount ?? 0) / (topCategories[0]?.bookingCount || 1)) * 100, 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending vendor applications */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-royal-blue">Pending Applications</h3>
            <Link href="/dashboard/admin/applications" className="text-sm text-royal-blue hover:underline">View all</Link>
          </div>
          {!applications?.applications?.length ? (
            <EmptyState icon="✅" title="All reviewed" description="No pending vendor applications" />
          ) : (
            <div className="space-y-3">
              {applications.applications.map((app: any) => (
                <Link key={app._id} href="/dashboard/admin/applications">
                  <div className="p-3 rounded-xl hover:bg-royal-50 border border-border transition-colors">
                    <p className="font-medium text-sm text-foreground">{app.businessName || 'Unnamed Business'}</p>
                    <p className="text-xs text-muted">{(app.userId as any)?.email || 'No email'}</p>
                    <div className="flex items-center justify-between mt-2">
                      <StatusBadge status={app.status} />
                      <span className="text-xs text-muted">{timeAgo(app.createdAt)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Top vendors */}
        <div className="card">
          <h3 className="font-semibold text-royal-blue mb-4">Top Vendors</h3>
          {!Array.isArray(topVendors) || topVendors.length === 0 ? (
            <EmptyState icon="🏆" title="No vendors" description="Top vendors will appear here" />
          ) : (
            <div className="space-y-3">
              {(topVendors ?? []).slice(0, 5).map((v: any, i: number) => (
                <div key={v._id} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-muted w-5">#{i+1}</span>
                  <div className="w-8 h-8 rounded-full bg-royal-blue flex items-center justify-center text-white text-xs font-bold overflow-hidden flex-shrink-0">
                    {v.avatar ? <img
  src={v.avatar}
  alt={v.firstName}
  className="w-full h-full object-cover"
  onError={(e) => {
    e.currentTarget.style.display = 'none';
  }}
/> : getInitials(v.firstName, v.lastName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
  {v.vendorProfile?.businessName ||
    `${v.firstName ?? ''} ${v.lastName ?? ''}`.trim() ||
    'Unknown Vendor'}
</p>
                    <p className="text-xs text-muted">⭐ {(v.vendorProfile?.rating ?? 0).toFixed(1)} · {v.vendorProfile?.reviewCount ?? 0} reviews</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
