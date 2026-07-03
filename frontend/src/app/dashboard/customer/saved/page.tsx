'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useSavedServices, useToggleSaved } from '@/lib/hooks/useQueries';
import ServiceCard from '@/components/services/ServiceCard';
import EmptyState from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/Skeleton';
import { LayoutDashboard, Calendar, CreditCard, Star, Heart, Bell, User } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/dashboard/customer', icon: <LayoutDashboard size={18} /> },
  { label: 'My Bookings', href: '/dashboard/customer/bookings', icon: <Calendar size={18} /> },
  { label: 'Payments', href: '/dashboard/customer/payments', icon: <CreditCard size={18} /> },
  { label: 'Saved Services', href: '/dashboard/customer/saved', icon: <Heart size={18} /> },
  { label: 'Reviews', href: '/dashboard/customer/reviews', icon: <Star size={18} /> },
  { label: 'Notifications', href: '/notifications', icon: <Bell size={18} /> },
  { label: 'Profile', href: '/profile', icon: <User size={18} /> },
];

export default function SavedServicesPage() {
  const { data: services, isLoading } = useSavedServices();
  console.log('Saved Services:', services);

  return (
    <DashboardLayout navItems={navItems} title="Saved Services">
      <div className="mb-4 text-sm text-muted">{Array.isArray(services) ? services.length : 0} saved services</div>

      {isLoading ? <PageLoader /> : !Array.isArray(services) || services.length === 0 ? (
        <EmptyState icon="❤️" title="No saved services" description="Save your favourite services to quickly find them later."
          action={{ label: 'Browse Services', href: '/services' }} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services
  .filter(Boolean)
  .map((s: any) => (
    <ServiceCard
      key={s._id}
      service={s}
    />
))}
        </div>
      )}
    </DashboardLayout>
  );
}
