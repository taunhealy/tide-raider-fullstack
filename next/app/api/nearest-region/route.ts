import { NextResponse } from "next/server";
import { headers } from "next/headers";

// Helper function to calculate distance between two coordinates
function getDistanceFromLatLonInKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export async function GET() {
  try {
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for") ||
      headersList.get("x-real-ip") ||
      "127.0.0.1";

    // Use a geolocation service (free tier)
    const response = await fetch(`https://ipapi.co/${ip}/json/`);

    if (!response.ok) {
      throw new Error("Failed to fetch location data");
    }

    const data = await response.json();

    return NextResponse.json({
      country: data.country_name,
      region: data.region,
      continent: data.continent_name || "",
      latitude: data.latitude,
      longitude: data.longitude,
    });
  } catch (error) {
    console.error("Error fetching location:", error);
    return NextResponse.json(
      { error: "Failed to determine location" },
      { status: 500 }
    );
  }
}
