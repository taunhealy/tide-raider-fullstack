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

/**
 * Send email notification to admin when a trial activation fails
 */
export async function notifyAdminTrialFailure(data: {
  email: string;
  promoCode?: string;
  error: string;
}) {
  const subject = `❌ Trial Activation Failed - ${data.email}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Trial Activation Failed!</h2>
      <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #fee2e2;">
        <p><strong>User Email:</strong> ${data.email}</p>
        <p><strong>Promo Code Used:</strong> ${data.promoCode || "None"}</p>
        <p><strong>Error Message:</strong> <span style="color: #dc2626;">${data.error}</span></p>
        <p><strong>Attempt Time:</strong> ${new Date().toLocaleString()}</p>
      </div>
      <p style="color: #6b7280; font-size: 14px;">
        An attempt to activate a trial failed. You may want to check if the promo code is valid or if the user is having technical issues.
      </p>
    </div>
  `;

  try {
    const sent = await sendEmail(ADMIN_EMAIL, subject, html);
    if (sent) {
      console.log(`✅ Admin failure notification sent for: ${data.email}`);
    }
    return sent;
  } catch (error) {
    console.error("Error sending admin failure notification:", error);
    return false;
  }
}

/**
 * Send email notification to admin when a user generates an AI intelligence report
 */
export async function notifyAdminNewReport(
  user: { id: string; email: string; name: string | null },
  report: { id: string; date: Date | string; source: string; category: string; content: string; duration: number },
  beach: { id: string; name: string }
) {
  const subject = `🛰️ AI Report Generated - ${beach.name} by ${user.name || user.email}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
      <h2 style="color: #6366f1;">New AI Strategic Report Generated!</h2>
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #e2e8f0;">
        <p><strong>Beach / Spot:</strong> ${beach.name} (${beach.id})</p>
        <p><strong>Category:</strong> ${report.category}</p>
        <p><strong>Forecast Source:</strong> ${report.source}</p>
        <p><strong>Duration:</strong> ${report.duration} Days</p>
        <p><strong>Target Date:</strong> ${new Date(report.date).toLocaleDateString()}</p>
        <p><strong>Generated By:</strong> ${user.name || "Unknown"} (${user.email})</p>
        <p><strong>User ID:</strong> ${user.id}</p>
        <p><strong>Generation Time:</strong> ${new Date().toLocaleString()}</p>
      </div>
      <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; font-family: monospace; white-space: pre-wrap; font-size: 13px; max-height: 300px; overflow-y: auto;">
        ${report.content}
      </div>
    </div>
  `;

  try {
    const sent = await sendEmail(ADMIN_EMAIL, subject, html);
    return sent;
  } catch (error) {
    console.error("Error sending admin notification for new report:", error);
    return false;
  }
}

/**
 * Send email notification to admin when a user creates a new forecast alert
 */
export async function notifyAdminNewAlert(
  user: { id: string; email: string; name: string | null },
  alert: { id: string; name: string; alertType: string; notificationMethod: string; starRating?: string | number | null }
) {
  const subject = `🚨 New Forecast Alert Created - ${alert.name} by ${user.name || user.email}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
      <h2 style="color: #ef4444;">New Forecast Alert Set up!</h2>
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #e2e8f0;">
        <p><strong>Alert Name:</strong> ${alert.name}</p>
        <p><strong>Alert Type:</strong> ${alert.alertType}</p>
        ${alert.starRating ? `<p><strong>Rating Threshold:</strong> ${alert.starRating} Stars</p>` : ""}
        <p><strong>Notification Method:</strong> ${alert.notificationMethod}</p>
        <p><strong>Created By:</strong> ${user.name || "Unknown"} (${user.email})</p>
        <p><strong>User ID:</strong> ${user.id}</p>
        <p><strong>Creation Time:</strong> ${new Date().toLocaleString()}</p>
      </div>
      <p style="color: #6b7280; font-size: 14px;">
        This alert will actively monitor forecasts and dispatch tactical alerts to this user when conditions align!
      </p>
    </div>
  `;

  try {
    const sent = await sendEmail(ADMIN_EMAIL, subject, html);
    return sent;
  } catch (error) {
    console.error("Error sending admin notification for new alert:", error);
    return false;
  }
}

/**
 * Send email notification to admin when a user creates a new log entry
 */
export async function notifyAdminNewLog(
  user: { id: string; email: string; name: string | null },
  log: { id: string; surferRating: number; comments?: string | null; date: Date | string },
  beach?: { name: string } | null
) {
  const subject = `🌊 New Surf Log Created - ${beach?.name || "Unknown Break"} [${log.surferRating} ★]`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
      <h2 style="color: #0ea5e9;">New Surf Session Logged!</h2>
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #e2e8f0;">
        <p><strong>Beach / Spot:</strong> ${beach?.name || "Unknown Break"}</p>
        <p><strong>Surfer Rating:</strong> ${log.surferRating} / 5 Stars</p>
        <p><strong>Session Date:</strong> ${new Date(log.date).toLocaleDateString()}</p>
        <p><strong>Logged By:</strong> ${user.name || "Unknown"} (${user.email})</p>
        <p><strong>User ID:</strong> ${user.id}</p>
        <p><strong>Logging Time:</strong> ${new Date().toLocaleString()}</p>
      </div>
      ${log.comments ? `
      <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; font-style: italic; font-size: 14px; color: #475569;">
        "${log.comments}"
      </div>
      ` : ""}
    </div>
  `;

  try {
    const sent = await sendEmail(ADMIN_EMAIL, subject, html);
    return sent;
  } catch (error) {
    console.error("Error sending admin notification for new log:", error);
    return false;
  }
}
