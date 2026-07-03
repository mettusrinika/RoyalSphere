import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { authApi } from '../api';
import { useAuthStore } from '../stores/authStore';
import { useSocketStore } from '../stores/socketStore';

export function useLogin() {
  const { setAuth } = useAuthStore();
  const { connect } = useSocketStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      authApi.login(data),

    onSuccess: async (response) => {
      const auth = response.data.data;

      // Save authentication
      setAuth(
        auth.user,
        auth.accessToken,
        auth.refreshToken,
      );

      // Update React Query cache
      queryClient.setQueryData(
        ['me'],
        auth.user,
      );

      // Connect socket
      connect(auth.accessToken);

      toast.success(
        `Welcome back, ${auth.user.firstName}!`,
      );

      if (
  auth.user.role === 'vendor' &&
  !auth.user.isVendorApproved
) {
  toast.error(
    'Your vendor application is still under review.'
  );

  router.replace('/vendor/apply');
  return;
}

switch (auth.user.role) {
  case 'admin':
    router.replace('/dashboard/admin');
    break;

  case 'vendor':
    router.replace('/dashboard/vendor');
    break;

  default:
    router.replace('/dashboard/customer');
}
    },

    onError: (error: any) => {
      toast.error(
        Array.isArray(error?.response?.data?.message)
          ? error.response.data.message[0]
          : error?.response?.data?.message ||
              'Login failed. Please check your credentials.',
      );
    },
  });
}

export function useRegister() {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: any) =>
      authApi.register(data),

    onSuccess: () => {
      toast.success(
        'Account created successfully! Please check your email to verify your account.'
      );

      router.push('/auth/login');
    },

    onError: (error: any) => {
      toast.error(
        Array.isArray(error?.response?.data?.message)
          ? error.response.data.message[0]
          : error?.response?.data?.message ||
              'Registration failed.'
      );
    },
  });
}

export function useLogout() {
  const { logout } = useAuthStore();
  const { disconnect } = useSocketStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      logout();
      disconnect();
      queryClient.clear();
      router.push('/auth/login');
      toast.success('Logged out successfully');
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
    onSuccess: () => toast.success('Reset link sent if email exists'),
  });
}

export function useResetPassword() {
  const router = useRouter();
  return useMutation({
    mutationFn: (data: any) => authApi.resetPassword(data),
    onSuccess: () => {
      toast.success('Password reset! Please login.');
      router.push('/auth/login');
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: any) => authApi.changePassword(data),
    onSuccess: () => toast.success('Password changed successfully'),
  });
}

export function useMe() {
  const {
    accessToken,
    isAuthenticated,
    updateUser,
  } = useAuthStore();

  return useQuery({
    queryKey: ['me'],

    queryFn: async () => {
      const response = await authApi.getMe();

      const user = response.data.data.user;

      updateUser(user);

      return user;
    },

    enabled: !!accessToken && isAuthenticated,

    retry: false,

    staleTime: 5 * 60 * 1000,

    throwOnError: false,
  });
}