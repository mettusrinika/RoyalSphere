'use client';

import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Crown, Eye, EyeOff } from 'lucide-react';
import { useResetPassword } from '@/lib/hooks/useAuth';

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain uppercase, lowercase and a number'
      ),

    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    path: ['confirm'],
    message: 'Passwords do not match',
  });

type ResetPasswordForm = z.infer<typeof schema>;

  function ResetPasswordContent() {
  const params = useSearchParams();
  const token = params.get('token') || '';

  const { mutate: reset, isPending } = useResetPassword();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: {
      errors,
      isDirty,
    },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: ResetPasswordForm) => {
    reset({
      token,
      password: data.password,
    });
  };

  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-royal-gold rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Crown
              size={28}
              className="text-royal-blue"
            />
          </div>

          <h1 className="text-2xl font-bold text-white">
            Create New Password
          </h1>

          <p className="text-blue-300 text-sm mt-2">
            Your new password must be different from your previous password.
          </p>
        </div>

        <div className="card">

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
          >

            <div>
              <label className="label">
                New Password
              </label>

              <div className="relative">

                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                  className="input pr-11"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-royal-blue"
                >
                  {showPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>

              </div>

              {errors.password && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label className="label">
                Confirm Password
              </label>

              <div className="relative">

                <input
                  {...register('confirm')}
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  className="input pr-11"
                />

                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-royal-blue"
                >
                  {showConfirm ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>

              </div>

              {errors.confirm && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.confirm.message}
                </p>
              )}
            </div>
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-xs text-blue-700">
                Password must contain at least:
              </p>

              <ul className="text-xs text-blue-700 mt-2 space-y-1 list-disc ml-4">
                <li>8 or more characters</li>
                <li>One uppercase letter</li>
                <li>One lowercase letter</li>
                <li>One number</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={isPending || !isDirty || !token}
              className="btn-primary w-full py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending
                ? 'Resetting password...'
                : 'Reset Password'}
            </button>

            {!token && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-600 text-center">
                  Invalid or expired reset link.
                </p>
              </div>
            )}

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

        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-hero-gradient flex items-center justify-center">
          <p className="text-white">
            Loading...
          </p>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}