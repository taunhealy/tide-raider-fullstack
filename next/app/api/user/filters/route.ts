import { NextResponse } from "next/server";
import { backendGet, backendPut } from "@/app/lib/backend-api";
import { getServerAuth } from "@/app/lib/server-auth";

export async function POST(req: Request) {
  try {
    const { user } = await getServerAuth();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const filters = await req.json();
    const result = await backendPut(`/api/users/${user.id}/filters`, filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error saving filters:", error);
    return NextResponse.json(
      { error: "Failed to save filters" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { user } = await getServerAuth();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await backendGet(`/api/users/${user.id}/filters`);
    return NextResponse.json(result.filters || null);
  } catch (error) {
    console.error("Error fetching filters:", error);
    return NextResponse.json(
      { error: "Failed to fetch filters" },
      { status: 500 }
    );
  }
}
