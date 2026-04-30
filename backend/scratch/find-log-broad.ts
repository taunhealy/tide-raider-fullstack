
import { prisma } from "../src/lib/prisma";

async function findLog() {
    const targetDate = new Date("2026-04-24");
    targetDate.setUTCHours(0,0,0,0);
    
    console.log(`Searching for ALL logs on ${targetDate.toISOString().split('T')[0]}...`);
    
    const logs = await prisma.logEntry.findMany({
        where: {
            date: targetDate
        },
        include: {
            user: true
        }
    });
    
    console.log(`Found ${logs.length} logs:`);
    logs.forEach(log => {
        console.log(`- ID: ${log.id}, Beach: ${log.beachName}, User: ${log.user?.name || log.surferName}, userId: ${log.userId}`);
    });

    await prisma.$disconnect();
}

findLog();
