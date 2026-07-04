import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  servicesApi, bookingsApi, reviewsApi, analyticsApi,
  categoriesApi, vendorApplicationsApi, notificationsApi, aiApi, usersApi,
} from '../api';
import { useAuthStore } from '../stores/authStore';

// ── Categories ─────────────────────────────────────────────────────────────
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await categoriesApi.getAll();
      return response.data.data;
    },
    staleTime: 10 * 60 * 1000,
  });
}

// ── Services ──────────────────────────────────────────────────────────────
export function useServices(params: any = {}) {
  return useQuery({
    queryKey: ['services', params],
    queryFn: async () => {
      const response = await servicesApi.search(params);
      return response.data.data;
    },
    keepPreviousData: true,
  } as any);
}

export function useFeaturedServices(limit = 8) {
  return useQuery({ queryKey: ['services', 'featured', limit], queryFn: () => servicesApi.getFeatured(limit).then(r => r.data) });
}

export function useService(id: string) {
  return useQuery({
    queryKey: ['service', id],
    queryFn: () =>
      servicesApi.getById(id).then(r => r.data.data),
    enabled: !!id,
  });
}

export function useMyServices() {
  return useQuery({
    queryKey: ['my-services'],
    queryFn: async () => {
      const response = await servicesApi.getMyServices();
      return response.data.data;
    },
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => servicesApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-services'] }); toast.success('Service created!'); },
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: any) => servicesApi.update(id, data),
    onSuccess: (_, { id }) => { qc.invalidateQueries({ queryKey: ['service', id] }); qc.invalidateQueries({ queryKey: ['my-services'] }); toast.success('Service updated!'); },
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => servicesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-services'] }); toast.success('Service deleted'); },
  });
}

// ── Bookings ──────────────────────────────────────────────────────────────
export function useMyBookings(params?: any) {
  return useQuery({
    queryKey: ['bookings', params],
    queryFn: async () => {
      const response = await bookingsApi.getMyBookings(params);
      return response.data.data;
    },
    keepPreviousData: true,
  } as any);
}



export function useBooking(id: string) {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ['booking', id],
    queryFn: async () => {
      const response = await bookingsApi.getById(id);
      return response.data.data;
    },
    enabled: !!id && !!accessToken,
  });
}

export function useUpcomingBookings() {
  return useQuery({ queryKey: ['bookings', 'upcoming'], queryFn: () => bookingsApi.getUpcoming().then(r => r.data) });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => bookingsApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bookings'] }); toast.success('Booking created! Awaiting vendor acceptance.'); },
  });
}

export function useUpdateBookingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => bookingsApi.updateStatus(id, data),
    onSuccess: (_, { id }) => { qc.invalidateQueries({ queryKey: ['booking', id] }); qc.invalidateQueries({ queryKey: ['bookings'] }); toast.success('Booking status updated'); },
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: any) => bookingsApi.cancel(id, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bookings'] }); toast.success('Booking cancelled'); },
  });
}

// ── Reviews ───────────────────────────────────────────────────────────────
export function useServiceReviews(
  serviceId: string,
  params?: any,
) {
  return useQuery({
    queryKey: [
      'reviews',
      'service',
      serviceId,
      params,
    ],
    queryFn: async () => {
      const response =
        await reviewsApi.getServiceReviews(
          serviceId,
          params,
        );

      return response.data.data;
    },
    enabled: !!serviceId,
  });
}

export function useVendorReviews(
  vendorId: string,
) {
  return useQuery({
    queryKey: [
      'reviews',
      'vendor',
      vendorId,
    ],
    queryFn: async () => {
      const response =
        await reviewsApi.getVendorReviews(
          vendorId,
        );

      return response.data.data;
    },
    enabled: !!vendorId,
  });
}

export function useCreateReview() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: any) =>
      reviewsApi.create(data),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ['reviews'],
      });

      qc.invalidateQueries({
        queryKey: ['bookings'],
      });

      qc.invalidateQueries({
        queryKey: ['services'],
      });

      toast.success('Review submitted!');
    },
  });
}

