async function test() {
  const BACKEND_URL = "http://127.0.0.1:4050";
  const beachId = "crayfish-factory";
  const date = "2026-05-28";
  const backendUrl = `${BACKEND_URL}/api/beach-ratings/beach-scores?beachId=${beachId}&date=${date}`;
  
  console.log("--- Test 1: Fetch with NO headers ---");
  try {
    const response = await fetch(backendUrl);
    console.log(`Response status: ${response.status}`);
    const data = await response.json();
    console.log("Scores length:", data?.scores?.length);
    console.log("Data sample:", JSON.stringify(data).substring(0, 300));
  } catch (error: any) {
    console.error("Test 1 failed:", error.message);
  }

  console.log("\n--- Test 2: Fetch with empty Cookie header ---");
  try {
    const response = await fetch(backendUrl, {
      headers: {
        Cookie: "",
      }
    });
    console.log(`Response status: ${response.status}`);
    const data = await response.json();
    console.log("Scores length:", data?.scores?.length);
  } catch (error: any) {
    console.error("Test 2 failed:", error.message);
  }

  console.log("\n--- Test 3: Fetch with credentials: 'include' ---");
  try {
    const response = await fetch(backendUrl, {
      credentials: "include"
    } as any);
    console.log(`Response status: ${response.status}`);
    const data = await response.json();
    console.log("Scores length:", data?.scores?.length);
  } catch (error: any) {
    console.error("Test 3 failed:", error.message);
  }
}

test();
