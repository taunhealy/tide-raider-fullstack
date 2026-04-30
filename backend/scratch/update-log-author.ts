
import { prisma } from "../src/lib/prisma";

async function updateLog() {
    const logId = "2a971465-e6dc-4797-9939-5a900b116e27";
    const tideRaiderId = "cmnhjq35d000cs60fxss02p4o";
    
    console.log(`Updating log entry ${logId} to Tide Raider (${tideRaiderId})...`);
    
    const updated = await prisma.logEntry.update({
        where: { id: logId },
        data: {
            userId: tideRaiderId,
            surferName: "Tide Raider",
            isAnonymous: false
        }
    });
    
    console.log("✅ Log entry updated successfully:", updated.id);

    await prisma.$disconnect();
}

updateLog();
