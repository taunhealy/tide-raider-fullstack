
import { prisma } from "../src/lib/prisma";

async function check() {
    const targetDate = new Date("2026-04-24");
    targetDate.setUTCHours(0,0,0,0);
    
    const score = await prisma.beachDailyScore.findFirst({
        where: {
            regionId: "western-cape",
            date: targetDate,
            source: "WINDFINDER"
        }
    });
    
    console.log(`Windfinder Score conditions:`, JSON.stringify(score?.conditions, null, 2));

    await prisma.$disconnect();
}

check();
