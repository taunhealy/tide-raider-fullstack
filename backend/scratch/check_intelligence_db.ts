import { prisma } from "../src/lib/prisma";

async function checkDb() {
  try {
    const count = await (prisma as any).intelligenceReport.count();
    console.log(`IntelligenceReport count: ${count}`);
    const latest = await (prisma as any).intelligenceReport.findFirst({
        orderBy: { createdAt: 'desc' }
    });
    console.log("Latest report:", JSON.stringify(latest, null, 2));
  } catch (err: any) {
    console.error("DB Check Failed:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDb();
