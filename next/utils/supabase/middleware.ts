import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Resilience: Ensure URL starts with http to prevent [Error: Invalid supabaseUrl] crash
  if (!supabaseUrl || !supabaseUrl.startsWith('http') || !supabaseKey) {
    if (process.env.NODE_ENV === 'development') {
      console.warn("Invalid or missing Supabase environment variables in middleware");
    }
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    });

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake can make it very hard to debug
    // auth issues.
    await supabase.auth.getUser();

    return supabaseResponse;
  } catch (error) {
    console.error("Middleware updateSession error:", error);
    return supabaseResponse;
  }
}
