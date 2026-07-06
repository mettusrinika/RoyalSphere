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
  createOrder: (id:string) => api.post(`/payments/create-order/${id}`),
  createPaymentOrder: (id:string) => api.post(`/payments/create-order/${id}`),
  verifyPayment: (d:any) => api.post("/payments/verify", d),

  notifications: () => api.get("/notifications"),
  readAll: () => api.patch("/notifications/read-all"),

  conversations: () => api.get("/messages/conversations"),
  conversation: (id:string) => api.get(`/messages/conversation/${id}`, {params:{page:1,limit:50}}),
  createConversation: (bookingId:string) => api.post(`/messages/conversation/${bookingId}`),
  sendMessage: (id:string,content:string) => api.post(`/messages/send/${id}`, {content,type:"text"}),

  reviews: (id:string) => api.get(`/reviews/service/${id}`),
  createReview: (d:any) => api.post("/reviews", d),

  customerOverview: () => api.get("/analytics/customer/overview"),
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
};

export const errMsg = (e:any) => {
  const m = e?.response?.data?.message;
  if (Array.isArray(m)) return m[0];
  if (typeof m === "string") return m;
  if (!e?.response) return "Unable to connect to OMIQORA. Check your connection and try again.";
  return e?.message ?? "Something went wrong";
};



