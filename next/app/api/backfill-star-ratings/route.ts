import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";

/**
 * Backfill starRating for existing BeachDailyScore records
 * This calculates starRating from score for records where starRating is null
 */
export async function GET() {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    console.log("🔄 Starting starRating backfill...");

    // Find all records with null starRating
    const recordsToUpdate = await prisma.beachDailyScore.findMany({
      where: {
        starRating: null,
      },
      select: {
        id: true,
        beachId: true,
        score: true,
      },
    });

    console.log(`📊 Found ${recordsToUpdate.length} records to update`);

    let updated = 0;
    let errors = 0;

    // Update each record
    for (const record of recordsToUpdate) {
      try {
        // Calculate starRating from score (0-10 scale to 1-5 stars)
        // Score 0-1.99 = 0 stars, 2-3.99 = 1 star, 4-5.99 = 2 stars, 6-7.99 = 3 stars, 8-9.99 = 4 stars, 10 = 5 stars
        const scoreOutOfFive = Math.floor(record.score / 2);
        const starRating = Math.max(1, Math.min(5, scoreOutOfFive)); // Clamp between 1-5

        await prisma.beachDailyScore.update({
          where: { id: record.id },
          data: { starRating },
        });

        updated++;
      } catch (error) {
        console.error(`Error updating record ${record.id}:`, error);
        errors++;
      }
    }

    console.log(`✅ Backfill complete: ${updated} updated, ${errors} errors`);

    return NextResponse.json({
      success: true,
      message: "Star rating backfill completed",
      totalRecords: recordsToUpdate.length,
      updated,
      errors,
    });
  } catch (error) {
    console.error("❌ Error in backfill:", error);
    return NextResponse.json(
      {
        error: "Failed to backfill star ratings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

