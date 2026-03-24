import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const today = new Date("2026-03-24");
    today.setUTCHours(0,0,0,0);
    
    const forecasts = await prisma.forecast.findMany({
        where: {
            regionId: "western-cape",
            date: today
        }
    });
    console.log("Forecasts for western-cape on 2026-03-24:", JSON.stringify(forecasts, null, 2));
}

main();
