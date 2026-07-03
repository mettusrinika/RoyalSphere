'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/lib/stores/authStore';
import { useVendorReviews } from '@/lib/hooks/useQueries';
import { reviewsApi } from '@/lib/api';
import EmptyState from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { getInitials, timeAgo } from '@/lib/utils';
import { LayoutDashboard, Package, Calendar, CreditCard, Star, MessageSquare, Bell, User, Send } from 'lucide-react';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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

export default function VendorReviewsPage() {
  const { user } = useAuthStore();
  const { data, isLoading } = useVendorReviews(user?._id || '');
  const qc = useQueryClient();
  const [replyId, setReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  const submitReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      await reviewsApi.replyToReview(reviewId, replyText);
      qc.invalidateQueries({ queryKey: ['reviews', 'vendor', user?._id] });
      toast.success('Reply posted!');
      setReplyId(null);
      setReplyText('');
    } catch {
    toast.error('Failed to post reply');
} finally { setReplying(false); }
  };

  const avgRating = data?.reviews?.length
    ? (data.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / data.reviews.length).toFixed(1)
    : '0.0';

  return (
    <DashboardLayout navItems={navItems} title="My Reviews">
      {/* Summary */}
      {data?.total > 0 && (
        <div className="card mb-6 flex items-center gap-6">
          <div className="text-center">
            <p className="text-4xl font-bold text-royal-blue">{avgRating}</p>
            <div className="flex items-center gap-0.5 mt-1 justify-center">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} size={14} className={+avgRating >= s ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
              ))}
            </div>
            <p className="text-xs text-muted mt-1">{data.total} reviews</p>
          </div>
          <div className="flex-1">
            {[5, 4, 3, 2, 1].map(star => {
              const count = data.reviews.filter((r: any) => r.rating === star).length;
              return (
                <div key={star} className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-muted w-4">{star}</span>
                  <Star size={10} className="text-yellow-400 fill-yellow-400" />
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${data.total ? (count / data.total) * 100 : 0}%` }} />
                  </div>
                  <span className="text-xs text-muted w-4">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isLoading ? <TableSkeleton rows={4} /> : !data?.reviews?.length ? (
        <EmptyState icon="⭐" title="No reviews yet" description="Complete bookings and deliver great service to earn reviews" />
      ) : (
        <div className="space-y-4">
          {data.reviews.map((review: any) => {
            const reviewer = review.customerId as any;
            const service = review.serviceId as any;
            return (
              <div key={review._id} className="card">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-royal-blue text-white flex items-center justify-center text-xs font-bold overflow-hidden flex-shrink-0">
                    {reviewer?.avatar ? (
  <img
  src={reviewer.avatar}
  alt={reviewer?.firstName || 'Customer'}
  className="w-full h-full object-cover"
  onError={(e) => {
    e.currentTarget.src = '/placeholder-avatar.png';
  }}
/>
) : (
  getInitials(reviewer?.firstName, reviewer?.lastName)
)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm text-foreground">{`${reviewer?.firstName ?? ''} ${reviewer?.lastName ?? ''}`.trim() || 'Customer'}</p>
                      <span className="text-xs text-muted">{timeAgo(review.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} size={12} className={review.rating >= s ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
                      ))}
                      {service?.name && (
    <span className="text-xs text-muted ml-2">
        · {service.name}
    </span>
)}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted mb-3">
    {review.comment || 'No review comment provided.'}
</p>

                {review.vendorReply ? (
                  <div className="bg-royal-50 border-l-4 border-l-royal-blue p-3 rounded-r-xl">
                    <p className="text-xs font-semibold text-royal-blue mb-1">Your Reply</p>
                    <p className="text-sm text-muted">{review.vendorReply}</p>
                  </div>
                ) : (
                  replyId === review._id ? (
                    <div className="flex gap-2 mt-2">
                      <input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write a reply..."
                        className="input flex-1 text-sm py-2" onKeyDown={e => e.key === 'Enter' && submitReply(review._id)} />
                      <button onClick={() => submitReply(review._id)} disabled={replying || !replyText.trim()}
                        className="btn-primary px-3 py-2 rounded-lg text-sm flex items-center gap-1">
                        <Send size={14} /> {replying ? 'Posting...' : 'Reply'}
                      </button>
                      <button
    onClick={() => {
        setReplyId(null);
        setReplyText('');
    }} className="text-xs text-muted hover:underline px-2">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setReplyId(review._id)} className="text-xs text-royal-blue hover:underline mt-1">
                      Reply to this review
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
