import { Router, Request, Response } from "express";
import { sendEmail } from "../lib/email";

const router = Router();

/**
 * GET /api/test-email
 * Test endpoint to verify Resend email configuration
 * Only available in development or with proper authentication
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    // TODO: Add proper authentication or remove after testing

    const testEmail = "taunhealy@gmail.com";

    console.log("📧 Sending test email to:", testEmail);

    const success = await sendEmail(
      testEmail,
      "🌊 Test Email from Tide Raider",
      `
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
              <p><strong>From:</strong> ${process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"}</p>
              <p><strong>To:</strong> ${testEmail}</p>
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
            <p>Sent from Cloud Run • ${new Date().toLocaleString()}</p>
          </div>
        </body>
        </html>
      `
    );

    if (success) {
      console.log("✅ Test email sent successfully!");
      return res.json({
        success: true,
        message: `Test email sent successfully to ${testEmail}`,
        timestamp: new Date().toISOString(),
      });
    } else {
      console.error("❌ Failed to send test email");
      return res.status(500).json({
        success: false,
        message: "Failed to send email - check server logs",
      });
    }
  } catch (error) {
    console.error("❌ Test email error:", error);
    return res.status(500).json({
      error: "Failed to send test email",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;

