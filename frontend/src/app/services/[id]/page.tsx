'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useService, useServiceReviews, useCreateBooking, useToggleSaved } from '@/lib/hooks/useQueries';
import { useAuthStore } from '@/lib/stores/authStore';
import { PageLoader } from '@/components/ui/Skeleton';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate, getInitials, timeAgo } from '@/lib/utils';
import { Star, MapPin, Calendar, Heart, MessageSquare, Share2, ChevronLeft, Check } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { data: service, isLoading } = useService(id);
  console.log("SERVICE DATA:", service);
  const { data: reviewData } = useServiceReviews(id);
  const { mutate: createBooking, isPending: booking } = useCreateBooking();
  const { mutate: toggleSaved } = useToggleSaved();
  const [activeImage, setActiveImage] = useState(0);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  if (isLoading) return <div className="min-h-screen bg-background"><Navbar /><PageLoader /></div>;
  if (!service) return <div className="min-h-screen flex items-center justify-center"><p>Service not found</p></div>;

  const vendor = service.vendorId as any;
  const category = service.categoryId as any;

  const onBook = (data: any) => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    createBooking(
  {
    serviceId: id,
    eventDate: data.eventDate,
    eventLocation: data.eventLocation,
    eventDetails: {
      eventType: data.eventType,
      guestCount: Number(data.guestCount),
      specialRequirements: data.specialRequirements,
    },
    amount: service.basePrice,
  },
  {
    onSuccess: () => {
      toast.success('Booking created');
      setShowBookingForm(false);
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ||
        'Booking failed'
      );
    },
  },
);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16 max-w-6xl mx-auto px-4">
        {/* Back */}
        <button onClick={() => router.back()} className="flex items-center gap-1 text-muted hover:text-royal-blue text-sm mb-6 mt-4">
          <ChevronLeft size={16} /> Back to Services
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: images + details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image gallery */}
            <div className="card p-0 overflow-hidden">
              <div className="relative h-80 bg-gray-100">
                {service.images?.length > 0 ? (
                 <img
  src={service.images?.[activeImage] || '/images/service-placeholder.jpg'}
  alt={service.name}
  onError={(e) => {
    e.currentTarget.src = '/images/service-placeholder.jpg';
  }}
  className="w-full h-full object-cover"
/>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl bg-royal-50">📸</div>
                )}
                <button
  onClick={() =>
    toggleSaved(id, {
      onSuccess: () => {
        toast.success('Service saved');
      },
      onError: () => {
        toast.error('Unable to save service');
      },
    })
  }
  className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
>
  <Heart size={18} className="text-muted" />
