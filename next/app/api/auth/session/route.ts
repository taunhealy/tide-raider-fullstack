import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/lib/authOptions";
import { getCachedSession, cacheUserSession } from "@/app/lib/auth-cache";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session) {
    return NextResponse.json(session);
  }
  return NextResponse.json(null);
}
