import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../../booking-engine/src/trpc/routers';

export const trpc = createTRPCReact<AppRouter>();
