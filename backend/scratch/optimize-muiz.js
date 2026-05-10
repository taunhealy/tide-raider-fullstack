const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function optimizeMuizenberg() {
  try {
    // 1. Mark as sheltered
    const beach = await prisma.beach.update({
      where: { id: 'muizenberg-beach' },
      data: { sheltered: true }
    });
    console.log("✅ Muizenberg marked as sheltered.");

    // 2. Update GENERAL profile
    const profile = await prisma.beachConditionProfile.findFirst({
      where: { beachId: 'muizenberg-beach', category: 'GENERAL' }
    });

    if (profile) {
      const currentWind = Array.isArray(profile.optimalWindDirections) 
        ? profile.optimalWindDirections 
        : JSON.parse(profile.optimalWindDirections);
      
      const newWind = [...new Set([...currentWind, 'WNW'])];
      
      const currentSwell = typeof profile.optimalSwellDirections === 'string' 
        ? JSON.parse(profile.optimalSwellDirections) 
        : profile.optimalSwellDirections;
      
      const newSwell = { ...currentSwell, max: 240 }; // Allow SW (up to 240)

      const currentPeriod = typeof profile.idealSwellPeriod === 'string'
        ? JSON.parse(profile.idealSwellPeriod)
        : profile.idealSwellPeriod;
      
      const newPeriod = { ...currentPeriod, min: 10 }; // Lower floor to 10s

      await prisma.beachConditionProfile.update({
        where: { id: profile.id },
        data: {
          optimalWindDirections: newWind,
          optimalSwellDirections: newSwell,
          idealSwellPeriod: newPeriod
        }
      });
      console.log("✅ Muizenberg GENERAL profile optimized (Added WNW, Swell max 240, Period min 10s).");
    }

    // 3. Update SURF_FOILING profile too (it already had 8s min, but let's check)
    // Actually, GENERAL is the one the user is likely seeing in the main report.

  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

optimizeMuizenberg();
