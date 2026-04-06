import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  try {
    const beaches = await prisma.beach.findMany({
      where: { name: { contains: 'Second' } }
    });

    let output = "";
    if (beaches.length > 0) {
      for (const beach of beaches) {
        output += `--- BEACH: ${beach.name} (${beach.id}) ---\n`;
        output += `Optimal Wind: ${JSON.stringify(beach.optimalWindDirections)}\n`;
        output += `Region: ${beach.regionId}\n`;

        const scores = await prisma.beachDailyScore.findMany({
          where: { beachId: beach.id },
          orderBy: { date: 'desc' },
          take: 10
        });

        output += "--- RECENT SCORES ---\n";
        scores.forEach(s => {
          output += `Source: ${s.source} | Date: ${s.date.toISOString().split('T')[0]} | Rating: ${s.starRating} | Score: ${s.score} | Wind: ${JSON.stringify((s.conditions as any).windDirection)} deg\n`;
        });
        output += "\n";
      }
    } else {
      output += "No beaches found with 'Second'\n";
    }
    
    fs.writeFileSync('beach_stats.txt', output);
    console.log("Stats written to beach_stats.txt");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
