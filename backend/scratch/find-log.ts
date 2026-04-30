
import { prisma } from "../src/lib/prisma";

async function findLog() {
    const targetDate = new Date("2026-04-24");
    targetDate.setUTCHours(0,0,0,0);
    
    console.log(`Searching for log entry on ${targetDate.toISOString().split('T')[0]} for Muizenberg...`);
    
    const logs = await prisma.logEntry.findMany({
        where: {
            date: targetDate,
            beachName: {
                contains: "Muizenberg",
                mode: 'insensitive'
            }
        },
        include: {
            user: true
        }
    });
    
    console.log(`Found ${logs.length} logs:`);
    logs.forEach(log => {
        console.log(`- ID: ${log.id}, User: ${log.user?.name || log.surferName}, userId: ${log.userId}`);
    });

    const tideRaider = await prisma.user.findFirst({
        where: {
            name: {
                contains: "Tide Raider",
                mode: 'insensitive'
            }
        }
    });
    
    if (tideRaider) {
        console.log(`\nFound Tide Raider user: ID: ${tideRaider.id}`);
    } else {
        console.log(`\nCould not find 'Tide Raider' user.`);
    }

    await prisma.$disconnect();
}

findLog();
