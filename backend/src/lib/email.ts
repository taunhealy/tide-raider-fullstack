import { Resend } from "resend";

// Initialize Resend lazily to avoid errors if API key is missing
let resendInstance: Resend | null = null;

function getResendInstance(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn("❌ RESEND_API_KEY not configured, email not sent");
      return false;
    }

    const resend = getResendInstance();
    if (!resend) {
      console.error("❌ Failed to initialize Resend client - API key missing");
      return false;
    }

    const fromEmail =
      process.env.RESEND_FROM_EMAIL || "Tide Raider <noreply@tideraider.com>";

    console.log(`📧 Attempting to send email via Resend:`, {
      from: fromEmail,
      to,
      subject,
      hasApiKey: !!process.env.RESEND_API_KEY,
      apiKeyLength: process.env.RESEND_API_KEY?.length || 0,
    });

    const result = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    });

    if (result.error) {
      console.error("❌ Resend API error:", result.error);
      return false;
    }

    if (result.data?.id) {
      console.log(`✅ Email sent successfully via Resend:`, {
        emailId: result.data.id,
        to,
        subject,
      });
      return true;
    }

    console.warn("⚠️ Resend returned no error but no email ID:", result);
    return false;
  } catch (error) {
    console.error("❌ Resend error:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
    return false;
  }
}
