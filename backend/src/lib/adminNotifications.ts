import { sendEmail } from "./email";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@tideraider.com";

/**
 * Send email notification to admin when a new user signs up
 */
export async function notifyAdminNewUser(user: {
  id: string;
  email: string;
  name: string | null;
}) {
  const subject = `🎉 New User Signup - ${user.email}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">New User Signed Up!</h2>
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Name:</strong> ${user.name || "Not provided"}</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>User ID:</strong> ${user.id}</p>
        <p><strong>Signup Time:</strong> ${new Date().toLocaleString()}</p>
      </div>
      <p style="color: #6b7280; font-size: 14px;">
        This user has been added to Tide Raider. They may start a free trial or subscribe to premium features.
      </p>
    </div>
  `;

  try {
    const sent = await sendEmail(ADMIN_EMAIL, subject, html);
    if (sent) {
      console.log(`✅ Admin notification sent for new user: ${user.email}`);
    } else {
      console.warn(`⚠️ Failed to send admin notification for new user: ${user.email}`);
    }
    return sent;
  } catch (error) {
    console.error("Error sending admin notification for new user:", error);
    return false;
  }
}

/**
 * Send email notification to admin when a user subscribes
 */
export async function notifyAdminNewSubscription(user: {
  id: string;
  email: string;
  name: string | null;
  paypalSubscriptionId?: string | null;
}) {
  const subject = `💰 New Subscription - ${user.email}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">New Subscription Activated!</h2>
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Name:</strong> ${user.name || "Not provided"}</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>User ID:</strong> ${user.id}</p>
        ${user.paypalSubscriptionId ? `<p><strong>PayPal Subscription ID:</strong> ${user.paypalSubscriptionId}</p>` : ""}
        <p><strong>Subscription Time:</strong> ${new Date().toLocaleString()}</p>
      </div>
      <p style="color: #6b7280; font-size: 14px;">
        This user has activated a premium subscription. They now have access to all premium features.
      </p>
    </div>
  `;

  try {
    const sent = await sendEmail(ADMIN_EMAIL, subject, html);
    if (sent) {
      console.log(`✅ Admin notification sent for new subscription: ${user.email}`);
    } else {
      console.warn(`⚠️ Failed to send admin notification for subscription: ${user.email}`);
    }
    return sent;
  } catch (error) {
    console.error("Error sending admin notification for subscription:", error);
    return false;
  }
}

/**
 * Send email notification to admin when a user starts a free trial
 */
export async function notifyAdminNewTrial(user: {
  id: string;
  email: string;
  name: string | null;
  trialEndDate?: Date | null;
}) {
  const subject = `🆓 New Trial Started - ${user.email}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f59e0b;">New Trial Started!</h2>
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Name:</strong> ${user.name || "Not provided"}</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>User ID:</strong> ${user.id}</p>
        ${user.trialEndDate ? `<p><strong>Trial Ends:</strong> ${new Date(user.trialEndDate).toLocaleDateString()}</p>` : ""}
        <p><strong>Trial Start Time:</strong> ${new Date().toLocaleString()}</p>
      </div>
      <p style="color: #6b7280; font-size: 14px;">
        This user has started a free trial. Consider following up near the end of their trial period.
      </p>
    </div>
  `;

  try {
    const sent = await sendEmail(ADMIN_EMAIL, subject, html);
    if (sent) {
      console.log(`✅ Admin notification sent for new trial: ${user.email}`);
    } else {
      console.warn(`⚠️ Failed to send admin notification for trial: ${user.email}`);
    }
    return sent;
  } catch (error) {
    console.error("Error sending admin notification for trial:", error);
    return false;
  }
}
