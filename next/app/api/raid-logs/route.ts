import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";

// Use NEXT_PUBLIC_API_URL if set, otherwise use environment-appropriate default
const getBackendUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  const isDevelopment = process.env.NODE_ENV === "development";

  // In development, use localhost backend (connects to Docker postgres)
  if (isDevelopment) {
    return envUrl || "http://localhost:4001";
  }

  // In production, use production backend (connects to Fly.io postgres)
  return envUrl || "https://tide-raider-backend.fly.dev";
};

const BACKEND_URL = getBackendUrl();

/**
 * Proxy request to backend (fallback when Prisma not available)
 */
async function proxyToBackend(req: NextRequest, method: string, body?: any) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;

    // If body not provided, read from request
    const requestBody =
      body ||
      (method === "POST" || method === "PUT" ? await req.json() : undefined);

    const response = await fetch(`${BACKEND_URL}/api/raid-logs`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        Cookie: cookieStore.toString(),
      },
      credentials: "include",
      ...(requestBody && { body: JSON.stringify(requestBody) }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: "Failed to create log",
      }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error proxying to backend:", error);
    return NextResponse.json(
      { error: "Failed to create log" },
      { status: 500 }
    );
  }
}

/**
 * Get authenticated user from backend auth token
 */
async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;

    if (!authToken) {
      return null;
    }

    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Cookie: cookieStore.toString(),
      },
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error("[getAuthenticatedUser] Error:", error);
    return null;
  }
}

/**
 * GET /api/raid-logs
 * Proxy to backend /api/raid-logs
 */
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;
    const searchParams = req.nextUrl.searchParams.toString();
    const queryString = searchParams ? `?${searchParams}` : "";

    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout (reduced from 30)

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/raid-logs${queryString}`,
        {
          headers: {
            ...(authToken && { Authorization: `Bearer ${authToken}` }),
            Cookie: cookieStore.toString(),
          },
          credentials: "include",
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Handle 429 gracefully
        if (response.status === 429) {
          return NextResponse.json(
            { error: "Too many requests, please try again later" },
            { status: 429 }
          );
        }
        // Return empty result for errors instead of failing
        if (response.status >= 500) {
          console.error(`[raid-logs] Backend error ${response.status}`);
          return NextResponse.json({
            entries: [],
            total: 0,
            page: 1,
            limit: 50,
            totalPages: 0,
          });
        }
        return NextResponse.json(
          { error: "Failed to fetch logs" },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json(data);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === "AbortError") {
        console.error("[raid-logs] Request timeout");
        return NextResponse.json({
          entries: [],
          total: 0,
          page: 1,
          limit: 50,
          totalPages: 0,
        });
      }
      throw fetchError;
    }
  } catch (error) {
    console.error("Error fetching raid logs:", error);
    // Return empty result instead of error to prevent UI hanging
    return NextResponse.json({
      entries: [],
      total: 0,
      page: 1,
      limit: 50,
      totalPages: 0,
    });
  }
}

/**
 * POST /api/raid-logs
 * Create log entry directly using Prisma (if DATABASE_URL is set)
 * Otherwise, fall back to proxying to backend
 */
export async function POST(req: NextRequest) {
  try {
    // Read body once (can only be read once)
    const body = await req.json();

    // Check if we can use Prisma directly (DATABASE_URL must be set)
    const canUsePrisma = !!process.env.DATABASE_URL;

    if (!canUsePrisma) {
      // Fall back to proxying to backend
      console.log("[raid-logs] DATABASE_URL not set, proxying to backend");
      return proxyToBackend(req, "POST", body);
    }

    // Get authenticated user
    const user = await getAuthenticatedUser();
    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const {
      date,
      surferEmail,
      surferName,
      beachName,
      regionId,
      surferRating,
      comments,
      isPrivate,
      isAnonymous,
      imageUrl,
      imageUrls,
      videoUrl,
      videoPlatform,
      forecastId,
      forecast,
      beachId,
    } = body;

    // Validate required fields
    if (!date || !regionId) {
      return NextResponse.json(
        { error: "Missing required fields: date and regionId are required" },
        { status: 400 }
      );
    }

    // Handle forecast: create if provided, or use existing forecastId
    let finalForecastId: string | undefined = forecastId;

    if (!finalForecastId && forecast && typeof forecast === "object") {
      // Create new forecast if forecast data is provided
      const forecastDate = forecast.date
        ? new Date(forecast.date)
        : new Date(date);

      // Check if forecast already exists for this date/region
      const existingForecast = await prisma.forecastA.findUnique({
        where: {
          date_regionId: {
            date: forecastDate,
            regionId: regionId,
          },
        },
      });

      if (existingForecast) {
        finalForecastId = existingForecast.id;
      } else {
        // Create new forecast
        const newForecast = await prisma.forecastA.create({
          data: {
            date: forecastDate,
            regionId: regionId,
            windSpeed: forecast.windSpeed ?? 0,
            windDirection: forecast.windDirection ?? 0,
            swellHeight: forecast.swellHeight ?? 0,
            swellPeriod: forecast.swellPeriod ?? 0,
            swellDirection: forecast.swellDirection ?? 0,
          },
        });
        finalForecastId = newForecast.id;
      }
    }

    // Get or create user in database
    let dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!dbUser) {
      // Create user if doesn't exist
      dbUser = await prisma.user.create({
        data: {
          email: user.email,
          name: user.name || surferName || "Anonymous Surfer",
          image: user.image,
        },
      });
    }

    // Create log entry
    const logEntry = await prisma.logEntry.create({
      data: {
        date: new Date(date),
        surferEmail: surferEmail || user.email,
        surferName: isAnonymous
          ? "Anonymous"
          : surferName || user.name || "Anonymous Surfer",
        beachName: beachName || undefined,
        surferRating: surferRating ?? 0,
        comments: comments || undefined,
        isPrivate: isPrivate ?? false,
        isAnonymous: isAnonymous ?? false,
        imageUrl: imageUrl || undefined,
        imageUrls: imageUrls && imageUrls.length > 0 ? imageUrls : undefined,
        videoUrl: videoUrl || undefined,
        videoPlatform: videoPlatform || undefined,
        regionId: regionId,
        beachId: beachId || undefined,
        forecastId: finalForecastId || undefined,
        userId: dbUser.id,
      },
      include: {
        beach: true,
        region: true,
        forecast: true,
      },
    });

    return NextResponse.json(logEntry);
  } catch (error: any) {
    console.error("Error creating raid log:", error);

    // Handle Prisma unique constraint errors
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A log entry with these details already exists" },
        { status: 409 }
      );
    }

    // Handle Prisma foreign key errors
    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "Invalid reference (beach, region, or forecast not found)" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create log",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/raid-logs
 * Proxy to backend /api/raid-logs
 */
export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;
    const body = await req.json();

    const response = await fetch(`${BACKEND_URL}/api/raid-logs`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        Cookie: cookieStore.toString(),
      },
      credentials: "include",
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to update log" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating raid log:", error);
    return NextResponse.json(
      { error: "Failed to update log" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/raid-logs
 * Proxy to backend /api/raid-logs
 */
export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;
    const searchParams = req.nextUrl.searchParams.toString();
    const queryString = searchParams ? `?${searchParams}` : "";

    const response = await fetch(`${BACKEND_URL}/api/raid-logs${queryString}`, {
      method: "DELETE",
      headers: {
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        Cookie: cookieStore.toString(),
      },
      credentials: "include",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to delete log" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error deleting raid log:", error);
    return NextResponse.json(
      { error: "Failed to delete log" },
      { status: 500 }
    );
  }
}
