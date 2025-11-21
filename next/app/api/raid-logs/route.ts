import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

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
 * Proxy to backend /api/raid-logs
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;
    const body = await req.json();

    // CRITICAL: Strip legacy forecast fields before sending to backend
    // Production backend still validates these fields and will fail
    let cleanedBody = { ...body };

    // Log original body for debugging
    if (cleanedBody.forecast) {
      console.log("[raid-logs] Original forecast in body:", {
        hasForecastId: !!cleanedBody.forecastId,
        forecastKeys: Object.keys(cleanedBody.forecast),
        hasWind: cleanedBody.forecast.wind !== undefined,
        hasSwell: cleanedBody.forecast.swell !== undefined,
        hasTimestamp: cleanedBody.forecast.timestamp !== undefined,
      });
    }

    if (cleanedBody.forecast && typeof cleanedBody.forecast === "object") {
      // Remove legacy fields that cause validation errors
      const { wind, swell, timestamp, ...cleanForecast } = cleanedBody.forecast;

      // Only keep new-format fields
      const allowedFields = [
        "id",
        "date",
        "windSpeed",
        "windDirection",
        "swellHeight",
        "swellPeriod",
        "swellDirection",
      ];

      const finalForecast: any = {};
      for (const key of allowedFields) {
        if (cleanForecast[key] !== undefined) {
          finalForecast[key] = cleanForecast[key];
        }
      }

      // If we have forecastId, don't send forecast object at all
      if (cleanedBody.forecastId) {
        console.log(
          "[raid-logs] Removing forecast object because forecastId exists"
        );
        delete cleanedBody.forecast;
      } else if (Object.keys(finalForecast).length > 0) {
        cleanedBody.forecast = finalForecast;
        console.log(
          "[raid-logs] Cleaned forecast:",
          Object.keys(finalForecast)
        );
      } else {
        delete cleanedBody.forecast;
      }

      // Log if we removed legacy fields
      if (
        wind !== undefined ||
        swell !== undefined ||
        timestamp !== undefined
      ) {
        console.warn("[raid-logs] ⚠️ Removed legacy forecast fields:", {
          hadWind: wind !== undefined,
          hadSwell: swell !== undefined,
          hadTimestamp: timestamp !== undefined,
        });
      }
    }

    // Final safety check: Remove forecast if forecastId exists
    if (cleanedBody.forecastId && cleanedBody.forecast) {
      console.warn(
        "[raid-logs] ⚠️ Removing forecast object because forecastId exists"
      );
      delete cleanedBody.forecast;
    }

    const response = await fetch(`${BACKEND_URL}/api/raid-logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        Cookie: cookieStore.toString(),
      },
      credentials: "include",
      body: JSON.stringify(cleanedBody),
    });

    if (!response.ok) {
      // Try to get error message from backend
      const errorData = await response.json().catch(() => ({
        message: "Failed to create log",
      }));
      console.error("[raid-logs] Backend error:", errorData);

      // Extract validation errors if present
      let errorMessage =
        errorData.message || errorData.error || "Failed to create log";

      // If it's a validation error, try to extract more details
      if (response.status === 400 && errorData.details) {
        // Validation middleware returns details array with path and message
        const validationErrors = errorData.details
          .map((detail: any) => {
            const path = detail.path || "field";
            return `${path}: ${detail.message}`;
          })
          .join(", ");
        errorMessage = `Validation failed: ${validationErrors}`;
      } else if (response.status === 400 && errorData.error) {
        // Other validation errors
        errorMessage = errorData.error;
      }

      return NextResponse.json(
        {
          error: errorMessage,
          details: errorData.issues || errorData.details,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating raid log:", error);
    return NextResponse.json(
      { error: "Failed to create log" },
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
