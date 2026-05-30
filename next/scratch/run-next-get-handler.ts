import { NextRequest } from "next/server";
import { GET } from "../app/api/beach-scores/route";

async function run() {
  const url = new URL("http://localhost:3000/api/beach-scores?beachId=crayfish-factory&date=2026-05-28");
  const request = new NextRequest(url);

  console.log("🚀 Running local GET handler simulation...");
  try {
    const response = await GET(request);
    console.log(`Response status: ${response.status}`);
    const data = await response.json();
    console.log("Response body:", JSON.stringify(data, null, 2));
  } catch (error: any) {
    console.error("Handler threw error:", error);
  }
}

run();