// ── Analytics ─────────────────────────────────────────────────────────────
export function useAdminOverview() {
  return useQuery({ queryKey: ['analytics', 'admin', 'overview'], queryFn: async () => {
  const response = await analyticsApi.adminOverview();
  return response.data.data;
}, staleTime: 2 * 60 * 1000 });
}
export function useRevenueChart(months = 12) {
  return useQuery({ queryKey: ['analytics', 'revenue', months], queryFn: async () => {
  const response = await analyticsApi.revenueChart(months);
  return response.data.data;
} });
}
export function useUserGrowth(months = 12) {
  return useQuery({ queryKey: ['analytics', 'users', months], queryFn: async () => {
  const response = await analyticsApi.userGrowth(months);
  return response.data.data;
} });
}
export function useTopCategories() {
  return useQuery({
    queryKey: ['analytics', 'categories'],
    queryFn: async () => {
      const response = await analyticsApi.topCategories();
      return response.data.data;
    },
  });
}
export function useTopVendors() {
  return useQuery({
    queryKey: ['analytics', 'vendors'],
    queryFn: async () => {
      const response = await analyticsApi.topVendors();
      return response.data.data;
    },
  });
}
export function useVendorOverview() {
  return useQuery({ queryKey: ['analytics', 'vendor', 'overview'], queryFn: async () => {
  const response = await analyticsApi.vendorOverview();
  return response.data.data;
}, staleTime: 2 * 60 * 1000 });
}
export function useVendorRevenueChart(months = 6) {
  return useQuery({ queryKey: ['analytics', 'vendor', 'revenue', months], queryFn: () => analyticsApi.vendorRevenueChart(months).then(r => r.data) });
}
export function useVendorServicePerformance() {
  return useQuery({ queryKey: ['analytics', 'vendor', 'services'], queryFn: () => analyticsApi.vendorServicePerformance().then(r => r.data) });
}
export function useCustomerOverview() {
  return useQuery({ queryKey: ['analytics', 'customer', 'overview'], queryFn: async () => {
  const response = await analyticsApi.customerOverview();
  return response.data.data;
}, staleTime: 2 * 60 * 1000 });
}
export function usePublicStats() {
  return useQuery({
    queryKey: ['public-stats'],
    queryFn: async () => {
      const response = await analyticsApi.publicStats();
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
// ── Vendor Applications ───────────────────────────────────────────────────
export function useMyApplication() {
  return useQuery({
    queryKey: ['my-application'],
    queryFn: async () => {
      const response = await vendorApplicationsApi.getMyApplication();
      return response.data.data;
    },
  });
}
export function useVendorApplications(params?: any) {
  return useQuery({
    queryKey: ['vendor-applications', params],
    queryFn: async () => {
      const response = await vendorApplicationsApi.getAll(params);
      return response.data.data;
    },
  });
}
export function useApproveVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: any) => vendorApplicationsApi.approve(id, notes),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendor-applications'] }); toast.success('Vendor approved!'); },
  });
}
export function useRejectVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: any) => vendorApplicationsApi.reject(id, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendor-applications'] }); toast.success('Application rejected'); },
  });
}

// ── Notifications ─────────────────────────────────────────────────────────
export function useNotifications(params?: any) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: async () => {
      const response = await notificationsApi.getAll(params);
      return response.data.data;
    },
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      notificationsApi.markAsRead(id),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ['notifications'],
      });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () =>
      notificationsApi.markAllRead(),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ['notifications'],
      });

      toast.success('All marked as read');
    },
  });
}

// ── AI ────────────────────────────────────────────────────────────────────
export function useAIRecommendations(params?: any) {
  return useQuery({ queryKey: ['ai', 'recommendations', params], queryFn: () => aiApi.getServiceRecommendations().then(r => r.data), staleTime: 5 * 60 * 1000 });
}
export function useBudgetPlanner() {
  return useMutation({ mutationFn: (data: any) => aiApi.budgetPlanner(data).then(r => r.data) });
}

// ── Users (admin) ─────────────────────────────────────────────────────────
export function useAllUsers(params?: any) {
  return useQuery({ queryKey: ['users', params], queryFn: () => usersApi.getAllUsers(params).then(r => r.data?.data ?? r.data) });
}
export function useSavedServices() {
  return useQuery({
    queryKey: ['saved-services'],
    queryFn: async () => {
      const response = await usersApi.getSavedServices();
      return response.data.data;
    },
  });
}
export function useToggleSaved() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (serviceId: string) =>
      usersApi.toggleSavedService(serviceId),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['saved-services'] });
      qc.invalidateQueries({ queryKey: ['services'] });
      qc.invalidateQueries({ queryKey: ['service'] });

      toast.success('Saved services updated');
    },
  });
}



export function useAIHealth() {
  return useQuery({ queryKey: ['ai', 'health'], queryFn: () => aiApi.getAIHealth().then(r => r.data) });
}
export function useDemandForecast() {
  return useQuery({ queryKey: ['ai', 'demand-forecast'], queryFn: () => aiApi.getDemandForecast().then(r => r.data) });
}
export function useSmartAnalytics() {
  return useQuery({ queryKey: ['ai', 'smart-analytics'], queryFn: () => aiApi.getSmartAnalytics().then(r => r.data) });
}
export function useExecutiveBrief() {
  return useQuery({ queryKey: ['ai', 'executive-brief'], queryFn: () => aiApi.getExecutiveBrief().then(r => r.data) });
}
export function useVendorAIBrief(vendorId?: string) {
  return useQuery({ queryKey: ['ai', 'vendor-brief', vendorId], queryFn: () => aiApi.getVendorBrief(vendorId!).then(r => r.data), enabled: Boolean(vendorId) });
}
export function useAISupport() {
  return useMutation({ mutationFn: (message: string) => aiApi.supportAI(message).then(r => r.data) });
}
export function useAIModeration() {
  return useMutation({ mutationFn: (text: string) => aiApi.moderateContent(text).then(r => r.data) });
}
