import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { ListingCategory, ListingStatus } from '@prisma/client';

export const listingsRouter = router({
  // Get all active listings (public)
  getAll: publicProcedure
    .input(
      z
        .object({
          category: z.nativeEnum(ListingCategory).optional(),
          limit: z.number().min(1).max(100).default(50),
          cursor: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50;
      const cursor = input?.cursor;

      const listings = await ctx.prisma.listing.findMany({
        take: limit + 1,
        where: {
          status: ListingStatus.ACTIVE,
          ...(input?.category && { category: input.category }),
        },
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          images: {
            orderBy: { order: 'asc' },
          },
          company: {
            select: {
              name: true,
              slug: true,
              city: true,
              province: true,
            },
          },
        },
      });

      let nextCursor: string | undefined = undefined;
      if (listings.length > limit) {
        const nextItem = listings.pop();
        nextCursor = nextItem!.id;
      }

      return {
        listings,
        nextCursor,
      };
    }),

  // Get single listing by ID or slug (public)
  getById: publicProcedure
    .input(
      z.object({
        id: z.string().optional(),
        slug: z.string().optional(),
        companySlug: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const listing = await ctx.prisma.listing.findFirst({
        where: {
          OR: [
            { id: input.id },
            {
              slug: input.slug,
              company: { slug: input.companySlug },
            },
          ],
        },
        include: {
          images: {
            orderBy: { order: 'asc' },
          },
          company: true,
          pickupLocations: {
            include: {
              location: true,
            },
          },
          pricingRules: {
            where: { isActive: true },
            orderBy: { priority: 'desc' },
          },
        },
      });

      if (!listing) {
        throw new Error('Listing not found');
      }

      return listing;
    }),

  // Create new listing (protected - requires auth)
  create: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
        title: z.string().min(3).max(200),
        slug: z.string().min(3).max(200),
        description: z.string().min(10),
        category: z.nativeEnum(ListingCategory),
        basePricePerDay: z.number().positive(),
        weeklyDiscount: z.number().min(0).max(1).default(0.1),
        monthlyDiscount: z.number().min(0).max(1).default(0.2),
        securityDeposit: z.number().min(0).default(0),
        cleaningFee: z.number().min(0).default(0),
        insurancePerDay: z.number().min(0).default(0),
        minRentalDays: z.number().int().min(1).default(1),
        maxRentalDays: z.number().int().positive().optional(),
        advanceNoticeDays: z.number().int().min(0).default(1),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        specifications: z.record(z.any()).optional(),
        features: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const listing = await ctx.prisma.listing.create({
        data: {
          ...input,
          status: ListingStatus.DRAFT,
          features: input.features || [],
          specifications: input.specifications || {},
        },
        include: {
          images: true,
          company: true,
        },
      });

      return listing;
    }),

  // Update listing (protected)
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(3).max(200).optional(),
        description: z.string().min(10).optional(),
        basePricePerDay: z.number().positive().optional(),
        status: z.nativeEnum(ListingStatus).optional(),
        specifications: z.record(z.any()).optional(),
        features: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const listing = await ctx.prisma.listing.update({
        where: { id },
        data,
        include: {
          images: true,
          company: true,
        },
      });

      return listing;
    }),

  // Delete listing (protected)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.listing.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Get listings by company (protected)
  getByCompany: protectedProcedure
    .input(z.object({ companyId: z.string() }))
    .query(async ({ ctx, input }) => {
      const listings = await ctx.prisma.listing.findMany({
        where: { companyId: input.companyId },
        include: {
          images: {
            orderBy: { order: 'asc' },
            take: 1,
          },
          _count: {
            select: {
              bookings: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return listings;
    }),
});
