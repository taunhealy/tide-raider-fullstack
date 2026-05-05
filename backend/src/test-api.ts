import axios from "axios";

async function testApi() {
  const baseUrl = "http://localhost:4050/api";
  
  try {
    console.log("Testing with WINDY...");
    const res = await axios.get(`${baseUrl}/filtered-beaches`, {
      params: {
        regionId: "western-cape",
        timeSlot: "MORNING",
        forecastDate: "2026-05-05",
        source: "WINDY"
      }
    });
    console.log(`WINDY: Found ${res.data.beaches?.length} beaches`);

  } catch (error: any) {
    console.error("API Error:", error.response?.data || error.message);
  }
}

testApi();
