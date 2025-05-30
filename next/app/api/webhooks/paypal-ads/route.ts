import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: Request) {
  // Verify the webhook signature using the ads-specific webhook ID
  const webhookId = process.env.PAYPAL_ADS_WEBHOOK_ID;

  const payload = await request.json();
  const webhookEvent = payload.event_type;

  try {
    // Log all events for monitoring
    console.log("PayPal Ad Webhook Event:", webhookEvent, payload.resource.id);

    // Handle subscription-specific events
    if (webhookEvent.startsWith("BILLING.SUBSCRIPTION.")) {
      const subscriptionId = payload.resource.id;
      const customId = payload.resource.custom_id; // This will contain our ad ID with 'ad_' prefix

      // Only process if this is an ad subscription (has 'ad_' prefix)
      if (!customId || !customId.startsWith("ad_")) {
        return NextResponse.json({
          received: true,
          message: "Not an ad subscription",
        });
      }

      const adId = customId.replace("ad_", "");

      switch (webhookEvent) {
        case "BILLING.SUBSCRIPTION.ACTIVATED":
        case "BILLING.SUBSCRIPTION.CREATED":
          await handleAdSubscriptionActive(subscriptionId, adId);
          break;
        case "BILLING.SUBSCRIPTION.CANCELLED":
        case "BILLING.SUBSCRIPTION.EXPIRED":
          await handleAdSubscriptionEnded(
            subscriptionId,
            webhookEvent === "BILLING.SUBSCRIPTION.EXPIRED"
              ? "expired"
              : "cancelled"
          );
          break;
        case "BILLING.SUBSCRIPTION.SUSPENDED":
          await handleAdSubscriptionSuspended(subscriptionId);
          break;
        default:
          console.log("Unhandled ad subscription event:", webhookEvent);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Ad webhook error:", error);
    return NextResponse.json(
      { error: "Ad webhook handler failed" },
      { status: 400 }
    );
  }
}

// Ad subscription handlers
async function handleAdSubscriptionActive(
  subscriptionId: string,
  adId: string
) {
  // First try to update by subscription ID
  const updateResult = await prisma.adRequest.updateMany({
    where: { paypalSubscriptionId: subscriptionId },
    data: {
      status: "active",
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  });

  // If no records were updated, try updating by ad ID
  if (updateResult.count === 0 && adId) {
    await prisma.adRequest.update({
      where: { id: adId },
      data: {
        paypalSubscriptionId: subscriptionId,
        status: "active",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    });
  }
}

async function handleAdSubscriptionEnded(
  subscriptionId: string,
  status: string
) {
  await prisma.adRequest.updateMany({
    where: { paypalSubscriptionId: subscriptionId },
    data: {
      status: status,
    },
  });
}

async function handleAdSubscriptionSuspended(subscriptionId: string) {
  await prisma.adRequest.updateMany({
    where: { paypalSubscriptionId: subscriptionId },
    data: {
      status: "suspended",
    },
  });
}
