import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { processUserAlerts } from "@/app/lib/services/alertProcessor";

export async function POST(request: NextRequest) {
  try {
    // Get userId from request body or use a system user ID
    const { userId } = await request.json();

    // Process alerts for the specified user
    const result = await processUserAlerts(userId, new Date());

    return NextResponse.json({ success: true, processed: result });
  } catch (error) {
    console.error("Error processing alerts:", error);
    return NextResponse.json(
      { error: "Failed to process alerts" },
      { status: 500 }
    );
  }
}

// Make sure there's at least one export
export const dynamic = "force-dynamic";
