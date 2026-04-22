import { prisma } from "./prisma";
import crypto from "crypto";

/**
 * Generate a unique referral code for a user
 */
export async function generateUniqueReferralCode(name?: string): Promise<string> {
  const prefix = name ? name.substring(0, 3).toUpperCase() : "TR";
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  const code = `${prefix}-${random}`;

  // Check uniqueness
  const existing = await prisma.user.findUnique({
    where: { referralCode: code }
  });

  if (existing) {
    return generateUniqueReferralCode(name);
  }

  return code;
}

/**
 * Reward a referrer with AI credits
 */
export async function rewardReferrer(referrerId: string, credits: number = 30) {
  try {
    const user = await prisma.user.update({
      where: { id: referrerId },
      data: {
        credits: { increment: credits }
      }
    });

    // Create a notification for the referrer
    await prisma.notification.create({
      data: {
        userId: referrerId,
        type: "RECRUITMENT",
        title: "Recruitment Successful 🎯",
        message: `A new tactical analyst has joined via your intel link. +${credits} Intelligence Credits added to your balance.`,
        read: false
      }
    });

    console.log(`[Referral] 🏆 Rewarded user ${referrerId} with ${credits} credits. New balance: ${user.credits}`);
    return true;
  } catch (error) {
    console.error(`[Referral] ❌ Failed to reward referrer ${referrerId}:`, error);
    return false;
  }
}
