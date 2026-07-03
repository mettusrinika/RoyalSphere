'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { bookingsApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { TableSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate, timeAgo } from '@/lib/utils';
import { LayoutDashboard, Users, ShieldCheck, Store, Calendar, CreditCard, Tag, BarChart2 } from 'lucide-react';
import Link from 'next/link';

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

export default function AdminBookingsPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-bookings', status, page],
    queryFn: () => bookingsApi.getAllBookings({ status, page, limit: 20 }).then(r => r.data?.data ?? r.data),
  });

  const statuses = ['', 'pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'rejected'];

  return (
    <DashboardLayout navItems={navItems} title="All Bookings">
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {statuses.map(s => (
          <button key={s} onClick={() => { setStatus(s); setPage(1); }}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${status === s ? 'bg-royal-blue text-white' : 'bg-white border border-border text-muted hover:border-royal-blue'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="mb-4 text-sm text-muted">{data?.total ?? 0} total bookings</div>

      {isLoading ? <TableSkeleton rows={8} /> : !data?.bookings?.length ? (
        <EmptyState icon="📋" title="No bookings found" description="Bookings will appear here once customers start booking services" />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-border">
                <tr>
                  <th className="text-left px-6 py-3 text-muted font-medium">Booking #</th>
                  <th className="text-left px-6 py-3 text-muted font-medium">Customer</th>
                  <th className="text-left px-6 py-3 text-muted font-medium">Vendor</th>
                  <th className="text-left px-6 py-3 text-muted font-medium">Service</th>
                  <th className="text-left px-6 py-3 text-muted font-medium">Amount</th>
                  <th className="text-left px-6 py-3 text-muted font-medium">Status</th>
                  <th className="text-left px-6 py-3 text-muted font-medium">Event Date</th>
                  <th className="text-left px-6 py-3 text-muted font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {data.bookings.map((b: any) => {
                  const customer = b.customerId as any;
                  const vendor = b.vendorId as any;
                  const service = b.serviceId as any;
                  return (
                    <tr key={b._id} className="border-b border-border last:border-0 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <Link href={`/bookings/${b._id}`} className="font-medium text-royal-blue hover:underline text-xs">{b.bookingNumber || 'N/A'}</Link>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-foreground">{`${customer?.firstName ?? ''} ${customer?.lastName ?? ''}`.trim() || 'Unknown Customer'}</p>
                        <p className="text-xs text-muted">{customer?.email || 'No email'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-foreground">{
  vendor?.vendorProfile?.businessName ||
  `${vendor?.firstName ?? ''} ${vendor?.lastName ?? ''}`.trim() ||
  'Unknown Vendor'
}</p>
                      </td>
                      <td className="px-6 py-4 text-muted truncate max-w-[150px]">{service?.name || 'Unknown Service'}</td>
                      <td className="px-6 py-4 font-semibold text-royal-blue">{formatCurrency(b.amount ?? 0)}</td>
                      <td className="px-6 py-4"><StatusBadge status={b.status} /></td>
                      <td className="px-6 py-4 text-muted text-xs">{b.eventDate ? formatDate(b.eventDate) : '-'}</td>
                      <td className="px-6 py-4 text-muted text-xs">{b.createdAt ? timeAgo(b.createdAt) : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {(data?.totalPages ?? 0) > 1 && (
            <div className="flex justify-center gap-2 p-4 border-t border-border">
              {[...Array(data?.totalPages ?? 0)].map((_, i) => (
                <button
  key={i}
  disabled={page === i + 1}
  onClick={() => setPage(i + 1)}
                 className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
  page === i + 1
    ? 'bg-royal-blue text-white cursor-default'
    : 'bg-white border border-border hover:bg-gray-50'
}`}>
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

