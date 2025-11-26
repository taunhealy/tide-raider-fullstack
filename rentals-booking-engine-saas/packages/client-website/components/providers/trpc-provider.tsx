'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useSession } from 'next-auth/react';

function TRPCClientProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/trpc`,
          // Send NextAuth JWT token to Cloud Run
          async headers() {
            // Get the JWT token from NextAuth session
            const token = session?.user?.id; // We'll use a proper JWT in production
            
            return {
              authorization: token ? `Bearer ${token}` : '',
            };
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TRPCClientProvider>{children}</TRPCClientProvider>
    </SessionProvider>
  );
}

// Import SessionProvider
import { SessionProvider } from 'next-auth/react';

