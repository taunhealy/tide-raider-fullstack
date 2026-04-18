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
    const cacheKey = `${beach}-${persona}-${date}`;
    const cached = this.cache[cacheKey];

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log(`[IntelligenceService] ⚡ Memory Cache HIT for ${beach} (${persona})`);
      return cached.report;
    }

    try {
      // 1. Check Database first
      let beachRef = null;
      try {
        beachRef = await prisma.beach.findFirst({
           where: { name: { equals: beach, mode: 'insensitive' } }
        });
        
        if (beachRef) {
           const d = new Date(date);
           d.setUTCHours(0, 0, 0, 0);
           
           // Use try-catch for the specific table query since it might be missing
           try {
              const dbReport = await (prisma as any).intelligenceReport.findUnique({
                 where: {
                    beachId_date_persona: {
                       beachId: beachRef.id,
                       date: d,
                       persona: persona
                    }
                 }
              });
              
              if (dbReport) {
                 console.log(`[IntelligenceService] ✅ DB HIT for ${beach} (${persona})`);
                 this.cache[cacheKey] = { report: dbReport.content, timestamp: Date.now() };
                 return dbReport.content;
              }
           } catch (dbError) {
              console.warn(`[IntelligenceService] ⚠️ IntelligenceReport table may be missing or inaccessible:`, (dbError as any).message);
           }
        }
      } catch (beachError) {
        console.warn(`[IntelligenceService] ⚠️ Could not look up beach reference:`, (beachError as any).message);
      }

      console.log(`[IntelligenceService] 🌐 Fetching NEW Gemini intel for ${beach}...`);
      const report = await PythonBridge.generateIntelligenceReport(
        beach, windSpeed, windDir, swellHeight, swellPeriod, swellDir, score, persona, trend
      );
      
      // 2. Save to Database (Best effort)
      if (beachRef) {
         try {
            const d = new Date(date);
            d.setUTCHours(0, 0, 0, 0);
            
            await (prisma as any).intelligenceReport.upsert({
               where: {
                  beachId_date_persona: {
                     beachId: beachRef.id,
                     date: d,
                     persona: persona
                  }
               },
               create: {
                  beachId: beachRef.id,
                  date: d,
                  persona: persona,
                  content: report
               },
               update: {
                  content: report
               }
            });
            console.log(`[IntelligenceService] 💾 Persisted intel to DB for ${beach}`);
         } catch (saveError) {
            console.warn(`[IntelligenceService] 💾 Failed to persist intel to DB (skipping):`, (saveError as any).message);
         }
      }
      
      this.cache[cacheKey] = {
        report,
        timestamp: Date.now()
      };
      
      return report;
    } catch (error) {
       console.error(`[IntelligenceService] ❌ Failed to generate AI report:`, error);
       return `[CONNECTION ERROR] Intelligence relay scrambled. Conditions: ${score}/10 with ${windDir} winds. Stand by for backup sync.`;
    }
  }
}
