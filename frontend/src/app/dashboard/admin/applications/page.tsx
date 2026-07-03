'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  useVendorApplications,
  useApproveVendor,
  useRejectVendor,
} from '@/lib/hooks/useQueries';
import { TableSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import { timeAgo, formatDate } from '@/lib/utils';
import { LayoutDashboard, Users, ShieldCheck, Store, Calendar, CreditCard, Tag, BarChart2, Check, X, Eye } from 'lucide-react';
import { useForm } from 'react-hook-form';

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

export default function AdminApplicationsPage() {
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<any>(null);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);

  const { data, isLoading } = useVendorApplications({ status, page, limit: 20 });
  const { mutate: approve, isPending: approving } = useApproveVendor();
  const { mutate: reject, isPending: rejecting } = useRejectVendor();
  const { register, handleSubmit, reset } = useForm();

  const handleAction = (data: any) => {
    if (!selected) return;
    if (action === 'approve') {
      approve({ id: selected._id, notes: data.notes }, { onSuccess: () => { setSelected(null); setAction(null); reset(); } });
    } else {
      reject({ id: selected._id, reason: data.reason }, { onSuccess: () => { setSelected(null); setAction(null); reset(); } });
    }
  };

  return (
    <DashboardLayout navItems={navItems} title="Vendor Applications">
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {['pending', 'under_review', 'approved', 'rejected', ''].map(s => (
          <button key={s} onClick={() => { setStatus(s); setPage(1); }}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${status === s ? 'bg-royal-blue text-white' : 'bg-white border border-border text-muted hover:border-royal-blue'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {isLoading ? <TableSkeleton rows={6} /> : !data?.applications?.length ? (
        <EmptyState icon="📋" title="No applications" description={
  status
    ? `No ${status.replace('_', ' ')} vendor applications found.`
    : 'No vendor applications found.'
} />
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="text-left px-6 py-3 text-muted font-medium">Applicant</th>
                <th className="text-left px-6 py-3 text-muted font-medium">Business</th>
                <th className="text-left px-6 py-3 text-muted font-medium">Categories</th>
                <th className="text-left px-6 py-3 text-muted font-medium">Status</th>
                <th className="text-left px-6 py-3 text-muted font-medium">Applied</th>
                <th className="text-left px-6 py-3 text-muted font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.applications.map((app: any) => {
                const user = app.userId as any;
                return (
                  <tr key={app._id} className="border-b border-border last:border-0 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground">{`${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() ||
  'Unknown User'}</p>
                      <p className="text-xs text-muted">{user?.email || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground">{app.businessName || 'Unnamed Business'}</p>
                      <p className="text-xs text-muted">{app.businessLocation?.city || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
  {app.categories?.length ? (
    app.categories.slice(0, 3).map((c: string) => (
      <span
        key={c}
        className="badge bg-royal-50 text-royal-blue text-xs"
      >
        {c}
      </span>
    ))
  ) : (
    <span className="text-xs text-muted">
      No categories
    </span>
  )}
</div>
                    </td>
                    <td className="px-6 py-4">
  <StatusBadge status={app.status || 'pending'} />
</td>

<td className="px-6 py-4 text-muted text-xs">
  {app.createdAt ? timeAgo(app.createdAt) : '-'}
</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setSelected(app)} className="p-1.5 text-muted hover:text-royal-blue rounded-lg hover:bg-royal-50">
                          <Eye size={16} />
                        </button>
                        {app.status === 'pending' && (
                          <>
                            <button onClick={() => { setSelected(app); setAction('approve'); }}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"><Check size={16} /></button>
                            <button onClick={() => { setSelected(app); setAction('reject'); }}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><X size={16} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* View detail modal */}
      {selected && !action && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="card w-full max-w-lg my-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-royal-blue">Application Details</h3>
              <button type="button" onClick={() => setSelected(null)} > <X size={20} className="text-muted" /></button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-muted">Business</p><p className="font-medium">{selected.businessName || '-'}</p></div>
                <div><p className="text-xs text-muted">Experience</p><p className="font-medium">{selected.experience || '-'}</p></div>
                <div><p className="text-xs text-muted">City</p><p className="font-medium">{selected.businessLocation?.city || '-'}</p></div>
                <div><p className="text-xs text-muted">Phone</p><p className="font-medium">{selected.phone || '-'}</p></div>
              </div>
              <div><p className="text-xs text-muted mb-1">Description</p><p className="text-muted">{selected.businessDescription || 'No description provided.'}</p></div>
              <div><p className="text-xs text-muted mb-1">Categories</p>
                <div className="flex flex-wrap gap-1">
  {selected.categories?.length ? (
    selected.categories.map((c: string) => (
      <span
        key={c}
        className="badge bg-royal-50 text-royal-blue"
      >
        {c}
      </span>
    ))
  ) : (
    <span className="text-xs text-muted">
      No categories
    </span>
  )}
</div>
              </div>
              {selected.documents?.length ? (
  <div>
    <p className="text-xs text-muted mb-1">
      Documents ({selected.documents.length})
    </p>

    <div className="flex flex-wrap gap-2">
      {selected.documents.map((d: any, i: number) => (
        <a
          key={i}
          href={d.url}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-royal-blue hover:underline border border-border px-2 py-1 rounded"
        >
          {d.type || `Document ${i + 1}`}
        </a>
      ))}
    </div>
  </div>
) : (
  <div>
    <p className="text-xs text-muted">
      No documents uploaded
    </p>
  </div>
)}    </div>

            {selected.status === 'pending' && (
              <div className="flex gap-3 mt-5">
                <button onClick={() => setAction('approve')} className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700">Approve</button>
                <button onClick={() => setAction('reject')} className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700">Reject</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Approve/Reject modal */}
      {selected && action && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md">
            <h3 className="font-semibold text-royal-blue mb-4">{action === 'approve' ? '✅ Approve Vendor' : '❌ Reject Application'}</h3>
            <form onSubmit={handleSubmit(handleAction)} className="space-y-4">
              {action === 'approve' ? (
                <div><label className="label">Admin Notes (optional)</label>
                  <textarea {...register('notes')} rows={3} placeholder="Welcome message or notes..." className="input resize-none" /></div>
              ) : (
                <div><label className="label">Rejection Reason *</label>
                  <textarea {...register('reason', {
  required: 'Reason is required',
  minLength: 10,
})} rows={3} placeholder="Provide a clear reason..." className="input resize-none" /></div>
              )}
              <div className="flex gap-3">
                <button
  type="button"
  disabled={approving || rejecting}
  onClick={() => setAction(null)} className="flex-1 btn-outline py-2.5 rounded-xl text-sm">Back</button>
                <button type="submit" disabled={
  approving ||
  rejecting ||
  !selected
}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white ${action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                  {approving || rejecting ? 'Processing...' : action === 'approve' ? 'Approve' : 'Reject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
