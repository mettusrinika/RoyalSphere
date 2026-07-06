'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Script from 'next/script';
import toast from 'react-hot-toast';

import Navbar from '@/components/layout/Navbar';
import { useBooking } from '@/lib/hooks/useQueries';
import { paymentsApi } from '@/lib/api';

import { PageLoader } from '@/components/ui/Skeleton';
import { formatCurrency, formatDate } from '@/lib/utils';

import {
  CreditCard,
  Calendar,
  MapPin,
  Building2,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function BookingPaymentPage() {
  const { id } = useParams<{ id: string }>();

  const router = useRouter();

  const {
    data: booking,
    isLoading,
    refetch,
  } = useBooking(id);

  const [loading, setLoading] =
    useState(false);
    useEffect(() => {
  if (booking?.paymentStatus === 'paid') {
    router.replace(`/bookings/${id}`);
  }
}, [booking, id, router]);

if (booking?.paymentStatus === 'paid') {
  return null;
}

  if (isLoading) {
    return (
      <>
        <Navbar />
        <PageLoader />
      </>
    );
  }

  if (!booking) {
    return (
      <>
        <Navbar />

        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">

            <h2 className="text-2xl font-bold mb-3">
              Booking not found
            </h2>

            <button
              onClick={() => router.back()}
              className="btn-primary"
            >
              Go Back
            </button>

          </div>
        </div>
      </>
    );
  }

  

  const service = booking.serviceId as any;
  const vendor = booking.vendorId as any;
  const customer = booking.customerId as any;
    const handlePayment = async () => {
    if (loading) return;

    setLoading(true);

    try {
      const { data } =
        await paymentsApi.createOrder(id);

      const order =
        data.data ?? data;

      if (!window.Razorpay) {
        toast.error(
          'Unable to load Razorpay.'
        );
        setLoading(false);
        return;
      }

const razorpay = new window.Razorpay({
  key: order.key,

  amount: order.amount,

  currency: order.currency,

  name: 'OMIQORA',

  description: booking.bookingNumber,

  order_id: order.orderId,

  image: '/logo.png',

  prefill: {
    name: `${customer?.firstName ?? ''} ${customer?.lastName ?? ''}`,
    email: customer?.email ?? '',
    contact: customer?.phone ?? '',
  },

  notes: {
    bookingId: booking._id,
    bookingNumber: booking.bookingNumber,
  },

  theme: {
    color: '#0B1F5B',
  },

  modal: {
    escape: false,

    ondismiss: () => {
      toast.error("Payment was cancelled or closed.");
      setLoading(false);
    },
  },

  handler: async (response: any) => {
    try {
      await paymentsApi.verifyPayment({
        bookingId: booking._id,
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature,
      });

      toast.success("Payment Successful");

      await refetch();

      router.replace(`/bookings/${booking._id}`);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ??
        "Payment verification failed"
      );
    } finally {
      setLoading(false);
    }
  },
});

// 👇 ADD THIS BLOCK IMMEDIATELY AFTER THE CONSTRUCTOR

razorpay.on("payment.failed", (response: any) => {
  console.error("Payment Failed:", response);

  toast.error(
    response.error?.description ??
    "Payment failed"
  );

  setLoading(false);
});

// 👇 KEEP THIS LAST

razorpay.open();

      } catch (error: any) {
      toast.error(
        error?.response?.data?.message ??
          'Unable to create payment order'
      );

      setLoading(false);
    }
  };

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => {
}}
      />

      <div className="min-h-screen bg-background">

        <Navbar />

        <div className="pt-24 pb-16">

          <div className="max-w-4xl mx-auto px-4">

            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm text-muted hover:text-royal-blue mb-8"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <div className="card p-8">

              <div className="flex items-center justify-between">

                <div>

                  <h1 className="text-3xl font-bold text-royal-blue">
                    Secure Checkout
                  </h1>

                  <p className="text-muted mt-2">
                    Booking #{booking.bookingNumber}
                  </p>

                </div>

                <ShieldCheck
                  className="text-green-600"
                  size={42}
                />

              </div>

              <hr className="my-8" />
                            <div className="space-y-5">

                <div className="flex justify-between items-center border-b pb-4">

                  <span className="text-muted">
                    Service
                  </span>

                  <span className="font-semibold">
                    {service?.name}
                  </span>

                </div>

                <div className="flex justify-between items-center border-b pb-4">

                  <span className="flex items-center gap-2 text-muted">

                    <Building2 size={16} />

                    Vendor

                  </span>

                  <span className="font-semibold">

                    {
                      vendor?.vendorProfile
                        ?.businessName ||

                      `${vendor?.firstName ?? ''} ${vendor?.lastName ?? ''}`

                    }

                  </span>

                </div>

                <div className="flex justify-between items-center border-b pb-4">

                  <span className="flex items-center gap-2 text-muted">

                    <Calendar size={16} />

                    Event Date

                  </span>

                  <span className="font-semibold">

                    {formatDate(
                      booking.eventDate
                    )}

                  </span>

                </div>

                <div className="flex justify-between items-center border-b pb-4">

                  <span className="flex items-center gap-2 text-muted">

                    <MapPin size={16} />

                    Event Location

                  </span>

                  <span className="font-semibold text-right">

                    {
                      booking.eventLocation
                    }

                  </span>

                </div>

                <div className="flex justify-between items-center border-b pb-4">

                  <span className="text-muted">

                    Payment Status

                  </span>

                  <span className="font-semibold capitalize text-orange-600">

                    {
                      booking.paymentStatus
                    }

                  </span>

                </div>

                <div className="flex justify-between items-center pt-2">

                  <span className="text-xl font-bold">

                    Total Amount

                  </span>

                  <span className="text-3xl font-bold text-royal-blue">

                    {formatCurrency(
                      booking.amount
                    )}

                  </span>

                </div>

              </div>

              <div className="mt-10">

                <button
                  onClick={handlePayment}
                  disabled={loading}
                  className="btn-gold w-full h-14 rounded-xl text-lg font-semibold flex items-center justify-center gap-3 disabled:opacity-60"
                >

                  <CreditCard size={22} />

                  {
                    loading
                      ? 'Opening Razorpay...'
                      : `Pay ${formatCurrency(
                          booking.amount
                        )}`
                  }

                </button>

                <p className="text-center text-sm text-muted mt-5">

                  🔒 100% Secure payment powered by Razorpay

                </p>

              </div>
                            <div className="mt-10 rounded-xl border border-blue-100 bg-blue-50 p-5">

                <h3 className="font-semibold text-royal-blue mb-3">
                  Before you pay
                </h3>

                <ul className="space-y-2 text-sm text-gray-700">

                  <li>
                    ✓ Your payment is processed securely through Razorpay.
                  </li>

                  <li>
                    ✓ OMIQORA never stores your card information.
                  </li>

                  <li>
                    ✓ The vendor will receive payment only after successful verification.
                  </li>

                  <li>
                    ✓ A payment receipt will be available in your booking history.
                  </li>

                </ul>

              </div>

            </div>

          </div>

        </div>

      </div>

    </>

  );

}