</button>
              </div>
              {service.images?.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto">
                  {service.images.map((img: string, i: number) => (
                    <button key={i} onClick={() => setActiveImage(i)} className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${activeImage === i ? 'border-royal-blue' : 'border-transparent'}`}>
                      <img
  src={img || '/images/service-placeholder.jpg'}
  alt=""
  onError={(e) => {
    e.currentTarget.src = '/images/service-placeholder.jpg';
  }}
  className="w-full h-full object-cover"
/>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Service info */}
            <div className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  {category && <span className="badge bg-royal-50 text-royal-blue mb-2">{service.categoryId?.name}</span>}
                  <h1 className="text-2xl font-bold text-royal-blue">{service.name}</h1>
                  <div className="mt-2">
  <StatusBadge status={service.status} />
</div>
                </div>
                <button
  onClick={() => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied');
  }}
  className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
>
  <Share2 size={18} />
</button>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-muted mb-4">
                {service.location?.city && <span className="flex items-center gap-1"><MapPin size={14} /> {service.location.city}</span>}
                <span className="flex items-center gap-1"><Star size={14} className="text-yellow-400 fill-yellow-400" /> {(service.rating ?? 0).toFixed(1)}({service.reviewCount ?? 0} reviews)</span>
                <span>{service.bookingCount ?? 0} bookings</span>
              </div>

              <p className="text-muted leading-relaxed mb-6">{service.description}</p>

              {service.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {service.tags.map((tag: string) => (
                    <span key={tag} className="px-3 py-1 bg-gray-100 text-muted text-xs rounded-full">#{tag}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Packages */}
            {service.packages?.length > 0 && (
              <div className="card">
                <h2 className="font-semibold text-royal-blue mb-4">Packages</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {service.packages.map((pkg: any, i: number) => (
                    <div key={i} className="border border-border rounded-xl p-4 hover:border-royal-blue transition-colors">
                      <h3 className="font-semibold text-foreground">{pkg.name}</h3>
                      <p className="text-2xl font-bold text-royal-blue mt-1">{formatCurrency(pkg.price)}</p>
                      <p className="text-sm text-muted mt-2">{pkg.description}</p>
                      {pkg.features?.length > 0 && (
                        <ul className="mt-3 space-y-1">
                          {pkg.features.map((f: string, fi: number) => (
                            <li key={fi} className="text-xs text-muted flex items-center gap-1.5"><Check size={12} className="text-green-500" /> {f}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="card">
              <h2 className="font-semibold text-royal-blue mb-4">
                Reviews {reviewData?.total ? `(${reviewData.total})` : ''}
              </h2>
              {!reviewData?.reviews?.length ? (
                <p className="text-muted text-sm">No reviews yet. Be the first to review!</p>
              ) : (
                <div className="space-y-4">
                  {reviewData.reviews.map((review: any) => {
                    const reviewer = review.customerId as any;
                    return (
                      <div key={review._id} className="border-b border-border pb-4 last:border-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-9 h-9 rounded-full bg-royal-blue text-white flex items-center justify-center text-xs font-bold overflow-hidden">
                            {reviewer?.avatar ? <img
  src={reviewer.avatar || '/default-avatar.png'}
  alt=""
  onError={(e) => {
    e.currentTarget.src = '/default-avatar.png';
  }}
  className="w-full h-full object-cover"
/> : getInitials(reviewer?.firstName || '', reviewer?.lastName || '')}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-foreground">{reviewer?.firstName} {reviewer?.lastName}</p>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => <Star key={i} size={10} className={i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />)}
                              <span className="text-xs text-muted ml-1">{timeAgo(review.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-muted">{review.comment}</p>
                        {review.vendorReply && (
                          <div className="mt-2 pl-4 border-l-2 border-royal-gold bg-gold-50 p-2 rounded-r-lg">
                            <p className="text-xs font-medium text-royal-blue">Vendor Reply</p>
                            <p className="text-xs text-muted">{review.vendorReply}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: booking card */}
          <div className="space-y-4">
            <div className="card sticky top-24">
              <p className="text-muted text-sm mb-1">Starting from</p>
              <p className="text-3xl font-bold text-royal-blue mb-1">{formatCurrency(service.basePrice ?? 0)}</p>
              <p className="text-xs text-muted mb-5 capitalize">{service.priceType?.replace('_', ' ')}</p>

              {!showBookingForm ? (
                <button onClick={() => isAuthenticated ? setShowBookingForm(true) : router.push('/auth/login')} className="btn-primary w-full py-3 rounded-xl mb-3">
                  Book Now
                </button>
              ) : (
                <form onSubmit={handleSubmit(onBook)} className="space-y-3">
                  <div>
                    <label className="label text-xs">Event Date *</label>
                    <input {...register('eventDate', { required: true })} type="date" className="input text-sm" min={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div>
                    <label className="label text-xs">Event Location *</label>
                    <input {...register('eventLocation', { required: true })} placeholder="e.g. Taj Hotel, Mumbai" className="input text-sm" />
                  </div>
                  <div>
                    <label className="label text-xs">Event Type</label>
                    <select {...register('eventType')} className="input text-sm">
                      <option value="">Select type</option>
                      {['Wedding','Birthday','Corporate','Engagement','Anniversary','Other'].map(t => <option key={t} value={t.toLowerCase()}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label text-xs">Guest Count</label>
                    <input {...register('guestCount')} type="number" placeholder="e.g. 100" className="input text-sm" />
                  </div>
                  <div>
                    <label className="label text-xs">Special Requirements</label>
                    <textarea {...register('specialRequirements')} rows={2} placeholder="Any specific requirements..." className="input text-sm resize-none" />
                  </div>
                  <button type="submit" disabled={booking} className="btn-primary w-full py-2.5 rounded-xl text-sm">
                    {booking ? 'Creating booking...' : 'Confirm Booking'}
                  </button>
                  <button type="button" onClick={() => setShowBookingForm(false)} className="w-full text-muted text-sm hover:underline">Cancel</button>
                </form>
              )}

              {vendor && (
               <button
  onClick={() => {
    toast(
      'Please book this service first to start chatting with the vendor.'
    );
  }}
  className="flex items-center justify-center gap-2 w-full border-2 border-royal-blue text-royal-blue py-2.5 rounded-xl text-sm font-medium"
>
  <MessageSquare size={18} />
  Chat with Vendor
</button>
              )}

              {/* Vendor info */}
              {vendor && (
                <div className="mt-5 pt-5 border-t border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-royal-blue text-white flex items-center justify-center text-sm font-bold overflow-hidden">
                      {vendor.avatar ? <img
  src={vendor.avatar || '/default-avatar.png'}
  alt=""
  onError={(e) => {
    e.currentTarget.src = '/default-avatar.png';
  }}
  className="w-full h-full object-cover"
/> : getInitials(
  vendor.firstName ?? '',
  vendor.lastName ?? ''
)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">
                        {vendor.vendorProfile?.businessName || `${vendor.firstName} ${vendor.lastName}`}
                        {vendor.vendorProfile?.isVerified && <span className="text-green-600 font-bold">
Verified
</span>}
                      </p>
                      <p className="text-xs text-muted">{vendor.vendorProfile?.reviewCount ?? 0} reviews · ⭐ {(vendor.vendorProfile?.rating ?? 0).toFixed(1)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
