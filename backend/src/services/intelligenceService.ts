import { PythonBridge } from "../lib/pythonBridge";
import { prisma } from "../lib/prisma";
import { ScoreService } from "./scoreService";

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
         const dbReport = await prisma.intelligenceReport.findFirst({
            where: {
              beachId: beachRef.id,
              userId: null, // Global cache reports have no user ID
              date: reportDate,
              persona: persona,
              duration: 1
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
               intel_history_unique: {
                  beachId: beachRef.id,
                  userId: null,
                  date: reportDate,
                  persona: persona,
                  duration: 1
               }
            },
            update: { content: report },
            create: {
               beachId: beachRef.id,
               userId: null,
               date: reportDate,
               persona: persona,
               content: report,
               duration: 1
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
  
  static async getTimedReportForBeach(beachId: string, date: string, userId: string, days: number = 7, personaOverride?: string): Promise<{ report: string, presenterName: string, creditsRemaining: number }> {
    // 1. Authenticate user and check credits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, credits: true }
    });

    if (!user) throw new Error("User not found");
    
    // Credit cost: 1 credit for 1 day, 4 credits for 3 days or more.
    const creditCost = days <= 1 ? 1 : 4;
    
    if (user.credits < creditCost) throw new Error("INSUFFICIENT_CREDITS");

    const beachRef = await prisma.beach.findUnique({
       where: { id: beachId }
    });

    if (!beachRef) throw new Error("Beach not found");

    // 2. Process Date
    const startDate = new Date(date);
    startDate.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + days);

    // 3. Deduct credit immediately (Atomic update)
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: creditCost } },
      select: { credits: true }
    });

    try {
      // 4. Generate Report
      const forecasts = await prisma.forecast.findMany({
        where: {
          regionId: beachRef.regionId,
          date: { gte: startDate, lt: endDate },
          timeSlot: "NOON",
          source: "WINDFINDER"
        },
        orderBy: { date: 'asc' }
      });

      if (forecasts.length === 0) {
        // Refund if no data found
        await prisma.user.update({
          where: { id: userId },
          data: { credits: { increment: creditCost } }
        });
        
        return { 
          report: `Swell intelligence currently unavailable for this ${days}-day timeframe.`,
          presenterName: "Tide Raider Central",
          creditsRemaining: updatedUser.credits + creditCost
        };
      }

      const context = forecasts.map(f => {
         const dateStr = f.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
         const score = 0; // Score calculation requires profile data not available in this context
         return `${dateStr}: ${f.swellHeight}m @ ${f.swellPeriod}s ${f.swellDirection}°, wind ${f.windSpeed}kts ${f.windDirection}°, Tide: ${f.tide || 'N/A'}, ALGO_SCORE: ${score.toFixed(1)}/10`;
      }).join("\n");

      const { getPersonaByCycle } = await import("../constants/intelligence");
      const activePersona = getPersonaByCycle(new Date().getDate());
      const persona = personaOverride || activePersona.id;

      // Fetch the GENERAL condition profile to build spot rules
      const conditionProfile = await (prisma as any).beachConditionProfile.findFirst({
        where: { beachId: beachRef.id, category: "GENERAL" }
      });

      // Construct Spot Rules to guide the AI with specific expertise
      const optimalWind = conditionProfile?.optimalWindDirections?.join(", ") || "N/A";
      const swellDir = conditionProfile?.optimalSwellDirections 
        ? `${conditionProfile.optimalSwellDirections.min}° to ${conditionProfile.optimalSwellDirections.max}°`
        : "N/A";
      const idealTide = conditionProfile?.optimalTide || "Incoming Mid-to-High";

      const spotRules = `
      SPOT DNA & OPTIMAL CONDITIONS for ${beachRef.name}:
      - Optimal Wind: ${optimalWind}
      - Optimal Swell: ${swellDir}
      - Ideal Tide: ${idealTide}
      - Spot Knowledge: ${(beachRef as any).description || "Open beach break. Vulnerable to strong winds. Monitor local shifts."}
      `;

      const report = await PythonBridge.generateIntelligenceReport(
        beachRef.name, 
        forecasts[0].windSpeed, 
        forecasts[0].windDirection.toString(), 
        forecasts[0].swellHeight, 
        forecasts[0].swellPeriod, 
        forecasts[0].swellDirection.toString(), 
        0, 
        persona, 
        `Current Reference Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\nTarget Timeframe: ${days}-Day Outlook\n\nForecast Data Snippets:\n${context}\n\n${spotRules}`,
        days === 1 ? "daily" : days <= 3 ? "tactical" : "weekly"
      );

      let finalReport = report;
      const startDateStr = forecasts[0].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const endDateStr = forecasts[forecasts.length - 1].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dateRangeTitle = `[${startDateStr} - ${endDateStr}]`;

      if (finalReport.includes("BRIEFING:")) {
        finalReport = finalReport.replace(/(BRIEFING: [^\n]+)/, `$1 ${dateRangeTitle}`);
      } else {
        finalReport = `TACTICAL BRIEFING: ${beachRef.name} ${dateRangeTitle}\n\n${finalReport}`;
      }

      // 5. Save report to history
      await prisma.intelligenceReport.upsert({
        where: {
          intel_history_unique: {
            beachId,
            userId,
            date: startDate,
            persona,
            duration: days
          }
        },
        update: { 
          content: finalReport,
          endDate: endDate
        },
        create: {
          beachId,
          userId,
          date: startDate,
          persona,
          content: finalReport,
          duration: days,
          endDate: endDate
        }
      });

      return { 
        report: finalReport, 
        presenterName: activePersona.name,
        creditsRemaining: updatedUser.credits
      };
    } catch (error) {
      // REFUND ON FAILURE
      console.error("[IntelligenceService] Generation failed, refunding credits:", error);
      await prisma.user.update({
        where: { id: userId },
        data: { credits: { increment: creditCost } }
      });
      throw error;
    }
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
