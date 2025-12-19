/**
 * Script to Onboard a Partner (Surf Shop)
 * - Creates/Finds a User
 * - Sets up their Partner Profile with PayPal Email
 * - Assigns them a Promo Code for referrals
 * 
 * Usage:
 *   npx tsx scripts/onboard-partner.ts --name "Surf Shop" --link "https://surfshop.com" --email "shop@example.com" --paypal "payments@example.com" --code "SURFSHOP20"
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface Args {
  name: string;
  link: string;
  email: string;
  paypalEmail: string;
  promoCode: string;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const result: Partial<Args> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--name" && args[i + 1]) result.name = args[++i];
    if (arg === "--link" && args[i + 1]) result.link = args[++i];
    if (arg === "--email" && args[i + 1]) result.email = args[++i];
    if (arg === "--paypal" && args[i + 1]) result.paypalEmail = args[++i];
    if (arg === "--code" && args[i + 1]) result.promoCode = args[++i].toUpperCase();
  }

  if (!result.email || !result.paypalEmail || !result.promoCode || !result.name || !result.link) {
    console.error("❌ Missing required arguments.");
    console.log("Usage: npx tsx scripts/onboard-partner.ts --name \"Name\" --link \"https://site.com\" --email \"email\" --paypal \"paypal\" --code \"CODE\"");
    process.exit(1);
  }

  return result as Args;
}

async function main() {
  const args = parseArgs();
  console.log("🚀 Onboarding New Partner...");
  console.log(args);

  try {
    // 1. Find or Create User
    const user = await prisma.user.upsert({
      where: { email: args.email },
      update: { name: args.name },
      create: {
        email: args.email,
        name: args.name,
        // No password needed if they just use this for tracking, 
        // but normally they'd sign up via the app. 
        // If this user already exists, we just link them.
      }
    });
    console.log(`✅ User identified: ${user.email} (${user.id})`);

    // 2. Create/Update Partner Profile
    await prisma.partnerProfile.upsert({
      where: { userId: user.id },
      update: { 
        businessName: args.name,
        businessLink: args.link,
        paypalEmail: args.paypalEmail 
      },
      create: {
        userId: user.id,
        businessName: args.name,
        businessLink: args.link,
        paypalEmail: args.paypalEmail,
        balance: 0,
        totalPaid: 0
      }
    });
    console.log(`✅ Partner Profile set with PayPal: ${args.paypalEmail}`);
    console.log(`   - Website: ${args.link}`);

    // 3. Create/Link Promo Code
    const code = await prisma.promoCode.upsert({
      where: { code: args.promoCode },
      update: {
        ownerId: user.id,
        discountPercent: 10,     // 10% Discount for user
        commissionPercent: 20,   // 20% Commission for partner
        isActive: true
      },
      create: {
        code: args.promoCode,
        ownerId: user.id,
        discountPercent: 10,
        commissionPercent: 20,
        trialDays: 14,
        isActive: true,
        usedCount: 0
      }
    });
    console.log(`✅ Promo Code '${code.code}' assigned to ${user.name}`);
    console.log(`   - Customer gets: ${code.discountPercent}% Off`);
    console.log(`   - Partner gets: ${code.commissionPercent}% Commission`);

    console.log("\n🎉 Partner Onboarding Complete!");

  } catch (error) {
    console.error("❌ Error onboarding partner:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
