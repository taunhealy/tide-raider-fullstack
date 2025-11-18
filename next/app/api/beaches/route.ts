// app/api/beaches/route.ts
import { NextResponse } from "next/server";
import { backendGet } from "@/app/lib/backend-api";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const regionId = searchParams.get("regionId");

    const url = regionId 
      ? `/api/beaches?regionId=${regionId}`
      : "/api/beaches";
    
    const result = await backendGet(url);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch beaches:", error);
    return NextResponse.json(
      { error: "Failed to fetch beaches" },
      { status: 500 }
    );
  }
}
