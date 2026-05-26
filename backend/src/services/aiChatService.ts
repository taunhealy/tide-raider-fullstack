import { GoogleGenerativeAI } from "@google/generative-ai";
import { AI_MODELS } from "../constants/ai";
import { prisma } from "../lib/prisma";

export class AIChatService {
  private static getModel() {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("[AIChatService] ❌ No API key found in environment");
      throw new Error("MISSING_API_KEY");
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({ model: AI_MODELS.CHAT });
  }

  static async chat(userId: string, message: string, history: { role: "user" | "model"; content: string }[] = []) {
    console.log(`[AIChatService] 📨 New message from User ${userId}: "${message.substring(0, 50)}..."`);
    
    // 1. Check user & credits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true }
    });
 
    if (!user) {
      console.error(`[AIChatService] ❌ User ${userId} not found`);
      throw new Error("USER_NOT_FOUND");
    }
 
    if (user.credits < 1) {
      console.warn(`[AIChatService] ⚠️ User ${userId} has insufficient credits (${user.credits})`);
      throw new Error("INSUFFICIENT_CREDITS");
    }

    const lowerMessage = message.toLowerCase();

    // 2. Beyond Today Date Check & Redirect Flow
    const beyondTodayPhrases = [
      "tomorrow", "next week", "forecast for", "weekend", "saturday", "sunday", "monday", 
      "tuesday", "wednesday", "thursday", "friday", "future", "projections", "prediction",
      "forecast on", "days away", "days out", "later this week"
    ];
    
    const isBeyondToday = beyondTodayPhrases.some(phrase => lowerMessage.includes(phrase));
    if (isBeyondToday) {
      console.log(`[AIChatService] 🕒 Beyond today requested, redirecting...`);
      return {
        reply: "Negative. Deep regional forecasts and tactical projections beyond today require advanced satellite predictive routing. Please transition to the AI Reports sector. [REDIRECT: AI_REPORT_PAGE]",
        creditsRemaining: user.credits
      };
    }

    // Region mapping helper for organic/semantic detection
    const regionMapping: Record<string, string> = {
      "western cape": "western-cape",
      "eastern cape": "eastern-cape",
      "kwazulu natal": "kwazulu-natal",
      "kzn": "kwazulu-natal",
      "durban": "kwazulu-natal",
      "northern cape": "northern-cape",
      "swakopmund": "swakopmund",
      "namibia": "swakopmund",
      "tofo": "inhambane-province",
      "inhambane": "inhambane-province",
      "ponta do ouro": "ponta-do-ouro",
      "ponta": "ponta-do-ouro",
      "madagascar": "madagascar-south",
      "bali": "bali",
      "uluwatu": "bali",
      "queensland": "queensland",
      "noosa": "queensland",
      "waikato": "waikato",
      "raglan": "waikato",
      "chicama": "chicama",
      "peru": "chicama",
      "california": "california",
      "bondi": "new-south-wales",
      "new south wales": "new-south-wales",
      "nsw": "new-south-wales",
      "scotland": "scotland",
      "morocco": "morocco",
      "taghazout": "morocco",
      "mundaka": "basque-country",
      "basque": "basque-country"
    };

    // 3. Best Waves Today Intent & Region Selection Flow
    const bestWavesPhrases = ["best waves", "good surf", "highest scoring", "where to surf", "best breaks", "surf today"];
    const isQueryingBestWaves = bestWavesPhrases.some(phrase => lowerMessage.includes(phrase));
    
    let organicallySelectedRegion = "";
    for (const [name, id] of Object.entries(regionMapping)) {
      if (lowerMessage.includes(name)) {
        organicallySelectedRegion = id;
        break;
      }
    }

    const isRegionSelectPayload = message.startsWith("[REGION_SELECT]");
    const targetRegionId = isRegionSelectPayload 
      ? message.replace("[REGION_SELECT]", "").trim() 
      : organicallySelectedRegion;

    // Trigger region selector if querying best waves today but no region has been resolved yet
    if (isQueryingBestWaves && !targetRegionId && !isRegionSelectPayload) {
      console.log(`[AIChatService] 🎯 Best waves intent matched. Prompting region selection...`);
      return {
        reply: "Signal secured. Initiating real-time surf scoring and wave height telemetry. Please search and select your target sector to locate today's highest-scoring breaks: [PROMPT_REGION_SELECT]",
        creditsRemaining: user.credits
      };
    }

    // 4. Fetch Core Telemetry & Real-Time Daily Scores Context
    console.log(`[AIChatService] 🔍 Fetching tactical context...`);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const [beaches, recentLogs] = await Promise.all([
      prisma.beach.findMany({
        take: 15,
        select: { name: true, regionId: true }
      }),
      prisma.logEntry.findMany({
        take: 8,
        orderBy: { date: "desc" },
        select: { 
          beach: { select: { name: true } }, 
          surferRating: true, 
          comments: true,
          date: true
        }
      })
    ]);

    let customTelemetryContext = "";
    if (targetRegionId) {
      console.log(`[AIChatService] 📊 Querying live BeachDailyScores for region: ${targetRegionId}`);
      
      // Query today's Daily Scores
      const scores = await prisma.beachDailyScore.findMany({
        where: {
          regionId: targetRegionId,
          date: today,
          category: "GENERAL"
        },
        orderBy: {
          score: "desc"
        },
        take: 5,
        include: {
          beach: {
            select: {
              name: true,
              location: true,
              difficulty: true,
              waveType: true
            }
          }
        }
      });

      // SWR/Fallback: If empty, query latest available scores in the region in the last 7 days
      let scoresToUse = scores;
      if (scoresToUse.length === 0) {
        scoresToUse = await prisma.beachDailyScore.findMany({
          where: {
            regionId: targetRegionId,
            category: "GENERAL",
            date: {
              gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
            }
          },
          orderBy: [
            { date: "desc" },
            { score: "desc" }
          ],
          take: 5,
          include: {
            beach: {
              select: {
                name: true,
                location: true,
                difficulty: true,
                waveType: true
              }
            }
          }
        });
      }

      if (scoresToUse.length > 0) {
        const dateStr = scoresToUse[0].date.toISOString().split("T")[0];
        customTelemetryContext = `
          TODAY'S CRITICAL FIELD INTEL (BEACH DAILY SCORES) FOR SECTOR: ${targetRegionId.toUpperCase()} (Telemetric date: ${dateStr})
          Here are today's top-performing surf breaks, sorted by their calculated Tide Raider Daily Surf Score:
          ${scoresToUse.map((s, idx) => `
          ${idx + 1}. Break Name: ${s.beach.name} (${s.beach.location})
             - Daily Surf Score: ${s.score}/100
             - Rating: ${s.starRating || 0}/5 Stars
             - Target Category: ${s.beach.difficulty}
             - Break Style: ${s.beach.waveType}
             - Peak Time: ${s.timeSlot}
             - Deductions & Deductive Insights: ${JSON.stringify((s.conditions as any)?.deductions || [])}
             - Checklist Parameters: ${JSON.stringify((s.conditions as any)?.checklist || {})}
          `).join("\n")}
        `;
      } else {
        customTelemetryContext = `
          No active telemetry found for sector ${targetRegionId.toUpperCase()} in the last 7 days.
          Inform the user that the telemetry buoys for this sector are currently out of range, but offer general advice and suggest they manually check the live maps.
        `;
      }
    }

    const context = `
      You are the Tide Raider Tactical AI, an elite surf intelligence assistant. 
      Users pay 1 credit per interaction for your expertise.
      
      Current Operational Data:
      - Monitored Assets (Beaches): ${beaches.map(b => b.name).join(", ")}
      - Recent Field Intelligence (Raid Logs):
        ${recentLogs.map(l => `- [${l.date.toISOString().split('T')[0]}] ${l.beach.name}: ${l.surferRating}/5 - "${l.comments}"`).join("\n")}
      
      ${customTelemetryContext}

      Operational Protocols:
      1. Tone: Tactical, professional, elite, slightly mysterious. Use terms like "sector", "asset", "scout", "relay", "intel", "telemetry".
      2. Accuracy: Provide precise surf advice based on the data provided. If asked about a beach not in the list, state it's "outside current reconnaissance range" but offer general regional advice if possible.
      3. Value: Each response costs the user 1 credit. Ensure high-density intelligence.
      4. Brevity: Keep responses concise (2-3 short paragraphs max).
    `;

    // 5. Deduct credit
    console.log(`[AIChatService] 💸 Deducting 1 credit from User ${userId}...`);
    await prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: 1 } }
    });

    try {
      console.log(`[AIChatService] 🧠 Invoking Gemini AI...`);
      const model = this.getModel();
      const chat = model.startChat({
        history: [
          { role: "user", parts: [{ text: context }] },
          { role: "model", parts: [{ text: "Tactical AI initialized. Signal secured. Awaiting user transmission." }] },
          ...history.map(h => ({
            role: h.role === "user" ? "user" : "model",
            parts: [{ text: h.content }]
          }))
        ]
      });

      const processedMessage = isRegionSelectPayload 
        ? `Analyze and report today's best surf breaks for region ${targetRegionId} based on the real-time daily scores telemetry.`
        : message;

      const result = await chat.sendMessage(processedMessage);
      const responseText = result.response.text();
      console.log(`[AIChatService] ✅ AI Response generated (${responseText.length} chars)`);

      const updatedUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { credits: true }
      });

      return {
        reply: responseText,
        creditsRemaining: updatedUser?.credits || 0
      };
    } catch (error) {
      console.error(`[AIChatService] ❌ AI Generation failed:`, error);
      // Refund if AI fails
      await prisma.user.update({
        where: { id: userId },
        data: { credits: { increment: 1 } }
      });
      throw error;
    }
  }
}
