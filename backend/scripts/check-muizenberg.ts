import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const beaches = await prisma.beach.findMany({
        where: { name: { contains: "Muizenberg", mode: "insensitive" } }
    });
    console.log("Beaches found:", JSON.stringify(beaches, null, 2));
}

main();
