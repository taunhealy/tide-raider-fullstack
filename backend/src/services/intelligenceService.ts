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
         // Check for ANY existing report for this beach/date/persona (Crowdfunded model)
         const dbReport = await prisma.intelligenceReport.findFirst({
            where: {
              beachId: beachRef.id,
              date: reportDate,
              persona: persona,
              duration: 1
            },
            include: {
              user: {
                select: {
                  name: true,
                  instagram: true,
                  link: true
                }
              }
            }
         });
         
         if (dbReport) {
            let content = dbReport.content;
            // Add pioneer credit if it was a user-generated report
            if (dbReport.user) {
              const pioneerInfo = `\n\n---
*Intelligence pioneered by **${dbReport.user.name}***
${dbReport.user.instagram ? `[Instagram](https://instagram.com/${dbReport.user.instagram.replace('@', '')})` : ''} ${dbReport.user.link ? `| [Website](${dbReport.user.link})` : ''}`;
              content += pioneerInfo;
            }
            this.cache[cacheKey] = { report: content, timestamp: Date.now() };
            return content;
         }
      }

      const dailyForecasts = await prisma.forecast.findMany({
        where: {
          regionId: beachRef?.regionId || "western-cape",
          date: reportDate,
          // source: "WINDFINDER" // Allow any source to provide data for the report
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
         const existingDailyReport = await prisma.intelligenceReport.findFirst({
            where: {
               beachId: beachRef.id,
               userId: "cmnhjq35d000cs60fxss02p4o",
               date: reportDate,
               persona: persona,
               duration: 1
            }
         });

         if (existingDailyReport) {
            await prisma.intelligenceReport.update({
               where: { id: existingDailyReport.id },
               data: { content: report }
            });
         } else {
            await prisma.intelligenceReport.create({
               data: {
                  beachId: beachRef.id,
                  userId: "cmnhjq35d000cs60fxss02p4o",
                  date: reportDate,
                  persona: persona,
                  content: report,
                  duration: 1
               }
            });
         }
      }
      
      this.cache[cacheKey] = { report, timestamp: Date.now() };
      return report;
    } catch (error) {
       console.error(`[IntelligenceService] AI failure:`, error);
       return `Signal scrambled. Observational data for ${beach} indicates ${score}/10 conditions.`;
    }
  }
  
  static async getTimedReportForBeach(beachId: string, date: string, userId: string, days: number = 7, personaOverride?: string, category: string = "GENERAL", source: string = "WINDY"): Promise<{ id?: string, report: string, presenterName: string, creditsRemaining: number, pioneer?: any }> {
    console.log(`[IntelligenceService] 📋 Starting report generation: Beach=${beachId}, User=${userId}, Days=${days}, Persona=${personaOverride || 'AUTO'}, Source=${source}`);
    
    // 1. Authenticate user and check credits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, credits: true }
    });

    if (!user) {
      console.error(`[IntelligenceService] ❌ User ${userId} not found`);
      throw new Error("User not found");
    }
    
    // Credit cost: 1 credit for 1 day, 4 credits for 3 days or more.
    const creditCost = days <= 1 ? 1 : 4;
    
    if (user.credits < creditCost) {
      console.warn(`[IntelligenceService] ⚠️ Insufficient credits: Has ${user.credits}, Needs ${creditCost}`);
      throw new Error("INSUFFICIENT_CREDITS");
    }

    const beachRef = await prisma.beach.findUnique({
       where: { id: beachId },
       include: { region: true }
    });

    if (!beachRef) {
      console.error(`[IntelligenceService] ❌ Beach ${beachId} not found`);
      throw new Error("Beach not found");
    }

    // 2. Process Date with robust validation
    let startDate = new Date(date);
    if (isNaN(startDate.getTime())) {
      console.warn(`[IntelligenceService] ⚠️ Invalid date provided: "${date}", defaulting to today`);
      startDate = new Date();
    }
    
    startDate.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + days);

    // 2b. Check if an identical report already exists (Community Sharing)
    const existingCommunityReport = await prisma.intelligenceReport.findFirst({
      where: {
        beachId,
        date: startDate,
        persona: (personaOverride || "AUTO").toUpperCase(),
        duration: days,
        category: category.toUpperCase(),
        source: source.toUpperCase()
      },
      include: {
        user: {
          select: {
            name: true,
            instagram: true,
            link: true
          }
        }
      }
    });

    if (existingCommunityReport) {
      console.log(`[IntelligenceService] 🤝 Found existing community report. Sharing access.`);
      return {
        id: existingCommunityReport.id,
        report: existingCommunityReport.content,
        presenterName: existingCommunityReport.persona,
        creditsRemaining: user.credits,
        pioneer: existingCommunityReport.user ? {
          name: existingCommunityReport.user.name,
          instagram: existingCommunityReport.user.instagram,
          link: existingCommunityReport.user.link
        } : null
      };
    }

    // 3. Deduct credit immediately (Atomic update)
    let updatedUser;
    try {
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { credits: { decrement: creditCost } },
        select: { id: true, credits: true, name: true, email: true, instagram: true, link: true }
      });
      console.log(`[IntelligenceService] 💸 Credits deducted. Remaining: ${updatedUser.credits}`);
    } catch (error) {
      console.error(`[IntelligenceService] ❌ Failed to deduct credits:`, error);
      throw new Error("FAILED_TO_DEDUCT_CREDITS");
    }

    try {
      // 4. Fetch Historical Memory (Last 3 User Raid Logs)
      const recentLogs = await prisma.logEntry.findMany({
        where: { beachId },
        orderBy: { date: 'desc' },
        take: 3,
        select: {
          date: true,
          surferRating: true,
          comments: true
        }
      });

      const historicalMemory = recentLogs.map(l => 
        `[${l.date.toISOString().split('T')[0]}] User Rating: ${l.surferRating}/5. Notes: ${l.comments || 'No comment'}`
      ).join('\n');

      // 5. Generate Report

      // 5. Generate Report
      // Query forecasts using the requested source
      const querySource = source.toUpperCase();
      let forecasts = await prisma.forecast.findMany({
        where: {
          regionId: beachRef.regionId,
          date: { gte: startDate, lt: endDate },
          timeSlot: "NOON",
          source: querySource as any
        },
        orderBy: { date: 'asc' }
      });

      // Fallback if the requested source has missing data
      if (forecasts.length === 0) {
        console.log(`[IntelligenceService] ⚠️ No forecasts found for source ${querySource}, falling back to WINDY`);
        forecasts = await prisma.forecast.findMany({
          where: {
            regionId: beachRef.regionId,
            date: { gte: startDate, lt: endDate },
            timeSlot: "NOON",
            source: "WINDY"
          },
          orderBy: { date: 'asc' }
        });
      }

      // If WINDY is also missing, fall back to WINDFINDER
      if (forecasts.length === 0) {
        console.log(`[IntelligenceService] ⚠️ No forecasts found for WINDY, falling back to WINDFINDER`);
        forecasts = await prisma.forecast.findMany({
          where: {
            regionId: beachRef.regionId,
            date: { gte: startDate, lt: endDate },
            timeSlot: "NOON",
            source: "WINDFINDER"
          },
          orderBy: { date: 'asc' }
        });
      }

      console.log(`[IntelligenceService] 📊 Found ${forecasts.length} noon forecasts for the next ${days} days`);

      if (forecasts.length === 0) {
        // Refund if no data found
        await prisma.user.update({
          where: { id: userId },
          data: { credits: { increment: creditCost } }
        });
        
        return { 
          report: `Swell intelligence currently unavailable for this ${days}-day timeframe.`,
          presenterName: "Ryko Central",
          creditsRemaining: updatedUser.credits + creditCost
        };
      }

      const { getPersonaByCycle, AI_PERSONAS } = await import("../constants/intelligence");
      const cyclePersona = getPersonaByCycle(new Date().getDate());
      
      // Use override if provided, otherwise cycle
      const persona = (personaOverride || cyclePersona.id).toUpperCase();
      
      // Resolve the actual name for the persona being used
      const activePersona = AI_PERSONAS.find(p => p.id === persona) || cyclePersona;
      
      console.log(`[IntelligenceService] 🎭 Using persona: ${activePersona.name} (${activePersona.id})`);

      // Fetch the specific condition profile for the requested sport category
      let conditionProfile = null;
      try {
        const sportCategory = category.toUpperCase() as any;
        conditionProfile = await (prisma as any).beachConditionProfile.findUnique({
          where: {
            beachId_category: {
              beachId: beachId,
              category: sportCategory
            }
          }
        }) || await (prisma as any).beachConditionProfile.findFirst({
          where: { beachId: beachRef.id, category: "GENERAL" }
        });
      } catch (err) {
        console.warn("[IntelligenceService] ⚠️ Failed to query beachConditionProfile (table/model might be missing in DB), falling back:", err);
      }

      const context = forecasts.map(f => {
         const dateObj = f.date instanceof Date ? f.date : new Date(f.date);
         const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
         
         // Calculate real score if profile is available
         let scoreValue = 0;
         let deductions: string[] = [];
         if (conditionProfile) {
           const result = ScoreService.calculateScore(beachRef, conditionProfile, f);
           scoreValue = result?.score || 0;
           deductions = result?.deductions || [];
         }
         
          const scoreDisplay = (scoreValue * 2).toFixed(1); // Scale to 10
          const deductionStr = deductions.length > 0 ? ` (Deductions: ${deductions.join(', ')})` : "";

          // Multi-Swell Data for AI Analysis
          const mainSwell = `${f.swellHeight}m @ ${f.swellPeriod}s ${f.swellDirection}°`;
          let secondarySwellStr = "";
          if (f.swellHeight2 && f.swellHeight2 > 0) {
            secondarySwellStr += `, Swell 2: ${f.swellHeight2}m @ ${f.swellPeriod2}s ${f.swellDirection2}°`;
          }
          if (f.swellHeight3 && f.swellHeight3 > 0) {
            secondarySwellStr += `, Swell 3: ${f.swellHeight3}m @ ${f.swellPeriod3}s ${f.swellDirection3}°`;
          }
          const energyStr = f.swellEnergy && f.swellEnergy > 0 ? `, Energy: ${f.swellEnergy}kJ` : "";

          return `${dateStr}: ${mainSwell}${secondarySwellStr}${energyStr}, Wind: ${f.windSpeed}kts ${f.windDirection}°, Tide: ${f.tide || 'N/A'}, ALGO_SCORE: ${scoreDisplay}/10${deductionStr}`;
      }).join("\n");

      // Construct Spot Rules to guide the AI with specific expertise
      const optimalWind = Array.isArray(conditionProfile?.optimalWindDirections) 
        ? conditionProfile.optimalWindDirections.join(", ") 
        : "N/A";
        
      // Safely access JSON fields
      const swellDirs = conditionProfile?.optimalSwellDirections as any;
      const swellDir = (swellDirs && typeof swellDirs === 'object' && 'min' in swellDirs)
        ? `${swellDirs.min}° to ${swellDirs.max}°`
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
        `Current Reference Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\nTarget Timeframe: ${days}-Day Outlook\nSPORT CATEGORY: ${category}\n\nHISTORICAL MEMORY (User Logs):\n${historicalMemory || "No recent intelligence signals from this sector."}\n\nForecast Data Snippets:\n${context}\n\n${spotRules}`,
        days === 1 ? "daily" : days <= 3 ? "tactical" : "weekly"
      ).catch(err => {

        console.error(`[IntelligenceService] ❌ Python generation failed:`, err);
        throw err;
      });

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
      const existingReport = await prisma.intelligenceReport.findFirst({
        where: {
          beachId,
          userId,
          date: startDate,
          persona,
          duration: days,
          category,
          source: querySource
        }
      });

      if (existingReport) {
        await prisma.intelligenceReport.update({
          where: { id: existingReport.id },
          data: {
            content: finalReport,
            endDate: endDate
          }
        });
      } else {
        await prisma.intelligenceReport.create({
          data: {
            beachId,
            userId,
            date: startDate,
            persona,
            content: finalReport,
            duration: days,
            endDate: endDate,
            category,
            source: querySource
          }
        });
      }

      // 6. Find the report ID (since we used upsert, we need to fetch or handle result)
      const savedReport = await prisma.intelligenceReport.findFirst({
        where: {
          beachId,
          userId,
          date: startDate,
          persona,
          duration: days,
          category,
          source: querySource
        },
        select: { id: true }
      });

      // Trigger background admin notification
      if (savedReport) {
        import("../lib/adminNotifications").then(({ notifyAdminNewReport }) => {
          notifyAdminNewReport(
            { id: userId, email: updatedUser.email || "unknown@tideraider.com", name: updatedUser.name },
            {
              id: savedReport.id,
              date: startDate,
              source: querySource,
              category,
              content: finalReport,
              duration: days
            },
            { id: beachId, name: beachRef.name }
          ).catch(err => console.error("Error sending admin report notification:", err));
        }).catch(err => console.error("Failed to load adminNotifications module:", err));
      }

      return { 
        id: savedReport?.id,
        report: finalReport, 
        presenterName: activePersona.name,
        creditsRemaining: updatedUser.credits,
        pioneer: {
          name: updatedUser.name,
          instagram: updatedUser.instagram,
          link: updatedUser.link
        }
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
       return { report: "Systems offline.", presenterName: "Ryko" };
    }
  }
}
