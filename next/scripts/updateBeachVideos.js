import { beachData } from "../app/data/beachData";
import { prisma } from "../app/lib/prisma";

async function updateBeachVideos() {
  console.log("Starting beach videos update...");

  // Get all beaches from beachData that have videos
  const beachesWithVideos = beachData.filter(
    (beach) =>
      beach.videos && Array.isArray(beach.videos) && beach.videos.length > 0
  );

  console.log(
    `Found ${beachesWithVideos.length} beaches with videos in beachData`
  );

  let successCount = 0;
  let failCount = 0;

  // Update each beach with videos
  for (const beach of beachesWithVideos) {
    try {
      // Use upsert to ensure the operation works whether the beach exists or not
      const result = await prisma.beach.update({
        where: { id: beach.id },
        data: {
          videos: beach.videos,
        },
      });

      successCount++;
      console.log(
        `✓ Updated videos for beach: ${beach.name} (${beach.id}) - ${beach.videos?.length || 0} videos`
      );
    } catch (error) {
      failCount++;
      console.error(
        `✗ Failed to update videos for beach ${beach.name} (${beach.id}):`,
        error
      );
    }
  }

  console.log(
    `Update complete: ${successCount} beaches updated, ${failCount} failed`
  );
}

// Run the function
updateBeachVideos()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error("Update failed:", e);
    prisma.$disconnect();
    process.exit(1);
  });
