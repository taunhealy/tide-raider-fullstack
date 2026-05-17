import { spawn } from "child_process";
import path from "path";
import { BaseForecastData } from "./types";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

  static async generateIntelligenceReportNode(
    beach: string,
    windSpeed: number,
    windDir: string,
    swellHeight: number,
    swellPeriod: number,
    swellDir: string,
    score: number,
    persona: string,
    trend?: string,
    mode: string = "daily"
  ): Promise<string> {
    console.log(`[PythonBridge] 🧠 Executing Pure Node.js Gemini SDK for ${beach} (${mode})...`);
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Neither GOOGLE_API_KEY nor GEMINI_API_KEY is configured in Node process.env");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let systemPrompt = "";
    let userPrompt = "";

    const activePersona = persona.toUpperCase();

    if (mode === "weekly" || mode === "tactical") {
      const durationLabel = mode === "weekly" ? "7-Day" : "3-Day";
      systemPrompt = `You are a Precision Surf Intelligence AI assigned to a specific maritime asset in the Western Cape. MISSION CRITICAL: You must only report on the beach break specified in the USER PROMPT. Do not include data for neighboring beaches in the same sector. Strategic Reporting Protocols:
1. IDENTIFIER: Every report must start with: 'TACTICAL BRIEFING: [BEACH NAME]'.
2. SPORT DNA: You are generating this for the ${activePersona} category. Adjust your physics engine accordingly. (e.g., Foiling cares about period/energy; Kiting cares about wind speed/gusts; Surfing cares about face integrity).
3. HISTORICAL CORRELATION: If 'HISTORICAL MEMORY' is provided, cross-reference it. If a user logged a 'shallow sandbar' yesterday, warn that today's high-period swell may cause heavy close-outs.
4. VERIFIED RATINGS: Assign Star Ratings (⭐⭐⭐⭐⭐/5) based on 'ALGO_SCORE': (8-10: ⭐⭐⭐⭐⭐, 6-8: ⭐⭐⭐⭐, 4-6: ⭐⭐⭐, 2-4: ⭐⭐, 0-2: ⭐).
5. DEDUCTION REASONING: Use the 'Deductions' provided in the context to explain why a rating might be suppressed (e.g., 'Rating suppressed due to cross-shore wind component').
6. MULTI-SWELL ANALYSIS: Explicitly look for 'Swell 2' and 'Swell 3' in the provided tactical snapshots. If secondary or tertiary swell trains are present, analyze their impact on face integrity and set frequency. For example, a crossing Swell 2 can cause peaky, unstable conditions, while a reinforcing Swell 2 can lead to double-up sets.
7. TONE: ${activePersona}.

Format: 3-4 specialized maritime paragraphs. No markdown. No bolding. No hashtags. Absolute technical precision required.`;

      userPrompt = `Generate a ${activePersona} ${durationLabel} Strategic Outlook EXCLUSIVELY for the following asset:
TARGET ASSET: ${beach}
Provided Forecast Data:
${trend || 'Data pending'}`;
    } else {
      systemPrompt = `You are a specialized Daily Reconnaissance AI. your goal is a single-spot situational report. MISSION CRITICAL: Report ONLY on the TARGET ASSET. Do not mention neighboring breaks or general regional trends.

Intelligence Protocols:
1. THE GOLDEN WINDOW: Define the best window for THIS SPOT with a Star Rating.
2. SPOT DNA SYNC: Explictly cite how the current swell/wind aligns with THIS SPOT's optimal directions.
3. TIDE & GEAR: Provide advice for THIS SPOT's specific topography.
4. TONE: ${activePersona}.

Format: 3-4 high-technical sentences. Lead with: 'DAILY RECON: [BEACH NAME]'. No markdown.`;

      userPrompt = `Generate a ${activePersona} Daily Outlook EXCLUSIVELY for:
TARGET ASSET: ${beach}
Swell: ${swellHeight}m @ ${swellPeriod}s ${swellDir}.
Wind: ${windSpeed}kts ${windDir}.
Snapshots:
${trend || 'Stable'}`;
    }

    const response = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      systemInstruction: systemPrompt,
    });

    const resultText = response.response.text();
    if (!resultText) {
      throw new Error("Gemini returned empty text response");
    }

    return resultText;
  }

  static async generateIntelligenceReport(beach: string, windSpeed: number, windDir: string, swellHeight: number, swellPeriod: number, swellDir: string, score: number, persona: string, trend?: string, mode: string = "daily"): Promise<string> {
    console.log(`[PythonBridge] 🧠 Generating ${mode} ${persona} intel for ${beach}...`);
    
    // First, try running the pure Node.js Gemini SDK directly since it is 100x faster, uses less memory, and doesn't require Python setup in container!
    try {
      return await this.generateIntelligenceReportNode(beach, windSpeed, windDir, swellHeight, swellPeriod, swellDir, score, persona, trend, mode);
    } catch (nodeError: any) {
      console.warn(`[PythonBridge] ⚠️ Pure Node.js Gemini SDK failed: ${nodeError?.message || nodeError}. Falling back to Python bridge...`);
    }

    return new Promise((resolve, reject) => {
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
