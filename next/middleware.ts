import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // 1. Check for auth-token (our custom JWT)
  const token = request.cookies.get("auth-token")?.value;

  // 2. Define protected paths
  // /raidlogs and all its subpaths are protected
  const isRaidLogs = pathname.startsWith("/raidlogs");
  
  // Pagination on /raid is gated from page 2 onwards
  const page = parseInt(searchParams.get("page") || "1", 10);
  const isPageGated = pathname === "/raid" && page >= 2;

  // 3. If accessing protected resource without token, redirect to login
  if ((isRaidLogs || isPageGated) && !token) {
    const loginUrl = new URL("/login", request.url);
    // Store the original destination to redirect back after login
    const targetPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
    loginUrl.searchParams.set("callbackUrl", targetPath);
    
    return NextResponse.redirect(loginUrl);
  }

  // 4. Continue with Supabase session update (for legacy support if needed)
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
