
import 'dotenv/config'; // Load .env file
import { Resend } from "resend";

async function sendTestEmail() {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "Tide Raider <noreply@tideraider.com>";
  const toEmail = "taunhealy@gmail.com";

  if (!apiKey) {
    console.error("❌ RESEND_API_KEY environment variable is required");
    process.exit(1);
  }

  console.log("📧 Sending test email...\n");
  console.log(`From: ${fromEmail}`);
  console.log(`To: ${toEmail}`);
  console.log(`API Key: ${apiKey.substring(0, 10)}...\n`);

  try {
    const resend = new Resend(apiKey);

    const result = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: "🌊 Test Email from Tide Raider (Debug)",
      html: "<p>Debug email test</p>",
    });

    if (result.error) {
      console.error("❌ Resend API error:", result.error);
      process.exit(1);
    }

    if (result.data?.id) {
      console.log("✅ Email sent successfully!");
      console.log(`   Email ID: ${result.data.id}`);
    } else {
      console.warn("⚠️ Unexpected response:", result);
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

sendTestEmail();
