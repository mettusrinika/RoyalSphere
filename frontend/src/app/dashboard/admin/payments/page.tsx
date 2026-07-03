'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { paymentsApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { TableSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import StatCard from '@/components/dashboard/StatCard';
import { formatCurrency, timeAgo } from '@/lib/utils';
import { LayoutDashboard, Users, ShieldCheck, Store, Calendar, CreditCard, Tag, BarChart2, TrendingUp } from 'lucide-react';

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

export default function AdminPaymentsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['admin-payments', page],
    queryFn: () => paymentsApi.getAdminPayments({ page, limit: 20 }).then(r => r.data),
  });

  return (
    <DashboardLayout navItems={navItems} title="Payments & Revenue">
      {/* Stats from real DB */}
      {data?.stats ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard title="Total Revenue" value={formatCurrency(data.stats.totalRevenue || 0)} icon={<TrendingUp size={20} />} color="green" />
          <StatCard title="Platform Commission" value={formatCurrency(data.stats.totalCommission || 0)} icon={<CreditCard size={20} />} color="gold" />
          <StatCard title="Vendor Payouts" value={formatCurrency(data.stats.totalPayout || 0)} icon={<CreditCard size={20} />} color="blue" />
        </div>
        ) : (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
    <StatCard
      title="Total Revenue"
      value={formatCurrency(0)}
      icon={<TrendingUp size={20} />}
      color="green"
    />
    <StatCard
      title="Platform Commission"
      value={formatCurrency(0)}
      icon={<CreditCard size={20} />}
      color="gold"
    />
    <StatCard
      title="Vendor Payouts"
      value={formatCurrency(0)}
      icon={<CreditCard size={20} />}
      color="blue"
    />
  </div>
)}

      {isLoading ? <TableSkeleton rows={8} /> : !data?.payments?.length ? (
        <EmptyState icon="💳" title="No payments yet" description="Payments will appear here once customers complete bookings" />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-border">
                <tr>
                  <th className="text-left px-6 py-3 text-muted font-medium">Razorpay ID</th>
                  <th className="text-left px-6 py-3 text-muted font-medium">Customer</th>
                  <th className="text-left px-6 py-3 text-muted font-medium">Vendor</th>
                  <th className="text-left px-6 py-3 text-muted font-medium">Amount</th>
                  <th className="text-left px-6 py-3 text-muted font-medium">Commission</th>
                  <th className="text-left px-6 py-3 text-muted font-medium">Vendor Payout</th>
                  <th className="text-left px-6 py-3 text-muted font-medium">Status</th>
                  <th className="text-left px-6 py-3 text-muted font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.payments.map((p: any) => {
                  const customer = p.customerId as any;
                  const vendor = p.vendorId as any;
                  return (
                    <tr key={p._id} className="border-b border-border last:border-0 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-mono text-xs text-royal-blue">
  {p.razorpayPaymentId ??
    (p.razorpayOrderId
      ? `${p.razorpayOrderId.slice(0, 16)}...`
      : 'N/A')}
</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-foreground">
  {`${customer?.firstName ?? ''} ${customer?.lastName ?? ''}`.trim() ||
    'Unknown Customer'}
</p>
                        <p className="text-xs text-muted">{customer?.email || '-'}</p>
                      </td>
                      <td className="px-6 py-4">
  <p className="font-medium text-foreground">
    {vendor?.vendorProfile?.businessName ||
      `${vendor?.firstName ?? ''} ${vendor?.lastName ?? ''}`.trim() ||
      'Unknown Vendor'}
  </p>
</td>
                      <td className="px-6 py-4 font-bold text-royal-blue">{formatCurrency(p.amount ?? 0)}</td>
                      <td className="px-6 py-4 text-green-600 font-medium">{formatCurrency(p.commissionAmount ?? 0)}</td>
                      <td className="px-6 py-4 text-muted">{formatCurrency(p.vendorPayoutAmount ?? 0)}</td>
                      <td className="px-6 py-4"><StatusBadge status={p.status || 'pending'} /></td>
                      <td className="px-6 py-4 text-xs text-muted">{p.createdAt ? timeAgo(p.createdAt) : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {(data?.totalPages ?? 0) > 1 && (
  <div className="flex justify-center gap-2 p-4 border-t border-border">
    {Array.from({ length: data.totalPages }).map((_, i) => (
      <button
        key={i}
        disabled={page === i + 1}
        onClick={() => setPage(i + 1)}
        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
          page === i + 1
            ? 'bg-royal-blue text-white cursor-default'
            : 'bg-white border border-border hover:bg-gray-50'
        }`}
      >
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
