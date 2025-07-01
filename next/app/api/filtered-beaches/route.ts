import { FILTERS } from "@/app/config/filters";
import { prisma } from "@/app/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Build where clause from filters
  const whereClause = FILTERS.reduce((acc, filter) => {
    const value = searchParams.get(filter.urlParam);
    if (value) {
      switch (filter.type) {
        case "array":
          acc[filter.beachProp] = { in: value.split(",") };
          break;
        case "boolean":
          acc[filter.beachProp] = value === "true";
          break;
        case "number":
          acc[filter.beachProp] = { gte: parseFloat(value) };
          break;
        default:
          acc[filter.beachProp] = value;
      }
    }
    return acc;
  }, {} as Record<string, any>);

  // Get filtered beaches with their scores
  const beaches = await prisma.beach.findMany({
    where: whereClause,
    include: {
      beachDailyScores: {
        where: { date: today },
        select: { score: true }
      },
      region: true
    }
  });

  return Response.json({
    beaches,
    totalCount: beaches.length
  });
}