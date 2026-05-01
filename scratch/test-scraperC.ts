import { scraperC } from "./backend/src/lib/scrapers/scraperC";

async function test() {
  try {
    const url = "https://windy.app/forecast2/spot/89110/Muizenberg";
    console.log("Testing scraperC with URL:", url);
    const data = await scraperC(url, "western-cape");
    console.log("Scraped Data:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Test failed:", error);
  }
}

test();
