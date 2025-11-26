import { router } from '../trpc';
import { listingsRouter } from './listings';
import { bookingsRouter } from './bookings';

export const appRouter = router({
  listings: listingsRouter,
  bookings: bookingsRouter,
});

export type AppRouter = typeof appRouter;
