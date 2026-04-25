const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log("Updating credits for Tide Raider and Taunhealy...");
  
  // Update Tide Raider
  await prisma.user.upsert({
    where: { email: "admin@tideraider.com" },
    update: { credits: 300 },
    create: {
      id: "cmnhjq35d000cs60fxss02p4o",
      name: "Tide Raider",
      email: "admin@tideraider.com",
      roles: ["SURFER"],
      credits: 300,
      subscriptionStatus: "ACTIVE",
      subscriptionEndsAt: new Date("2030-01-01"),
    },
  });
  console.log("✓ Updated Tide Raider");

  // Update Taunhealy
  await prisma.user.upsert({
    where: { email: "taunhealy@gmail.com" },
    update: { credits: 300 },
    create: {
      id: "cmn4owtab0000s60f0dosfbck",
      name: "Taun",
      email: "taunhealy@gmail.com",
      roles: ["SURFER"],
      credits: 300,
      subscriptionStatus: "ACTIVE",
      subscriptionEndsAt: new Date("2030-01-01"),
    },
  });
  console.log("✓ Updated Taunhealy");

  await prisma.$disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
