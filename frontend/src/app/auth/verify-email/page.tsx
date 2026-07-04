'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Crown,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { authApi } from '@/lib/api';

function VerifyEmailContent() {
  const params = useSearchParams();
  const token = params.get('token');

  const [status, setStatus] = useState<
    'loading' | 'success' | 'error'
  >('loading');

  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link.');
      return;
    }

    authApi
      .verifyEmail(token)
      .then(() => {
        setStatus('success');
        setMessage(
          'Your email has been verified successfully.'
        );
      })
      .catch((e) => {
        setStatus('error');
        setMessage(
          e.response?.data?.message ||
            'Verification failed or the link has expired.'
        );
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4">
      <div className="card w-full max-w-md text-center">

        <div className="w-14 h-14 bg-royal-gold rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Crown
            size={28}
            className="text-royal-blue"
          />
        </div>

        {status === 'loading' && (
          <>
            <div className="w-10 h-10 border-4 border-royal-blue/20 border-t-royal-blue rounded-full animate-spin mx-auto mb-4" />

            <h2 className="text-xl font-bold text-royal-blue mb-2">
              Verifying Email
            </h2>

            <p className="text-sm text-muted">
              Please wait while we verify your
              email address...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle
              size={54}
              className="mx-auto mb-4 text-green-500"
            />

            <h2 className="text-2xl font-bold text-royal-blue mb-2">
              Email Verified
            </h2>

            <p className="text-muted text-sm mb-6">
              {message}
            </p>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <p className="text-xs text-green-700">
                Your account is now fully verified.
                You can safely sign in and start
                using OMIQORA.
              </p>
            </div>
                        <Link
              href="/auth/login"
              className="btn-primary inline-block px-8 py-3 rounded-xl"
            >
              Login to Continue
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle
              size={54}
              className="mx-auto mb-4 text-red-500"
            />

            <h2 className="text-2xl font-bold text-royal-blue mb-2">
              Verification Failed
            </h2>

            <p className="text-muted text-sm mb-6">
              {message}
            </p>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-xs text-red-700">
                Your verification link may have expired or
                has already been used. You can log in and
                request a new verification email if needed.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                href="/auth/login"
                className="btn-primary py-3 rounded-xl"
              >
                Back to Login
              </Link>

              <Link
                href="/auth/register"
                className="btn-outline py-3 rounded-xl"
              >
                Create New Account
              </Link>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
  export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-hero-gradient flex items-center justify-center">
          <p className="text-white">Verifying email...</p>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

