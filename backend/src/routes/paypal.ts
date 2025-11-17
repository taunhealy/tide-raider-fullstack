import { Router, Request, Response } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();

// PayPal API configuration
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_MODE = process.env.PAYPAL_MODE || "sandbox"; // 'sandbox' or 'live'
const PAYPAL_BASE_URL =
  PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

// Get PayPal access token
async function getPayPalAccessToken(): Promise<string> {
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
    throw new Error("Failed to get PayPal access token");
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

// POST /api/paypal/create-subscription - Create a PayPal subscription
router.post(
  "/create-subscription",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.user?.id) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
        return res.status(500).json({
          error: "PayPal configuration missing",
          message: "PayPal credentials not configured",
        });
      }

      const accessToken = await getPayPalAccessToken();

      // Get user email for PayPal
      const user = await prisma.user.findUnique({
        where: { id: authReq.user.id },
        select: { email: true, name: true },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Create subscription plan (you'll need to create this in PayPal dashboard first)
      // For now, we'll use a product/plan ID from environment variables
      const PLAN_ID = process.env.PAYPAL_PLAN_ID;

      if (!PLAN_ID) {
        return res.status(500).json({
          error: "PayPal plan not configured",
          message: "PAYPAL_PLAN_ID environment variable is required",
        });
      }

      // Create subscription
      const subscriptionResponse = await fetch(
        `${PAYPAL_BASE_URL}/v1/billing/subscriptions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            "PayPal-Request-Id": `subscription-${authReq.user.id}-${Date.now()}`,
          },
          body: JSON.stringify({
            plan_id: PLAN_ID,
            subscriber: {
              name: {
                given_name: user.name?.split(" ")[0] || "User",
                surname: user.name?.split(" ").slice(1).join(" ") || "",
              },
              email_address: user.email,
            },
            application_context: {
              brand_name: "Tide Raider",
              locale: "en-US",
              shipping_preference: "NO_SHIPPING",
              user_action: "SUBSCRIBE_NOW",
              payment_method: {
                payer_selected: "PAYPAL",
                payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED",
              },
              return_url: `${process.env.FRONTEND_URL || "https://www.tideraider.com"}/checkout/success`,
              cancel_url: `${process.env.FRONTEND_URL || "https://www.tideraider.com"}/checkout/cancel`,
            },
          }),
        }
      );

      if (!subscriptionResponse.ok) {
        const errorData = await subscriptionResponse.json().catch(() => ({}));
        console.error("PayPal subscription creation error:", errorData);
        return res.status(subscriptionResponse.status).json({
          error: "Failed to create PayPal subscription",
          details: errorData,
        });
      }

      const subscriptionData = (await subscriptionResponse.json()) as {
        id: string;
        status: string;
        links?: Array<{ rel: string; href: string }>;
      };

      // Store subscription ID in user record (temporarily, until webhook confirms)
      await prisma.user.update({
        where: { id: authReq.user.id },
        data: {
          paypalSubscriptionId: subscriptionData.id,
        },
      });

      // Return approval URL for user to complete payment
      const approvalUrl = subscriptionData.links?.find(
        (link) => link.rel === "approve"
      )?.href;

      if (!approvalUrl) {
        return res.status(500).json({
          error: "No approval URL returned from PayPal",
        });
      }

      return res.json({
        subscriptionId: subscriptionData.id,
        approvalUrl,
        status: subscriptionData.status,
      });
    } catch (error) {
      console.error("PayPal subscription creation error:", error);
      return res.status(500).json({
        error: "Failed to create subscription",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// GET /api/paypal/subscription-status - Get subscription status
router.get(
  "/subscription-status",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.user?.id) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await prisma.user.findUnique({
        where: { id: authReq.user.id },
        select: {
          subscriptionStatus: true,
          hasActiveTrial: true,
          paypalSubscriptionId: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json({
        subscriptionStatus: user.subscriptionStatus,
        hasActiveTrial: user.hasActiveTrial,
        paypalSubscriptionId: user.paypalSubscriptionId,
        isPremium: user.subscriptionStatus === "ACTIVE" || user.hasActiveTrial,
      });
    } catch (error) {
      console.error("Error fetching subscription status:", error);
      return res.status(500).json({
        error: "Failed to fetch subscription status",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

export default router;
