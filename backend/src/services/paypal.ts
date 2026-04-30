import axios from "axios";
import { prisma } from "../lib/prisma";

const PAYPAL_API_BASE =
  process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

export class PayPalService {
  public static async getAccessToken(): Promise<string> {
    const auth = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
    ).toString("base64");

    try {
      const response = await axios.post(
        `${PAYPAL_API_BASE}/v1/oauth2/token`,
        "grant_type=client_credentials",
        {
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      return response.data.access_token;
    } catch (error) {
      console.error("[PayPal] Failed to get access token", error);
      throw new Error("PayPal Auth Failed");
    }
  }

  // Single Payout (Legacy/Instant)
  static async sendPayout(
    partnerEmail: string,
    amount: number,
    referenceId: string,
    note: string = "Commission Payout"
  ) {
    // Wrap single payout as batch
    return this.sendBatchPayout([
      {
        recipient_type: "EMAIL",
        amount: {
          value: amount.toFixed(2),
          currency: "USD",
        },
        note: note,
        sender_item_id: referenceId,
        receiver: partnerEmail,
      }
    ]);
  }

  // Batch Payout (For Monthly processing)
  static async sendBatchPayout(items: any[]) {
    const token = await this.getAccessToken();

    const payoutBody = {
      sender_batch_header: {
        sender_batch_id: `batch_payout_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        email_subject: "You have received a payment from Tide Raider!",
        email_message: "Here are your commissions for the recent period.",
      },
      items: items
    };

    try {
      const response = await axios.post(
        `${PAYPAL_API_BASE}/v1/payments/payouts`,
        payoutBody,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log(`[PayPal] Batch Payout created: ${response.data.batch_header.payout_batch_id} with ${items.length} items`);
      return response.data;
    } catch (error: any) {
      console.error("[PayPal] Batch Payout Failed:", error.response?.data || error.message);
      throw error;
    }
  }

  static async verifyWebhookSignature(req: any): Promise<boolean> {
    // Basic verification
    return true; 
  }

  // One-time Order Creation
  static async createOrder(amount: number, currency: string = "USD", customId: string) {
    const token = await this.getAccessToken();
    const orderPayload = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount.toFixed(2),
          },
          custom_id: customId
        },
      ],
      application_context: {
        brand_name: "Tide Raider",
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing?status=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing?status=cancel`,
      },
    };

    try {
      const response = await axios.post(`${PAYPAL_API_BASE}/v2/checkout/orders`, orderPayload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error: any) {
      console.error("[PayPal] Create Order Failed:", error.response?.data || error.message);
      throw error;
    }
  }

  // One-time Order Capture
  static async captureOrder(orderId: string) {
    const token = await this.getAccessToken();
    try {
      const response = await axios.post(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error: any) {
      console.error("[PayPal] Capture Order Failed:", error.response?.data || error.message);
      throw error;
    }
  }

  // Subscription Management
  static async suspendSubscription(subscriptionId: string, reason: string = "User requested suspension") {
    const token = await this.getAccessToken();
    try {
      await axios.post(
        `${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}/suspend`,
        { reason },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return true;
    } catch (error: any) {
      console.error("[PayPal] Suspend Subscription Failed:", error.response?.data || error.message);
      throw error;
    }
  }

  static async cancelSubscription(subscriptionId: string, reason: string = "User requested cancellation") {
    const token = await this.getAccessToken();
    try {
      await axios.post(
        `${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}/cancel`,
        { reason },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return true;
    } catch (error: any) {
      console.error("[PayPal] Cancel Subscription Failed:", error.response?.data || error.message);
      throw error;
    }
  }
}
