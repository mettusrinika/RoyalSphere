'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Crown } from 'lucide-react';
import { useForgotPassword } from '@/lib/hooks/useAuth';

const schema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address'),
});

type ForgotPasswordForm = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const {
    mutate: forgot,
    isPending,
    isSuccess,
  } = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: {
      errors,
      isDirty,
    },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: ForgotPasswordForm) => {
    forgot(data.email);
  };

  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}

        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-royal-gold rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Crown
              size={28}
              className="text-royal-blue"
            />
          </div>

          <h1 className="text-2xl font-bold text-white">
            Reset Password
          </h1>

          <p className="text-blue-300 text-sm mt-1">
            Enter your email and we'll send you a password reset link.
          </p>
        </div>

        <div className="card">

          {isSuccess ? (
            <div className="text-center py-6">

              <div className="text-5xl mb-4">
                📧
              </div>

              <h3 className="font-semibold text-royal-blue text-lg mb-2">
                Check your email
              </h3>

              <p className="text-sm text-muted mb-6">
                If an account exists with this email,
                we've sent a password reset link.
              </p>

              <Link
                href="/auth/login"
                className="btn-primary inline-block px-6 py-3 rounded-xl"
              >
                Back to Login
              </Link>

            </div>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-5"
            >

              <div>
                <label className="label">
                  Email Address
                </label>

                <input
                  {...register('email')}
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="input"
                />

                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>
                            <button
                type="submit"
                disabled={isPending || !isDirty}
                className="btn-primary w-full py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending
                  ? 'Sending reset link...'
                  : 'Send Reset Link'}
              </button>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-xs text-blue-700">
                  For your security, we'll only send a reset email if an
                  account exists with the email address you entered.
                </p>
              </div>

              <p className="text-center text-sm text-muted">
                Remember your password?{' '}
                <Link
                  href="/auth/login"
                  className="text-royal-blue font-medium hover:underline"
                >
                  Back to Login
                </Link>
              </p>

            </form>
          )}

        </div>
      </div>
    </div>
  );
}