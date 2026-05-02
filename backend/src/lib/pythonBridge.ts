import { spawn } from "child_process";
import path from "path";
import { BaseForecastData } from "./types";

export class PythonBridge {
  private static readonly SCRAPER_PATH = path.join(process.cwd(), "scripts", "semantic_scraper.py");
  private static readonly INTEL_PATH = path.join(process.cwd(), "scripts", "generate_intelligence.py");

  static async runSemanticScrape(url: string, regionId: string): Promise<BaseForecastData[]> {
    return new Promise((resolve, reject) => {
      console.log(`[PythonBridge] 🚀 Launching semantic scraper for ${regionId}...`);
      
      const pythonCommand = process.platform === "win32" ? "python" : "python3";
      
      const pythonProcess = spawn(pythonCommand, [
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
            trend: f.trend,
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

  static async generateIntelligenceReport(beach: string, windSpeed: number, windDir: string, swellHeight: number, swellPeriod: number, swellDir: string, score: number, persona: string, trend?: string, mode: string = "daily"): Promise<string> {
    return new Promise((resolve, reject) => {
      console.log(`[PythonBridge] 🧠 Generating ${mode} ${persona} intel for ${beach}...`);
      
      const pythonCommand = process.platform === "win32" ? "python" : "python3";
      const args = [
        this.INTEL_PATH,
        "--beach", beach,
        "--wind_speed", windSpeed.toString(),
        "--wind_dir", windDir,
        "--swell_height", swellHeight.toString(),
        "--swell_period", swellPeriod.toString(),
        "--swell_dir", swellDir,
        "--score", score.toString(),
        "--persona", persona,
        "--trend", trend || "",
        "--mode", mode
      ];

      console.log(`[PythonBridge] 🚀 Executing: ${pythonCommand} ${args.join(" ")}`);
      
      const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn(`[PythonBridge] ⚠️ Neither GOOGLE_API_KEY nor GEMINI_API_KEY is set in Node process.env!`);
      } else {
        const keySource = process.env.GOOGLE_API_KEY ? "GOOGLE_API_KEY" : "GEMINI_API_KEY";
        console.log(`[PythonBridge] ✅ ${keySource} found (length: ${apiKey.length})`);
      }

      const pythonProcess = spawn(pythonCommand, args, {
        env: { ...process.env }
      });

      let stdout = "";
      let stderr = "";

      pythonProcess.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      pythonProcess.on("close", (code) => {
        if (code !== 0) {
          const errorMessage = stderr.trim() || "Python process exited with non-zero code";
          console.error(`[PythonBridge] ❌ Intel generation failed (code ${code}): ${errorMessage}`);
          reject(new Error(`Intel generation failed: ${errorMessage}`));
          return;
        }

        try {
          const result = JSON.parse(stdout);
          resolve(result.report);
        } catch (err) {
          reject(err);
        }
      });
    });
  }
}
