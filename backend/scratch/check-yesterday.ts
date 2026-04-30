
import { prisma } from "../src/lib/prisma";

async function check() {
    const targetDate = new Date("2026-04-29");
    targetDate.setUTCHours(0,0,0,0);
    
    console.log(`Checking Forecasts for ${targetDate.toISOString().split('T')[0]}...`);
    
    const forecasts = await prisma.forecast.findMany({
        where: {
            regionId: "western-cape",
            date: targetDate
        }
    });
    
    console.log(`Found ${forecasts.length} forecasts:`);
    forecasts.forEach(f => {
        console.log(`- Source: ${f.source}, Slot: ${f.timeSlot}, Wind: ${f.windSpeed}kts`);
    });
    
    await prisma.$disconnect();
}

check();
