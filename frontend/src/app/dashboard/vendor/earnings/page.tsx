'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { paymentsApi } from '@/lib/api';
import { useVendorRevenueChart, useVendorOverview } from '@/lib/hooks/useQueries';
import StatCard from '@/components/dashboard/StatCard';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate, timeAgo } from '@/lib/utils';
import { LayoutDashboard, Package, Calendar, CreditCard, Star, MessageSquare, Bell, User } from 'lucide-react';
import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TableSkeleton } from '@/components/ui/Skeleton';

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

export default function VendorEarningsPage() {
  const [page, setPage] = useState(1);
  const [months, setMonths] = useState(6);
  const { data: overviewResponse } = useVendorOverview();
const { data: revenueChartResponse } = useVendorRevenueChart(months);

const overview =
  (overviewResponse as any)?.data ??
  overviewResponse;

const revenueChartRaw =
  (revenueChartResponse as any)?.data ??
  revenueChartResponse;

const revenueChart = Array.isArray(revenueChartRaw)
  ? revenueChartRaw
  : [];

const { data: payments, isLoading } = useQuery({
  queryKey: ['vendor-payments', page],
  queryFn: async () => {
    const response = await paymentsApi.getHistory({
      page,
      limit: 10,
    });

    return response.data?.data ?? response.data;
  },
});

  return (
    <DashboardLayout navItems={navItems} title="Earnings">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total Earnings" value={formatCurrency(overview?.totalRevenue ?? 0)} icon={<CreditCard size={20} />} color="green" />
        <StatCard title="This Month" value={formatCurrency(overview?.revenueThisMonth ?? 0)} icon={<CreditCard size={20} />} color="gold" />
        <StatCard title="Completed Bookings" value={overview?.completedBookings ?? 0} icon={<Calendar size={20} />} color="blue" />
      </div>

      {/* Revenue chart */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-royal-blue">Revenue Trend</h3>
          <select value={months} onChange={e => setMonths(+e.target.value)} className="input w-36 text-sm py-1.5">
            <option value={3}>3 months</option>
            <option value={6}>6 months</option>
            <option value={12}>12 months</option>
          </select>
        </div>
        {!revenueChart?.length ? (
          <EmptyState icon="📊" title="No earnings yet" description="Complete bookings to see your revenue trend" />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenueChart}>
              <defs>
                <linearGradient id="vendorRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0B1F5B" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0B1F5B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) =>
  v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`
} />
              <Tooltip formatter={(v: any) => [formatCurrency(v), 'Earnings']} />
              <Area type="monotone" dataKey="revenue" stroke="#0B1F5B" strokeWidth={2} fill="url(#vendorRevGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Payment history */}
      <div className="card p-0 overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold text-royal-blue">Payment History</h3>
        </div>
        {isLoading ? <div className="p-5"><TableSkeleton rows={5} /></div> : !payments?.payments?.length ? (
          <EmptyState icon="💳" title="No payments yet" description="Payments will appear after bookings are completed" />
        ) : (
          <>
    <div className="overflow-x-auto">
        <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-border">
                <tr>
                  <th className="text-left px-6 py-3 text-muted font-medium">Booking</th>
                  <th className="text-left px-6 py-3 text-muted font-medium">Amount</th>
                  <th className="text-left px-6 py-3 text-muted font-medium">Your Payout</th>
                  <th className="text-left px-6 py-3 text-muted font-medium">Status</th>
                  <th className="text-left px-6 py-3 text-muted font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.payments.map((p: any) => (
                  <tr key={p._id} className="border-b border-border last:border-0 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-xs text-royal-blue">
    {(p.bookingId as any)?.bookingNumber || 'N/A'}
</p>
                      <p className="text-xs text-muted">{(p.bookingId as any)?.eventDate
    ? formatDate((p.bookingId as any).eventDate)
    : '—'}</p>
                    </td>
                    <td className="px-6 py-4 font-medium">{formatCurrency(p.amount ?? 0)}</td>
                    <td className="px-6 py-4 font-bold text-green-600">{formatCurrency(p.vendorPayoutAmount ?? 0)}</td>
                    <td className="px-6 py-4"><StatusBadge status={p.status} /></td>
                    <td className="px-6 py-4 text-xs text-muted">{timeAgo(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            {payments.totalPages > 1 && (
              <div className="flex justify-center gap-2 p-4 border-t border-border">
                {[...Array(payments.totalPages)].map((_, i) => (
                  <button key={i} onClick={() => setPage(i + 1)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium ${page === i + 1 ? 'bg-royal-blue text-white' : 'bg-white border border-border'}`}>
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
