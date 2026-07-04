import api from './client';

// ── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: any) => api.post('/auth/reset-password', data),
  changePassword: (data: any) => api.post('/auth/change-password', data),
  verifyEmail: (token: string) => api.get(`/auth/verify-email/${token}`),
  resendVerification: (email: string) =>
  api.post('/auth/resend-verification', { email }),
};

// ── Users ─────────────────────────────────────────────────────────────────
export const usersApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: any) => api.put('/users/profile', data),
  uploadAvatar: (formData: FormData) => api.post('/users/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  toggleSavedService: (serviceId: string) => api.post(`/users/saved-services/${serviceId}`),
  getSavedServices: () => api.get('/users/saved-services'),
  deleteImage: (serviceId: string, index: number) =>
  api.delete(`/services/${serviceId}/images/${index}`),
  // Admin
  getAllUsers: (params: any) => api.get('/users', { params }),
  getUserById: (id: string) => api.get(`/users/${id}`),
  updateUserStatus: (id: string, status: string) => api.patch(`/users/${id}/status`, { status }),
  deleteAccount: (password: string) =>
  api.delete('/users/account', {
    data: { password },
  }),
};

// ── Categories ────────────────────────────────────────────────────────────
export const categoriesApi = {
  getAll: () => api.get('/categories'),
  getBySlug: (slug: string) => api.get(`/categories/${slug}`),
  create: (data: any) => api.post('/categories', data),
  update: (id: string, data: any) => api.put(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
  seed: () => api.post('/categories/seed'),
};

// ── Services ──────────────────────────────────────────────────────────────
export const servicesApi = {
  search: (params: any) => api.get('/services', { params }),
  getFeatured: (limit = 8) => api.get(`/services/featured?limit=${limit}`),
  getByCategory: (categoryId: string, params?: any) =>
    api.get(`/services/category/${categoryId}`, { params }),
  getVendorServices: (vendorId: string) =>
    api.get(`/services/vendor/${vendorId}`),
  getMyServices: () => api.get('/services/my-services'),
  getById: (id: string) => api.get(`/services/${id}`),

  create: (data: any) => api.post('/services', data),

  update: (id: string, data: any) =>
    api.put(`/services/${id}`, data),

  delete: (id: string) =>
    api.delete(`/services/${id}`),

  uploadImages: (id: string, formData: FormData) =>
    api.post(`/services/${id}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  // ✅ ADD HERE
  deleteImage: (serviceId: string, index: number) =>
    api.delete(`/services/${serviceId}/images/${index}`),
};

// ── Bookings ──────────────────────────────────────────────────────────────
export const bookingsApi = {
  create: (data: any) => api.post('/bookings', data),
  getMyBookings: (params?: any) => api.get('/bookings/my', { params }),
  getUpcoming: () => api.get('/bookings/upcoming'),
  getById: (id: string) => api.get(`/bookings/${id}`),
  updateStatus: (id: string, data: any) => api.patch(`/bookings/${id}/status`, data),
  cancel: (id: string, reason: string) => api.patch(`/bookings/${id}/cancel`, { reason }),
  // Admin
  getAllBookings: (params?: any) => api.get('/bookings/admin/all', { params }),
};

// ── Payments ──────────────────────────────────────────────────────────────
export const paymentsApi = {
  createOrder: (bookingId: string) =>
    api.post(`/payments/create-order/${bookingId}`),

  verifyPayment: (data: any) =>
    api.post('/payments/verify', data),

  getHistory: (params?: Record<string, any>) =>
    api.get('/payments/history', {
      params,
    }),

  // Admin
  getAdminPayments: (params?: any) =>
    api.get('/payments/admin/all', {
      params,
    }),
};
// ── Reviews ───────────────────────────────────────────────────────────────
export const reviewsApi = {
  create: (data: any) => api.post('/reviews', data),
  getServiceReviews: (serviceId: string, params?: any) => api.get(`/reviews/service/${serviceId}`, { params }),
  getVendorReviews: (vendorId: string, params?: any) => api.get(`/reviews/vendor/${vendorId}`, { params }),
  replyToReview: (id: string, reply: string) => api.patch(`/reviews/${id}/reply`, { reply }),
};

// ── Vendor Applications ───────────────────────────────────────────────────
export const vendorApplicationsApi = {
  apply: (data: any) => api.post('/vendor-applications/apply', data),
  uploadDocument: (formData: FormData) =>
    api.post('/vendor-applications/upload-document', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMyApplication: () => api.get('/vendor-applications/my-application'),
  // Admin
  getAll: (params?: any) => api.get('/vendor-applications', { params }),
  getById: (id: string) => api.get(`/vendor-applications/${id}`),
  approve: (id: string, notes?: string) => api.patch(`/vendor-applications/${id}/approve`, { notes }),
  reject: (id: string, reason: string) => api.patch(`/vendor-applications/${id}/reject`, { reason }),
  getPendingCount: () => api.get('/vendor-applications/pending-count'),
};

// ── Notifications ─────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll: (params?: any) => api.get('/notifications', { params }),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

// ── Messages ──────────────────────────────────────────────────────────────
export const messagesApi = {
  getConversations: () => api.get('/messages/conversations'),

  getConversation: (conversationId: string, page = 1, limit = 50) =>
    api.get(`/messages/conversation/${conversationId}`, {
      params: { page, limit },
    }),

  createConversation: (bookingId: string) =>
    api.post(`/messages/conversation/${bookingId}`),

  sendMessage: (
    conversationId: string,
    content: string,
    type = 'text',
    fileUrl?: string,
    replyTo?: string,
  ) =>
    api.post(`/messages/send/${conversationId}`, {
      content,
      type,
      ...(fileUrl ? { fileUrl } : {}),
      ...(replyTo ? { replyTo } : {}),
    }),

  markRead: (conversationId: string) =>
    api.patch(`/messages/read/${conversationId}`),

  getUnreadCount: () => api.get('/messages/unread-count'),

  archive: (conversationId: string) =>
    api.patch(`/messages/archive/${conversationId}`),

  unarchive: (conversationId: string) =>
    api.patch(`/messages/unarchive/${conversationId}`),

  mute: (conversationId: string) =>
    api.patch(`/messages/mute/${conversationId}`),

  unmute: (conversationId: string) =>
    api.patch(`/messages/unmute/${conversationId}`),

  block: (conversationId: string) =>
    api.patch(`/messages/block/${conversationId}`),

  unblock: (conversationId: string) =>
    api.patch(`/messages/unblock/${conversationId}`),

  close: (conversationId: string) =>
    api.patch(`/messages/close/${conversationId}`),

  deleteMessage: (messageId: string) =>
    api.patch(`/messages/delete/${messageId}`),

  editMessage: (messageId: string, content: string) =>
    api.patch(`/messages/edit/${messageId}`, { content }),

  search: (conversationId: string, query: string) =>
    api.get(`/messages/search/${conversationId}`, {
      params: { q: query },
    }),
};

// ── Analytics ─────────────────────────────────────────────────────────────
export const analyticsApi = {
  adminOverview: () => api.get('/analytics/admin/overview'),
  revenueChart: (months = 12) => api.get(`/analytics/admin/revenue-chart?months=${months}`),
  userGrowth: (months = 12) => api.get(`/analytics/admin/user-growth?months=${months}`),
  topCategories: () => api.get('/analytics/admin/top-categories'),
  topVendors: (limit = 10) => api.get(`/analytics/admin/top-vendors?limit=${limit}`),
  bookingDistribution: () => api.get('/analytics/admin/booking-distribution'),
  vendorOverview: () => api.get('/analytics/vendor/overview'),
  vendorRevenueChart: (months = 6) => api.get(`/analytics/vendor/revenue-chart?months=${months}`),
  vendorServicePerformance: () => api.get('/analytics/vendor/service-performance'),
  customerOverview: () => api.get('/analytics/customer/overview'),

// Public
publicStats: () => api.get('/analytics/public/stats'),
};
// ── AI ────────────────────────────────────────────────────────────────────
export const aiApi = {
  getVendorRecommendations: (params: any) => api.get('/ai/recommendations/vendors', { params }),
  getServiceRecommendations: (limit = 8) => api.get(`/ai/recommendations/services?limit=${limit}`),
  budgetPlanner: (data: any) => api.post('/ai/budget-planner', data),
  getAIHealth: () => api.get('/ai/health'),
  getVendorPerformance: (vendorId: string) => api.get(`/ai/vendor-performance/${vendorId}`),
  getSentiment: (vendorId: string) => api.get(`/ai/sentiment/${vendorId}`),
  getRevenueForecast: (vendorId: string) => api.get(`/ai/revenue-forecast/${vendorId}`),
  getDemandForecast: () => api.get('/ai/demand-forecast'),
  getFraudDetection: () => api.get('/ai/fraud-detection'),
  moderateContent: (text: string) => api.post('/ai/moderate', { text }),
  getSmartAnalytics: () => api.get('/ai/smart-analytics'),
  getExecutiveBrief: () => api.get('/ai/executive-brief'),
  getVendorBrief: (vendorId: string) => api.get(`/ai/vendor-brief/${vendorId}`),
  supportAI: (message: string) => api.post('/ai/support-ai', { message }),

};
