'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useMyBookings, useCancelBooking, useCreateReview } from '@/lib/hooks/useQueries';
import { TableSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate, timeAgo } from '@/lib/utils';
import Link from 'next/link';
import { Calendar, CreditCard, Star, Heart, Bell, User, LayoutDashboard, X } from 'lucide-react';
import { useForm } from 'react-hook-form';

const navItems = [
  { label: 'Dashboard', href: '/dashboard/customer', icon: <LayoutDashboard size={18} /> },
  { label: 'My Bookings', href: '/dashboard/customer/bookings', icon: <Calendar size={18} /> },
  { label: 'Payments', href: '/dashboard/customer/payments', icon: <CreditCard size={18} /> },
  { label: 'Saved Services', href: '/dashboard/customer/saved', icon: <Heart size={18} /> },
  { label: 'Notifications', href: '/notifications', icon: <Bell size={18} /> },
  { label: 'Profile', href: '/profile', icon: <User size={18} /> },
];

export default function CustomerBookingsPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);

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
  const { mutate: cancel, isPending: cancelling } = useCancelBooking();
  const { mutate: submitReview, isPending: reviewing } = useCreateReview();
  const { register, handleSubmit, reset } = useForm();

  const statuses = ['', 'pending', 'accepted', 'in_progress', 'completed', 'cancelled'];

  const onReview = (bookingId: string, data: any) => {
    submitReview({ bookingId, rating: +data.rating, comment: data.comment }, {
      onSuccess: () => { setReviewBookingId(null); reset(); },
    });
  };

  return (
    <DashboardLayout navItems={navItems} title="My Bookings">
      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {statuses.map(s => (
          <button key={s} onClick={() => { setStatus(s); setPage(1); }}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${status === s ? 'bg-royal-blue text-white' : 'bg-white border border-border text-muted hover:border-royal-blue'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

     {isLoading ? (
  <TableSkeleton rows={5} />
) : !data?.bookings?.length ? (
  <EmptyState
    icon="📅"
    title="No bookings found"
    description="You don't have any bookings yet."
    action={{
      label: 'Browse Services',
      href: '/services',
    }}
  />
) : (
  <>
    <div className="space-y-4">
      {data.bookings.map((b: any) => {
        const service = b.serviceId as any;
        const vendor = b.vendorId as any;

        return (
          <div key={b._id} className="card">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-royal-50">
                {service?.images?.[0] ? (
                  <img
                    src={service.images[0]}
                    alt={service?.name || 'Service'}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src =
                        '/placeholder-service.jpg';
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl">
                    📸
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground">
                      {service?.name || 'Unnamed Service'}
                    </p>

                    <p className="text-sm text-muted">
                      {vendor?.vendorProfile?.businessName ||
                        `${vendor?.firstName ?? ''} ${
                          vendor?.lastName ?? ''
                        }`.trim() ||
                        'Unknown Vendor'}
                    </p>

                    <p className="mt-1 text-xs text-muted">
                      📅 {formatDate(b.eventDate)} · 📍{' '}
                      {b.eventLocation ||
                        'Location not specified'}
                    </p>
                  </div>

                  <StatusBadge status={b.status} />
                </div>
              </div>

              <div className="text-right">
                <p className="font-bold text-royal-blue">
                  {formatCurrency(b.amount ?? 0)}
                </p>

                <p className="text-xs text-muted">
                  {b.bookingNumber || 'N/A'}
                </p>

                <div className="mt-2 flex flex-wrap justify-end gap-2">
                  <Link
                    href={`/bookings/${b._id}`}
                    className="text-xs text-royal-blue hover:underline"
                  >
                    Details
                  </Link>

                  {b.status === 'completed' &&
                    !b.reviewSubmitted && (
                      <button
                        type="button"
                        onClick={() =>
                          setReviewBookingId(b._id)
                        }
                        className="text-xs text-royal-gold hover:underline"
                      >
                        Leave Review
                      </button>
                    )}

                  {b.status === 'completed' &&
                    b.reviewSubmitted && (
                      <span className="text-xs text-green-600">
                        Reviewed
                      </span>
                    )}

                  {['pending', 'accepted'].includes(
                    b.status,
                  ) && (
                    <button
                      type="button"
                      onClick={() =>
                        setCancelBookingId(b._id)
                      }
                      className="text-xs text-red-500 hover:underline"
                    >
                      Cancel
                    </button>
                  )}

                  {b.paymentStatus !== 'paid' &&
                    b.status === 'accepted' && (
                      <Link
                        href={`/bookings/${b._id}/pay`}
                        className="rounded-full bg-green-600 px-2 py-0.5 text-xs text-white hover:bg-green-700"
                      >
                        Pay Now
                      </Link>
                    )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>

    {data.totalPages > 1 && (
      <div className="mt-6 flex justify-center gap-2">
        {[...Array(data.totalPages)].map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setPage(i + 1)}
            className={`h-9 w-9 rounded-lg text-sm font-medium ${
              page === i + 1
                ? 'bg-royal-blue text-white'
                : 'border border-border bg-white'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    )}
  </>
)}

{/* Review Modal */}
{reviewBookingId && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="card w-full max-w-md">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-royal-blue">
          Leave a Review
        </h3>

        <button
          type="button"
          onClick={() => {
            setReviewBookingId(null);
            reset();
          }}
        >
          <X size={20} className="text-muted" />
        </button>
      </div>

      <form
        onSubmit={handleSubmit((formData) =>
          onReview(reviewBookingId, formData),
        )}
        className="space-y-4"
      >
        <div>
          <label className="label">Rating *</label>

          <select
            {...register('rating', {
              required: true,
            })}
            className="input"
            defaultValue="5"
          >
            {[5, 4, 3, 2, 1].map((rating) => (
              <option key={rating} value={rating}>
                {rating} Stars {'★'.repeat(rating)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Comment *</label>

          <textarea
            {...register('comment', {
              required: true,
              minLength: 10,
            })}
            rows={3}
            placeholder="Tell other customers about your experience..."
            className="input resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={reviewing}
          className="btn-primary w-full rounded-xl py-2.5"
        >
          {reviewing
            ? 'Submitting...'
            : 'Submit Review'}
        </button>
      </form>
    </div>
  </div>
)}

{/* Cancel Modal */}
{cancelBookingId && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="card w-full max-w-md">
      <h3 className="mb-4 font-semibold text-royal-blue">
        Cancel Booking
      </h3>

      <p className="mb-4 text-sm text-muted">
        Please provide a reason for cancellation.
      </p>

      <form
        onSubmit={handleSubmit((formData) =>
          cancel(
            {
              id: cancelBookingId,
              reason: formData.cancelReason,
            },
            {
              onSuccess: () => {
                setCancelBookingId(null);
                reset();
              },
            },
          ),
        )}
        className="space-y-4"
      >
        <textarea
          {...register('cancelReason', {
            required: true,
            minLength: 5,
          })}
          rows={3}
          placeholder="Please tell us why you're cancelling..."
          className="input resize-none"
        />

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              setCancelBookingId(null);
              reset();
            }}
            className="btn-outline flex-1 rounded-xl py-2.5 text-sm"
          >
            Keep Booking
          </button>

          <button
            type="submit"
            disabled={cancelling}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
          >
            {cancelling
              ? 'Cancelling...'
              : 'Cancel Booking'}
          </button>
        </div>
      </form>
        </div>
  </div>
)}

    </DashboardLayout>
  );
}