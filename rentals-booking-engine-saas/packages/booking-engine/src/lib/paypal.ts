import { decrypt } from "./encryption";

/**
 * PayPal REST API v2 integration
 * Handles order creation, capture, and webhook verification
 */

export interface PayPalCredentials {
  clientId: string;
  clientSecret: string;
  mode: "sandbox" | "live";
}

interface PayPalAccessToken {
  access_token: string;
  expires_in: number;
}

interface PayPalOrderResponse {
  id: string;
  status: string;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

/**
 * Get PayPal API base URL based on mode
 */
function getPayPalBaseUrl(mode: "sandbox" | "live"): string {
  return mode === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

/**
 * Get PayPal OAuth access token
 */
async function getAccessToken(
  credentials: PayPalCredentials
): Promise<string> {
  const baseUrl = getPayPalBaseUrl(credentials.mode);
  const auth = Buffer.from(
    `${credentials.clientId}:${credentials.clientSecret}`
  ).toString("base64");

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error(`PayPal auth failed: ${response.statusText}`);
  }

  const data = (await response.json()) as PayPalAccessToken;
  return data.access_token;
}

/**
 * Create a PayPal order
 * @param credentials - Decrypted PayPal credentials
 * @param amount - Order amount
 * @param currency - Currency code (default: ZAR)
 * @param returnUrl - URL to return after approval
 * @param cancelUrl - URL to return if cancelled
 */
export async function createPayPalOrder(
  credentials: PayPalCredentials,
  amount: number,
  currency: string = "ZAR",
  returnUrl: string,
  cancelUrl: string
): Promise<PayPalOrderResponse> {
  const accessToken = await getAccessToken(credentials);
  const baseUrl = getPayPalBaseUrl(credentials.mode);

  const orderPayload = {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: currency,
          value: amount.toFixed(2),
        },
      },
    ],
    application_context: {
      return_url: returnUrl,
      cancel_url: cancelUrl,
      brand_name: "Luxury Adventure Rentals",
      user_action: "PAY_NOW",
    },
  };

  const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(orderPayload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PayPal order creation failed: ${error}`);
  }

  return (await response.json()) as PayPalOrderResponse;
}

/**
 * Capture a PayPal order (after customer approval)
 */
export async function capturePayPalOrder(
  credentials: PayPalCredentials,
  orderId: string
): Promise<any> {
  const accessToken = await getAccessToken(credentials);
  const baseUrl = getPayPalBaseUrl(credentials.mode);

  const response = await fetch(
    `${baseUrl}/v2/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PayPal capture failed: ${error}`);
  }

  return await response.json();
}

/**
 * Verify PayPal webhook signature
 */
export async function verifyPayPalWebhook(
  credentials: PayPalCredentials,
  webhookId: string,
  headers: Record<string, string>,
  body: any
): Promise<boolean> {
  const accessToken = await getAccessToken(credentials);
  const baseUrl = getPayPalBaseUrl(credentials.mode);

  const verificationPayload = {
    transmission_id: headers["paypal-transmission-id"],
    transmission_time: headers["paypal-transmission-time"],
    cert_url: headers["paypal-cert-url"],
    auth_algo: headers["paypal-auth-algo"],
    transmission_sig: headers["paypal-transmission-sig"],
    webhook_id: webhookId,
    webhook_event: body,
  };

  const response = await fetch(
    `${baseUrl}/v1/notifications/verify-webhook-signature`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(verificationPayload),
    }
  );

  if (!response.ok) {
    return false;
  }

  const result = await response.json();
  return result.verification_status === "SUCCESS";
}

/**
 * Decrypt PayPal credentials from database
 */
export function decryptPayPalCredentials(
  encryptedClientId: string,
  encryptedClientSecret: string,
  mode: "sandbox" | "live"
): PayPalCredentials {
  return {
    clientId: decrypt(encryptedClientId),
    clientSecret: decrypt(encryptedClientSecret),
    mode,
  };
}

