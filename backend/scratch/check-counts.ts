
import { prisma } from "../src/lib/prisma";

async function check() {
    const targetDate = new Date("2026-04-24");
    targetDate.setUTCHours(0,0,0,0);
    
    const scoreSources = await prisma.beachDailyScore.groupBy({
        by: ['source'],
        where: {
            regionId: "western-cape",
            date: targetDate
        },
        _count: true
    });
    
    console.log(`Score counts for April 24:`, scoreSources);
    
    const forecastSources = await prisma.forecast.groupBy({
        by: ['source'],
        where: {
            regionId: "western-cape",
            date: targetDate
        },
        _count: true
    });
    console.log(`Forecast counts for April 24:`, forecastSources);

    await prisma.$disconnect();
}

check();
