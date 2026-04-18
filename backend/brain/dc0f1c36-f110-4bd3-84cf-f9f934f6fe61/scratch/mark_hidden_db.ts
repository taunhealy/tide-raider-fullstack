import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const hiddenGemIds = [
  "seafarm-pringle-bay", "palmiet-reef", "bellows", "kogelberg-reef", 
  "moonlight-bay", "harold-porter", "nine-miles", "i&js", 
  "derdesteen", "platboom", "thermopylae", "virgin-point", "dungeons"
];

async function main() {
  console.log("🚀 Marking beaches as Hidden Gems in DB...");
  for (const id of hiddenGemIds) {
    try {
      await prisma.beach.update({
        where: { id },
        data: { isHiddenGem: true }
      });
      console.log(`✅ ${id} marked as hidden gem`);
    } catch (e: any) {
      console.warn(`⚠️ Could not update ${id}: ${e.message}`);
    }
  }
}

main();
