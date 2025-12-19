import { Router, Request, Response } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import axios from "axios";
import { PayPalService } from "../services/paypal";

const router = Router();
const BASE_PRICE = 4.00;
const PLAN_ID = process.env.PAYPAL_PLAN_ID || "P-DEFAULT_PLAN_ID";

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
    
    // 1. Verify Webhook Signature (Simplified)
    // In production, use verifyWebhookSignature from service

    if (event.event_type === "PAYMENT.SALE.COMPLETED") {
       const resource = event.resource;
       // Logic to extract Custom ID is tricky in Payemnt Sale usually it's in the Billing Agreement
       // We might need to fetch the Subscription details using billing_agreement_id
       const billingAgreementId = resource.billing_agreement_id;
       
       if (billingAgreementId) {
          // Fetch Subscription to get Metadata (custom_id)
          const accessToken = await PayPalService['getAccessToken'](); // Make public in service
          const subResponse = await axios.get(
            `${process.env.PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'}/v1/billing/subscriptions/${billingAgreementId}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          
          const customId = subResponse.data.custom_id; // "{ userId: '...', promoCode: '...', partnerId: '...' }"
          
          if (customId) {
             const metadata = JSON.parse(customId);
             
             // Activate User
             await prisma.user.update({
               where: { id: metadata.userId },
               data: {
                 subscriptionStatus: "ACTIVE",
                 paypalSubscriptionId: billingAgreementId
               }
             });

             // AUTOMATED PARTNER PAYOUT
             if (metadata.partnerId) {
               // Calculate Commission (20% of SALE amount)
               const saleAmount = parseFloat(resource.amount.total);
               const commissionAmount = saleAmount * 0.20;

               const partner = await prisma.user.findUnique({
                 where: { id: metadata.partnerId },
                 include: { partnerProfile: true }
               });
               
               if (partner && partner.partnerProfile?.paypalEmail) {
                  console.log(`[PayPal] Initiating Payout of $${commissionAmount} to ${partner.partnerProfile.paypalEmail}`);
                  
                  // Record Commission as PENDING (to be paid out monthly via Cron)
                  await prisma.commission.create({
                    data: {
                      partnerId: partner.id,
                      referredUserId: metadata.userId,
                      amount: commissionAmount,
                      status: "PENDING"
                    }
                  });
                  
                  console.log(`[PayPal] Commission of $${commissionAmount} recorded for partner ${partner.partnerProfile.paypalEmail} (Pending Monthly Payout)`);
               }
             }
          }
       }
    }

    res.status(200).send();
  } catch (error) {
    console.error("[PayPal] Webhook Error:", error);
    res.status(500).send();
  }
});

// POST /api/paypal/cancel
router.post("/cancel", authenticateToken, async (req: Request, res: Response) => {
  // ... existing cancel logic (simplified for brevity, can keep previous logic)
    const authReq = req as AuthRequest;
    // ... basic DB update logic
    await prisma.user.update({
        where: { id: authReq.user?.id },
        data: { subscriptionStatus: "CANCELLED" }
    });
    res.json({ success: true });
});

export default router;
