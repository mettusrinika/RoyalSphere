'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAllUsers } from '@/lib/hooks/useQueries';
import { usersApi } from '@/lib/api';
import { TableSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate, getInitials, timeAgo } from '@/lib/utils';
import { LayoutDashboard, Users, ShieldCheck, Store, Calendar, CreditCard, Tag, BarChart2, Search, UserCheck, UserX } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

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

export default function AdminUsersPage() {
  const [params, setParams] = useState({ page: 1, limit: 20, role: '', status: '', search: '' });
  const { data, isLoading } = useAllUsers(params);
  const qc = useQueryClient();

  const updateStatus = async (userId: string, status: string) => {
    try {
      await usersApi.updateUserStatus(userId, status);
      toast.success(`User status updated to ${status}.`);
      qc.invalidateQueries({ queryKey: ['users'] });
    } catch { toast.error('Failed to update status'); }
  };

return (
  <DashboardLayout navItems={navItems} title="User Management">
    <div className="flex flex-wrap gap-3 mb-6">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          size={16}
        />
        <input
          value={params.search}
          onChange={(e) =>
            setParams((p) => ({
              ...p,
              search: e.target.value,
              page: 1,
            }))
          }
          placeholder="Search users..."
          className="input pl-9 w-56 text-sm py-2"
        />
      </div>

      <select
        value={params.role}
        onChange={(e) =>
          setParams((p) => ({
            ...p,
            role: e.target.value,
            page: 1,
          }))
        }
        className="input w-36 text-sm py-2"
      >
        <option value="">All Roles</option>
        <option value="customer">Customer</option>
        <option value="vendor">Vendor</option>
        <option value="admin">Admin</option>
      </select>

      <select
        value={params.status}
        onChange={(e) =>
          setParams((p) => ({
            ...p,
            status: e.target.value,
            page: 1,
          }))
        }
        className="input w-40 text-sm py-2"
      >
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="suspended">Suspended</option>
        <option value="pending_verification">Pending</option>
      </select>

      <span className="text-sm text-muted self-center">
        {data?.total ?? 0} users
      </span>
    </div>

    {isLoading ? (
      <TableSkeleton rows={8} />
    ) : !data?.users?.length ? (
      <EmptyState
        icon="👥"
        title="No users found"
        description="Try adjusting your filters"
      />
    ) : (
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              <th className="text-left px-6 py-3">User</th>
              <th className="text-left px-6 py-3">Role</th>
              <th className="text-left px-6 py-3">Status</th>
              <th className="text-left px-6 py-3">Joined</th>
              <th className="text-left px-6 py-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {data.users.map((u: any) => (
              <tr
                key={u._id}
                className="border-b border-border last:border-0 hover:bg-gray-50"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-royal-blue text-white flex items-center justify-center text-xs font-bold overflow-hidden">
                      {u.avatar ? (
                        <img
                          src={u.avatar}
                          alt={`${u.firstName} ${u.lastName}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getInitials(u.firstName, u.lastName)
                      )}
                    </div>

                    <div>
                      <p className="font-medium">
                        {u.firstName} {u.lastName}
                      </p>
                      <p className="text-xs text-muted">
                        {u.email}
                      </p>
                      {u.vendorProfile?.businessName && (
  <p className="text-xs text-royal-blue">
    {u.vendorProfile.businessName}
  </p>
)}
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <span
  className={`badge capitalize ${
    u.role === 'admin'
      ? 'bg-purple-100 text-purple-700'
      : u.role === 'vendor'
      ? u.isVendorApproved
        ? 'bg-green-100 text-green-700'
        : 'bg-yellow-100 text-yellow-700'
      : 'bg-gray-100 text-gray-600'
  }`}
>
  {u.role === 'vendor'
    ? u.isVendorApproved
      ? 'Verified Vendor'
      : 'Vendor Pending'
    : u.role}
</span>
                </td>

                <td className="px-6 py-4">
                  <StatusBadge status={u.status} />
                </td>

                <td className="px-6 py-4 text-xs text-muted">
                  {u.createdAt ? formatDate(u.createdAt) : '-'}
                </td>

                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {u.status !== 'active' && (
                      <button
                        onClick={() =>
                          updateStatus(u._id, 'active')
                        }
                        className="p-2 rounded hover:bg-green-50"
                      >
                        <UserCheck size={16} />
                      </button>
                    )}

                    {u.status !== 'suspended' &&
                      u.role !== 'admin' && (
                        <button
                          onClick={() =>
                            updateStatus(u._id, 'suspended')
                          }
                          className="p-2 rounded hover:bg-red-50"
                        >
                          <UserX size={16} />
                        </button>
                      )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
                {(data?.totalPages ?? 0) > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-border">
            {Array.from({ length: data.totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() =>
                  setParams((p) => ({
                    ...p,
                    page: i + 1,
                  }))
                }
                disabled={params.page === i + 1}
                className={`w-9 h-9 rounded-lg ${
                  params.page === i + 1
                    ? 'bg-royal-blue text-white'
                    : 'border border-border hover:bg-gray-50'
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