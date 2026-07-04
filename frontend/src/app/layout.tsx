'use client';
import './globals.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';
import PWARegister from '@/components/PWARegister';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { retry: 1, staleTime: 60 * 1000 } },
  }));

  return (
    <html lang="en">
      <head>
        <title>OMIQORA – Premium Services Marketplace</title>
        <meta name="description" content="AI-powered services ecosystem for events, photography, catering and more" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
  <PWARegister />
  {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { borderRadius: '12px', fontFamily: 'Inter', fontSize: '14px' },
              success: { style: { background: '#0B1F5B', color: '#F4E6A1' } },
              error: { style: { background: '#DC2626', color: '#fff' } },
            }}
          />
        </QueryClientProvider>
      </body>
    </html>
  );
}
