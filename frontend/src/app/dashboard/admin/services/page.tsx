'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useServices } from '@/lib/hooks/useQueries';
import { servicesApi } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { TableSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatCurrency, timeAgo } from '@/lib/utils';
import { LayoutDashboard, Users, ShieldCheck, Store, Calendar, CreditCard, Tag, BarChart2, Search, Eye, Trash2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

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

export default function AdminServicesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const {
  data: servicesData,
  isLoading,
} = useServices({
  page,
  limit: 20,
  search,
});

const data = servicesData as {
  services: any[];
  total: number;
  page?: number;
  totalPages?: number;
} | undefined;
  return (
    <DashboardLayout navItems={navItems} title="All Services">
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search services..." className="input pl-9 text-sm py-2" />
        </div>
        <span className="text-sm text-muted self-center">{data?.total ?? 0} services</span>
      </div>

      {isLoading ? <TableSkeleton rows={8} /> : !data?.services?.length ? (
        <EmptyState icon="📦" title="No services found" description="Services will appear here once vendors add them" />
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="text-left px-6 py-3 text-muted font-medium">Service</th>
                <th className="text-left px-6 py-3 text-muted font-medium">Vendor</th>
                <th className="text-left px-6 py-3 text-muted font-medium">Category</th>
                <th className="text-left px-6 py-3 text-muted font-medium">Price</th>
                <th className="text-left px-6 py-3 text-muted font-medium">Rating</th>
                <th className="text-left px-6 py-3 text-muted font-medium">Status</th>
                <th className="text-left px-6 py-3 text-muted font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.services.map((s: any) => {
                const vendor = s.vendorId as any;
                const cat = s.categoryId as any;
                return (
                  <tr key={s._id} className="border-b border-border last:border-0 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-royal-50 flex-shrink-0">
                         {s.images?.[0] ? (
  <img
    src={s.images[0]}
    alt={s.name || 'Service'}
    className="w-full h-full object-cover"
    onError={(e) => {
      e.currentTarget.onerror = null; // Prevent infinite loop
      e.currentTarget.src = '/placeholder-service.jpg';
    }}
  />
) : (
  <img
    src="/placeholder-service.jpg"
    alt="Placeholder"
    className="w-full h-full object-cover"
  />
)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground truncate max-w-[160px]">{s.name || 'Unnamed Service'}</p>
                          <p className="text-xs text-muted">{s.bookingCount ?? 0} bookings</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted text-xs">{
  vendor?.vendorProfile?.businessName ||
  `${vendor?.firstName ?? ''} ${vendor?.lastName ?? ''}`.trim() ||
  'Unknown Vendor'
}</td>
                    <td className="px-6 py-4 text-muted text-xs">{cat?.icon || '📦'} {cat?.name || 'Uncategorized'}</td>
                    <td className="px-6 py-4 font-medium text-royal-blue">{formatCurrency(s.basePrice ?? 0)}</td>
                    <td className="px-6 py-4 text-sm">⭐ {(s.rating ?? 0).toFixed(1)} ({s.reviewCount ?? 0})</td>
                    <td className="px-6 py-4"><StatusBadge status={s.status || 'pending'} /></td>
                    <td className="px-6 py-4">
                      <Link href={s._id ? `/services/${s._id}` : '#'} className="p-1.5 text-muted hover:text-royal-blue rounded-lg hover:bg-royal-50 inline-flex">
                        <Eye size={16} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
