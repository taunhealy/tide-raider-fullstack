
import { prisma } from "../lib/prisma";

export interface AnalyticsReport {
  dateRange: string;
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  totalSearches: number;
  topBeaches: { name: string; count: number }[];
  topRegions: { name: string; count: number }[];
  alertsSent: number;
  activeSubscribers: number;
}

export class AnalyticsService {
  static async getWeeklyStats(): Promise<AnalyticsReport> {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const dateRange = `${lastWeek.toLocaleDateString()} - ${now.toLocaleDateString()}`;

    // 1. User Stats
    const totalUsers = await prisma.user.count();
    const newUsers = await prisma.user.count({
      where: { createdAt: { gte: lastWeek } }
    });
    const activeSubscribers = await prisma.user.count({
      where: {
        OR: [
          { subscriptionStatus: "ACTIVE" },
          { hasActiveTrial: true }
        ]
      }
    });

    // 2. Activity Stats (based on UserSearch)
    const totalSearches = await prisma.userSearch.count({
      where: { createdAt: { gte: lastWeek } }
    });
    
    // We treat unique userId in UserSearch as "Active Users"
    const activeUsersResult = await prisma.userSearch.groupBy({
      by: ['userId'],
      where: { 
        createdAt: { gte: lastWeek },
        userId: { not: null }
      },
    });
    const activeUsers = activeUsersResult.length;

    // 3. Top Beaches
    const beachCounts = await prisma.userSearch.groupBy({
      by: ['beachId'],
      where: { 
        createdAt: { gte: lastWeek },
        beachId: { not: null }
      },
      _count: { beachId: true },
      orderBy: { _count: { beachId: 'desc' } },
      take: 5
    });

    const topBeaches = await Promise.all(beachCounts.map(async (b) => {
      const beach = await prisma.beach.findUnique({ where: { id: b.beachId! }, select: { name: true } });
      return { name: beach?.name || "Unknown", count: b._count.beachId };
    }));

    // 4. Top Regions
    const regionCounts = await prisma.userSearch.groupBy({
      by: ['regionId'],
      where: { 
        createdAt: { gte: lastWeek },
        regionId: { not: null }
      },
      _count: { regionId: true },
      orderBy: { _count: { regionId: 'desc' } },
      take: 5
    });

    const topRegions = await Promise.all(regionCounts.map(async (r) => {
      const region = await prisma.region.findUnique({ where: { id: r.regionId! }, select: { name: true } });
      return { name: region?.name || "Unknown", count: r._count.regionId };
    }));

    // 5. Alerts Sent
    const alertsSent = await prisma.alertNotification.count({
      where: { createdAt: { gte: lastWeek } }
    });

    return {
      dateRange,
      totalUsers,
      newUsers,
      activeUsers,
      totalSearches,
      topBeaches,
      topRegions,
      alertsSent,
      activeSubscribers
    };
  }
}
