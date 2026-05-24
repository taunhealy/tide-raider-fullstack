import { ScoreService } from "../src/services/scoreService";
import { prisma } from "../src/lib/prisma";

async function main() {
  const beach = await prisma.beach.findUnique({
    where: { id: "llandudno" },
    include: { conditionProfiles: true }
  });

  if (!beach) {
    console.error("Llandudno not found in DB!");
    return;
  }

  const profile = beach.conditionProfiles[0];
  console.log("Using updated Llandudno profile from DB:");
  console.log("Optimal Wind:", profile.optimalWindDirections);
  console.log("Ideal Swell Period:", JSON.stringify(profile.idealSwellPeriod));

  // Test Tuesday May 26 conditions
  const conditions = {
    windSpeed: 10,
    windDirection: 202.5, // SSW
    swellHeight: 2.4,
    swellPeriod: 12,
    swellDirection: 228, // SW
  };

  const result = ScoreService.calculateScore(beach, profile, conditions);
  
  if (result) {
    console.log("\n--- RE-CALCULATED RESULTS ---");
    console.log("Calculated Score (out of 5):", result.score);
    console.log("Star Rating (rounded):", Math.max(1, Math.min(5, Math.round(result.score))));
    console.log("Deductions:", result.deductions);
    console.log("Checklist:", JSON.stringify(result.checklist, null, 2));
  } else {
    console.log("Calculation failed!");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
