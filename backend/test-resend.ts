/**
 * Quick test script to verify Resend configuration
 * Usage: 
 * 1. Add RESEND_API_KEY to backend/.env
 * 2. Run: npx ts-node test-resend.ts your-email@example.com
 */

import { Resend } from "resend";

async function testResend() {
  const recipientEmail = process.argv[2];
  
  if (!recipientEmail) {
    console.error("❌ Please provide a recipient email:");
    console.log("   npx ts-node test-resend.ts your-email@example.com");
    process.exit(1);
  }

  if (!process.env.RESEND_API_KEY) {
    console.error("❌ RESEND_API_KEY not found in environment");
    console.log("   Add it to backend/.env:");
    console.log('   RESEND_API_KEY="re_your_key_here"');
    process.exit(1);
  }

  console.log("📧 Testing Resend configuration...\n");
  console.log("Configuration:");
  console.log(`  API Key: ${process.env.RESEND_API_KEY.substring(0, 10)}...`);
  console.log(`  From: ${process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"}`);
  console.log(`  To: ${recipientEmail}\n`);

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    const result = await resend.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject: "🌊 Tide Raider Alert Test",
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>🌊 Tide Raider Alert Test</h2>
          <p>This is a test email from your Tide Raider alert system.</p>
          <p><strong>If you received this, your Resend configuration is working correctly! ✅</strong></p>
          <hr>
          <p style="font-size: 12px; color: #666;">
            Sent from: ${fromEmail}<br>
            Timestamp: ${new Date().toISOString()}
          </p>
        </body>
        </html>
      `,
    });

    if (result.error) {
      console.error("❌ Resend API error:", result.error);
      process.exit(1);
    }

    if (result.data?.id) {
      console.log("✅ Email sent successfully!");
      console.log(`   Email ID: ${result.data.id}`);
      console.log(`\n📬 Check ${recipientEmail} for the test email`);
      console.log("\n✨ Your Resend configuration is working correctly!");
    } else {
      console.warn("⚠️ Unexpected response:", result);
    }
  } catch (error) {
    console.error("❌ Error:", error);
    if (error instanceof Error) {
      console.error("Details:", error.message);
    }
    process.exit(1);
  }
}

testResend();




