import { spawn } from "child_process";
import path from "path";
import { BaseForecastData } from "./types";

export class PythonBridge {
  private static readonly SCRAPER_PATH = path.join(process.cwd(), "scripts", "semantic_scraper.py");

  static async runSemanticScrape(url: string, regionId: string): Promise<BaseForecastData[]> {
    return new Promise((resolve, reject) => {
      console.log(`[PythonBridge] 🚀 Launching semantic scraper for ${regionId}...`);
      
      const pythonProcess = spawn("python", [
        this.SCRAPER_PATH,
        "--url", url,
        "--region", regionId
      ]);

      let stdout = "";
      let stderr = "";

      pythonProcess.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        const msg = data.toString();
        // Pipe stderr to our console for visibility of Python logs
        process.stderr.write(`[Python] ${msg}`);
        stderr += msg;
      });

      pythonProcess.on("close", (code) => {
        if (code !== 0) {
          console.error(`[PythonBridge] ❌ Scraper failed with code ${code}. Error: ${stderr}`);
          reject(new Error(`Python process exited with code ${code}`));
          return;
        }

        try {
          // Find the JSON block in the output (it might be surrounded by logs)
          const jsonMatch = stdout.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error("No JSON found in scraper output");
          }
          
          const result = JSON.parse(jsonMatch[0]);
          const forecasts: BaseForecastData[] = result.forecasts.map((f: any) => ({
            regionId: regionId,
            date: new Date(f.date),
            windSpeed: f.windSpeed,
            windDirection: f.windDirection,
            swellHeight: f.swellHeight,
            swellPeriod: f.swellPeriod,
            swellDirection: f.swellDirection,
          }));
          
          console.log(`[PythonBridge] ✅ Successfully extracted ${forecasts.length} forecasts.`);
          resolve(forecasts);
        } catch (err) {
          console.error(`[PythonBridge] ❌ Failed to parse scraper output:`, err);
          console.debug(`[PythonBridge] Raw stdout:`, stdout);
          reject(err);
        }
      });
    });
  }
}
