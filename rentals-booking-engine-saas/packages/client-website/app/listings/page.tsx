'use client';

import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ListingsPage() {
  const { data, isLoading, error } = trpc.listings.getAll.useQuery({
    limit: 20,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-4xl">⏳</div>
          <p className="text-muted-foreground">Loading luxury rentals...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-4xl">❌</div>
          <p className="text-destructive">Error loading listings</p>
          <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Navigation */}
      <nav className="border-b bg-white/50 backdrop-blur-lg dark:bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">🏎️</span>
              <span className="text-xl font-bold">Luxury Rentals</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="outline">Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Available Rentals</h1>
          <p className="mt-2 text-muted-foreground">
            {data?.listings.length || 0} luxury vehicles ready for your adventure
          </p>
        </div>

        {data?.listings.length === 0 ? (
          <div className="rounded-2xl border bg-white p-12 text-center dark:bg-slate-800">
            <div className="mb-4 text-6xl">🚗</div>
            <h2 className="text-2xl font-semibold">No listings yet</h2>
            <p className="mt-2 text-muted-foreground">
              Check back soon for amazing luxury rentals!
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data?.listings.map((listing) => (
              <div
                key={listing.id}
                className="group overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-xl dark:bg-slate-800"
              >
                {/* Image */}
                <div className="relative aspect-video overflow-hidden bg-slate-200 dark:bg-slate-700">
                  {listing.images[0] ? (
                    <img
                      src={listing.images[0].url}
                      alt={listing.images[0].altText || listing.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-6xl">
                      {listing.category === 'SUPERCAR' && '🏎️'}
                      {listing.category === 'YACHT' && '⛵'}
                      {listing.category === 'JETSKI' && '🚤'}
                      {listing.category === 'CAMPER_4X4' && '🚙'}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      {listing.category.replace('_', ' ')}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {listing.company.city}
                    </span>
                  </div>

                  <h3 className="text-xl font-semibold">{listing.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {listing.description}
                  </p>

                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">
                        R {listing.basePricePerDay.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">per day</p>
                    </div>
                    <Button>View Details</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
