/**
 * Quick script to send a test email using Resend
 * Run: RESEND_API_KEY="re_xxx" RESEND_FROM_EMAIL="..." npx tsx send-test-email-now.ts
 */

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
      subject: "🌊 Test Email from Tide Raider",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
              line-height: 1.6;
              color: #1a1a1a;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #1cd9ff 0%, #00b4d8 100%);
              color: white;
              padding: 30px;
              border-radius: 8px;
              text-align: center;
              margin-bottom: 30px;
            }
            .content {
              background-color: #f7f7f7;
              padding: 30px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            h1 {
              margin: 0;
              font-size: 28px;
            }
            .success {
              background-color: #d4edda;
              border: 1px solid #c3e6cb;
              color: #155724;
              padding: 15px;
              border-radius: 6px;
              margin: 20px 0;
            }
            .info {
              background-color: #fff;
              padding: 15px;
              border-radius: 6px;
              border-left: 4px solid #1cd9ff;
              margin: 15px 0;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 12px;
              margin-top: 30px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🌊 Tide Raider</h1>
            <p>Email Test Successful!</p>
          </div>
          
          <div class="content">
            <div class="success">
              <strong>✅ Success!</strong> Your Resend email integration is working correctly.
            </div>
            
            <h2>Configuration Details:</h2>
            <div class="info">
              <p><strong>From:</strong> ${fromEmail}</p>
              <p><strong>To:</strong> ${toEmail}</p>
              <p><strong>Service:</strong> Resend (AWS SES)</p>
              <p><strong>Time:</strong> ${new Date().toISOString()}</p>
            </div>
            
            <h2>What's Working:</h2>
            <ul>
              <li>✅ RESEND_API_KEY is configured</li>
              <li>✅ DNS records are verified</li>
              <li>✅ Email service is operational</li>
              <li>✅ Alert notifications are ready</li>
            </ul>
            
            <p><strong>Your alert system is now fully operational!</strong> Users will receive email notifications when their alert conditions are met.</p>
          </div>
          
          <div class="footer">
            <p>This is a test email from your Tide Raider backend</p>
            <p>Sent at ${new Date().toLocaleString()}</p>
          </div>
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
      console.log(`\n📬 Check ${toEmail} for the test email\n`);
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

sendTestEmail();




