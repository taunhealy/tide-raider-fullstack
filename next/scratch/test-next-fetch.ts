async function test() {
  const BACKEND_URL = "https://tide-raider-backend-o6rx5gs5rq-ew.a.run.app";
  const beachId = "crayfish-factory";
  const date = "2026-05-28";
  const backendUrl = `${BACKEND_URL}/api/beach-ratings/beach-scores?beachId=${beachId}&date=${date}`;
  
  console.log(`Fetching from: ${backendUrl}`);
  try {
    const response = await fetch(backendUrl);
    console.log(`Response status: ${response.status}`);
    const data = await response.json();
    console.log("Data:", JSON.stringify(data).substring(0, 300));
  } catch (error: any) {
    console.error("Fetch failed:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
  }
}

test();
