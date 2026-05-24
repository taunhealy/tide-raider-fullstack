import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Updating admin user cmnhjq35d000cs60fxss02p4o name to 'gh0st'...");
  
  const updatedUser = await prisma.user.update({
    where: { id: "cmnhjq35d000cs60fxss02p4o" },
    data: {
      name: "gh0st",
      instagram: null,
      link: null
    }
  });

  console.log("SUCCESS! Updated user:", JSON.stringify(updatedUser, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
