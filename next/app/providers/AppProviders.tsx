"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { BeachProvider } from "@/app/context/BeachContext";

import { SubscriptionProvider } from "./SubscriptionProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data is fresh for 5 minutes
      gcTime: 1000 * 60 * 30, // Cache persists for 30 minutes
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

export default function AppProviders({
  children,
  session,
  initialBeaches = [],
}: {
  children: React.ReactNode;
  session?: any; // You should type this properly based on your session structure
  initialBeaches?: any[];
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={session} refetchInterval={0}>
        <SubscriptionProvider>
          <BeachProvider initialBeaches={initialBeaches}>
            {children}
            <Toaster position="top-right" />
            <ReactQueryDevtools initialIsOpen={false} />
          </BeachProvider>
        </SubscriptionProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
