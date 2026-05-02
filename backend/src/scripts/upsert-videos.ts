
import "../setup";
import { PrismaClient } from "@prisma/client";

// Use connection pooler support
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL || "";
  if (url.includes(":6543") && !url.includes("pgbouncer=true")) {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}pgbouncer=true`;
  }
  return url;
};

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
});

async function upsertVideos() {
  console.log("🚀 Starting targeted video upsert...");

  const updates = [
    {
      id: "sunset-beach",
      videos: [
        {
          url: "https://www.youtube.com/watch?v=h1jbkyLOKms",
          title: "Surf's Up in Cape Town! My First Surf Session in 8 Months!!",
          platform: "youtube"
        }
      ]
    },
    {
      id: "imsouane-magic-bay-morocco",
      videos: [
        {
          url: "https://www.youtube.com/watch?v=FjIu0Z5tK3A",
          title: "IMSOUANE | The Magic Bay of Morocco (Longboard Surfing)",
          platform: "youtube"
        },
        {
          url: "https://www.youtube.com/watch?v=6bFXMrcWA5k",
          title: "Surfing, Hiking & Beach BBQ!!",
          platform: "youtube"
        }
      ]
    }
  ];

  for (const item of updates) {
    console.log(`Updating ${item.id}...`);
    try {
      await prisma.beach.update({
        where: { id: item.id },
        data: { videos: item.videos }
      });
      console.log(`✅ ${item.id} updated.`);
    } catch (error) {
      console.error(`❌ Failed to update ${item.id}:`, (error as any).message);
    }
  }

  console.log("🏁 Upsert process complete.");
  process.exit(0);
}

upsertVideos().catch(err => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
