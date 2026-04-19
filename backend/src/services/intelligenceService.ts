import { PythonBridge } from "../lib/pythonBridge";
import { prisma } from "../lib/prisma";

interface IntelCache {
  [key: string]: {
    report: string;
    timestamp: number;
  };
}

export class IntelligenceService {
  private static cache: IntelCache = {};
  private static readonly CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours (Daily persistence)

  static async getReport(beach: string, windSpeed: number, windDir: string, swellHeight: number, swellPeriod: number, swellDir: string, score: number, persona: string, date: string, trend?: string): Promise<string> {
    
    // 🛡️ STRICT WHITELIST: Only generate AI reports for Muizenberg to protect budget
    const isWhitelisted = beach.toLowerCase().includes("muizenberg");
    if (!isWhitelisted) {
      return `Detailed AI intelligence is currently exclusive to prime sectors like Muizenberg. Observing standard buoy data for ${beach}: ${score}/10 conditions with ${windDir} winds.`;
    }

    const cacheKey = `${beach}-${persona}-${date}`;
    const cached = this.cache[cacheKey];

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log(`[IntelligenceService] ⚡ Memory Cache HIT for ${beach} (${persona})`);
      return cached.report;
    }

    try {
      // 1. Check Database first (Daily Persistence)
      let beachRef = await prisma.beach.findFirst({
         where: { name: { equals: beach, mode: 'insensitive' } }
      });
      
      const reportDate = new Date(date);
      reportDate.setUTCHours(0, 0, 0, 0);

      if (beachRef) {
         try {
            const dbReport = await prisma.intelligenceReport.findUnique({
               where: {
                  beachId_date_persona: {
                     beachId: beachRef.id,
                     date: reportDate,
                     persona: persona
                  }
               }
            });
            
            if (dbReport) {
               console.log(`[IntelligenceService] ✅ DB HIT for ${beach} (${persona})`);
               this.cache[cacheKey] = { report: dbReport.content, timestamp: Date.now() };
               return dbReport.content;
            }
         } catch (dbErr) {
            console.warn("[IntelligenceService] DB lookup failed, proceeding to generation...");
         }
      }

      console.log(`[IntelligenceService] 🌐 Generating Daily Aggregate Intel for ${beach}...`);
      
      // 2. Fetch all 3 time-slots for this beach/day to provide context for the whole day
      // This allows the AI to say "Starts clean, gets messy"
      const dailyForecasts = await prisma.forecast.findMany({
        where: {
          regionId: beachRef?.regionId || "western-cape",
          date: reportDate,
          source: "WINDFINDER"
        }
      });

      // Format snapshots for AI context
      const snapshots = ["MORNING", "NOON", "EVENING"].map(slot => {
         const f = dailyForecasts.find(d => d.timeSlot === slot);
         if (!f) return `${slot}: Data pending.`;
         return `${slot}: ${f.swellHeight}m @ ${f.swellPeriod}s ${f.swellDirection}°, wind ${f.windSpeed}kts ${f.windDirection}°`;
      }).join("\n");

      // 3. Generate the report via Python/Gemini
      // We pass the snapshots as the "Trend" to give it full context
      const report = await PythonBridge.generateIntelligenceReport(
        beach, windSpeed, windDir, swellHeight, swellPeriod, swellDir, score, persona, snapshots
      );
      
      // 4. Save to Database for next time
      if (beachRef) {
         await prisma.intelligenceReport.upsert({
            where: {
               beachId_date_persona: {
                  beachId: beachRef.id,
                  date: reportDate,
                  persona: persona
               }
            },
            update: { content: report },
            create: {
               beachId: beachRef.id,
               date: reportDate,
               persona: persona,
               content: report
            }
         }).catch(e => console.warn("[IntelligenceService] Failed to persist report:", e));
      }
      
      this.cache[cacheKey] = {
        report,
        timestamp: Date.now()
      };
      
      return report;
    } catch (error) {
       console.error(`[IntelligenceService] ❌ AI failure:`, error);
       return `Signal scrambled. Current Muizenberg readout: ${score}/10. Topology: Sand bottom, optimal on the pushing tide.`;
    }
  }
}
