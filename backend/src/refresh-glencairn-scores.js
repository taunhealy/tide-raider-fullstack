const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Direction mapping utilities (copied from ScoreService for standalone use or I can try to require it)
const cardinalToDegreesMap = {
  N: 0, NNE: 22.5, NE: 45, ENE: 67.5, E: 90, ESE: 112.5, SE: 135, SSE: 157.5,
  S: 180, SSW: 202.5, SW: 225, WSW: 247.5, W: 270, WNW: 292.5, NW: 315, NNW: 337.5,
};

function degreesToCardinal(degrees) {
  degrees = degrees % 360;
  if (degrees < 0) degrees += 360;
  const cardinals = Object.entries(cardinalToDegreesMap);
  return cardinals.reduce((closest, [direction, dirDegrees]) => {
    const currentDiff = Math.abs(degrees - dirDegrees);
    const closestDiff = Math.abs(degrees - cardinalToDegreesMap[closest]);
    return currentDiff < closestDiff ? direction : closest;
  }, "N");
}

function calculateScore(beach, conditions) {
  const parsedBeach = {
    ...beach,
    optimalSwellDirections: typeof beach.optimalSwellDirections === "string" ? JSON.parse(beach.optimalSwellDirections) : beach.optimalSwellDirections,
    swellSize: typeof beach.swellSize === "string" ? JSON.parse(beach.swellSize) : beach.swellSize,
    idealSwellPeriod: typeof beach.idealSwellPeriod === "string" ? JSON.parse(beach.idealSwellPeriod) : beach.idealSwellPeriod,
  };

  let score = 5;
  const windCardinal = degreesToCardinal(conditions.windDirection);

  if (!beach.optimalWindDirections.includes(windCardinal)) {
    const minAngleDiff = beach.optimalWindDirections.reduce((minDiff, optimalDir) => {
      const optimalDegrees = cardinalToDegreesMap[optimalDir];
      const diff = Math.abs(conditions.windDirection - optimalDegrees);
      const angleDiff = Math.min(diff, 360 - diff);
      return Math.min(minDiff, angleDiff);
    }, 180);

    if (minAngleDiff <= 22.5) score -= 0.5;
    else if (minAngleDiff <= 45) score -= 1;
    else if (minAngleDiff <= 90) score -= 2;
    else score -= 3;
  }

  const isOptimalWind = beach.optimalWindDirections.includes(windCardinal);
  if (!isOptimalWind && !beach.sheltered) {
    if (conditions.windSpeed > 25) score -= 2.5;
    else if (conditions.windSpeed > 15) score -= 1.5;
    else if (conditions.windSpeed > 10) score -= 0.5;
  } else if (conditions.windSpeed > 35) score -= 2;

  if (!(conditions.swellHeight >= parsedBeach.swellSize.min && conditions.swellHeight <= parsedBeach.swellSize.max)) {
    const heightDiff = Math.min(Math.abs(conditions.swellHeight - parsedBeach.swellSize.min), Math.abs(conditions.swellHeight - parsedBeach.swellSize.max));
    if (heightDiff <= 0.5) score -= 0.5;
    else if (heightDiff <= 1) score -= 1;
    else score -= 3;
  }

  if (!(conditions.swellDirection >= parsedBeach.optimalSwellDirections.min && conditions.swellDirection <= parsedBeach.optimalSwellDirections.max)) {
    const minDiff = Math.abs(conditions.swellDirection - parsedBeach.optimalSwellDirections.min);
    const maxDiff = Math.abs(conditions.swellDirection - parsedBeach.optimalSwellDirections.max);
    const swellDirDiff = Math.min(Math.min(minDiff, 360 - minDiff), Math.min(maxDiff, 360 - maxDiff));
    if (swellDirDiff <= 20) score -= 1;
    else if (swellDirDiff <= 45) score -= 2;
    else score -= 3;
  }

  const isBeachBreak = parsedBeach.waveType === "BEACH_BREAK";
  const periodThreshold = isBeachBreak ? 9 : 12;
  if (conditions.swellPeriod < (periodThreshold - 3)) score -= 2;
  else if (conditions.swellPeriod < periodThreshold) score -= 0.5;
  else if (!(conditions.swellPeriod >= parsedBeach.idealSwellPeriod.min && conditions.swellPeriod <= parsedBeach.idealSwellPeriod.max)) {
    const periodDiff = Math.min(Math.abs(conditions.swellPeriod - parsedBeach.idealSwellPeriod.min), Math.abs(conditions.swellPeriod - parsedBeach.idealSwellPeriod.max));
    if (periodDiff <= 2) score -= 0.5;
    else score -= 1;
  }

  return Number(Math.min(5, Math.max(0, score)).toFixed(1));
}

async function refreshScores() {
  try {
    const yesterday = new Date('2026-04-24');
    const beach = await prisma.beach.findFirst({ where: { name: 'Glencairn' } });
    if (!beach) throw new Error('Beach not found');

    const forecasts = await prisma.forecast.findMany({
      where: { date: yesterday, regionId: beach.regionId }
    });

    console.log(`Found ${forecasts.length} forecasts to recalculate scores for Glencairn...`);

    for (const forecast of forecasts) {
      const calculatedScore = calculateScore(beach, forecast);
      const integerScore = Math.round(calculatedScore * 2);
      const starRating = Math.max(1, Math.min(5, Math.floor(integerScore / 2)));

      await prisma.beachDailyScore.upsert({
        where: {
          beachId_date_source_timeSlot: {
            beachId: beach.id,
            date: yesterday,
            source: forecast.source,
            timeSlot: forecast.timeSlot
          }
        },
        update: {
          score: integerScore,
          starRating: starRating,
          conditions: {
            windSpeed: forecast.windSpeed,
            windDirection: forecast.windDirection,
            swellHeight: forecast.swellHeight,
            swellDirection: forecast.swellDirection,
            swellPeriod: forecast.swellPeriod,
            tide: forecast.tide || ""
          }
        },
        create: {
          beachId: beach.id,
          date: yesterday,
          source: forecast.source,
          timeSlot: forecast.timeSlot,
          regionId: beach.regionId,
          score: integerScore,
          starRating: starRating,
          conditions: {
            windSpeed: forecast.windSpeed,
            windDirection: forecast.windDirection,
            swellHeight: forecast.swellHeight,
            swellDirection: forecast.swellDirection,
            swellPeriod: forecast.swellPeriod,
            tide: forecast.tide || ""
          }
        }
      });
      
      console.log(`Updated Glencairn score for ${forecast.source} ${forecast.timeSlot}: ${calculatedScore}/5 (${starRating} stars)`);
    }

    console.log('✅ Glencairn scores for yesterday have been synchronized with the new optimal conditions.');
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

refreshScores();
