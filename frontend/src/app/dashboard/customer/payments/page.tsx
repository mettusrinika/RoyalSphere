'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { paymentsApi } from '@/lib/api';
import { TableSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import StatCard from '@/components/dashboard/StatCard';
import { formatCurrency, formatDate, timeAgo } from '@/lib/utils';
import { LayoutDashboard, Calendar, CreditCard, Star, Heart, Bell, User } from 'lucide-react';
import Link from 'next/link';

const navItems = [
  { label: 'Dashboard', href: '/dashboard/customer', icon: <LayoutDashboard size={18} /> },
  { label: 'My Bookings', href: '/dashboard/customer/bookings', icon: <Calendar size={18} /> },
  { label: 'Payments', href: '/dashboard/customer/payments', icon: <CreditCard size={18} /> },
  { label: 'Saved Services', href: '/dashboard/customer/saved', icon: <Heart size={18} /> },
  { label: 'Reviews', href: '/dashboard/customer/reviews', icon: <Star size={18} /> },
  { label: 'Notifications', href: '/notifications', icon: <Bell size={18} /> },
  { label: 'Profile', href: '/profile', icon: <User size={18} /> },
];

export default function CustomerPaymentsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
  queryKey: ['my-payments', page],
  queryFn: async () => {
    const res = await paymentsApi.getHistory({
      page,
      limit: 10,
    });

    return res.data.data;
  },
});

  const totalSpent =
  data?.payments?.reduce(
    (sum: number, p: any) =>
      p.status === 'paid'
        ? sum + (p.amount ?? 0)
        : sum,
    0
  ) ?? 0;

  return (
    <DashboardLayout navItems={navItems} title="Payment History">
      {data?.payments?.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <StatCard title="Total Spent" value={formatCurrency(totalSpent)} icon={<CreditCard size={20} />} color="blue" />
          <StatCard title="Total Transactions" value={data?.total ?? 0} icon={<CreditCard size={20} />} color="gold" />
        </div>
      )}

      {isLoading ? <TableSkeleton rows={6} /> : !data?.payments?.length ? (
        <EmptyState icon="💳" title="No payments yet" description="You haven't made any payments yet."
          action={{ label: 'Browse Services', href: '/services' }} />
      ) : (
        <div className="card p-0 overflow-hidden">
  <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="text-left px-6 py-3 text-muted font-medium">Booking</th>
                <th className="text-left px-6 py-3 text-muted font-medium">Amount</th>
                <th className="text-left px-6 py-3 text-muted font-medium">Status</th>
                <th className="text-left px-6 py-3 text-muted font-medium">Transaction ID</th>
                <th className="text-left px-6 py-3 text-muted font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.payments.map((p: any) => (
                <tr key={p._id} className="border-b border-border last:border-0 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link href={
  (p.bookingId as any)?._id
    ? `/bookings/${(p.bookingId as any)._id}`
    : '#'
} className="font-medium text-royal-blue hover:underline text-xs">
                      {(p.bookingId as any)?.bookingNumber || 'N/A'}
                    </Link>
                    <p className="text-xs text-muted">{(p.bookingId as any)?.eventDate ? formatDate((p.bookingId as any).eventDate) : ''}</p>
                  </td>
                  <td className="px-6 py-4 font-bold text-royal-blue">{formatCurrency(p.amount ?? 0)}</td>
                  <td className="px-6 py-4"><StatusBadge status={p.status} /></td>
                  <td className="px-6 py-4">
                    <p className="font-mono text-xs text-muted">
  {p.razorpayPaymentId
    ? p.razorpayPaymentId
    : p.razorpayOrderId
      ? `${p.razorpayOrderId.slice(0, 20)}...`
      : '—'}
</p>
                  </td>
                  <td className="px-6 py-4 text-xs text-muted">{p.createdAt
  ? timeAgo(p.createdAt)
  : 'Just now'}</td>
                </tr>
              ))}
            </tbody>
          </table>
</div>
          {data.totalPages > 1 && (
            <div className="flex justify-center gap-2 p-4 border-t border-border">
              {[...Array(data.totalPages)].map((_, i) => (
                <button key={i} onClick={() => setPage(i + 1)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium ${page === i + 1 ? 'bg-royal-blue text-white' : 'bg-white border border-border'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
