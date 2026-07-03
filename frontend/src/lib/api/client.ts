import axios, {
  AxiosError,
  AxiosInstance,
} from 'axios';

import toast from 'react-hot-toast';

import {
  useAuthStore,
} from '../stores/authStore';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000/api/v1';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// =========================================================
// ATTACH ACCESS TOKEN
// =========================================================

api.interceptors.request.use(
  (config) => {
    const token =
      useAuthStore.getState().accessToken;

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// =========================================================
// REFRESH ACCESS TOKEN
// =========================================================

let isRefreshing = false;

let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (
  error: any,
  token: string | null,
) => {
  refreshQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });

  refreshQueue = [];
};

api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError<any>) => {
    const originalRequest: any =
      error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise<string>(
          (resolve, reject) => {
            refreshQueue.push({
              resolve,
              reject,
            });
          },
        )
          .then((token) => {
            originalRequest.headers =
              originalRequest.headers || {};

            originalRequest.headers.Authorization =
              `Bearer ${token}`;

            return api(originalRequest);
          })
          .catch((queueError) =>
            Promise.reject(queueError),
          );
      }

      originalRequest._retry = true;

      isRefreshing = true;

      try {
        const authState =
          useAuthStore.getState();

        const refreshToken =
          authState.refreshToken;

        if (!refreshToken) {
          throw new Error(
            'No refresh token available',
          );
        }

        const response = await axios.post(
          `${API_URL}/auth/refresh`,
          {
            refreshToken,
          },
        );

        const refreshedAuth =
          response.data.data;

        const newAccessToken =
          refreshedAuth.accessToken;

        const newRefreshToken =
          refreshedAuth.refreshToken;

        if (
          !newAccessToken ||
          !newRefreshToken
        ) {
          throw new Error(
            'Invalid refresh response',
          );
        }

        const currentUser =
          useAuthStore.getState().user;

        if (!currentUser) {
          throw new Error(
            'Authenticated user missing',
          );
        }

        useAuthStore.getState().setAuth(
          currentUser,
          newAccessToken,
          newRefreshToken,
        );

        processQueue(
          null,
          newAccessToken,
        );

        originalRequest.headers =
          originalRequest.headers || {};

        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(
          refreshError,
          null,
        );

        useAuthStore
          .getState()
          .logout();

        if (
          typeof window !== 'undefined'
        ) {
          window.location.href =
            '/auth/login';
        }

        return Promise.reject(
          refreshError,
        );
      } finally {
        isRefreshing = false;
      }
    }

    if (
      error.response?.status !== 401
    ) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Something went wrong';

      toast.error(
        Array.isArray(message)
          ? message[0]
          : message,
      );
    }

    return Promise.reject(error);
  },
);

export default api;