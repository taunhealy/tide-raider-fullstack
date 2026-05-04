import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    const beach = await prisma.beach.findUnique({
      where: { id: 'ijs-kommetjie' }
    });
    console.log("Remaining I&J in Kommetjie:", beach ? beach.name : "NOT FOUND!");
    
    const others = await prisma.beach.findMany({
      where: {
        name: { contains: "I&J", mode: "insensitive" }
      }
    });
    console.log("Other I&J beaches still in DB:", others.map(b => b.name));
    
  } catch (error: any) {
    console.error("Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
