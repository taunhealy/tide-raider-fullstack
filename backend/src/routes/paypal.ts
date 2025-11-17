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

      // Log configuration for debugging
      console.log("PayPal Configuration:", {
        mode: PAYPAL_MODE,
        baseUrl: PAYPAL_BASE_URL,
        planId: PLAN_ID,
        hasClientId: !!PAYPAL_CLIENT_ID,
        hasClientSecret: !!PAYPAL_CLIENT_SECRET,
      });

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
        const errorData = (await subscriptionResponse
          .json()
          .catch(() => ({}))) as {
          name?: string;
          message?: string;
          issue?: string;
          details?: any[];
        };
        console.error("PayPal subscription creation error:", {
          status: subscriptionResponse.status,
          statusText: subscriptionResponse.statusText,
          error: errorData,
          planId: PLAN_ID,
          mode: PAYPAL_MODE,
        });

        // Provide more helpful error messages
        let errorMessage = "Failed to create PayPal subscription";
        if (
          errorData.name === "RESOURCE_NOT_FOUND" ||
          errorData.issue === "INVALID_RESOURCE_ID"
        ) {
          errorMessage = `PayPal plan not found. Please verify:
            - Plan ID "${PLAN_ID}" exists in PayPal ${PAYPAL_MODE} environment
            - Plan ID matches the environment (sandbox vs live)
            - Plan is active and accessible with current credentials`;
        }

        return res.status(subscriptionResponse.status).json({
          error: errorMessage,
          details: errorData,
          troubleshooting: {
            planId: PLAN_ID,
            mode: PAYPAL_MODE,
            baseUrl: PAYPAL_BASE_URL,
          },
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

// POST /api/paypal/sync - Sync subscription status from PayPal
router.post("/sync", authenticateToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      return res.status(500).json({
        error: "PayPal configuration missing",
      });
    }

    // Get user's PayPal subscription ID
    const user = await prisma.user.findUnique({
      where: { id: authReq.user.id },
      select: {
        paypalSubscriptionId: true,
        subscriptionStatus: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.paypalSubscriptionId) {
      return res.json({
        message: "No PayPal subscription found",
        subscriptionStatus: user.subscriptionStatus,
        synced: false,
      });
    }

    // Fetch subscription status from PayPal
    const accessToken = await getPayPalAccessToken();
    const subscriptionResponse = await fetch(
      `${PAYPAL_BASE_URL}/v1/billing/subscriptions/${user.paypalSubscriptionId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!subscriptionResponse.ok) {
      console.error(
        "Failed to fetch subscription from PayPal:",
        subscriptionResponse.status,
        await subscriptionResponse.text()
      );
      return res.status(500).json({
        error: "Failed to sync subscription from PayPal",
        subscriptionStatus: user.subscriptionStatus,
        synced: false,
      });
    }

    const subscriptionData = (await subscriptionResponse.json()) as {
      id: string;
      status: string;
    };

    // Map PayPal status to our subscription status
    let newStatus: string | null = null;
    switch (subscriptionData.status.toUpperCase()) {
      case "ACTIVE":
        newStatus = "ACTIVE";
        break;
      case "SUSPENDED":
        newStatus = "SUSPENDED";
        break;
      case "CANCELLED":
        newStatus = "CANCELLED";
        break;
      case "EXPIRED":
        newStatus = "EXPIRED";
        break;
      default:
        console.log(
          `Unknown PayPal subscription status: ${subscriptionData.status}`
        );
    }

    // Update user's subscription status if it changed
    if (newStatus && newStatus !== user.subscriptionStatus) {
      await prisma.user.update({
        where: { id: authReq.user.id },
        data: {
          subscriptionStatus: newStatus,
          hasActiveTrial: false,
          trialEndDate: null,
        },
      });

      console.log(
        `Synced subscription ${user.paypalSubscriptionId} to status: ${newStatus}`
      );

      return res.json({
        message: "Subscription synced successfully",
        subscriptionStatus: newStatus,
        paypalStatus: subscriptionData.status,
        synced: true,
      });
    }

    return res.json({
      message: "Subscription already up to date",
      subscriptionStatus: user.subscriptionStatus,
      paypalStatus: subscriptionData.status,
      synced: true,
    });
  } catch (error) {
    console.error("Error syncing subscription:", error);
    return res.status(500).json({
      error: "Failed to sync subscription",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/paypal/cancel - Cancel a PayPal subscription
router.post(
  "/cancel",
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
        });
      }

      // Get user's PayPal subscription ID
      const user = await prisma.user.findUnique({
        where: { id: authReq.user.id },
        select: {
          paypalSubscriptionId: true,
        },
      });

      if (!user || !user.paypalSubscriptionId) {
        return res.status(404).json({ error: "No active subscription found" });
      }

      // Cancel subscription via PayPal API
      const accessToken = await getPayPalAccessToken();
      const cancelResponse = await fetch(
        `${PAYPAL_BASE_URL}/v1/billing/subscriptions/${user.paypalSubscriptionId}/cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            reason: "User requested cancellation",
          }),
        }
      );

      if (!cancelResponse.ok) {
        const error = await cancelResponse.json().catch(() => ({}));
        console.error("Failed to cancel PayPal subscription:", error);
        return res.status(500).json({
          error: "Failed to cancel subscription",
          details: error,
        });
      }

      // Update user's subscription status
      await prisma.user.update({
        where: { id: authReq.user.id },
        data: {
          subscriptionStatus: "CANCELLED",
        },
      });

      console.log(
        `Subscription ${user.paypalSubscriptionId} cancelled by user`
      );

      return res.json({
        message: "Subscription cancelled successfully",
        subscriptionStatus: "CANCELLED",
      });
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      return res.status(500).json({
        error: "Failed to cancel subscription",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// POST /api/paypal/suspend - Suspend a PayPal subscription
router.post(
  "/suspend",
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
        });
      }

      // Get user's PayPal subscription ID
      const user = await prisma.user.findUnique({
        where: { id: authReq.user.id },
        select: {
          paypalSubscriptionId: true,
        },
      });

      if (!user || !user.paypalSubscriptionId) {
        return res.status(404).json({ error: "No active subscription found" });
      }

      // Suspend subscription via PayPal API
      const accessToken = await getPayPalAccessToken();
      const suspendResponse = await fetch(
        `${PAYPAL_BASE_URL}/v1/billing/subscriptions/${user.paypalSubscriptionId}/suspend`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            reason: "User requested suspension",
          }),
        }
      );

      if (!suspendResponse.ok) {
        const error = await suspendResponse.json().catch(() => ({}));
        console.error("Failed to suspend PayPal subscription:", error);
        return res.status(500).json({
          error: "Failed to suspend subscription",
          details: error,
        });
      }

      // Update user's subscription status
      await prisma.user.update({
        where: { id: authReq.user.id },
        data: {
          subscriptionStatus: "SUSPENDED",
        },
      });

      console.log(
        `Subscription ${user.paypalSubscriptionId} suspended by user`
      );

      return res.json({
        message: "Subscription suspended successfully",
        subscriptionStatus: "SUSPENDED",
      });
    } catch (error) {
      console.error("Error suspending subscription:", error);
      return res.status(500).json({
        error: "Failed to suspend subscription",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// POST /api/paypal/webhook - Handle PayPal webhook events
router.post("/webhook", async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const webhookEvent = payload.event_type;

    // Log all events for monitoring
    console.log("PayPal Webhook Event:", webhookEvent, payload.resource?.id);

    // Handle subscription-specific events
    if (webhookEvent?.startsWith("BILLING.SUBSCRIPTION.")) {
      const subscriptionId = payload.resource?.id;

      if (!subscriptionId) {
        console.error("No subscription ID in webhook payload");
        return res.status(400).json({ error: "Invalid webhook payload" });
      }

      switch (webhookEvent) {
        case "BILLING.SUBSCRIPTION.ACTIVATED":
        case "BILLING.SUBSCRIPTION.CREATED":
        case "BILLING.SUBSCRIPTION.RE_ACTIVATED":
          await handleSubscriptionActive(subscriptionId);
          break;
        case "BILLING.SUBSCRIPTION.CANCELLED":
        case "BILLING.SUBSCRIPTION.EXPIRED":
          await handleSubscriptionEnded(
            subscriptionId,
            webhookEvent === "BILLING.SUBSCRIPTION.EXPIRED"
              ? "EXPIRED"
              : "CANCELLED"
          );
          break;
        case "BILLING.SUBSCRIPTION.SUSPENDED":
          await handleSubscriptionSuspended(subscriptionId);
          break;
        case "BILLING.SUBSCRIPTION.PAYMENT_FAILED":
          await handleSubscriptionPaymentFailed(subscriptionId);
          break;
        case "BILLING.SUBSCRIPTION.UPDATED":
          // Subscription updated - check status from payload
          await handleSubscriptionUpdated(subscriptionId, payload.resource);
          break;
        // Log other subscription events
        default:
          console.log("Unhandled subscription event:", webhookEvent);
      }
    }

    return res.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(400).json({
      error: "Webhook handler failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

async function handleSubscriptionActive(subscriptionId: string) {
  await prisma.user.updateMany({
    where: { paypalSubscriptionId: subscriptionId },
    data: {
      subscriptionStatus: "ACTIVE",
      hasActiveTrial: false,
      trialEndDate: null,
    },
  });
  console.log(`Subscription ${subscriptionId} activated`);
}

async function handleSubscriptionEnded(
  subscriptionId: string,
  status: "EXPIRED" | "CANCELLED"
) {
  await prisma.user.updateMany({
    where: { paypalSubscriptionId: subscriptionId },
    data: {
      subscriptionStatus: status,
    },
  });
  console.log(`Subscription ${subscriptionId} ended: ${status}`);
}

async function handleSubscriptionSuspended(subscriptionId: string) {
  await prisma.user.updateMany({
    where: { paypalSubscriptionId: subscriptionId },
    data: {
      subscriptionStatus: "SUSPENDED",
    },
  });
  console.log(`Subscription ${subscriptionId} suspended`);
}

async function handleSubscriptionPaymentFailed(subscriptionId: string) {
  // Payment failed - keep subscription active but log the failure
  // PayPal will retry payments, so we don't immediately suspend
  console.log(`Payment failed for subscription ${subscriptionId}`);
  // Optionally, you could update a payment_failed flag or send notification
}

async function handleSubscriptionUpdated(
  subscriptionId: string,
  resource: any
) {
  // Update subscription based on the resource status
  const status = resource?.status;
  if (!status) {
    console.log(
      `Subscription ${subscriptionId} updated but no status in payload`
    );
    return;
  }

  // Map PayPal status to our subscription status
  switch (status.toUpperCase()) {
    case "ACTIVE":
      await handleSubscriptionActive(subscriptionId);
      break;
    case "SUSPENDED":
      await handleSubscriptionSuspended(subscriptionId);
      break;
    case "CANCELLED":
      await handleSubscriptionEnded(subscriptionId, "CANCELLED");
      break;
    case "EXPIRED":
      await handleSubscriptionEnded(subscriptionId, "EXPIRED");
      break;
    default:
      console.log(
        `Subscription ${subscriptionId} updated to unknown status: ${status}`
      );
  }
}

export default router;
