'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useMyBookings, useUpdateBookingStatus } from '@/lib/hooks/useQueries';
import { TableSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate, timeAgo } from '@/lib/utils';
import { LayoutDashboard, Package, Calendar, CreditCard, Star, MessageSquare, Bell, User, Check, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import {
  bookingsApi,
  servicesApi,
  messagesApi,
} from '@/lib/api';
import { useRouter } from 'next/navigation';
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

export default function VendorBookingsPage() {
  const router = useRouter();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [actionBooking, setActionBooking] = useState<{
  id: string;
  action: 'accept' | 'reject' | 'start' | 'complete';
} | null>(null);

  const {
  data: bookingsData,
  isLoading,
} = useMyBookings({
  status,
  page,
  limit: 10,
});

const data = bookingsData as {
  bookings: any[];
  total: number;
  page: number;
  totalPages: number;
} | undefined;
  const { mutate: updateStatus, isPending } = useUpdateBookingStatus();
  const { register, handleSubmit, reset } = useForm();

  const handleAction = (formData: any) => {
  if (!actionBooking) return;

  const statusMap = {
    accept: 'accepted',
    reject: 'rejected',
    start: 'in_progress',
    complete: 'completed',
  } as const;

  updateStatus(
    {
      id: actionBooking.id,
      status: statusMap[actionBooking.action],
      reason: formData.reason,
      note: formData.note,
    },
    {
      onSuccess: () => {
        setActionBooking(null);
        reset();
      },
    },
  );
};

  return (
    <DashboardLayout navItems={navItems} title="Booking Requests">
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {['', 'pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'rejected'].map(s => (
          <button key={s} onClick={() => { setStatus(s); setPage(1); }}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${status === s ? 'bg-royal-blue text-white' : 'bg-white border border-border text-muted hover:border-royal-blue'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {isLoading ? <TableSkeleton rows={5} /> : !data?.bookings?.length ? (
        <EmptyState icon="📋" title="No bookings yet" description="Booking requests from customers will appear here" />
      ) : (
        <div className="space-y-4">
          {data.bookings.map((b: any) => {
            const customer = b.customerId as any;
            const service = b.serviceId as any;
            return (
              <div key={b._id} className="card">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-semibold text-foreground">{b.bookingNumber || 'Booking'}</p>
                        <p className="text-sm text-muted">{service?.name || 'Unnamed Service'}</p>
                      </div>
                      <StatusBadge status={b.status || 'pending'} />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted">Customer</p>
                        <p className="font-medium text-foreground">{`${customer?.firstName ?? ''} ${customer?.lastName ?? ''}`.trim() || 'Customer'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">Event Date</p>
                        <p className="font-medium text-foreground">{b.eventDate ? formatDate(b.eventDate) : 'Not scheduled'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">Location</p>
                        <p className="font-medium text-foreground truncate">{b.eventLocation || 'Location not provided'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">Amount</p>
                        <p className="font-bold text-royal-blue">{formatCurrency(b.amount ?? 0)}</p>
                      </div>
                    </div>
                    {b.eventDetails?.specialRequirements && (
                      <p className="text-xs text-muted mt-2 bg-gray-50 p-2 rounded-lg">
  💬 {b.eventDetails?.specialRequirements || 'No special requirements'}
</p>
                    )}
                  </div>
                  {b.status === 'pending' && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => setActionBooking({ id: b._id, action: 'accept' })}
                        className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-700">
                        <Check size={14} /> Accept
                      </button>
                      <button onClick={() => setActionBooking({ id: b._id, action: 'reject' })}
                        className="flex items-center gap-1.5 bg-red-100 text-red-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-200">
                        <X size={14} /> Reject
                      </button>
                    </div>
                  )}
                  {b.status === 'accepted' &&
  b.paymentStatus === 'paid' && (
    <button
      type="button"
      onClick={() =>
        setActionBooking({
          id: b._id,
          action: 'start',
        })
      }
      className="flex-shrink-0 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
    >
      Start Service
    </button>
  )}

{b.status === 'accepted' &&
  b.paymentStatus !== 'paid' && (
    <span className="flex-shrink-0 text-xs font-medium text-amber-600">
      Awaiting Payment
    </span>
  )}

{b.status === 'in_progress' && (
  <button
    type="button"
    onClick={() =>
      setActionBooking({
        id: b._id,
        action: 'complete',
      })
    }
    className="flex-shrink-0 rounded-xl bg-royal-blue px-4 py-2 text-sm font-medium text-white hover:bg-royal-navy"
  >
    Mark Complete
  </button>
)}
      <button
  type="button"
  onClick={async () => {
    try {
      const { data } = await messagesApi.createConversation(b._id);

      const conversation = data?.data ?? data;

      const conversationId =
        conversation?.conversationId ?? conversation?._id;

      if (!conversationId) {
        throw new Error('Conversation ID missing');
      }

      router.push(
        `/chat?conversation=${encodeURIComponent(
          String(conversationId),
        )}`,
      );
    } catch (error) {
      console.error('Unable to start conversation:', error);
      toast.error('Unable to start conversation');
    }
  }}
  className="text-sm text-muted hover:text-royal-blue flex-shrink-0"
  aria-label="Open booking conversation"
>
  <MessageSquare size={18} />
</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Action modal */}
      {actionBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md">
            <h3 className="mb-4 font-semibold text-royal-blue">
  {actionBooking.action === 'accept'
    ? '✅ Accept Booking'
    : actionBooking.action === 'reject'
      ? '❌ Reject Booking'
      : actionBooking.action === 'start'
        ? '▶️ Start Service'
        : '✅ Mark Booking as Completed'}
</h3>
            <form onSubmit={handleSubmit(handleAction)} className="space-y-4">
              {actionBooking.action === 'reject' && (
                <div>
                  <label className="label">Reason for rejection *</label>
                  <textarea {...register('reason', { required: true })} rows={3} placeholder="Explain why this booking is being rejected..." className="input resize-none" />
                </div>
              )}
              <div>
                <label className="label">Note (optional)</label>
                <input {...register('note')} placeholder="Any additional note..." className="input" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setActionBooking(null)} className="flex-1 btn-outline py-2.5 rounded-xl text-sm">Cancel</button>
                <button
  type="submit"
  disabled={isPending}
  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white ${
    actionBooking.action === 'reject'
      ? 'bg-red-600 hover:bg-red-700'
      : 'bg-royal-blue hover:bg-royal-navy'
  }`}
>
  {isPending
  ? 'Processing...'
  : actionBooking.action === 'accept'
    ? 'Accept Booking'
    : actionBooking.action === 'reject'
      ? 'Reject Booking'
      : actionBooking.action === 'start'
        ? 'Start Service'
        : 'Complete Booking'}
</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
