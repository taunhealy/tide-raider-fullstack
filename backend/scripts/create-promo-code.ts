/**
 * Script to create or update promo codes
 * 
 * Usage:
 *   npx tsx scripts/create-promo-code.ts <code> [options]
 * 
 * Examples:
 *   npx tsx scripts/create-promo-code.ts tideraidertrial
 *   npx tsx scripts/create-promo-code.ts SUMMER2024 --max-uses 500 --trial-days 30
 *   npx tsx scripts/create-promo-code.ts WINTER2024 --max-uses 1000 --description "Winter promotion"
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface Args {
  code: string;
  description?: string;
  maxUses?: number;
  trialDays?: number;
  isActive?: boolean;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error("Error: Promo code is required");
    console.log("\nUsage: npx tsx scripts/create-promo-code.ts <code> [options]");
    console.log("\nOptions:");
    console.log("  --description <text>    Description of the promo code");
    console.log("  --max-uses <number>     Maximum number of uses (default: unlimited)");
    console.log("  --trial-days <number>   Number of trial days (default: 30)");
    console.log("  --inactive              Create as inactive");
    process.exit(1);
  }

  const code = args[0].toUpperCase().trim();
  const result: Args = { code };

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === "--description" && args[i + 1]) {
      result.description = args[++i];
    } else if (arg === "--max-uses" && args[i + 1]) {
      result.maxUses = parseInt(args[++i], 10);
      if (isNaN(result.maxUses)) {
        console.error("Error: --max-uses must be a number");
        process.exit(1);
      }
    } else if (arg === "--trial-days" && args[i + 1]) {
      result.trialDays = parseInt(args[++i], 10);
      if (isNaN(result.trialDays)) {
        console.error("Error: --trial-days must be a number");
        process.exit(1);
      }
    } else if (arg === "--inactive") {
      result.isActive = false;
    }
  }

  return result;
}

async function main() {
  try {
    const args = parseArgs();

    console.log(`\n🔑 Creating/updating promo code: ${args.code}`);
    console.log("   Options:", {
      description: args.description || "None",
      maxUses: args.maxUses ?? "Unlimited",
      trialDays: args.trialDays ?? 30,
      isActive: args.isActive !== false,
    });

    const promoCode = await prisma.promoCode.upsert({
      where: { code: args.code },
      update: {
        description: args.description,
        maxUses: args.maxUses,
        trialDays: args.trialDays ?? 30,
        isActive: args.isActive !== false,
        updatedAt: new Date(),
      },
      create: {
        code: args.code,
        description: args.description,
        maxUses: args.maxUses,
        trialDays: args.trialDays ?? 30,
        isActive: args.isActive !== false,
        usedCount: 0,
      },
    });

    console.log("\n✅ Promo code created/updated successfully!");
    console.log("\n📋 Details:");
    console.log(`   ID: ${promoCode.id}`);
    console.log(`   Code: ${promoCode.code}`);
    console.log(`   Description: ${promoCode.description || "None"}`);
    console.log(`   Max Uses: ${promoCode.maxUses ?? "Unlimited"}`);
    console.log(`   Used Count: ${promoCode.usedCount}`);
    console.log(`   Trial Days: ${promoCode.trialDays}`);
    console.log(`   Active: ${promoCode.isActive ? "Yes" : "No"}`);
    console.log(`   Created: ${promoCode.createdAt.toISOString()}`);
    console.log(`   Updated: ${promoCode.updatedAt.toISOString()}`);
  } catch (error) {
    console.error("\n❌ Error creating promo code:", error);
    if (error instanceof Error) {
      console.error("   Message:", error.message);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

