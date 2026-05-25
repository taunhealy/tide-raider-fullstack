/**
 * Standard Email Layout Wrapper
 */
const emailLayout = (title: string, content: string, unsubscribeUrl?: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      background-color: #f7f7f7;
      margin: 0;
      padding: 20px;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .header {
      background-color: #000000;
      padding: 40px 24px;
      text-align: center;
      color: #ffffff;
    }
    .header-logo {
      font-size: 24px;
      font-weight: 900;
      letter-spacing: -0.05em;
      text-transform: uppercase;
    }
    .header-logo span { color: #60a5fa; }
    .content {
      padding: 40px 32px;
    }
    .title {
      font-size: 24px;
      font-weight: 800;
      margin-bottom: 16px;
      color: #000000;
      letter-spacing: -0.02em;
    }
    .text {
      font-size: 16px;
      color: #4b5563;
      margin-bottom: 24px;
    }
    .button-container {
      margin: 32px 0;
      text-align: center;
    }
    .button {
      background-color: #60a5fa;
      color: #000000 !important;
      padding: 16px 32px;
      border-radius: 99px;
      text-decoration: none;
      font-weight: 800;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      display: inline-block;
      transition: transform 0.2s;
    }
    .footer {
      padding: 32px;
      text-align: center;
      background-color: #fafafa;
      border-top: 1px solid #eeeeee;
    }
    .footer p {
      font-size: 12px;
      color: #9ca3af;
      margin-bottom: 8px;
    }
    .footer a {
      color: #9ca3af;
      text-decoration: underline;
    }
    .highlight-box {
      background-color: #f0fdfa;
      border-left: 4px solid #60a5fa;
      padding: 20px;
      margin: 24px 0;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="header-logo">TIDE <span>RAIDER</span></div>
    </div>
    <div class="content">
      <h1 class="title">${title}</h1>
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Tide Raider Maritime Intelligence</p>
      <p>Muizenberg, Cape Town</p>
      ${unsubscribeUrl ? `
        <p style="margin-top: 16px;">
          You are receiving this because you opted in to maritime intelligence updates.
          <br>
          <a href="${unsubscribeUrl}">Unsubscribe</a> from this list.
        </p>
      ` : ""}
    </div>
  </div>
</body>
</html>
`;

/**
 * Trial Started Email
 */
export const trialStartedTemplate = (userName: string) => emailLayout(
  "Welcome to the Tactical Feed 🌊",
  `
  <p class="text">Hey ${userName},</p>
  <p class="text">Your 20-day tactical trial has been activated. You now have full access to our premium maritime intelligence pipeline, including:</p>
  <div class="highlight-box">
    <ul style="list-style-type: none; padding: 0;">
      <li style="margin-bottom: 10px;">💎 <strong>Hidden Gems:</strong> Uncover the best uncrowded surf breaks.</li>
      <li style="margin-bottom: 10px;">📊 <strong>Historical Scoring:</strong> See which spots are performing best over time.</li>
      <li style="margin-bottom: 10px;">⚡ <strong>Tactical Alerts:</strong> Get notified the moment your ideal conditions hit the water.</li>
    </ul>
  </div>
  <p class="text">The next 20 days are about getting you into the best waves of your life.</p>
  <div class="button-container">
    <a href="https://www.tideraider.com/raid" class="button">Access Tactical Feed</a>
  </div>
  `
);

/**
 * Trial Expired Email
 */
export const trialExpiredTemplate = (userName: string) => emailLayout(
  "Your Tactical Trial has Concluded ⚓",
  `
  <p class="text">Hey ${userName},</p>
  <p class="text">Your 20-day tactical trial has come to an end. We hope you've enjoyed having the edge on the water.</p>
  <div class="highlight-box">
    <p style="font-weight: 700; color: #000000; margin-bottom: 8px;">Don't lose your advantage:</p>
    <p class="text" style="font-size: 14px; margin-bottom: 0;">Upgrade to a full subscription now to maintain access to Hidden Gems, Tactical Alerts, and the full Maritime Intelligence pipeline.</p>
  </div>
  <p class="text">Keep tracking, keep raiding.</p>
  <div class="button-container">
    <a href="https://www.tideraider.com/pricing" class="button">Upgrade to Premium</a>
  </div>
  `
);

/**
 * Weekly Newsletter Template
 */
export const weeklyNewsletterTemplate = (userName: string, aiReport: string, weekDates: string, unsubscribeUrl: string, presenterName: string = "Tide Raider Central") => emailLayout(
  `Weekly Tactical Intelligence: Muizenberg [${weekDates}] 🛰️`,
  `
  <p class="text">Hey ${userName},</p>
  <p class="text">Here is your tactical overview for the upcoming week in the Western Cape.</p>
  
  <div class="highlight-box" style="background-color: #000000; border-left: 4px solid #60a5fa; color: #ffffff; padding: 24px;">
    <h3 style="color: #60a5fa; margin-bottom: 16px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em;">AI SECTOR ANALYSIS: MUIZENBERG</h3>
    <div style="font-family: 'Courier New', Courier, monospace; line-height: 1.8; color: #e5e7eb; font-size: 14px;">
      ${aiReport.replace(/\n/g, '<br>')}
    </div>
    <div style="margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); pt-16px; font-weight: bold; color: #60a5fa; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">
      Signing off, ${presenterName}
    </div>
  </div>

  <p class="text">Our intelligence suggests several prime windows opening up. Head over to the dashboard for the full breakdown of all regional sectors.</p>
  
  <div class="button-container">
    <a href="https://www.tideraider.com/raid" class="button">View Full Dashboard</a>
  </div>
  `,
  unsubscribeUrl
);

/**
 * Newsletter Welcome Template
 */
export const newsletterWelcomeTemplate = (userName: string) => emailLayout(
  "Intelligence Pipeline Connected 🛰️",
  `
  <p class="text">Welcome to the inner circle, ${userName}.</p>
  <p class="text">You have successfully subscribed to the **Tide Raider Weekly Intelligence**. Every Sunday, we'll deliver a strategic breakdown of the Muizenberg sector and upcoming swell windows across the Western Cape.</p>
  
  <div class="highlight-box">
    <p style="font-weight: 700; color: #1e293b; margin-bottom: 8px;">What to expect:</p>
    <ul style="list-style-type: none; padding: 0;">
      <li style="margin-bottom: 8px; color: #475569;">🛰️ <strong>AI Sector Analysis:</strong> Deep-dive reports generated by our intelligence engine.</li>
      <li style="margin-bottom: 8px; color: #475569;">🌊 <strong>Swell Windows:</strong> The precise times and tides for the best conditions.</li>
      <li style="margin-bottom: 0; color: #475569;">💎 <strong>Spot Spotlights:</strong> Tactical data on regional and seasonal breaks.</li>
    </ul>
  </div>

  <p class="text">The dashboard is also live if you want to track real-time conditions.</p>
  
  <div class="button-container">
    <a href="https://www.tideraider.com/raid" class="button">Access Intelligence Hub</a>
  </div>
  `
);

/**
 * Subscription Activated Email
 */
export const subscriptionActivatedTemplate = (userName: string, planName: string = "Premium Tactical") => emailLayout(
  "Premium Intelligence Activated 🛰️",
  `
  <p class="text">Hey ${userName},</p>
  <p class="text">Your ${planName} subscription is now active. You have successfully unlocked the full power of the Tide Raider intelligence pipeline.</p>
  
  <div class="highlight-box">
    <p style="font-weight: 700; color: #000000; margin-bottom: 8px;">Your Premium Access Includes:</p>
    <ul style="list-style-type: none; padding: 0;">
      <li style="margin-bottom: 10px;">🌊 <strong>Unlimited Tactical Alerts:</strong> Track every sector with zero limits.</li>
      <li style="margin-bottom: 10px;">💎 <strong>Full Hidden Gems Access:</strong> Every secret spot, revealed.</li>
      <li style="margin-bottom: 10px;">📊 <strong>Advanced Analytics:</strong> Deep-dive into historical data and AI scoring.</li>
      <li style="margin-bottom: 10px;">💬 <strong>WhatsApp Priority:</strong> Real-time intelligence delivered to your phone.</li>
    </ul>
  </div>

  <p class="text">We've added 30 monthly credits to your account for on-demand intelligence reports.</p>
  
  <div class="button-container">
    <a href="https://www.tideraider.com/raid" class="button">Access Tactical Dashboard</a>
  </div>
  <p class="text" style="font-size: 12px; text-align: center;">Need help? Reply to this email or visit our support center.</p>
  `
);

/**
 * Subscription Cancelled Email
 */
export const subscriptionCancelledTemplate = (userName: string) => emailLayout(
  "Subscription Cancelled ⚓",
  `
  <p class="text">Hey ${userName},</p>
  <p class="text">As requested, your Tide Raider Premium subscription has been cancelled. You will still have access to premium features until the end of your current billing period.</p>
  
  <div class="highlight-box" style="background-color: #fff7ed; border-left: 4px solid #f97316;">
    <p style="font-weight: 700; color: #9a3412; margin-bottom: 8px;">What happens next?</p>
    <p class="text" style="font-size: 14px; margin-bottom: 0;">Once your billing period ends, your account will revert to the Free tier. You'll lose access to Tactical Alerts, Hidden Gems, and advanced AI reporting.</p>
  </div>

  <p class="text">We're sorry to see you go. If there's anything we could have done better, please let us know by replying to this email.</p>
  
  <div class="button-container">
    <a href="https://www.tideraider.com/pricing" class="button">Reactivate Subscription</a>
  </div>
  `
);

/**
 * Analytics Report Template
 */
export const analyticsReportTemplate = (stats: any) => emailLayout(
  "Website Analytics Report 📊",
  `
  <p class="text">Here is your weekly performance summary for <strong>Tide Raider</strong>.</p>
  
  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
    <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 16px;">Core Growth Metrics</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #475569;">Date Range</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700;">${stats.dateRange}</td>
      </tr>
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #475569;">Total Registered Users</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700;">${stats.totalUsers}</td>
      </tr>
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #475569;">New Signups (7d)</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #10b981;">+${stats.newUsers}</td>
      </tr>
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #475569;">Active Subscribers</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #60a5fa;">${stats.activeSubscribers}</td>
      </tr>
    </table>
  </div>

  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
    <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 16px;">Engagement Metrics (7d)</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #475569;">Active Searchers</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700;">${stats.activeUsers}</td>
      </tr>
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #475569;">Total Searches Performed</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700;">${stats.totalSearches}</td>
      </tr>
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #475569;">Alert Notifications Sent</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700;">${stats.alertsSent}</td>
      </tr>
    </table>
  </div>

  <div style="display: flex; gap: 16px;">
    <div style="flex: 1; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
      <h4 style="font-size: 12px; text-transform: uppercase; color: #64748b; margin-bottom: 12px;">Top Regions</h4>
      <ul style="list-style: none; padding: 0; font-size: 13px;">
        ${stats.topRegions.map((r: any) => `<li style="margin-bottom: 4px;">${r.name}: <strong>${r.count}</strong></li>`).join('')}
      </ul>
    </div>
    <div style="flex: 1; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
      <h4 style="font-size: 12px; text-transform: uppercase; color: #64748b; margin-bottom: 12px;">Top Beaches</h4>
      <ul style="list-style: none; padding: 0; font-size: 13px;">
        ${stats.topBeaches.map((b: any) => `<li style="margin-bottom: 4px;">${b.name}: <strong>${b.count}</strong></li>`).join('')}
      </ul>
    </div>
  </div>

  <div class="button-container">
    <a href="https://www.tideraider.com/admin" class="button">Open Admin Hub</a>
  </div>
  `
);
/**
 * Log Comment Notification Email
 */
export const logCommentTemplate = (loggerName: string, commenterName: string, logId: string, commentText: string) => emailLayout(
  "New Intel on your Mission Log 💬",
  `
  <p class="text">Hey ${loggerName},</p>
  <p class="text"><strong>${commenterName}</strong> just contributed new intelligence to your mission log.</p>
  
  <div class="highlight-box">
    <p style="font-style: italic; color: #4b5563; margin-bottom: 0;">"${commentText}"</p>
  </div>

  <p class="text">Head over to the log to view the full discussion and respond.</p>
  
  <div class="button-container">
    <a href="https://www.tideraider.com/raidlogs/${logId}" class="button">View Mission Log</a>
  </div>
  `
);

/**
 * Registration Welcome Email
 */
export const registrationWelcomeTemplate = (userName: string) => emailLayout(
  "Account Activated: Welcome to Tide Raider! 🌊",
  `
  <p class="text">Hey ${userName},</p>
  <p class="text">Welcome to **Tide Raider**—the ultimate maritime intelligence platform for dedicated ocean-goers.</p>
  
  <div class="highlight-box">
    <p style="font-weight: 700; color: #000000; margin-bottom: 8px;">Here is how to get started:</p>
    <ul style="list-style-type: none; padding: 0;">
      <li style="margin-bottom: 10px;">🗺️ <strong>Sectors & Regions:</strong> Open the Interactive Map to see real-time surf intelligence for the Western Cape.</li>
      <li style="margin-bottom: 10px;">🎯 <strong>Invite the Squad:</strong> Share your unique referral link found in your profile to earn +30 Intelligence Credits for every friend who joins!</li>
      <li style="margin-bottom: 10px;">🛰️ <strong>AI Reports:</strong> Generate comprehensive forecast digests and tactical windows.</li>
    </ul>
  </div>

  <p class="text">We've loaded your account with initial tactical credits to get you started.</p>
  
  <div class="button-container">
    <a href="https://www.tideraider.com/raid" class="button">Access Tactical Dashboard</a>
  </div>
  `
);

/**
 * Referral Success Email
 */
export const referralSuccessTemplate = (referrerName: string, recruitName: string, credits: number) => emailLayout(
  "Recruitment Successful! +30 Credits Added 🎯",
  `
  <p class="text">Hey ${referrerName},</p>
  <p class="text">Mission accomplished! **${recruitName}** has successfully signed up for Tide Raider using your tactical recruit link.</p>
  
  <div class="highlight-box" style="background-color: #f0fdf4; border-left-color: #10b981;">
    <p style="font-weight: 700; color: #065f46; margin-bottom: 8px;">Reward Issued:</p>
    <p class="text" style="margin-bottom: 0;">We've added <strong>+${credits} Intelligence Credits</strong> to your balance. Your updated credits are now available for generating strategic surf reports.</p>
  </div>

  <p class="text">Keep sharing your link to stack more credits and build the ultimate maritime squad.</p>
  
  <div class="button-container">
    <a href="https://www.tideraider.com/raid" class="button">View Dashboard</a>
  </div>
  `
);

