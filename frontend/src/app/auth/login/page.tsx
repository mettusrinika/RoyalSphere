'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Crown, Eye, EyeOff } from 'lucide-react';
import { useLogin } from '@/lib/hooks/useAuth';

const schema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address'),

  password: z
    .string()
    .min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof schema>;

export default function LoginPage() {
  const { mutate: login, isPending } = useLogin();

  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: {
      errors,
      isDirty,
    },
  } = useForm<LoginForm>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: LoginForm) => {
    login(data);
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
            Welcome Back
          </h1>

          <p className="text-blue-300 text-sm mt-1">
            Sign in to your Royal Sphere account
          </p>
        </div>

        <div className="card">

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
          >

            {/* Email */}

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

            {/* Password */}

            <div>
              <label className="label">
                Password
              </label>

              <div className="relative">

                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="input pr-11"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-royal-blue transition-colors"
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
                        <div className="flex items-center justify-between">

              <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded"
                />
                Remember me
              </label>

              <Link
                href="/auth/forgot-password"
                className="text-sm text-royal-blue hover:underline"
              >
                Forgot password?
              </Link>

            </div>

            <button
              type="submit"
              disabled={isPending || !isDirty}
              className="btn-primary w-full py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending
                ? 'Signing you in...'
                : 'Sign In'}
            </button>

          </form>

          <div className="mt-6 border-t border-border pt-5">

            <p className="text-center text-sm text-muted">
              Don't have an account?{' '}
              <Link
                href="/auth/register"
                className="text-royal-blue font-medium hover:underline"
              >
                Create one
              </Link>
            </p>

          </div>

        </div>
      </div>
    </div>
  );
}