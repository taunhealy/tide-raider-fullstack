import { Router, Request, Response } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import axios from "axios";
import { PayPalService } from "../services/paypal";
import { sendEmail } from "../lib/email";
import { subscriptionActivatedTemplate, subscriptionCancelledTemplate } from "../lib/emailTemplates";
import { AlertService } from "../services/alertService";

const router = Router();
const BASE_PRICE = 4.00;
const PLAN_ID = process.env.PAYPAL_PLAN_ID || "P-DEFAULT_PLAN_ID";

// GET /api/paypal/subscription-status
router.get("/subscription-status", authenticateToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const user = await prisma.user.findUnique({
      where: { id: authReq.user?.id },
      select: {
        subscriptionStatus: true,
        hasActiveTrial: true,
        paypalSubscriptionId: true,
        credits: true,
        trialEndDate: true
      }
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    // Calculate trial active status
    const isTrialActive = user.hasActiveTrial && user.trialEndDate && new Date(user.trialEndDate) > new Date();

    res.json({
      subscriptionStatus: user.subscriptionStatus,
      hasActiveTrial: user.hasActiveTrial,
      isTrialActive,
      paypalSubscriptionId: user.paypalSubscriptionId,
      isPremium: user.subscriptionStatus?.toUpperCase() === "ACTIVE" || isTrialActive,
      credits: user.credits || 0
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch status" });
  }
});

// POST /api/paypal/sync - Sync subscription status from PayPal
router.post("/sync", authenticateToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const { subscriptionId } = req.body;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Link subscription ID if provided
    if (subscriptionId) {
      await prisma.user.update({
        where: { id: userId },
        data: { paypalSubscriptionId: subscriptionId }
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { paypalSubscriptionId: true, email: true, name: true, subscriptionStatus: true }
    });

    if (!user?.paypalSubscriptionId) {
      if (user?.subscriptionStatus === "ACTIVE") {
        return res.json({
          success: true,
          status: "ACTIVE",
          message: "Your tactical status is ACTIVE. Subscription managed manually."
        });
      }
      return res.status(400).json({ error: "No PayPal subscription found to sync." });
    }

    const accessToken = await PayPalService.getAccessToken();
    const response = await axios.get(
      `${process.env.PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'}/v1/billing/subscriptions/${user.paypalSubscriptionId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const paypalStatus = response.data.status;
    let dbStatus = "INACTIVE";

    if (paypalStatus === "ACTIVE") dbStatus = "ACTIVE";
    else if (paypalStatus === "SUSPENDED") dbStatus = "SUSPENDED";
    else if (paypalStatus === "CANCELLED" || paypalStatus === "EXPIRED") dbStatus = "INACTIVE";
    else if (paypalStatus === "APPROVAL_PENDING" || paypalStatus === "APPROVED") dbStatus = "PENDING";

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { subscriptionStatus: dbStatus }
    });

    // If it just became active, send email
    if (dbStatus === "ACTIVE" && user.subscriptionStatus !== "ACTIVE") {
      await sendEmail(
        user.email,
        "Premium Intelligence Activated 🛰️",
        subscriptionActivatedTemplate(user.name || "Explorer")
      );
    }

    res.json({
      success: true,
      status: dbStatus,
      paypalStatus: paypalStatus
    });
  } catch (error) {
    console.error("[PayPal] Sync Error:", error);
    res.status(500).json({ error: "Failed to sync subscription" });
  }
});

// POST /api/paypal/create-subscription
router.post("/create-subscription", authenticateToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { promoCode } = req.body;
    
    let finalPrice = BASE_PRICE;
    let partnerId = null;
    let validCode = null;

    // Validate Coupon
    if (promoCode) {
      const code = await prisma.promoCode.findUnique({
        where: { code: promoCode.toUpperCase() },
        include: { owner: true } // Assuming 'owner' relation exists for partner
      });

      if (code && code.isActive) {
        // Apply 10% discount logic (or whatever is set on code/system)
        // Hardcoding standard affiliate discount for now
        const discount = 0.10; // 10%
        finalPrice = BASE_PRICE * (1 - discount);
        validCode = code.code;
        partnerId = code.ownerId;
      }
    }

    // Get Access Token
    const accessToken = await PayPalService['getAccessToken'](); // Accessing private method via string or make public

    // Create Subscription Payload with Override
    // Note: To override price in PayPal Subscriptions, we need to provide the plan detail override
    const subscriptionPayload = {
      plan_id: PLAN_ID,
      custom_id: JSON.stringify({
        userId: authReq.user?.id,
        promoCode: validCode,
        partnerId: partnerId
      }),
      plan: {
        billing_cycles: [
          {
            sequence: 1,
            total_cycles: 0, // Infinite
            pricing_scheme: {
              fixed_price: {
                value: finalPrice.toFixed(2),
                currency_code: "USD"
              }
            }
          }
        ]
      },
      application_context: {
        brand_name: "Tide Raider",
        shipping_preference: "NO_SHIPPING",
        user_action: "SUBSCRIBE_NOW",
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`
      }
    };

    const response = await axios.post(
      `${process.env.PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'}/v1/billing/subscriptions`,
      subscriptionPayload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json({
      subscriptionId: response.data.id,
      approvalUrl: response.data.links.find((l: any) => l.rel === "approve").href
    });

  } catch (error: any) {
    console.error("[PayPal] Create Subscription Failed:", error.response?.data || error);
    res.status(500).json({ error: "Failed to create subscription" });
  }
});

// WEBHOOK HANDLER
router.post("/webhook", async (req: Request, res: Response) => {
  try {
    const event = req.body;
    console.log(`[PayPal Webhook] Received event: ${event.event_type}`);
    
    // In production, verify signature here...

    const resource = event.resource;
    let subscriptionId = resource.billing_agreement_id || resource.id;

    if (event.event_type === "PAYMENT.SALE.COMPLETED") {
       if (subscriptionId) {
          const accessToken = await PayPalService.getAccessToken();
          const subResponse = await axios.get(
            `${process.env.PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'}/v1/billing/subscriptions/${subscriptionId}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          
          const customId = subResponse.data.custom_id;
          
          if (customId) {
             const metadata = JSON.parse(customId);
             
             const user = await prisma.user.findUnique({ where: { id: metadata.userId } });
             if (!user) return res.status(404).send();

             // Only activate if not already active to avoid duplicate emails
             if (user.subscriptionStatus !== "ACTIVE") {
               await prisma.user.update({
                 where: { id: metadata.userId },
                 data: {
                   subscriptionStatus: "ACTIVE",
                   paypalSubscriptionId: subscriptionId,
                   credits: { increment: 30 }
                 }
               });

               await sendEmail(
                 user.email,
                 "Premium Intelligence Activated 🛰️",
                 subscriptionActivatedTemplate(user.name || "Explorer")
               );
             }

             // Handle Partner Payouts...
             if (metadata.partnerId) {
                const saleAmount = parseFloat(resource.amount.total);
                const commissionAmount = saleAmount * 0.20;
                await prisma.commission.create({
                  data: {
                    partnerId: metadata.partnerId,
                    referredUserId: metadata.userId,
                    amount: commissionAmount,
                    status: "PENDING"
                  }
                });
             }
          }
       }
    } else if (event.event_type === "BILLING.SUBSCRIPTION.CANCELLED") {
      const user = await prisma.user.findFirst({
        where: { paypalSubscriptionId: subscriptionId }
      });

      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { subscriptionStatus: "CANCELLED" }
        });

        // Enforce free tier limits immediately
        await AlertService.syncAlertStatus(user.id);

        await sendEmail(
          user.email,
          "Subscription Cancelled ⚓",
          subscriptionCancelledTemplate(user.name || "Explorer")
        );
      }
    } else if (event.event_type === "BILLING.SUBSCRIPTION.ACTIVATED") {
      // Handled similarly to SALE.COMPLETED if we want to be safe
      // But usually SALE.COMPLETED is the one that confirms money is received
    }

    res.status(200).send();
  } catch (error) {
    console.error("[PayPal] Webhook Error:", error);
    res.status(500).send();
  }
});

// POST /api/paypal/create-credit-order
router.post("/create-credit-order", authenticateToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // 100 credits for R100 (~$5.50 USD)
    const AMOUNT = 5.50; 
    const CURRENCY = "USD";
    const CREDITS_TO_ADD = 100;

    const order = await PayPalService.createOrder(AMOUNT, CURRENCY, JSON.stringify({
      userId,
      credits: CREDITS_TO_ADD,
      type: "CREDIT_PURCHASE"
    }));

    res.json({
      orderId: order.id,
      approvalUrl: order.links.find((l: any) => l.rel === "approve").href
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create credit order" });
  }
});

// POST /api/paypal/capture-credit-order
router.post("/capture-credit-order", authenticateToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: "Order ID required" });

    const capture = await PayPalService.captureOrder(orderId);

    if (capture.status === "COMPLETED") {
       const purchaseUnit = capture.purchase_units[0];
       const customId = purchaseUnit.payments.captures[0].custom_id || purchaseUnit.custom_id;
       
       if (customId) {
          const metadata = JSON.parse(customId);
          if (metadata.type === "CREDIT_PURCHASE") {
             const user = await prisma.user.update({
               where: { id: metadata.userId },
               data: {
                 credits: { increment: metadata.credits }
               }
             });
             
             return res.json({ success: true, credits: user.credits });
          }
       }
    }

    res.status(400).json({ error: "Order not completed" });
  } catch (error) {
    console.error("[PayPal] Capture Error:", error);
    res.status(500).json({ error: "Failed to capture order" });
  }
});

// POST /api/paypal/suspend
router.post("/suspend", authenticateToken, async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.id;
        
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const user = await prisma.user.findUnique({
          where: { id: userId }
        });

        if (!user) return res.status(404).json({ error: "User not found" });

        // If it's a PayPal subscription, suspend it there
        if (user.paypalSubscriptionId) {
            await PayPalService.suspendSubscription(user.paypalSubscriptionId);
        }

        await prisma.user.update({
            where: { id: userId },
            data: { subscriptionStatus: "SUSPENDED" }
        });

        // Enforce free tier limits immediately
        await AlertService.syncAlertStatus(userId);

        res.json({ success: true, message: "Subscription suspended successfully" });
    } catch (error) {
        console.error("[PayPal] Suspend Error:", error);
        res.status(500).json({ error: "Failed to suspend subscription" });
    }
});

// POST /api/paypal/cancel
router.post("/cancel", authenticateToken, async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.id;
        
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const user = await prisma.user.findUnique({
          where: { id: userId }
        });

        if (!user) return res.status(404).json({ error: "User not found" });

        // If it's a PayPal subscription, cancel it there
        if (user.paypalSubscriptionId) {
            try {
                await PayPalService.cancelSubscription(user.paypalSubscriptionId);
            } catch (err) {
                console.warn("[PayPal] Cancel in PayPal failed, proceeding with DB update:", err);
            }
        }

        await prisma.user.update({
            where: { id: userId },
            data: { subscriptionStatus: "CANCELLED" }
        });

        // Enforce free tier limits immediately
        await AlertService.syncAlertStatus(userId);

        if (user.email) {
            await sendEmail(
                user.email,
                "Subscription Cancelled ⚓",
                subscriptionCancelledTemplate(user.name || "Explorer")
            ).catch(err => console.error("Failed to send cancellation email:", err));
        }
        
        res.json({ success: true, message: "Subscription cancelled successfully" });
    } catch (error) {
        console.error("[PayPal] Cancel Error:", error);
        res.status(500).json({ error: "Failed to cancel subscription" });
    }
});

// POST /api/paypal/activate (Resume)
router.post("/activate", authenticateToken, async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.id;
        
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const user = await prisma.user.findUnique({
          where: { id: userId }
        });

        if (!user) return res.status(404).json({ error: "User not found" });

        // If it's a PayPal subscription, activate it there
        if (user.paypalSubscriptionId) {
            await PayPalService.activateSubscription(user.paypalSubscriptionId);
        }

        await prisma.user.update({
            where: { id: userId },
            data: { subscriptionStatus: "ACTIVE" }
        });

        res.json({ success: true, message: "Subscription resumed successfully" });
    } catch (error) {
        console.error("[PayPal] Activate Error:", error);
        res.status(500).json({ error: "Failed to resume subscription" });
    }
});

export default router;
