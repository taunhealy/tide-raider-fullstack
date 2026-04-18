import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const ids = ["jocks-reef", "stony-beach"];
  console.log("🚀 Marking Jock's Reef and Stony Beach as Hidden Gems...");
  
  for (const id of ids) {
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
