import { NextResponse } from "next/server";

/**
 * GET /api/user/[userId]/profile
 *
 * Note: This endpoint is deprecated. User profile data should be obtained
 * from the log entry's user relation (entry.user) instead of fetching separately.
 *
 * This route returns 501 (Not Implemented) as the backend doesn't have
 * a /api/user/:userId endpoint, and we avoid using Prisma directly in Next.js
 * to prevent DATABASE_URL dependency issues.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  // Return 501 to indicate this endpoint is not implemented
  // Components should use entry.user data from log entries instead
  // This avoids needing DATABASE_URL in Next.js app
  try {
    const { userId } = await params;
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }
  } catch (error) {
    // If params access fails, still return 501, not 500
    console.warn("Error accessing params in profile route:", error);
  }

  return NextResponse.json(
    {
      error: "User profile endpoint not available",
      message:
        "Please use user data from log entry relation (entry.user) or implement backend endpoint",
    },
    { status: 501 }
  );
}
