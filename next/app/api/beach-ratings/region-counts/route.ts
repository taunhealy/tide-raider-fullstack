import { NextResponse } from "next/server";
import { ScoreService } from "@/app/services/scores/ScoreService";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const date = dateParam ? new Date(dateParam) : new Date();

    const counts = await ScoreService.getRegionCounts(date);

    return NextResponse.json({ counts });
  } catch (error) {
    console.error("Error fetching region counts:", error);
    return NextResponse.json(
      { error: "Failed to fetch region counts" },
      { status: 500 }
    );
  }
}
