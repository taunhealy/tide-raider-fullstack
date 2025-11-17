import { NextResponse } from "next/server";

/**
 * Location/Countries API
 * 
 * Note: This endpoint currently returns an empty array.
 * The frontend should not use Prisma directly - if country data is needed,
 * it should be added to the backend API and accessed via the backend-proxy.
 */
export async function GET() {
  // Return empty array - frontend should not use Prisma directly
  // If country data is needed, add it to the backend API
  return NextResponse.json([]);
}
