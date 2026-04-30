
import { prisma } from "../src/lib/prisma";
import { ScoreService } from "../src/services/scoreService";
import { randomUUID } from "crypto";

async function setManualForecast() {
    const regionId = "western-cape";
    const targetDate = new Date("2026-04-24");
    targetDate.setUTCHours(0,0,0,0);
    
    const timeSlot = "NOON";
    const source = "WINDFINDER";
    
    // NE = 45 degrees
    const windDirection = 45; 
    const windSpeed = 8;
    const swellHeight = 0.8;
    const swellDirection = 178;
    const swellPeriod = 10; // Defaulting to 10s as not specified
    
    console.log(`Setting manual forecast for ${regionId} on ${targetDate.toISOString().split('T')[0]}...`);
    
    const forecast = await prisma.forecast.upsert({
        where: {
            date_regionId_source_timeSlot: {
                date: targetDate,
                regionId,
                source,
                timeSlot
            }
        },
        update: {
            windSpeed,
            windDirection,
            swellHeight,
            swellDirection,
            swellPeriod,
        },
        create: {
            id: randomUUID(),
            date: targetDate,
            regionId,
            source,
            timeSlot,
            windSpeed,
            windDirection,
            swellHeight,
            swellDirection,
            swellPeriod,
            tide: ""
        }
    });
    
    console.log("✅ Forecast updated:", forecast.id);
    
    console.log("Calculating scores for all beaches...");
    await ScoreService.calculateAndStoreScores(regionId, forecast);
    console.log("✅ Scores recalculated and stored.");

    await prisma.$disconnect();
}

setManualForecast();
