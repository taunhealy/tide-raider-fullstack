/**
 * Script to create a PayPal subscription plan
 * Run with: npx ts-node scripts/create-paypal-plan.ts
 */

import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env.local") });
dotenv.config({ path: path.join(__dirname, "../.env") });

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_MODE = process.env.PAYPAL_MODE || "sandbox";
const PAYPAL_BASE_URL =
  PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

async function getPayPalAccessToken(): Promise<string> {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error("PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are required");
  }

  const auth = Buffer.from(
    `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${auth}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get PayPal access token: ${error}`);
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

async function createProduct(accessToken: string) {
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/catalogs/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "PayPal-Request-Id": `product-${Date.now()}`,
    },
    body: JSON.stringify({
      name: "Tide Raider Premium",
      description: "Premium subscription for Tide Raider - Up to 300 alerts",
      type: "SERVICE",
      category: "SOFTWARE",
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create product: ${JSON.stringify(error)}`);
  }

  return (await response.json()) as { id: string; name: string };
}

async function createPlan(accessToken: string, productId: string) {
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/plans`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "PayPal-Request-Id": `plan-${Date.now()}`,
    },
    body: JSON.stringify({
      product_id: productId,
      name: "Tide Raider Premium Monthly",
      description: "Monthly subscription for Tide Raider Premium",
      status: "ACTIVE",
      billing_cycles: [
        {
          frequency: {
            interval_unit: "MONTH",
            interval_count: 1,
          },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0, // 0 = infinite
          pricing_scheme: {
            fixed_price: {
              value: "3.00",
              currency_code: "USD",
            },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee: {
          value: "0.00",
          currency_code: "USD",
        },
        setup_fee_failure_action: "CONTINUE",
        payment_failure_threshold: 3,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create plan: ${JSON.stringify(error)}`);
  }

  return (await response.json()) as {
    id: string;
    name: string;
    status: string;
  };
}

async function main() {
  try {
    console.log("🚀 Creating PayPal subscription plan...");
    console.log(`Mode: ${PAYPAL_MODE}`);
    console.log(`Base URL: ${PAYPAL_BASE_URL}\n`);

    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      throw new Error(
        "PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be set in environment"
      );
    }

    // Step 1: Get access token
    console.log("1. Getting PayPal access token...");
    const accessToken = await getPayPalAccessToken();
    console.log("✅ Access token obtained\n");

    // Step 2: Create product
    console.log("2. Creating product...");
    const product = await createProduct(accessToken);
    console.log(`✅ Product created: ${product.name} (ID: ${product.id})\n`);

    // Step 3: Create plan
    console.log("3. Creating subscription plan...");
    const plan = await createPlan(accessToken, product.id);
    console.log(`✅ Plan created: ${plan.name} (ID: ${plan.id})`);
    console.log(`   Status: ${plan.status}\n`);

    console.log("=".repeat(60));
    console.log("✅ SUCCESS! Your PayPal Plan ID:");
    console.log(`   ${plan.id}`);
    console.log("=".repeat(60));
    console.log("\n📋 Next steps:");
    console.log(
      `1. Set this as PAYPAL_PLAN_ID in Fly.io:\n   fly secrets set PAYPAL_PLAN_ID="${plan.id}" --app tide-raider-backend`
    );
    console.log(
      `2. Or add to your .env.local:\n   PAYPAL_PLAN_ID="${plan.id}"`
    );
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

main();
