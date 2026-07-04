'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import { useLogout } from '@/lib/hooks/useAuth';
import { cn, getInitials } from '@/lib/utils';
import { Crown, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface SidebarItem { label: string; href: string; icon: React.ReactNode; }

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: SidebarItem[];
  title: string;
}

export default function DashboardLayout({ children, navItems, title }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { mutate: logout } = useLogout();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const Sidebar = () => (
    <aside className="w-64 bg-royal-blue min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-royal-gold rounded-lg flex items-center justify-center">
            <Image src="/omiqora-icon.png" alt="OMIQORA" width={36} height={36} className="rounded-xl object-cover" />
          </div>
          <span className="text-white font-bold text-lg">OMI<span className="text-royal-gold">QORA</span></span>
        </Link>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-royal-gold flex items-center justify-center text-royal-blue font-bold text-sm overflow-hidden">
            {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="" /> : getInitials(user?.firstName || '', user?.lastName || '')}
          </div>
          <div>
            <p className="text-white text-sm font-semibold">{user?.firstName} {user?.lastName}</p>
            <p className="text-blue-300 text-xs">

  {user?.role === 'admin'
    ? 'Admin'
    : user?.role === 'vendor'
      ? user?.isVendorApproved
        ? 'Verified Vendor'
        : 'Vendor Application Pending'
      : 'Customer'}

</p>
          </div>
        </div>
        {user?.profileCompletion !== undefined && user.profileCompletion < 100 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-blue-300 mb-1">
              <span>Profile</span><span>{user.profileCompletion}%</span>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full">
              <div className="h-full bg-royal-gold rounded-full transition-all" style={{ width: `${user.profileCompletion}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">

  {navItems.map(({ label, href, icon }) => (
    <Link
      key={href}
      href={href}
      onClick={() => setSidebarOpen(false)}
      className={cn(
        'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
        pathname === href
          ? 'bg-white/15 text-white'
          : 'text-blue-200 hover:bg-white/10 hover:text-white'
      )}
    >
      <span
        className={
          pathname === href
            ? 'text-royal-gold'
            : ''
        }
      >
        {icon}
      </span>

      {label}
    </Link>
  ))}

  {/* Customer */}
  {user?.role === 'customer' && (
    <Link
      href="/vendor/apply"
      onClick={() => setSidebarOpen(false)}
      className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-blue-200 hover:bg-white/10 hover:text-white"
    >
      👑 Become a Vendor
    </Link>
  )}

  {/* Pending Vendor */}
  {user?.role === 'vendor' &&
    !user?.isVendorApproved && (
      <Link
        href="/vendor/apply"
        onClick={() => setSidebarOpen(false)}
        className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-yellow-300 hover:bg-yellow-500/20"
      >
        ⏳ Vendor Application
      </Link>
    )}

</nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={() => logout()}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-blue-200 hover:bg-red-500/20 hover:text-red-300 w-full transition-all"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 h-full z-40">
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64"><Sidebar /></div>
          <div className="flex-1 bg-black/50" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-64">
        {/* Top bar */}
<div className="bg-white border-b border-border px-6 h-16 flex items-center justify-between sticky top-0 z-30">

  {/* Left */}

  <div className="flex items-center gap-3">

    <button
      className="lg:hidden text-muted"
      onClick={() => setSidebarOpen(true)}
    >
      <Menu size={22} />
    </button>

    <h1 className="text-lg font-semibold text-royal-blue">
      {title}
    </h1>

  </div>

  {/* Right */}

  <div className="flex items-center gap-4">

    <Link
      href="/notifications"
      className="text-muted hover:text-royal-blue transition-colors text-sm"
    >
      Notifications
    </Link>

    {user?.role === 'customer' && (
      <Link
        href="/vendor/apply"
        className="text-sm font-medium text-royal-blue hover:underline"
      >
        Become a Vendor
      </Link>
    )}

    {user?.role === 'vendor' &&
      !user?.isVendorApproved && (
        <Link
          href="/vendor/apply"
          className="text-sm font-medium text-yellow-600 hover:underline"
        >
          Application Status
        </Link>
      )}

    <div className="w-8 h-8 rounded-full bg-royal-blue flex items-center justify-center text-white text-xs font-bold overflow-hidden">

      {user?.avatar ? (
        <img
          src={user.avatar}
          className="w-full h-full object-cover"
          alt=""
        />
      ) : (
        getInitials(
          user?.firstName || '',
          user?.lastName || '',
        )
      )}

    </div>

  </div>

</div>

        {/* Page content */}
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
