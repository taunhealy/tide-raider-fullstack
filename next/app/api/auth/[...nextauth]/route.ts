import NextAuth from "next-auth";
import { authOptions } from "@/app/lib/authOptions";
import { NextRequest, NextResponse } from "next/server";

// Import from single source of truth
import { getBackendUrl } from "@/app/lib/api-config";

const BACKEND_URL = getBackendUrl();

const handler = NextAuth(authOptions);

// Intercept Google OAuth requests and redirect to backend
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ nextauth: string[] }> }
) {
  const { nextauth } = await params;
  const pathSegments = nextauth || [];
  const path = pathSegments.join("/");

  // If it's a direct Google OAuth request, redirect to backend
  if (path === "google") {
    const searchParams = req.nextUrl.searchParams;
    const state = searchParams.get("state") || encodeURIComponent("/raid");

    console.log(
      `[NextAuth Route] Redirecting direct Google OAuth to backend: ${BACKEND_URL}/api/auth/google`
    );
    
    // In development, check if backend URL is localhost and log a helpful message
    if (process.env.NODE_ENV === "development" && BACKEND_URL.includes("localhost")) {
      console.log(
        `[NextAuth Route] ⚠️ Make sure backend is running at ${BACKEND_URL}`
    );
    }
    
    // Redirect to backend OAuth
    return NextResponse.redirect(
      `${BACKEND_URL}/api/auth/google?state=${state}`
    );
  }

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
