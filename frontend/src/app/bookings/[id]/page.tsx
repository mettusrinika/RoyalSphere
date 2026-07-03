'use client';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { useBooking } from '@/lib/hooks/useQueries';
import { paymentsApi } from '@/lib/api';
import { PageLoader } from '@/components/ui/Skeleton';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate, timeAgo } from '@/lib/utils';
import { ChevronLeft, Calendar, MapPin, CreditCard, User } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import EmptyState from '@/components/ui/EmptyState';
import Script from "next/script";

declare global { interface Window { Razorpay: any; } }

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: booking, isLoading, refetch } = useBooking(id);
  const [paying, setPaying] = useState(false);

  if (isLoading) return <div className="min-h-screen bg-background"><Navbar /><PageLoader /></div>;
  if (!booking) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24">
        <EmptyState
          icon="📄"
          title="Booking not found"
          description="This booking may have been removed or you don't have permission to view it."
          action={{
            label: 'Go Back',
            onClick: () => router.back(),
          }}
        />
      </div>
    </div>
  );
}

  const service = booking.serviceId as any;
  const vendor = booking.vendorId as any;
  const customer = booking.customerId as any;

  const handlePayment = async () => {
    setPaying(true);
    try {
      const { data: order } = await paymentsApi.createOrder(id);

      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: 'Royal Sphere',
        description: `Booking ${booking.bookingNumber}`,
        order_id: order.orderId,
        handler: async (response: any) => {
          try {
            await paymentsApi.verifyPayment({ ...response, bookingId: id });
            toast.success('Payment successful!');
            refetch();
          } catch { toast.error('Payment verification failed'); }
        },
        prefill: { name: `${customer?.firstName} ${customer?.lastName}`, email: customer?.email },
        theme: { color: '#0B1F5B' },
      };

      if (!window.Razorpay) {
  toast.error('Payment gateway failed to load.');
  setPaying(false);
  return;
}
const rp = new window.Razorpay(options);
      rp.open();
    } catch (error: any) {
    toast.error(
        error?.response?.data?.message ??
        'Failed to initiate payment'
    );
} finally { setPaying(false); }
  };


  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Script
  src="https://checkout.razorpay.com/v1/checkout.js"
  strategy="beforeInteractive"
/>
      <div className="pt-24 pb-16 max-w-3xl mx-auto px-4">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-muted hover:text-royal-blue text-sm mb-6">
          <ChevronLeft size={16} /> Back
        </button>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-royal-blue">{booking.bookingNumber}</h1>
            <p className="text-muted text-sm mt-1">{service?.name}</p>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Event details */}
          <div className="card">
            <h2 className="font-semibold text-royal-blue mb-4">Event Details</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted"><Calendar size={14} /><span>
  {booking.eventDate
    ? formatDate(booking.eventDate)
    : 'Not specified'}
</span></div>
              <div className="flex items-center gap-2 text-muted"><MapPin size={14} /><span>{booking.eventLocation || 'Not specified'}</span></div>
              {booking.eventDetails?.eventType && <div><span className="text-muted">Type: </span><span className="font-medium capitalize">{booking.eventDetails.eventType}</span></div>}
              {booking.eventDetails?.guestCount && <div><span className="text-muted">Guests: </span><span className="font-medium">{booking.eventDetails.guestCount}</span></div>}
              {booking.eventDetails?.specialRequirements && (
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-xs text-muted mb-1">Special Requirements</p>
                  <p className="text-sm">{booking.eventDetails.specialRequirements}</p>
                </div>
              )}
            </div>
          </div>
          

          {/* Payment info */}
          <div className="card">
            <h2 className="font-semibold text-royal-blue mb-4 flex items-center gap-2"><CreditCard size={16} /> Payment</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted">Amount</span><span className="font-bold text-royal-blue text-base">{formatCurrency(booking.amount ?? 0)}</span></div>
              <div className="flex justify-between"><span className="text-muted">Payment Status</span><StatusBadge status={booking.paymentStatus} /></div>
            </div>
            {booking.paymentStatus !== 'paid' && booking.status === 'accepted' && (
              <button onClick={handlePayment} disabled={paying || booking.paymentStatus === 'paid'} className="btn-gold w-full mt-4 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold">
                {paying ? 'Processing Payment...' : '💳 Pay Now'}
              </button>
            )}
            {booking.paymentStatus === 'paid' && (
              <div className="mt-4 flex items-center gap-2 text-green-600 text-sm font-medium bg-green-50 p-3 rounded-xl">✅ Payment completed successfully.
Your booking has been confirmed.</div>
            )}
          </div>

          {/* Vendor info */}
          <div className="card">
            <h2 className="font-semibold text-royal-blue mb-4 flex items-center gap-2"><User size={16} /> Vendor</h2>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-royal-blue text-white flex items-center justify-center text-sm font-bold overflow-hidden">
                {vendor?.avatar ? <img
  src={vendor.avatar || '/default-avatar.png'}
  loading="lazy"
  alt=""
  onError={(e) => {
    e.currentTarget.src = '/default-avatar.png';
  }}
  className="w-full h-full object-cover"
/> : (vendor?.firstName?.[0] || '')}
              </div>
              <div>
                <p className="font-medium text-foreground">{vendor?.vendorProfile?.businessName ||
`${vendor?.firstName ?? ''} ${vendor?.lastName ?? ''}`.trim() ||
'Vendor'}</p>
                <p className="text-xs text-muted">{vendor?.email || 'Email not available'}</p>
              </div>
            </div>
          </div>

          {/* Status history */}
          
<div className="card">
  <h2 className="font-semibold text-royal-blue mb-4">Timeline</h2>

  <div className="space-y-3">
    {booking.statusHistory?.length ? (
      booking.statusHistory.map((h: any, i: number) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-2.5 h-2.5 rounded-full bg-royal-blue mt-1" />

            {i < booking.statusHistory.length - 1 && (
              <div className="w-0.5 h-6 bg-gray-200 mt-1" />
            )}
          </div>

          <div>
            <p className="text-sm font-medium capitalize text-foreground">
              {h.status?.replace('_', ' ') || 'Status Updated'}
            </p>

            {h.note && (
              <p className="text-xs text-muted">
                {h.note}
              </p>
            )}

            <p className="text-xs text-muted">
              {h.updatedAt
                ? timeAgo(h.updatedAt)
                : 'Time unavailable'}
            </p>
          </div>
        </div>
      ))
    ) : (
      <div className="text-center py-6">
        <p className="text-sm text-muted">
          Booking timeline will appear as the booking progresses.
        </p>
      </div>
        )}
   </div> {/* End Timeline Content */}

</div> {/* End Timeline Card */}

</div> {/* End Grid */}

</div> {/* End Content */}

</div>

);
}