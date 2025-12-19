import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { businessName, contactName, email, paypalEmail } = await request.json();

    // Basic Validation
    if (!businessName || !email || !paypalEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Proxy request to Backend
    // In production, use backend URL
    const getBackendUrl = () => {
      const isDevelopment = process.env.NODE_ENV === "development";
      const envUrl = process.env.NEXT_PUBLIC_API_URL;
      
      if (isDevelopment) {
        return envUrl || "http://localhost:4001";
      }
      return envUrl || "https://tide-raider-backend-82632174665.europe-west1.run.app";
    };

    const BACKEND_URL = getBackendUrl();
    const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "temp-api-key"; 

    // Forward to Backend API
    const response = await fetch(`${BACKEND_URL}/api/partners/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
         // Pass a secret header if you want to restrict this to only your frontend
         // "x-api-key": API_KEY 
      },
      body: JSON.stringify({
        businessName,
        contactName,
        email,
        paypalEmail
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Backend processing failed" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error("Partner registration proxy error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
