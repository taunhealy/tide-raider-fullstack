import { NextResponse } from "next/server";
import { API_CONFIG } from "@/app/lib/api-config";

export async function GET(
  request: Request,
  { params }: { params: { name: string } }
) {
  const { name } = params;
  const { searchParams } = new URL(request.url);
  const backendUrl = API_CONFIG.baseUrl;

  try {
    const queryString = searchParams.toString();
    // Using 'name' parameter from Next.js as the 'id' for the backend
    const backendApiUrl = `${backendUrl}/api/beaches/${name}/rating${queryString ? `?${queryString}` : ""}`;

    const response = await fetch(backendApiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch rating" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[beach-rating-proxy] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
