import { NextRequest, NextResponse } from "next/server";

// Use NEXT_PUBLIC_API_URL if set, otherwise default to production
const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://tide-raider-backend.fly.dev";

/**
 * GET /api/beaches/[name]
 * Proxy to backend /api/beaches/:name
 * The backend handles all beach lookups by name or ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const beachName = decodeURIComponent(name);

    console.log(`[beaches/[name]] Looking up beach: "${beachName}"`);

    // Proxy to backend
    const backendUrl = `${BACKEND_URL}/api/beaches/${encodeURIComponent(beachName)}`;

    console.log(`[beaches/[name]] Proxying to backend: ${backendUrl}`);

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        const errorData = await response.json().catch(() => ({}));
        return NextResponse.json(
          {
            error: "Beach not found",
            message: errorData.message || `Could not find beach: ${beachName}`,
          },
          { status: 404 }
        );
      }
      const error = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(error.error || "Failed to fetch beach");
    }

    const data = await response.json();

    // The backend returns { beach: {...} }, but we need to transform it
    const beach = data.beach || data;

    // Transform the data to ensure proper typing
    const transformedBeach = {
      ...beach,
      optimalWindDirections: Array.isArray(beach.optimalWindDirections)
        ? beach.optimalWindDirections
        : [],
      optimalSwellDirections:
        typeof beach.optimalSwellDirections === "object" &&
        beach.optimalSwellDirections !== null
          ? beach.optimalSwellDirections
          : { min: 0, max: 0, cardinal: "N" },
      swellSize:
        typeof beach.swellSize === "object" && beach.swellSize !== null
          ? beach.swellSize
          : { min: 0, max: 0 },
      idealSwellPeriod:
        typeof beach.idealSwellPeriod === "object" &&
        beach.idealSwellPeriod !== null
          ? beach.idealSwellPeriod
          : { min: 0, max: 0 },
    };

    console.log(
      `[beaches/[name]] Found beach: "${transformedBeach.name}" (ID: ${transformedBeach.id})`
    );
    return NextResponse.json(transformedBeach);
  } catch (error) {
    console.error("[beaches/[name]] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch beach details" },
      { status: 500 }
    );
  }
}
