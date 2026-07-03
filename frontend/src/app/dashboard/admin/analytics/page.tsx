'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useRevenueChart, useUserGrowth, useTopCategories, useTopVendors } from '@/lib/hooks/useQueries';
import EmptyState from '@/components/ui/EmptyState';
import { formatCurrency } from '@/lib/utils';
import { LayoutDashboard, Users, ShieldCheck, Store, Calendar, CreditCard, Tag, BarChart2 } from 'lucide-react';
import { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
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

export default function AdminAnalyticsPage() {
  const [months, setMonths] = useState(12);
  const { data: revenue } = useRevenueChart(months);
  const { data: userGrowth } = useUserGrowth(months);
  const { data: topCategories } = useTopCategories();
  const { data: topVendors } = useTopVendors();

  return (
    <DashboardLayout navItems={navItems} title="Platform Analytics">
      <div className="flex items-center justify-between mb-6">
        <p className="text-muted text-sm">All data sourced from MongoDB in real-time</p>
        <select value={months} onChange={e => setMonths(+e.target.value)} className="input w-40 text-sm py-2">
          <option value={3}>Last 3 months</option>
          <option value={6}>Last 6 months</option>
          <option value={12}>Last 12 months</option>
        </select>
      </div>

      <div className="space-y-6">
        {/* Revenue Chart */}
        <div className="card">
          <h3 className="font-semibold text-royal-blue mb-5">Revenue & Commission Trend</h3>
          {!Array.isArray(revenue) || revenue.length === 0 ? (
            <EmptyState icon="📈" title="No revenue data" description="Revenue trend will appear as payments are processed" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenue}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0B1F5B" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0B1F5B" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="commGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => formatCurrency(v)} />
                <Tooltip formatter={(v: any, name: string) => [formatCurrency(v), name === 'revenue' ? 'Revenue' : 'Commission']} />
                <Legend />
                <Area type="monotone" dataKey="revenue" name="revenue" stroke="#0B1F5B" strokeWidth={2} fill="url(#revGrad)" />
                <Area type="monotone" dataKey="commission" name="commission" stroke="#D4AF37" strokeWidth={2} fill="url(#commGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* User Growth */}
        <div className="card">
          <h3 className="font-semibold text-royal-blue mb-5">User & Vendor Growth</h3>
          {!Array.isArray(userGrowth) || userGrowth.length === 0 ? (
  <EmptyState
    icon="👥"
    title="No user data"
    description="User growth will appear as people register"
  />
) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
  formatter={(value: number) => [value, 'Count']}
/>
                <Legend />
                <Bar dataKey="customers" name="Customers" fill="#0B1F5B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="vendors" name="Vendors" fill="#D4AF37" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Categories */}
          <div className="card">
            <h3 className="font-semibold text-royal-blue mb-4">Top Categories by Bookings</h3>
            {!Array.isArray(topCategories) || topCategories.length === 0 ? (
  <EmptyState
    icon="🏷️"
    title="No data"
    description="Category data will appear as bookings are made"
  />
) : (
  <div className="space-y-4">
    {topCategories.map((cat: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xl w-8 text-center">{cat.icon || '📦'}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-foreground">{cat.name}</span>
                        <span className="text-muted">{cat.bookingCount ?? 0} bookings</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-royal-blue rounded-full transition-all"
                          style={{
  width: `${Math.min(
    ((cat.bookingCount ?? 0) /
      (topCategories[0]?.bookingCount || 1)) *
      100,
    100
  )}%`,
}} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Vendors */}
          <div className="card">
            <h3 className="font-semibold text-royal-blue mb-4">Top Rated Vendors</h3>
            {!Array.isArray(topVendors) || topVendors.length === 0 ? (
  <EmptyState
    icon="🏆"
    title="No vendors"
    description="Top vendors will appear once approved"
  />
) : (
  <div className="space-y-3">
    {topVendors.slice(0, 8).map((v: any, i: number) => (
                  <div key={v._id} className="flex items-center gap-3">
                    <span className="text-sm font-bold text-muted w-5 text-center">#{i + 1}</span>
                    <div className="w-9 h-9 rounded-full bg-royal-blue text-white flex items-center justify-center text-xs font-bold overflow-hidden flex-shrink-0">
                      {v.avatar ? (
  <img
    src={v.avatar}
    alt={v.firstName || 'Vendor'}
    className="w-full h-full object-cover"
    onError={(e) => {
      e.currentTarget.style.display = 'none';
    }}
  />
) : (
  v.firstName && v.lastName
  ? `${v.firstName[0]}${v.lastName[0]}`
  : 'V'
)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {
  v.vendorProfile?.businessName ||
  `${v.firstName ?? ''} ${v.lastName ?? ''}`.trim() ||
  'Unknown Vendor'
}
                      </p>
                      <p className="text-xs text-muted">⭐ {(v.vendorProfile?.rating ?? 0).toFixed(1)} · {v.vendorProfile?.reviewCount ?? 0} reviews</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
