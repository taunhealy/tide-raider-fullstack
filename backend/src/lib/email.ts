import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not configured, email not sent");
      return false;
    }

    await resend.emails.send({
      from:
        process.env.RESEND_FROM_EMAIL || "Tide Raider <noreply@tideraider.com>",
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("Resend error:", error);
    return false;
  }
}
