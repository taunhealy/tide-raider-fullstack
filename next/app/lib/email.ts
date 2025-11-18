import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  try {
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

export async function sendTrialStartEmail(email: string, endDate: Date) {
  try {
    await resend.emails.send({
      from: "Tide Raider <noreply@tideraider.com>",
      to: email,
      subject: "Welcome to Your Tide Raider Trial!",
      html: `
        <h1>Welcome to Tide Raider!</h1>
        <p>Your 14-day trial has started. You now have full access to all features until ${endDate.toLocaleDateString()}.</p>
        <p>Enjoy discovering new surf spots and tracking conditions!</p>
      `,
    });
  } catch (error) {
    console.error("Error sending trial start email:", error);
    throw error;
  }
}

export async function sendTrialEndingSoonEmail(
  email: string,
  daysLeft: number
) {
  try {
    await resend.emails.send({
      from: "Tide Raider <noreply@tideraider.com>",
      to: email,
      subject: "Your Tide Raider Trial is Ending Soon",
      html: `
        <h1>Trial Ending Soon</h1>
        <p>Your trial will end in ${daysLeft} days. Subscribe now to maintain access to all features!</p>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/pricing">Subscribe Now</a>
      `,
    });
  } catch (error) {
    console.error("Error sending trial ending email:", error);
    throw error;
  }
}

// Rental-related email functions removed
