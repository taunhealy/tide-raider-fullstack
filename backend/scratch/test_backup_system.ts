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

const USER_BACKUP_PATH = path.join(__dirname, "backup_users.json");
const LOG_BACKUP_PATH = path.join(__dirname, "backup_log_entries.json");

async function main() {
  console.log("🧪 Starting backup system integration tests...");

  const testUserEmail = "backup.tester@tideraider.com";
  const testUserId = "backup-tester-id-999";
  const testLogId = "backup-tester-log-id-999";

  // Cleanup any old test runs
  console.log("🧹 Cleaning up old test data if present...");
  await prisma.logEntry.delete({ where: { id: testLogId } }).catch(() => {});
  await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});

  // Wait a second for filesystem queue to clear
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // --- TEST 1: User Creation Backup ---
  console.log("\n1️⃣ Testing User Creation Backup...");
  const user = await prisma.user.create({
    data: {
      id: testUserId,
      name: "Backup Tester",
      email: testUserEmail,
      credits: 50,
    },
  });
  console.log(`Created user ${user.email} in DB.`);

  // Wait for async backup task to write
  await new Promise((resolve) => setTimeout(resolve, 1500));

  let users = JSON.parse(fs.readFileSync(USER_BACKUP_PATH, "utf-8"));
  let backedUpUser = users.find((u: any) => u.id === testUserId);
  if (backedUpUser && backedUpUser.email === testUserEmail && backedUpUser.credits === 50) {
    console.log("✅ Test 1 Passed: User creation successfully backed up to JSON!");
  } else {
    throw new Error("❌ Test 1 Failed: User creation was not backed up properly.");
  }

  // --- TEST 2: User Update Backup ---
  console.log("\n2️⃣ Testing User Update Backup...");
  await prisma.user.update({
    where: { id: testUserId },
    data: {
      credits: 150,
      name: "Backup Tester Elite",
    },
  });
  console.log("Updated user credits to 150 in DB.");

  await new Promise((resolve) => setTimeout(resolve, 1500));

  users = JSON.parse(fs.readFileSync(USER_BACKUP_PATH, "utf-8"));
  backedUpUser = users.find((u: any) => u.id === testUserId);
  if (backedUpUser && backedUpUser.credits === 150 && backedUpUser.name === "Backup Tester Elite") {
    console.log("✅ Test 2 Passed: User updates successfully backed up to JSON!");
  } else {
    throw new Error("❌ Test 2 Failed: User update was not backed up properly.");
  }

  // --- TEST 3: Log Entry Creation Backup ---
  console.log("\n3️⃣ Testing Log Entry Creation Backup...");
  
  // Find a valid region to connect
  const region = await prisma.region.findFirst();
  if (!region) {
    throw new Error("No region found in database to link test log entry.");
  }

  const logEntry = await prisma.logEntry.create({
    data: {
      id: testLogId,
      date: new Date(),
      surferName: "Backup Tester",
      surferEmail: testUserEmail,
      beachName: "Tester Bay Break",
      surferRating: 5,
      comments: "Firing lines!",
      userId: testUserId,
      regionId: region.id,
      category: "GENERAL",
    },
  });
  console.log(`Created log entry ${logEntry.id} in DB.`);

  await new Promise((resolve) => setTimeout(resolve, 1500));

  let logs = JSON.parse(fs.readFileSync(LOG_BACKUP_PATH, "utf-8"));
  let backedUpLog = logs.find((l: any) => l.id === testLogId);
  if (backedUpLog && backedUpLog.comments === "Firing lines!" && backedUpLog.surferRating === 5) {
    console.log("✅ Test 3 Passed: LogEntry creation successfully backed up to JSON!");
  } else {
    throw new Error("❌ Test 3 Failed: LogEntry creation was not backed up properly.");
  }

  // --- TEST 4: Log Entry Update Backup ---
  console.log("\n4️⃣ Testing Log Entry Update Backup...");
  await prisma.logEntry.update({
    where: { id: testLogId },
    data: {
      comments: "Closing out completely, but clean.",
      surferRating: 3,
    },
  });
  console.log("Updated log entry comments and rating in DB.");

  await new Promise((resolve) => setTimeout(resolve, 1500));

  logs = JSON.parse(fs.readFileSync(LOG_BACKUP_PATH, "utf-8"));
  backedUpLog = logs.find((l: any) => l.id === testLogId);
  if (backedUpLog && backedUpLog.comments === "Closing out completely, but clean." && backedUpLog.surferRating === 3) {
    console.log("✅ Test 4 Passed: LogEntry updates successfully backed up to JSON!");
  } else {
    throw new Error("❌ Test 4 Failed: LogEntry update was not backed up properly.");
  }

  // --- TEST 5: Log Entry Deletion Backup ---
  console.log("\n5️⃣ Testing Log Entry Deletion Backup...");
  await prisma.logEntry.delete({
    where: { id: testLogId },
  });
  console.log("Deleted log entry from DB.");

  await new Promise((resolve) => setTimeout(resolve, 1500));

  logs = JSON.parse(fs.readFileSync(LOG_BACKUP_PATH, "utf-8"));
  backedUpLog = logs.find((l: any) => l.id === testLogId);
  if (!backedUpLog) {
    console.log("✅ Test 5 Passed: LogEntry deletion successfully synced to JSON!");
  } else {
    throw new Error("❌ Test 5 Failed: Deleted LogEntry was not removed from backup file.");
  }

  // --- TEST 6: Cleanup ---
  console.log("\n6️⃣ Cleaning up database and user backup...");
  await prisma.user.delete({ where: { id: testUserId } });
  
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Verify test user is also removed or kept clean
  // We don't remove users on deleted from db, but let's check
  users = JSON.parse(fs.readFileSync(USER_BACKUP_PATH, "utf-8"));
  const finalFilteredUsers = users.filter((u: any) => u.id !== testUserId);
  fs.writeFileSync(USER_BACKUP_PATH, JSON.stringify(finalFilteredUsers, null, 2), "utf-8");

  console.log("🧹 Cleaned up test user from backup file.");
  console.log("\n🎉 ALL BACKUP SYSTEM INTEGRATION TESTS PASSED GLORIOUSLY!");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
