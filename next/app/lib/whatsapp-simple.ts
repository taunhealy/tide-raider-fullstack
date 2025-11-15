/**
 * Simple WhatsApp API implementation using WaSenderAPI
 * 
 * WaSenderAPI is a simple, affordable alternative that doesn't require:
 * - Business email
 * - 2FA
 * - Meta business verification
 * 
 * Setup: https://wasenderapi.com
 * Pricing: Starting at $6/month
 */

export async function sendWhatsAppMessage(
  to: string,
  message: string
): Promise<boolean> {
  try {
    // Check if WaSenderAPI is configured
    if (!process.env.WASENDERAPI_TOKEN) {
      console.error("WASENDERAPI_TOKEN is not configured");
      return false;
    }

    // Normalize phone number (ensure it starts with +)
    const normalizedPhone = to.startsWith("+") ? to : `+${to}`;

    // Remove any spaces or dashes from phone number
    const cleanPhone = normalizedPhone.replace(/[\s-]/g, "");

    const response = await fetch("https://api.wasenderapi.com/v1/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WASENDERAPI_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: cleanPhone,
        message: message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("WaSenderAPI error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });

      // Provide helpful error messages
      if (response.status === 401) {
        throw new Error("WaSenderAPI token is invalid");
      } else if (response.status === 400) {
        throw new Error(`Invalid request: ${errorText || "Check phone number format"}`);
      }

      throw new Error(
        `WaSenderAPI error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const result = await response.json();
    console.log("WhatsApp message sent successfully via WaSenderAPI:", result);
    return true;
  } catch (error) {
    console.error("WaSenderAPI WhatsApp error:", error);
    return false;
  }
}

/**
 * Alternative: Unipile WhatsApp API
 * Even simpler - uses QR code connection
 */
export async function sendWhatsAppMessageUnipile(
  to: string,
  message: string
): Promise<boolean> {
  try {
    if (!process.env.UNIPILE_API_KEY) {
      console.error("UNIPILE_API_KEY is not configured");
      return false;
    }

    const normalizedPhone = to.startsWith("+") ? to : `+${to}`;
    const cleanPhone = normalizedPhone.replace(/[\s-]/g, "");

    const response = await fetch("https://api.unipile.com/v1/messages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.UNIPILE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: cleanPhone,
        text: message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Unipile error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      return false;
    }

    console.log("WhatsApp message sent successfully via Unipile");
    return true;
  } catch (error) {
    console.error("Unipile WhatsApp error:", error);
    return false;
  }
}

