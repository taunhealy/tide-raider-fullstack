import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { BookingStatus, DeliveryType } from '@prisma/client';

export const bookingsRouter = router({
  // Check availability for a listing
  checkAvailability: publicProcedure
    .input(
      z.object({
        listingId: z.string(),
        startDate: z.string().transform((str) => new Date(str)),
        endDate: z.string().transform((str) => new Date(str)),
      })
    )
    .query(async ({ ctx, input }) => {
      const { listingId, startDate, endDate } = input;

      // Check for conflicting bookings
      const conflicts = await ctx.prisma.booking.count({
        where: {
          listingId,
          status: {
            in: [
              BookingStatus.CONFIRMED,
              BookingStatus.IN_PROGRESS,
              BookingStatus.PAID,
            ],
          },
          OR: [
            {
              AND: [
                { startDate: { lte: endDate } },
                { endDate: { gte: startDate } },
              ],
            },
          ],
        },
      });

      return {
        available: conflicts === 0,
        conflicts,
      };
    }),

  // Calculate booking price with dynamic pricing
  calculatePrice: publicProcedure
    .input(
      z.object({
        listingId: z.string(),
        startDate: z.string().transform((str) => new Date(str)),
        endDate: z.string().transform((str) => new Date(str)),
        deliveryRequired: z.boolean().default(false),
        deliveryDistance: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const listing = await ctx.prisma.listing.findUnique({
        where: { id: input.listingId },
        include: {
          pricingRules: {
            where: { isActive: true },
            orderBy: { priority: 'desc' },
          },
          company: {
            include: { settings: true },
          },
        },
      });

      if (!listing) {
        throw new Error('Listing not found');
      }

      // Calculate number of days
      const days = Math.ceil(
        (input.endDate.getTime() - input.startDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      // Base price
      let basePrice = listing.basePricePerDay * days;

      // Apply discounts
      if (days >= 30) {
        basePrice *= 1 - listing.monthlyDiscount;
      } else if (days >= 7) {
        basePrice *= 1 - listing.weeklyDiscount;
      }

      // Apply dynamic pricing rules (weather-based, etc.)
      let priceMultiplier = 1;
      for (const rule of listing.pricingRules) {
        priceMultiplier *= rule.multiplier;
      }
      basePrice *= priceMultiplier;

      // Calculate delivery fee
      let deliveryFee = 0;
      if (input.deliveryRequired && input.deliveryDistance) {
        deliveryFee = (listing.deliveryPricePerKm || 0) * input.deliveryDistance;
      }

      // Calculate tax
      const taxRate = listing.company.settings?.taxRate || 0.15;
      const subtotal = basePrice + deliveryFee + listing.cleaningFee;
      const taxAmount = subtotal * taxRate;

      // Calculate insurance
      const insuranceAmount = listing.insurancePerDay * days;

      // Calculate deposit
      const depositPercentage =
        listing.company.settings?.depositPercentage || 0.3;
      const depositAmount = basePrice * depositPercentage;

      const totalAmount = subtotal + taxAmount + insuranceAmount;

      return {
        days,
        basePrice,
        deliveryFee,
        cleaningFee: listing.cleaningFee,
        insuranceAmount,
        taxAmount,
        depositAmount,
        totalAmount,
        currency: listing.company.settings?.currency || 'ZAR',
        breakdown: {
          basePricePerDay: listing.basePricePerDay,
          discountApplied: days >= 7,
          priceMultiplier,
        },
      };
    }),

  // Create a new booking
  create: protectedProcedure
    .input(
      z.object({
        listingId: z.string(),
        startDate: z.string().transform((str) => new Date(str)),
        endDate: z.string().transform((str) => new Date(str)),
        customerName: z.string(),
        customerEmail: z.string().email(),
        customerPhone: z.string(),
        deliveryRequired: z.boolean().default(false),
        deliveryType: z.nativeEnum(DeliveryType).optional(),
        deliveryAddress: z.string().optional(),
        customerNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const listing = await ctx.prisma.listing.findUnique({
        where: { id: input.listingId },
        include: { company: { include: { settings: true } } },
      });

      if (!listing) {
        throw new Error('Listing not found');
      }

      // Calculate pricing
      const days = Math.ceil(
        (input.endDate.getTime() - input.startDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      const basePrice = listing.basePricePerDay * days;
      const taxAmount = basePrice * (listing.company.settings?.taxRate || 0.15);
      const insuranceAmount = listing.insurancePerDay * days;
      const depositAmount =
        basePrice * (listing.company.settings?.depositPercentage || 0.3);
      const totalAmount = basePrice + taxAmount + insuranceAmount;

      // Create booking
      const booking = await ctx.prisma.booking.create({
        data: {
          companyId: listing.companyId,
          listingId: listing.id,
          userId: ctx.user.id,
          startDate: input.startDate,
          endDate: input.endDate,
          totalDays: days,
          basePrice,
          taxAmount,
          insuranceAmount,
          depositAmount,
          totalAmount,
          currency: listing.company.settings?.currency || 'ZAR',
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          deliveryRequired: input.deliveryRequired,
          deliveryType: input.deliveryType,
          deliveryAddress: input.deliveryAddress,
          customerNotes: input.customerNotes,
          status: BookingStatus.PENDING_PAYMENT,
        },
        include: {
          listing: {
            include: { images: true },
          },
          company: true,
        },
      });

      return booking;
    }),

  // Get user's bookings
  getMyBookings: protectedProcedure.query(async ({ ctx }) => {
    const bookings = await ctx.prisma.booking.findMany({
      where: { userId: ctx.user.id },
      include: {
        listing: {
          include: {
            images: { take: 1 },
          },
        },
        company: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return bookings;
  }),

  // Get booking by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const booking = await ctx.prisma.booking.findUnique({
        where: { id: input.id },
        include: {
          listing: {
            include: { images: true },
          },
          company: true,
          payments: true,
        },
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      // Ensure user owns this booking or is company owner
      if (booking.userId !== ctx.user.id) {
        throw new Error('Unauthorized');
      }

      return booking;
    }),
});
