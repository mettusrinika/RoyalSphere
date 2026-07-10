import axios from "axios";
import * as SecureStore from "expo-secure-store";

export const API_URL = "https://royalsphere-api.onrender.com/api/v1";
export const ACCESS_KEY = "omiqora_access";
export const REFRESH_KEY = "omiqora_refresh";

export const unwrap = (r: any) => r?.data?.data ?? r?.data ?? r;

export const listOf = (value: any) => {
  const data = unwrap(value);
  if (Array.isArray(data)) return data;
  for (const key of ["items","services","bookings","notifications","conversations","reviews","categories","messages","payments","data"]) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
};

export const api = axios.create({ baseURL: API_URL, timeout: 45000 });

api.interceptors.request.use(async config => {
  const token = await SecureStore.getItemAsync(ACCESS_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
      if (!refreshToken) return null;
      try {
        const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const data: any = unwrap(response);
        if (!data?.accessToken) return null;
        await SecureStore.setItemAsync(ACCESS_KEY, data.accessToken);
        if (data.refreshToken) await SecureStore.setItemAsync(REFRESH_KEY, data.refreshToken);
        api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;
        return data.accessToken as string;
      } catch {
        await SecureStore.deleteItemAsync(ACCESS_KEY);
        await SecureStore.deleteItemAsync(REFRESH_KEY);
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

api.interceptors.response.use(
  response => response,
  async error => {
    const original: any = error.config;
    if (error.response?.status === 401 && original && !original._retry && !String(original.url ?? "").includes("/auth/refresh")) {
      original._retry = true;
      const token = await refreshAccessToken();
      if (token) {
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
    }
    throw error;
  },
);

export const endpoints = {
  login: (d:any) => api.post("/auth/login", d),
  register: (d:any) => api.post("/auth/register", d),
  requestPhoneOtp: (phone:string) => api.post("/auth/phone-otp/request", {phone}),
  verifyPhoneOtp: (phone:string,otp:string) => api.post("/auth/phone-otp/verify", {phone,otp}),
  me: () => api.get("/auth/me"),
  profile: () => api.get("/users/profile"),
  updateProfile: (d:any) => api.put("/users/profile", d),

  categories: () => api.get("/categories"),
  category: (slug:string) => api.get(`/categories/${slug}`),
  featured: (limit=10) => api.get("/services/featured", { params:{limit} }),
  services: (params:any={}) => api.get("/services", {params}),
  servicesByCategory: (categoryId:string,page=1,limit=20) => api.get(`/services/category/${categoryId}`, {params:{page,limit}}),
  service: (id:string) => api.get(`/services/${id}`),
  saved: () => api.get("/users/saved-services"),
  toggleSaved: (id:string) => api.post(`/users/saved-services/${id}`),

  bookings: () => api.get("/bookings/my"),
  booking: (id:string) => api.get(`/bookings/${id}`),
  createBooking: (d:any) => api.post("/bookings", d),
  cancelBooking: (id:string,reason:string) => api.patch(`/bookings/${id}/cancel`, {reason}),

  payments: () => api.get("/payments/history"),
  payment: (id:string) => api.get(`/payments/${id}`),
  createOrder: (id:string) => api.post(`/payments/create-order/${id}`),
  createPaymentOrder: (id:string) => api.post(`/payments/create-order/${id}`),
  verifyPayment: (d:any) => api.post("/payments/verify", d),

  notifications: () => api.get("/notifications"),
  readAll: () => api.patch("/notifications/read-all"),
  registerPushToken: (expoPushToken:string) =>
    api.post("/notifications/push-token", {expoPushToken}),
  testPush: () => api.post("/notifications/push-test"),
  unregisterPushToken: () =>
    api.delete("/notifications/push-token"),

  conversations: () => api.get("/messages/conversations"),
  conversation: (id:string) => api.get(`/messages/conversation/${id}`, {params:{page:1,limit:50}}),
  createConversation: (bookingId:string) => api.post(`/messages/conversation/${bookingId}`),
  sendMessage: (id:string,content:string) => api.post(`/messages/send/${id}`, {content,type:"text"}),
  uploadVendorDocument: (form:FormData) => api.post("/vendor-applications/upload-document", form),
  uploadServiceImages: (id:string,form:FormData) => api.post(`/services/${id}/images`, form),
  deleteServiceImage: (id:string,index:number) => api.delete(`/services/${id}/images/${index}`),

  reviews: (id:string) => api.get(`/reviews/service/${id}`),
  createReview: (d:any) => api.post("/reviews", d),

  customerOverview: () => api.get("/analytics/customer/overview"),
  adminOverview: () => api.get("/analytics/admin/overview"),
  adminVendorApplications: () => api.get("/vendor-applications"),
  adminVendorApplication: (id:string) => api.get(`/vendor-applications/${id}`),
  adminVerifyVendorDocument: (id:string,type:string,d:any) => api.patch(`/vendor-applications/${id}/documents/${type}/verify`, d),
  adminCategories: () => api.get("/categories", {params:{all:"true"}}),
  adminBookings: () => api.get("/bookings/admin/all"),
  vendorOverview: () => api.get("/analytics/vendor/overview"),
  myServices: () => api.get("/services/my-services"),
  vendorApplication: () => api.get("/vendor-applications/my-application"),
  applyVendor: (d:any) => api.post("/vendor-applications/apply", d),
  submitVendorKyc: (provider="manual_admin_review") => api.post("/platform/vendor/kyc/submit", {provider}),
  submitPayoutOnboarding: (d:any) => api.post("/platform/vendor/payout-onboarding", d),
  vendorReadiness: () => api.get("/platform/vendor/readiness"),
  checkServiceability: (serviceId:string,latitude:number,longitude:number) =>
    api.get("/platform/serviceability", {params:{serviceId,latitude,longitude}}),

  aiHome: () => api.get("/ai/home"),
  aiSearch: (q:string) => api.get("/ai/search", {params:{q}}),
  aiSupport: (message:string) => api.post("/ai/support-ai", {message}),
  budget: (d:any) => api.post("/ai/budget-planner", d),
  aiRecommendations: () => api.get("/ai/recommendations/services?limit=8"),
  adminPayments: () => api.get("/payments"),
  adminApproveVendor: (id: string) =>
    api.patch(`/vendor-applications/${id}/approve`),
  adminRejectVendor: (id: string, data: { reason: string }) =>
    api.patch(`/vendor-applications/${id}/reject`, data),

  myReviews: () => api.get("/reviews/my"),
  updateReview: (id:string,d:any) => api.patch(`/reviews/${id}`, d),
  deleteReview: (id:string) => api.delete(`/reviews/${id}`),
  vendorReviews: (vendorId:string,page=1,limit=20) => api.get(`/reviews/vendor/${vendorId}`, {params:{page,limit}}),
  replyReview: (id:string,reply:string) => api.patch(`/reviews/${id}/reply`, {reply}),
  moderateReview: (id:string,d:any) => api.patch(`/reviews/${id}/moderate`, d),

  adminUsers: (params:any={}) => api.get("/users", {params}),
  adminUser: (id:string) => api.get(`/users/${id}`),
  adminUserStatus: (id:string,status:string) => api.patch(`/users/${id}/status`, {status}),
  adminServices: (page=1,limit=50) => api.get("/services/admin/all", {params:{page,limit}}),
  adminPendingServices: (page=1,limit=50) => api.get("/services/admin/pending", {params:{page,limit}}),
  adminApproveService: (id:string) => api.patch(`/services/${id}/approve`),
  adminRejectService: (id:string,reason:string) => api.patch(`/services/${id}/reject`, {reason}),
  adminPaymentList: () => api.get("/payments/admin/all"),
  adminRefund: (id:string,amount:number,reason:string) => api.post(`/payments/refund/${id}`, {amount,reason}),
  createCategory: (d:any) => api.post("/categories", d),
  updateCategory: (id:string,d:any) => api.put(`/categories/${id}`, d),
  deleteCategory: (id:string) => api.delete(`/categories/${id}`),
  seedCategories: () => api.post("/categories/seed"),
  adminRevenueChart: () => api.get("/analytics/admin/revenue-chart"),
  adminUserGrowth: () => api.get("/analytics/admin/user-growth"),
  adminTopCategories: () => api.get("/analytics/admin/top-categories"),
  adminTopVendors: () => api.get("/analytics/admin/top-vendors"),
  adminBookingDistribution: () => api.get("/analytics/admin/booking-distribution"),

  createService: (d:any) => api.post("/services", d),
  updateService: (id:string,d:any) => api.put(`/services/${id}`, d),
  deleteService: (id:string) => api.delete(`/services/${id}`),
  vendorBookings: () => api.get("/bookings/my"),
  updateBookingStatus: (id:string,status:string) => api.patch(`/bookings/${id}/status`, {status}),
  vendorRevenueChart: () => api.get("/analytics/vendor/revenue-chart"),
  vendorServicePerformance: () => api.get("/analytics/vendor/service-performance"),
  vendorReviewAnalytics: (vendorId:string) => api.get(`/reviews/analytics/vendor/${vendorId}`),

  unreadMessages: () => api.get("/messages/unread-count"),
  markConversationRead: (id:string) => api.patch(`/messages/read/${id}`),
  archiveConversation: (id:string) => api.patch(`/messages/archive/${id}`),
  unarchiveConversation: (id:string) => api.patch(`/messages/unarchive/${id}`),
  searchMessages: (id:string,q:string) => api.get(`/messages/search/${id}`, {params:{q}}),
};

export const errMsg = (e:any) => {
  const status = Number(e?.response?.status ?? 0);
  const raw = e?.response?.data?.message ?? e?.response?.data?.error;
  const message = Array.isArray(raw) ? raw.join("\n") : typeof raw === "string" ? raw : "";
  if (!e?.response) return "We couldn't reach OMIQORA right now. Check your connection and try again.";
  if (message) return message;
  if (status === 401) return "Please sign in and try again.";
  if (status === 403) return "Your account does not have access to this action.";
  if (status === 404) return "We couldn't find this item. Refresh and try again.";
  if (status === 409) return "This action conflicts with the current account or application status.";
  if (status >= 500) return "OMIQORA is temporarily unavailable. Please try again shortly.";
  return "We couldn't complete that action. Check the details and try again.";
};
