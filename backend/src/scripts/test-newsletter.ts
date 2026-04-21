import "../setup";
import { prisma } from "../lib/prisma";
import { sendEmail } from "../lib/email";
import { weeklyNewsletterTemplate } from "../lib/emailTemplates";
import { IntelligenceService } from "../services/intelligenceService";
import { generateUnsubscribeToken } from "../lib/tokens";

async function sendTestNewsletter(targetEmail: string) {
  console.log(`🧪 Starting Test Newsletter Blast for ${targetEmail}...`);

  try {
    // 1. Generate the Weekly AI Report
    console.log("🧠 Generating AI Intelligence Report...");
    
    // Allow manual persona override via command line (e.g., npx tsx script.ts email MC)
    const personaOverride = process.argv[3];
    const { report: aiReport, presenterName } = await IntelligenceService.generateWeeklyReport(personaOverride);
    
    // Log persona for verification
    console.log(`🎭 Active Persona: ${presenterName}`);
    
    // 2. Get the date range string
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 7);
    const weekDates = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    console.log(`📅 Dates: ${weekDates}`);
    console.log(`📝 Report Sample: ${aiReport.substring(0, 50)}...`);

    // 3. Find or create a dummy user context
    const user = await prisma.user.findFirst({
      where: { email: targetEmail }
    }) || { id: "test-user-id", name: "Commander", email: targetEmail };

    // 4. Generate unique unsubscribe token
    const token = generateUnsubscribeToken(user.id, "WEEKLY_INTEL");
    const backendUrl = process.env.BACKEND_URL || "http://localhost:4005";
    const unsubscribeUrl = `${backendUrl}/api/preferences/unsubscribe?token=${token}`;
    const subject = `[TEST] Weekly Tactical Intelligence: Muizenberg [${weekDates}] 🛰️`;

    console.log("📨 Dispatching email via Resend...");
    const success = await sendEmail(
      targetEmail,
      subject,
      weeklyNewsletterTemplate(user.name || "Commander", aiReport, weekDates, unsubscribeUrl, presenterName)
    );

    if (success) {
      console.log("✅ Test blast delivered successfully!");
    } else {
      console.log("❌ Failed to deliver test blast.");
    }

  } catch (error) {
    console.error("❌ Test Newsletter Failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2] || "taunhealy@gmail.com";
sendTestNewsletter(email);
