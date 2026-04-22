import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_CONFIG } from "@/app/lib/api-config";

const BACKEND_URL = API_CONFIG.baseUrl;

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;
    const body = await req.json();

    const response = await fetch(`${BACKEND_URL}/api/users/invite-squad`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        Cookie: cookieStore.toString(),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Invite Proxy] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
