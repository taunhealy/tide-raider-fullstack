import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

// Load environment overrides
const envLocalPath = path.join(__dirname, "../.env.local");
const envPath = path.join(__dirname, "../.env");
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else {
  dotenv.config({ path: envPath });
}

import { prisma } from "../src/lib/prisma";
import { BackupService } from "../src/services/backupService";

async function main() {
  console.log("👥 Querying all users from database to create initial JSON backup...");
  
  const users = await prisma.user.findMany();
  console.log(`Found ${users.length} users in database.`);

  for (const user of users) {
    console.log(`Backing up user: ${user.email} (ID: ${user.id})...`);
    await BackupService.backupUser(user.id, prisma);
  }

  // Allow tasks in queue to finish processing
  await new Promise((resolve) => setTimeout(resolve, 2000));
  
  console.log("🎉 Initial user backup process completed successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
