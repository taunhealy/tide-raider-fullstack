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
    
    // 1. Check credits
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

    // 2. Fetch Context (Beaches & Forecasts)
    console.log(`[AIChatService] 🔍 Fetching tactical context...`);
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

    const context = `
      You are the Tide Raider Tactical AI, an elite surf intelligence assistant. 
      Users pay 1 credit per interaction for your expertise.
      
      Current Operational Data:
      - Monitored Assets (Beaches): ${beaches.map(b => b.name).join(", ")}
      - Recent Field Intelligence (Raid Logs):
        ${recentLogs.map(l => `- [${l.date.toISOString().split('T')[0]}] ${l.beach.name}: ${l.surferRating}/5 - "${l.comments}"`).join("\n")}
      
      Operational Protocols:
      1. Tone: Tactical, professional, elite, slightly mysterious. Use terms like "sector", "asset", "scout", "relay", "intel".
      2. Accuracy: Provide precise surf advice based on the data provided. If asked about a beach not in the list, state it's "outside current reconnaissance range" but offer general regional advice if possible.
      3. Value: Each response costs the user 1 credit. Ensure high-density intelligence.
      4. Brevity: Keep responses concise (2-3 short paragraphs max).
    `;

    // 3. Deduct credit
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

      const result = await chat.sendMessage(message);
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
