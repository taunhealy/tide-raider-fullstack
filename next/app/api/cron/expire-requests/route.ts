import { NextResponse } from "next/server";
import { handleRequestExpiration } from "@/app/lib/rentalRequests";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// Vercel Cron Job - runs every hour
export const maxDuration = 300; // 5 minutes timeout
export async function GET(request: Request) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await handleRequestExpiration();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cron job failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
