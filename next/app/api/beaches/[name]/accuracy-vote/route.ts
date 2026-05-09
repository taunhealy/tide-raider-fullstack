import { NextResponse } from "next/server";
import { API_CONFIG } from "@/app/lib/api-config";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const body = await request.json();
  const backendUrl = API_CONFIG.baseUrl;

  try {
    // Using 'name' parameter from Next.js as the 'id' for the backend
    const backendApiUrl = `${backendUrl}/api/beaches/${name}/accuracy-vote`;

    const response = await fetch(backendApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to submit accuracy vote" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[accuracy-vote-proxy] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
