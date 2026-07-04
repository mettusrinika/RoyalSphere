'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useMyServices, useDeleteService, useCategories } from '@/lib/hooks/useQueries';
import { PageLoader } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { formatCurrency } from '@/lib/utils';
import { LayoutDashboard, Package, Calendar, CreditCard, Star, MessageSquare, Bell, User, Plus, Edit, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
import { servicesApi } from '@/lib/api';
import toast from 'react-hot-toast';

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

export default function VendorServicesPage() {
  const { data: services, isLoading } = useMyServices();
  const { mutate: deleteService } = useDeleteService();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  return (
    <DashboardLayout navItems={navItems} title="My Services">
      <div className="flex items-center justify-between mb-6">
        <p className="text-muted text-sm">{services?.length || 0} services listed</p>
        <Link href="/dashboard/vendor/services/new" className="btn-primary flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl">
          <Plus size={16} /> Add Service
        </Link>
      </div>

      {isLoading ? <PageLoader /> : !services?.length ? (
        <EmptyState icon="📦" title="No services yet" description="Add your first service to start receiving bookings"
          action={{ label: 'Add Service', href: '/dashboard/vendor/services/new' }} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s: any) => {
            const cat = s.categoryId as any;
            return (
              <div key={s._id} className="card p-0 overflow-hidden">
                <div className="relative h-44">
                  {s.images?.[0] ? (
  <img
    src={s.images[0]}
    alt={s.name || 'Service'}
    className="w-full h-full object-cover"
    onError={(e) => {
      e.currentTarget.src = '/images/service-placeholder.jpg';
    }}
  />
) : (
  <img
    src="/images/service-placeholder.jpg"
    alt="Service"
    className="w-full h-full object-cover"
  />
)}
                  <span className={`absolute top-3 right-3 badge ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {s.status || 'draft'}
                  </span>
                </div>
                <div className="p-4">
                  <p className="font-semibold text-foreground mb-1 truncate">{s.name || 'Untitled Service'}</p>
                  {cat && <p className="text-xs text-muted mb-2">
  {cat?.icon || '📦'} {cat?.name || 'Uncategorized'}
</p>}
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-royal-blue">{formatCurrency(s.basePrice ?? 0)}</span>
                    <span className="text-xs text-muted">⭐ {(s.rating ?? 0).toFixed(1)} · {s.bookingCount ?? 0} bookings</span>
                  </div>
                  <div className="flex gap-2">
                    <Link href={s._id ? `/services/${s._id}` : '#'} className="flex-1 flex items-center justify-center gap-1 text-xs border border-border rounded-lg py-2 text-muted hover:border-royal-blue hover:text-royal-blue">
                      <Eye size={12} /> View
                    </Link>
                    <Link href={s._id ? `/dashboard/vendor/services/${s._id}/edit` : '#'} className="flex-1 flex items-center justify-center gap-1 text-xs border border-border rounded-lg py-2 text-muted hover:border-royal-blue hover:text-royal-blue">
                      <Edit size={12} /> Edit
                    </Link>
                    <button onClick={() => setConfirmDelete(s._id)} className="flex items-center justify-center gap-1 text-xs border border-border rounded-lg py-2 px-3 text-red-400 hover:border-red-400 hover:text-red-500">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-sm text-center">
            <p className="text-3xl mb-3">🗑️</p>
            <h3 className="font-semibold text-foreground mb-2">Delete this Service?</h3>
            <p className="text-muted text-sm mb-5">This will permanently remove the service from OMIQORA. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 btn-outline py-2.5 rounded-xl text-sm">Cancel</button>
              <button
  onClick={() =>
    confirmDelete &&
    deleteService(confirmDelete, {
      onSuccess: () => setConfirmDelete(null),
    })
  }
                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
