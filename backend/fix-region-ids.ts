
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Map of incorrect IDs to correct IDs
const ID_MAPPINGS: Record<string, string> = {
  "Eastern Cape": "eastern-cape",
  "Western Cape": "western-cape",
  "KwaZulu-Natal": "kwazulu-natal",
  "Northern Cape": "northern-cape",
  // Add others if needed based on seed-minimal.ts
};

async function main() {
  console.log("🚀 Starting Region ID Migration...");

  for (const [oldId, newId] of Object.entries(ID_MAPPINGS)) {
    try {
      // 1. Check if old region exists
      const oldRegion = await prisma.region.findUnique({
        where: { id: oldId },
      });

      if (!oldRegion) {
        console.log(`ℹ️  Region '${oldId}' not found. Skipping.`);
        continue;
      }

      console.log(`🔄 Migrating '${oldId}' -> '${newId}'...`);

      // 2. Ensure new region exists
      let newRegion = await prisma.region.findUnique({
        where: { id: newId },
      });

      if (!newRegion) {
        console.log(`   Creating new region '${newId}'...`);
        newRegion = await prisma.region.create({
          data: {
            id: newId,
            name: oldRegion.name,
            countryId: oldRegion.countryId,
            continent: oldRegion.continent,
          },
        });
      }

      // 3. Update related records
      // We need to update every table that references Region
      
      // Forecasts
      const forecasts = await prisma.forecast.updateMany({
        where: { regionId: oldId },
        data: { regionId: newId },
      });
      console.log(`   Updated ${forecasts.count} forecasts.`);

      // Beaches
      const beaches = await prisma.beach.updateMany({
        where: { regionId: oldId },
        data: { regionId: newId },
      });
      console.log(`   Updated ${beaches.count} beaches.`);

      // Ads
      const ads = await prisma.ad.updateMany({
        where: { regionId: oldId },
        data: { regionId: newId },
      });
      console.log(`   Updated ${ads.count} ads.`);

      // AdRequests
      const adRequests = await prisma.adRequest.updateMany({
        where: { regionId: oldId },
        data: { regionId: newId },
      });
      console.log(`   Updated ${adRequests.count} adRequests.`);

      // Events
      const events = await prisma.event.updateMany({
        where: { regionId: oldId },
        data: { regionId: newId },
      });
      console.log(`   Updated ${events.count} events.`);

      // Stories
      const stories = await prisma.story.updateMany({
        where: { regionId: oldId },
        data: { regionId: newId },
      });
      console.log(`   Updated ${stories.count} stories.`);

      // Alerts
      const alerts = await prisma.alert.updateMany({
        where: { regionId: oldId },
        data: { regionId: newId },
      });
      console.log(`   Updated ${alerts.count} alerts.`);

      // BeachDailyScores
      const scores = await prisma.beachDailyScore.updateMany({
        where: { regionId: oldId },
        data: { regionId: newId },
      });
      console.log(`   Updated ${scores.count} beachDailyScores.`);

      // LogEntries
      const logs = await prisma.logEntry.updateMany({
        where: { regionId: oldId },
        data: { regionId: newId },
      });
      console.log(`   Updated ${logs.count} logEntries.`);

      // UserSearches
      const searches = await prisma.userSearch.updateMany({
        where: { regionId: oldId },
        data: { regionId: newId },
      });
      console.log(`   Updated ${searches.count} userSearches.`);

      // 4. Delete old region
      console.log(`   Deleting old region '${oldId}'...`);
      await prisma.region.delete({
        where: { id: oldId },
      });

      console.log(`✅ Successfully migrated '${oldId}' to '${newId}'`);

    } catch (error) {
      console.error(`❌ Failed to migrate '${oldId}':`, error);
    }
  }

  console.log("🏁 Migration completed.");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
