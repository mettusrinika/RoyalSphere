'use client';
import Navbar from '@/components/layout/Navbar';
import { useNotifications, useMarkNotificationRead, useMarkAllRead } from '@/lib/hooks/useQueries';
import { PageLoader } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { timeAgo } from '@/lib/utils';
import Link from 'next/link';
import { Bell, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const { data, isLoading } = useNotifications({ limit: 50 });
  const {
  mutate: markRead,
  isPending: markingRead,
} = useMarkNotificationRead();
  const {
  mutate: markAll,
  isPending: markingAll,
} = useMarkAllRead();

  const notifIcon: Record<string, string> = {
    booking_request: '📋', booking_accepted: '✅', booking_rejected: '❌',
    booking_completed: '🎉', payment_success: '💳', payment_failed: '⚠️',
    review_received: '⭐', vendor_approved: '🏆', vendor_rejected: '📩',
    new_message: '💬', system: '🔔',
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 max-w-2xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Bell size={22} className="text-royal-blue" />
            <h1 className="text-xl font-bold text-royal-blue">Notifications</h1>
            {data?.unreadCount > 0 && (
              <span className="badge bg-royal-gold text-royal-blue">{data.unreadCount} new</span>
            )}
          </div>
          {data?.unreadCount > 0 && (
            <button
  onClick={() =>
  markAll(undefined, {
    onSuccess: () => {
      toast.success('All notifications marked as read');
    },
  })
}
  disabled={markingAll}
  className="flex items-center gap-1.5 text-sm text-royal-blue hover:underline disabled:opacity-50"
>
  <CheckCheck size={16} />
  {markingAll ? 'Marking...' : 'Mark all read'}
</button>
          )}
        </div>

        {isLoading ? <PageLoader /> : !data?.notifications?.length ? (
         <EmptyState
  icon="🔔"
  title="No notifications"
  description="You're all caught up! Notifications will appear here."
  action={{
    label: 'Browse Services',
    href: '/services',
  }}
/>
        ) : (
          <div className="space-y-2">
            {data.notifications.map((n: any) => (
              <div
                key={n._id}
                onClick={() => {
  if (!n.isRead && !markingRead) {
    markRead(n._id);
  }
}}
                className={`card transition-all ${n.isRead ? 'bg-white' : 'bg-royal-50 border-l-4 border-l-royal-blue'}`}
              >
                <div className="flex items-start gap-4">
                  <span className="text-xl flex-shrink-0">{notifIcon[n.type] || '🔔'}</span>
                  <div className="flex-1">
                    <p className={`text-sm ${n.isRead ? 'text-foreground' : 'font-semibold text-royal-blue'}`}>{n.title}</p>
                    <p className="text-xs text-muted mt-0.5">{n.message}</p>
                    <p className="text-xs text-muted mt-1">
    {timeAgo(n.createdAt)}
    <span className="mx-1">•</span>
    {new Date(n.createdAt).toLocaleDateString()}
</p>
                  </div>
                  {n.actionUrl && (
                    <Link href={n.actionUrl} className="text-xs text-royal-blue hover:underline flex-shrink-0" onClick={e => e.stopPropagation()}>
                      View →
                    </Link>
                  )}
                  {!n.isRead && <div className="w-2 h-2 rounded-full bg-royal-blue flex-shrink-0 mt-1" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
