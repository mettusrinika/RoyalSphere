'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Crown, Eye, EyeOff } from 'lucide-react';
import { useRegister } from '@/lib/hooks/useAuth';
type RegisterFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
};

const schema = z
  .object({
    firstName: z.string().min(2, 'Minimum 2 characters required'),

    lastName: z.string().min(2, 'Minimum 2 characters required'),

    email: z.string().email('Enter a valid email address'),

    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain uppercase, lowercase and a number'
      ),

    confirmPassword: z.string(),

    

    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, 'Enter a valid mobile number')
      .optional()
      .or(z.literal('')),

    terms: z.literal(true, {
      errorMap: () => ({
        message: 'You must accept the Terms & Privacy Policy',
      }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export default function RegisterPage() {
  const { mutate: registerUser, isPending } = useRegister();

  const [showPassword, setShowPassword] = useState(false);

  const {
  register,
  handleSubmit,
  watch,
  formState: { errors },
} = useForm<RegisterFormData>({
  resolver: zodResolver(schema),
  defaultValues: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    terms: false,
  },
});

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
            Join OMIQORA
          </h1>

          <p className="text-blue-300 text-sm mt-1">
            Create your account and get started
          </p>

        </div>

        <div className="card">

          <form
  onSubmit={handleSubmit((data) => {
  const registerData = {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    password: data.password,
  };

  registerUser(registerData);
})}
  className="space-y-4"
>

            <div className="grid grid-cols-2 gap-3">

              <div>
                <label className="label">
                  First Name
                </label>

                <input
                  {...register('firstName')}
                  autoComplete="given-name"
                  placeholder="John"
                  className="input"
                />

                {errors.firstName && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.firstName.message as string}
                  </p>
                )}
              </div>

              <div>
                <label className="label">
                  Last Name
                </label>

                <input
                  {...register('lastName')}
                  autoComplete="family-name"
                  placeholder="Doe"
                  className="input"
                />

                {errors.lastName && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.lastName.message as string}
                  </p>
                )}
              </div>

            </div>

            <div>

              <label className="label">
                Email
              </label>

              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="input"
              />

              {errors.email && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.email.message as string}
                </p>
              )}

            </div>

            <div>

              <label className="label">
                Phone (optional)
              </label>

              <input
                {...register('phone')}
                placeholder="9876543210"
                className="input"
              />

              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.phone.message as string}
                </p>
              )}

            </div>

            <div>

              <label className="label">
                Password
              </label>

              <div className="relative">

                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Minimum 8 characters"
                  className="input pr-11"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
                >
                  {showPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>

              </div>

              <p className="text-xs text-muted mt-1">
                Must contain uppercase, lowercase, number and at least 8 characters.
              </p>

              {errors.password && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.password.message as string}
                </p>
              )}

            </div>
                        <div>

              <label className="label">
                Confirm Password
              </label>

              <input
                {...register('confirmPassword')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Confirm password"
                className="input"
              />

              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.confirmPassword.message as string}
                </p>
              )}

            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
  <h3 className="font-semibold text-royal-blue mb-2">
    Want to become a Vendor?
  </h3>

  <p className="text-sm text-gray-900">
    Create your account first. After signing in, you can apply as a
    vendor by submitting your business details and required documents.
    Once approved by the OMIQORA admin team, you'll gain access
    to the Vendor Dashboard and can start listing your services.
  </p>
</div>
            <div className="flex items-start gap-2">

              <input
                type="checkbox"
                {...register('terms')}
                className="mt-1"
              />

              <p className="text-xs text-muted">

                I agree to the{' '}

                <Link
                  href="/terms"
                  className="text-royal-blue hover:underline"
                >
                  Terms of Service
                </Link>

                {' '}and{' '}

                <Link
                  href="/privacy"
                  className="text-royal-blue hover:underline"
                >
                  Privacy Policy
                </Link>

              </p>

            </div>

            {errors.terms && (
              <p className="text-red-500 text-xs">
                {errors.terms.message as string}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="btn-primary w-full py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending
                ? 'Creating your OMIQORA account...'
                : 'Create Account'}
            </button>

          </form>

          <p className="text-center text-sm text-muted mt-5">

            Already have an account?{' '}

            <Link
              href="/auth/login"
              className="text-royal-blue font-medium hover:underline"
            >
              Sign in
            </Link>

          </p>

        </div>

      </div>

    </div>
  );
}