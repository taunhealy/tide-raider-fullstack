import { IntelligenceService } from '../src/services/intelligenceService';
import { prisma } from '../src/lib/prisma';

async function testWeekly() {
  console.log("Fetching first beach and user from DB...");
  const beach = await prisma.beach.findFirst();
  const user = await prisma.user.findFirst();
  
  if (!beach || !user) {
    console.error("Could not find beach or user in DB.");
    return;
  }
  
  console.log(`Beach: ${beach.name} (${beach.id})`);
  console.log(`User: ${user.name} (${user.id}), Credits: ${user.credits}`);
  
  // Ensure user has enough credits
  if (user.credits < 4) {
    await prisma.user.update({
      where: { id: user.id },
      data: { credits: 10 }
    });
    console.log("Added 10 credits to user.");
  }
  
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const result = await IntelligenceService.getTimedReportForBeach(
      beach.id,
      todayStr,
      user.id,
      7,
      undefined,
      'GENERAL'
    );
    console.log("Result:", result);
  } catch (err: any) {
    console.error("Caught error:");
    console.error(err);
    if (err.stack) {
      console.error(err.stack);
    }
  }
}

testWeekly().catch(console.error);
