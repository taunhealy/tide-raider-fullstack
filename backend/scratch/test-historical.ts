
import { prisma } from "../src/lib/prisma";
import { getLatestConditions } from "../src/services/surfConditionsService";

async function test() {
    const regionId = "western-cape";
    const targetDate = new Date("2026-04-24");
    targetDate.setUTCHours(0,0,0,0);
    
    console.log(`Testing Western Cape for ${targetDate.toISOString()}`);
    
    try {
        const result = await getLatestConditions(regionId, true, "WINDFINDER", 1, targetDate, "MORNING");
        console.log("Result:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

test();
