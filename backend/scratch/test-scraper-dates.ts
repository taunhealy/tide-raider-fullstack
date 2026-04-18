import { PythonBridge } from "./src/lib/pythonBridge";
import { config } from "dotenv";

config();

async function test() {
  const url = "https://www.windfinder.com/weatherforecast/muizenberg";
  try {
    const results = await PythonBridge.runSemanticScrape(url, "western-cape");
    console.log("--- Scraped Dates ---");
    results.forEach(r => console.log(r.date.toISOString()));
  } catch (err) {
    console.error(err);
  }
}

test();
