import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { ScoreService } from "@/app/services/scores/ScoreService";
import { getLatestConditions } from "@/app/api/surf-conditions/route";

// Use Node.js runtime for puppeteer/chromium support
export const runtime = "nodejs";

// Vercel automatically protects cron job routes
// No need to check for a secret as only Vercel can call this endpoint
export async function GET(request: Request) {
  try {
    // Get all regions
    const regions = await prisma.region.findMany();
    console.log(`Found ${regions.length} regions to process`);

    // Process each region sequentially to avoid overwhelming the database
    for (const region of regions) {
      try {
        console.log(`Processing region: ${region.name} (${region.id})`);

        // Get latest conditions for the region
        const conditions = await getLatestConditions(false, region.id);

        if (!conditions) {
          console.log(
            `No conditions found for region ${region.id}, skipping...`
          );
          continue;
        }

        // Calculate and store scores for this region
        await ScoreService.calculateAndStoreScores(region.id, conditions);
        console.log(`Successfully processed region ${region.id}`);
      } catch (error) {
        console.error(`Error processing region ${region.id}:`, error);
        // Continue with next region even if one fails
        continue;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${regions.length} regions`,
    });
  } catch (error) {
    console.error("Cron job failed:", error);
    return NextResponse.json(
      { error: "Failed to process regions" },
      { status: 500 }
    );
  }
}
