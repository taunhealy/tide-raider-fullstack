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
    
    // Whitelist check removed to allow global AI intelligence access via credit system for weekly reports
    // Daily mini-reports remain free but whitelisted to prime sectors if we want to save budget, 
    // but the user requested AI reports for "that beach".
    
    const cacheKey = `${beach}-${persona}-${date}`;
    const cached = this.cache[cacheKey];

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.report;
    }

    try {
      let beachRef = await prisma.beach.findFirst({
         where: { name: { equals: beach, mode: 'insensitive' } }
      });
      
      const reportDate = new Date(date);
      reportDate.setUTCHours(0, 0, 0, 0);

      if (beachRef) {
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
            this.cache[cacheKey] = { report: dbReport.content, timestamp: Date.now() };
            return dbReport.content;
         }
      }

      const dailyForecasts = await prisma.forecast.findMany({
        where: {
          regionId: beachRef?.regionId || "western-cape",
          date: reportDate,
          source: "WINDFINDER"
        }
      });

      const snapshots = ["MORNING", "NOON", "EVENING"].map(slot => {
         const f = dailyForecasts.find(d => d.timeSlot === slot);
         if (!f) return `${slot}: Data pending.`;
         return `${slot}: ${f.swellHeight}m @ ${f.swellPeriod}s ${f.swellDirection}°, wind ${f.windSpeed}kts ${f.windDirection}°`;
      }).join("\n");

      const report = await PythonBridge.generateIntelligenceReport(
        beach, windSpeed, windDir, swellHeight, swellPeriod, swellDir, score, persona, snapshots
      );
      
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
         });
      }
      
      this.cache[cacheKey] = { report, timestamp: Date.now() };
      return report;
    } catch (error) {
       console.error(`[IntelligenceService] AI failure:`, error);
       return `Signal scrambled. Observational data for ${beach} indicates ${score}/10 conditions.`;
    }
  }
  
  static async getWeeklyReportForBeach(beachId: string, date: string, userId: string, personaOverride?: string): Promise<{ report: string, presenterName: string, creditsRemaining: number }> {
    // 1. Authenticate user and check credits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, credits: true }
    });

    if (!user) throw new Error("User not found");
    if (user.credits < 2) throw new Error("INSUFFICIENT_CREDITS");

    const beachRef = await prisma.beach.findUnique({
       where: { id: beachId }
    });

    if (!beachRef) throw new Error("Beach not found");

    // 2. Process Date
    const startDate = new Date(date);
    startDate.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 7);

    // 3. Deduct credit immediately (Atomic update)
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: 2 } },
      select: { credits: true }
    });

    // 4. Generate Report
    const weeklyForecasts = await prisma.forecast.findMany({
      where: {
        regionId: beachRef.regionId,
        date: { gte: startDate, lte: endDate },
        timeSlot: "NOON",
        source: "WINDFINDER"
      },
      orderBy: { date: 'asc' }
    });

    if (weeklyForecasts.length === 0) {
      return { 
        report: "Swell intelligence currently unavailable for this timeframe. Our buoys are recalibrating.",
        presenterName: "Tide Raider Central",
        creditsRemaining: updatedUser.credits
      };
    }

    const context = weeklyForecasts.map(f => {
       const dateStr = f.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
       return `${dateStr}: ${f.swellHeight}m @ ${f.swellPeriod}s ${f.swellDirection}°, wind ${f.windSpeed}kts ${f.windDirection}°`;
    }).join("\n");

    const { getPersonaByCycle } = await import("../constants/intelligence");
    const activePersona = getPersonaByCycle(new Date().getDate());
    const persona = personaOverride || activePersona.id;

    const report = await PythonBridge.generateIntelligenceReport(
      beachRef.name, 
      weeklyForecasts[0].windSpeed, 
      weeklyForecasts[0].windDirection.toString(), 
      weeklyForecasts[0].swellHeight, 
      weeklyForecasts[0].swellPeriod, 
      weeklyForecasts[0].swellDirection.toString(), 
      0, 
      persona, 
      `Weekly Outlook Context (7-Day Forecast):\n${context}`,
      "weekly"
    );

    return { 
      report, 
      presenterName: activePersona.name,
      creditsRemaining: updatedUser.credits
    };
  }

  static async generateWeeklyReport(personaOverride?: string): Promise<{ report: string, presenterName: string }> {
    // This maintains the legacy Muizenberg weekly summary shown on the main dashboard
    try {
      const beach = "Muizenberg";
      const beachRef = await prisma.beach.findFirst({
         where: { name: { contains: beach, mode: 'insensitive' } }
      });

      if (!beachRef) throw new Error("Muizenberg master record not found");

      const startDate = new Date();
      startDate.setUTCHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 7);

      const weeklyForecasts = await prisma.forecast.findMany({
        where: {
          regionId: beachRef.regionId,
          date: { gte: startDate, lte: endDate },
          timeSlot: "NOON",
          source: "WINDFINDER"
        },
        orderBy: { date: 'asc' }
      });

      if (weeklyForecasts.length === 0) return { report: "Forecast pending.", presenterName: "Central" };

      const context = weeklyForecasts.map(f => {
         const dateStr = f.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
         return `${dateStr}: ${f.swellHeight}m @ ${f.swellPeriod}s ${f.swellDirection}°, wind ${f.windSpeed}kts ${f.windDirection}°`;
      }).join("\n");

      const { getPersonaByCycle } = await import("../constants/intelligence");
      const activePersona = getPersonaByCycle(new Date().getDate());
      const report = await PythonBridge.generateIntelligenceReport(
        beach, weeklyForecasts[0].windSpeed, weeklyForecasts[0].windDirection.toString(), 
        weeklyForecasts[0].swellHeight, weeklyForecasts[0].swellPeriod, weeklyForecasts[0].swellDirection.toString(), 
        0, personaOverride || activePersona.id, `Weekly Outlook:\n${context}`, "weekly"
      );
      
      return { report, presenterName: activePersona.name };
    } catch (error) {
       return { report: "Systems offline.", presenterName: "Tide Raider" };
    }
  }
}
