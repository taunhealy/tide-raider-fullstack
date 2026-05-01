import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load .env.local from the backend root
dotenv.config({ path: join(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

async function testTrialLifecycle() {
  const testEmail = `test-trial-${Date.now()}@example.com`;
  console.log(`🚀 Starting Trial Lifecycle Test for ${testEmail}`);

  try {
    // 1. Create a test user
    console.log("Step 1: Creating test user...");
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        name: "Test User",
        password: "hashedpassword",
      }
    });
    console.log(`✅ User created: ${user.id}`);

    // 2. Start a trial
    console.log("Step 2: Starting trial...");
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 20);

    const startedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        hasActiveTrial: true,
        trialStartDate: new Date(),
        trialEndDate: trialEndDate,
        subscriptionStatus: "TRIAL",
        hasTrialEnded: false,
      }
    });
    console.log(`✅ Trial started. End date: ${startedUser.trialEndDate?.toISOString()}`);
    console.log(`Status: ${startedUser.subscriptionStatus}, hasActiveTrial: ${startedUser.hasActiveTrial}`);

    // 3. Simulate trial expiration (move end date to past)
    console.log("Step 3: Simulating trial expiration...");
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 1); // Yesterday

    await prisma.user.update({
      where: { id: user.id },
      data: { trialEndDate: expiredDate }
    });
    console.log(`✅ Trial end date moved to: ${expiredDate.toISOString()}`);

    // 4. Run expiration logic (Manually)
    console.log("Step 4: Running expiration logic...");
    
    // This replicates the logic in CronScheduler.runScheduledJob (Step 1.5)
    const now = new Date();
    const expiredTrials = await prisma.user.findMany({
      where: {
        id: user.id, // Target our test user
        hasActiveTrial: true,
        trialEndDate: { lt: now },
        hasTrialEnded: false
      }
    });

    console.log(`🔍 Found ${expiredTrials.length} expired trials for this user.`);

    if (expiredTrials.length === 1) {
      const u = expiredTrials[0];
      
      // Simulate the update performed in CronScheduler
      await prisma.user.update({
        where: { id: u.id },
        data: {
          hasActiveTrial: false,
          hasTrialEnded: true,
          subscriptionStatus: "EXPIRED_TRIAL"
        }
      });
      console.log("✅ User updated to EXPIRED_TRIAL");
    } else {
      console.error("❌ Failed to find expired trial for user!");
    }

    // 5. Final verification
    const finalUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    console.log("\nFinal User State:", {
      subscriptionStatus: finalUser?.subscriptionStatus,
      hasActiveTrial: finalUser?.hasActiveTrial,
      hasTrialEnded: finalUser?.hasTrialEnded
    });

    if (
      finalUser?.subscriptionStatus === "EXPIRED_TRIAL" &&
      finalUser?.hasActiveTrial === false &&
      finalUser?.hasTrialEnded === true
    ) {
      console.log("\n🎊 TRIAL LIFECYCLE TEST PASSED! 🎊");
    } else {
      console.log("\n❌ TRIAL LIFECYCLE TEST FAILED! ❌");
    }

    // 6. Cleanup
    console.log("\nStep 6: Cleaning up...");
    await prisma.user.delete({ where: { id: user.id } });
    console.log("✅ Test user deleted.");

  } catch (error) {
    console.error("❌ Test failed with error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testTrialLifecycle();
