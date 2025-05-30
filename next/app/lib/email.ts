import { Resend } from "resend";
import sgMail from "@sendgrid/mail";
import { RentalItemRequest } from "@prisma/client";

const resend = new Resend(process.env.RESEND_API_KEY);

// Initialize SendGrid with your API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  try {
    await sgMail.send({
      to,
      from: process.env.SENDGRID_FROM_EMAIL!, // Verified sender email
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("SendGrid error:", error);
    return false;
  }
}

export async function sendTrialStartEmail(email: string, endDate: Date) {
  const msg = {
    to: email,
    from: "noreply@tideraider.com",
    subject: "Welcome to Your Tide Raider Trial!",
    html: `
      <h1>Welcome to Tide Raider!</h1>
      <p>Your 14-day trial has started. You now have full access to all features until ${endDate.toLocaleDateString()}.</p>
      <p>Enjoy discovering new surf spots and tracking conditions!</p>
    `,
  };

  await sgMail.send(msg);
}

export async function sendTrialEndingSoonEmail(
  email: string,
  daysLeft: number
) {
  const msg = {
    to: email,
    from: "noreply@tideraider.com",
    subject: "Your Tide Raider Trial is Ending Soon",
    html: `
      <h1>Trial Ending Soon</h1>
      <p>Your trial will end in ${daysLeft} days. Subscribe now to maintain access to all features!</p>
      <a href="${process.env.NEXT_PUBLIC_BASE_URL}/pricing">Subscribe Now</a>
    `,
  };

  await sgMail.send(msg);
}

export async function sendRequestExpiredNotification(
  request: RentalItemRequest & {
    renter: { email: string };
    rentalItem: { name: string };
  }
) {
  try {
    const { data } = await resend.emails.send({
      from: "Tide Raider <ads@tideraider.com>",
      to: request.renter.email,
      subject: "Rental Request Expired",
      html: `
        <h1>Rental Request Expired</h1>
        <p>Your rental request for the item "${request.rentalItem.name}" has expired.</p>
        <p>Please submit a new request if you're still interested.</p>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/rentals/${request.id}">View Rental</a>
      `,
    });
    return { success: true, data };
  } catch (error) {
    console.error("Email error:", error);
    throw error;
  }
}

export async function sendRentalRequestEmail(
  request: RentalItemRequest & {
    owner: { email: string };
    rentalItem: { name: string };
  }
) {
  try {
    const { data } = await resend.emails.send({
      from: "Tide Raider <ads@tideraider.com>",
      to: request.owner.email,
      subject: "New Rental Request",
      html: `
        <h1>New Rental Request</h1>
        <p>You have received a new rental request for your item "${request.rentalItem.name}".</p>
        <p>Rental period: ${request.startDate.toLocaleDateString()} to ${request.endDate.toLocaleDateString()}</p>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/rental-requests/${request.id}">View Request</a>
      `,
    });
    return { success: true, data };
  } catch (error) {
    console.error("Email error:", error);
    throw error;
  }
}
