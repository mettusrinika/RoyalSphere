'use client';


import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import {
  Bell,
  MessageSquare,
  Menu,
  X,
  Crown,
} from 'lucide-react';

import { useAuthStore } from '@/lib/stores/authStore';
import { useLogout } from '@/lib/hooks/useAuth';
import { useSocketStore } from '@/lib/stores/socketStore';
import { getInitials } from '@/lib/utils';

export default function Navbar() {
  const { user, isAuthenticated } = useAuthStore();
  const { mutate: logout } = useLogout();

  const {
    unreadNotifications,
    unreadMessages,
  } = useSocketStore();

  const [menuOpen, setMenuOpen] = useState(false);

  const dashboardPath =
    user?.role === 'admin'
      ? '/dashboard/admin'
      : user?.role === 'vendor' && user?.isVendorApproved
      ? '/dashboard/vendor'
      : '/dashboard/customer';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-royal-blue/95 backdrop-blur-md border-b border-white/10">

      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo */}

        <Link
          href="/"
          className="flex items-center gap-2.5"
        >
          <div className="w-8 h-8 bg-royal-gold rounded-lg flex items-center justify-center">
            <Image src="/omiqora-icon.png" alt="OMIQORA" width={40} height={40} className="rounded-xl object-cover" priority />
          </div>

          <span className="text-white font-bold text-lg tracking-tight">
            OMI<span className="text-royal-gold">QORA</span>
          </span>
        </Link>

        {/* Desktop Navigation */}

        <div className="hidden md:flex items-center gap-6">

          <Link
            href="/services"
            className="text-blue-200 hover:text-white text-sm font-medium transition-colors"
          >
            Services
          </Link>

          <Link
            href="/services?sort=popular"
            className="text-blue-200 hover:text-white text-sm font-medium transition-colors"
          >
            Popular
          </Link>

          <Link
            href="/ai/budget-planner"
            className="text-royal-gold hover:text-gold-300 text-sm font-medium transition-colors flex items-center gap-1"
          >
            ✨ AI Planner
          </Link>

        </div>

        {/* Right Side */}

        <div className="hidden md:flex items-center gap-3">

          {isAuthenticated && user ? (
            <>

              <Link
                href="/notifications"
                className="relative p-2 text-blue-200 hover:text-white transition-colors"
              >
                <Bell size={20} />

                {unreadNotifications > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-royal-gold text-royal-blue text-xs rounded-full flex items-center justify-center font-bold">
                    {unreadNotifications > 9
                      ? '9+'
                      : unreadNotifications}
                  </span>
                )}
              </Link>

              <Link
                href="/chat"
                className="relative p-2 text-blue-200 hover:text-white transition-colors"
              >
                <MessageSquare size={20} />

                {unreadMessages > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {unreadMessages}
                  </span>
                )}
              </Link>

              <div className="relative group">

                <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-xl px-3 py-1.5 transition-colors">

                  <div className="w-7 h-7 bg-royal-gold rounded-full overflow-hidden flex items-center justify-center text-royal-blue font-bold text-xs">

                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt=""
                        className="w-7 h-7 rounded-full object-cover"
                      />
                    ) : (
                      getInitials(
                        user.firstName,
                        user.lastName,
                      )
                    )}

                  </div>

                  <div className="flex flex-col items-start">

                    <span className="text-white text-sm font-medium">
                      {user.firstName}
                    </span>

                    <span className="text-xs text-blue-200">
                      {user.role === 'admin'
                        ? 'Admin'
                        : user.role === 'vendor'
                        ? user.isVendorApproved
                          ? 'Verified Vendor'
                          : 'Vendor Review'
                        : 'Customer'}
                    </span>

                  </div>

                </button>

                {/* Desktop Dropdown starts here */}
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-royal border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                                    <Link
                    href={dashboardPath}
                    className="block px-4 py-2.5 text-sm text-foreground hover:bg-royal-50 rounded-t-xl"
                  >
                    Dashboard
                  </Link>

                  {user.role === 'customer' && (
                    <Link
                      href="/vendor/apply"
                      className="block px-4 py-2.5 text-sm text-foreground hover:bg-royal-50"
                    >
                      Become a Vendor
                    </Link>
                  )}

                  {user.role === 'vendor' &&
                    !user.isVendorApproved && (
                      <Link
                        href="/vendor/apply"
                        className="block px-4 py-2.5 text-sm text-yellow-600 hover:bg-yellow-50"
                      >
                        Vendor Application
                      </Link>
                    )}

                  <Link
                    href="/profile"
                    className="block px-4 py-2.5 text-sm text-foreground hover:bg-royal-50"
                  >
                    Profile
                  </Link>

                  <hr className="border-border" />

                  <button
                    onClick={() => logout()}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-b-xl"
                  >
                    Logout
                  </button>

                </div>

              </div>

            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-blue-200 hover:text-white text-sm font-medium transition-colors"
              >
                Login
              </Link>

              <Link
                href="/auth/register"
                className="btn-gold text-sm px-4 py-2 rounded-lg"
              >
                Get Started
              </Link>
            </>
          )}

        </div>

        {/* Mobile Menu Button */}

        <button
          className="md:hidden text-white"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? (
            <X size={22} />
          ) : (
            <Menu size={22} />
          )}
        </button>

      </div>
            {/* Mobile Menu */}

      {menuOpen && (
        <div className="md:hidden bg-royal-navy border-t border-white/10 px-4 py-4 space-y-3">

          <Link
            href="/services"
            className="block text-blue-200 py-2 text-sm"
            onClick={() => setMenuOpen(false)}
          >
            Services
          </Link>

          <Link
            href="/services?sort=popular"
            className="block text-blue-200 py-2 text-sm"
            onClick={() => setMenuOpen(false)}
          >
            Popular
          </Link>

          <Link
            href="/ai/budget-planner"
            className="block text-royal-gold py-2 text-sm"
            onClick={() => setMenuOpen(false)}
          >
            ✨ AI Planner
          </Link>

          {isAuthenticated ? (
            <>

              <Link
                href={dashboardPath}
                className="block text-blue-200 py-2 text-sm"
                onClick={() => setMenuOpen(false)}
              >
                Dashboard
              </Link>

              {user?.role === 'customer' && (
                <Link
                  href="/vendor/apply"
                  className="block text-blue-200 py-2 text-sm"
                  onClick={() => setMenuOpen(false)}
                >
                  Become a Vendor
                </Link>
              )}

              {user?.role === 'vendor' &&
                !user?.isVendorApproved && (
                  <Link
                    href="/vendor/apply"
                    className="block text-yellow-300 py-2 text-sm"
                    onClick={() => setMenuOpen(false)}
                  >
                    Vendor Application
                  </Link>
                )}

              <button
                onClick={() => {
                  logout();
                  setMenuOpen(false);
                }}
                className="block text-red-400 py-2 text-sm w-full text-left"
              >
                Logout
              </button>

            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="block text-blue-200 py-2 text-sm"
                onClick={() => setMenuOpen(false)}
              >
                Login
              </Link>

              <Link
                href="/auth/register"
                className="block btn-gold text-center rounded-lg py-2 text-sm"
                onClick={() => setMenuOpen(false)}
              >
                Get Started
              </Link>
            </>
          )}

        </div>
      )}

    </nav>
  );
}