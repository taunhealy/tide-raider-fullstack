/// <reference types="node" />
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking for beach scores...");

  // Get Western Cape region ID
  const region = await prisma.region.findFirst({
    where: {
      OR: [
        { id: "western-cape" },
        { name: { contains: "Western Cape", mode: "insensitive" } },
      ],
    },
  });

  if (!region) {
    console.log("Region 'Western Cape' not found");
    return;
  }

  console.log(`Found region: ${region.name} (${region.id})`);

  // Count beaches in region
  const beachCount = await prisma.beach.count({
    where: { regionId: region.id },
  });
  console.log(`Total beaches in region: ${beachCount}`);

  // Check for scores
  const scoresCount = await prisma.beachDailyScore.count({
    where: {
      beach: {
        regionId: region.id,
      },
    },
  });
  console.log(`Total daily scores for region: ${scoresCount}`);

  // Check counts by source
  const sourceCounts = await prisma.beachDailyScore.groupBy({
    by: ['source'],
    _count: {
      source: true
    },
    where: {
      beach: {
        regionId: region.id
      }
    }
  });
  console.log("Scores by source:", JSON.stringify(sourceCounts, null, 2));

  // Check for scores today
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  
  // Check for scores specifically for TODAY (2025-11-28)
  const startOfDay = new Date("2025-11-28T00:00:00.000Z");
  const endOfDay = new Date("2025-11-28T23:59:59.999Z");
  
  const specificDateScoresCount = await prisma.beachDailyScore.count({
    where: {
      beach: {
        regionId: region.id,
      },
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  const specificDatePositiveScoresCount = await prisma.beachDailyScore.count({
    where: {
      beach: {
        regionId: region.id,
      },
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
      score: {
        gt: 0
      }
    },
  });

  const specificDateSampleScores = await prisma.beachDailyScore.findMany({
    where: {
      beach: {
        regionId: region.id,
      },
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    take: 5,
    include: {
      beach: true,
    }
  });

  const result = {
    region: { name: region.name, id: region.id },
    beachCount,
    scoresCount,
    specificDateScoresCount,
    specificDatePositiveScoresCount,
    specificDateSampleScores,
    sourceCounts,
    sampleScores: scoresCount > 0 ? await prisma.beachDailyScore.findMany({
      where: {
        beach: {
          regionId: region.id,
        },
      },
      take: 5,
      include: {
        beach: true,
      },
      orderBy: {
        date: 'desc'
      }
    }) : []
  };

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fs = require('fs');
  fs.writeFileSync('scores-result.json', JSON.stringify(result, null, 2));
  console.log("Results written to scores-result.json");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
