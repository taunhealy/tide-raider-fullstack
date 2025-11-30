import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const result = await prisma.$queryRaw`
      WITH DailyScores AS (
          SELECT 
              "beachId",
              SUM(score) as total_score,
              COUNT(DISTINCT source) as source_count
          FROM "BeachDailyScore"
          WHERE date::date = CURRENT_DATE
          GROUP BY "beachId"
      )
      SELECT 
          b.name as "Beach Name",
          r.name as "Region",
          ds.total_score as "Total Score",
          ds.source_count as "Sources Count"
      FROM DailyScores ds
      JOIN "Beach" b ON ds."beachId" = b.id
      JOIN "Region" r ON b."regionId" = r.id
      ORDER BY ds.total_score DESC
      LIMIT 10;
    `;

    console.log("Top Surf Breaks for Today (Aggregated Scores):");
    console.table(result);
  } catch (error) {
    console.error("Error executing query:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
