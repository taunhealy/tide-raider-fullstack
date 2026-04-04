
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const userId = "cmnhjq35d000cs60fxss02p4o";
  const email = "taunhealy@gmail.com";

  console.log(`Setting user ${email} (ID: ${userId}) to status 'ACTIVE'...`);

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: "ACTIVE",
        subscriptionEndsAt: new Date("2030-01-01"),
      },
    });

    console.log("Updated user by ID:", updatedUser.id, updatedUser.email, updatedUser.subscriptionStatus);
  } catch (err) {
    console.warn("Could not find user by ID, trying by email...", err instanceof Error ? err.message : "");
    try {
      const updatedUser = await prisma.user.update({
        where: { email: email },
        data: {
          subscriptionStatus: "ACTIVE",
          subscriptionEndsAt: new Date("2030-01-01"),
        },
      });
      console.log("Updated user by email:", updatedUser.id, updatedUser.email, updatedUser.subscriptionStatus);
    } catch (innerErr) {
      console.error("Failed to update user by email:", innerErr instanceof Error ? innerErr.message : "");
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
