import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { name: "Tide Raider" },
        { email: "admin@tideraider.com" },
        { id: "tide-raider" }
      ]
    }
  });

  if (user) {
    console.log("FOUND_USER:", JSON.stringify(user, null, 2));
  } else {
    console.log("USER_NOT_FOUND");
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
