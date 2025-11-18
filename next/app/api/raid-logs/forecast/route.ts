import { NextResponse } from "next/server";
import { backendGet } from "@/app/lib/backend-api";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
  const { searchParams } = new URL(req.url);
  const region = searchParams.get("region");
  const date = searchParams.get("date");

  if (!region || !date) {
    return NextResponse.json(
      { error: "Missing region or date" },
      { status: 400 }
    );
  }

    const forecast = await backendGet(
      `/api/raid-logs/forecast?region=${region}&date=${date}`
    );

    return NextResponse.json(forecast);
  } catch (error) {
    console.error("Error fetching forecast:", error);
    return NextResponse.json(
      { error: "Failed to fetch forecast" },
      { status: 500 }
    );
  }
}
