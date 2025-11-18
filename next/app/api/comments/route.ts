import { NextRequest, NextResponse } from "next/server";
import { backendGet, backendPost } from "@/app/lib/backend-api";

// GET /api/comments?entityId=xxx&entityType=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityId = searchParams.get("entityId");
    const entityType = searchParams.get("entityType");

    if (!entityId || !entityType) {
      return NextResponse.json(
        { error: "Missing entityId or entityType" },
        { status: 400 }
      );
    }

    const comments = await backendGet(
      `/api/comments?entityId=${entityId}&entityType=${entityType}`
    );

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST /api/comments
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, entityId, entityType } = body;

    if (!text || !entityId || !entityType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const comment = await backendPost("/api/comments", {
      text,
      entityId,
      entityType,
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
