import NextAuth from "next-auth";
import { authOptions } from "@/app/lib/authOptions";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://tide-raider-backend.fly.dev";

const handler = NextAuth(authOptions);

// Intercept Google OAuth requests and redirect to backend
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ nextauth: string[] }> }
) {
  const { nextauth } = await params;
  const pathSegments = nextauth || [];
  const path = pathSegments.join("/");

  // If it's a Google OAuth signin or callback request, redirect to backend
  if (path === "signin/google" || path === "callback/google") {
    const searchParams = req.nextUrl.searchParams;
    const callbackUrl = searchParams.get("callbackUrl") || "/raid";
    const state = encodeURIComponent(callbackUrl);

    console.log(
      `[NextAuth Route] Redirecting Google OAuth to backend: ${path}`
    );
    // Redirect to backend OAuth
    return NextResponse.redirect(
      `${BACKEND_URL}/api/auth/google?state=${state}`
    );
  }

  // For all other NextAuth routes, use the handler
  return handler(
    req as any,
    { params: Promise.resolve({ nextauth: pathSegments }) } as any
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ nextauth: string[] }> }
) {
  const { nextauth } = await params;
  const pathSegments = nextauth || [];
  const path = pathSegments.join("/");

  // If it's a Google OAuth signin request, redirect to backend
  if (path === "signin/google") {
    const formData = await req.formData().catch(() => null);
    const callbackUrl =
      formData?.get("callbackUrl")?.toString() ||
      req.nextUrl.searchParams.get("callbackUrl") ||
      "/raid";
    const state = encodeURIComponent(callbackUrl);

    console.log(`[NextAuth Route] Redirecting Google OAuth POST to backend`);
    // Redirect to backend OAuth
    return NextResponse.redirect(
      `${BACKEND_URL}/api/auth/google?state=${state}`
    );
  }

  // For all other NextAuth routes, use the handler
  return handler(
    req as any,
    { params: Promise.resolve({ nextauth: pathSegments }) } as any
  );
}
