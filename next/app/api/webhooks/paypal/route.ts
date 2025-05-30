import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { SubscriptionStatus } from "@/app/types/subscription";

export async function POST(request: Request) {
  const payload = await request.json();
  const webhookEvent = payload.event_type;

  try {
    // Log all events for monitoring
    console.log("PayPal Webhook Event:", webhookEvent, payload.resource.id);

    // Handle subscription-specific events
    if (webhookEvent.startsWith("BILLING.SUBSCRIPTION.")) {
      const subscriptionId = payload.resource.id;

      switch (webhookEvent) {
        case "BILLING.SUBSCRIPTION.ACTIVATED":
        case "BILLING.SUBSCRIPTION.CREATED":
          await handleSubscriptionActive(subscriptionId);
          break;
        case "BILLING.SUBSCRIPTION.CANCELLED":
        case "BILLING.SUBSCRIPTION.EXPIRED":
          await handleSubscriptionEnded(
            subscriptionId,
            webhookEvent === "BILLING.SUBSCRIPTION.EXPIRED"
              ? SubscriptionStatus.EXPIRED
              : SubscriptionStatus.CANCELLED
          );
          break;
        case "BILLING.SUBSCRIPTION.SUSPENDED":
          await handleSubscriptionSuspended(subscriptionId);
          break;
        // Log other subscription events
        default:
          console.log("Unhandled subscription event:", webhookEvent);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 400 }
    );
  }
}

async function handleSubscriptionActive(subscriptionId: string) {
  await prisma.user.updateMany({
    where: { paypalSubscriptionId: subscriptionId },
    data: {
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      hasActiveTrial: false,
      trialEndDate: null,
    },
  });
}

async function handleSubscriptionEnded(
  subscriptionId: string,
  status: SubscriptionStatus
) {
  await prisma.user.updateMany({
    where: { paypalSubscriptionId: subscriptionId },
    data: {
      subscriptionStatus: status,
    },
  });
}

async function handleSubscriptionSuspended(subscriptionId: string) {
  await prisma.user.updateMany({
    where: { paypalSubscriptionId: subscriptionId },
    data: {
      subscriptionStatus: SubscriptionStatus.SUSPENDED,
    },
  });
}
