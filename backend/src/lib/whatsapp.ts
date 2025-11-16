/**
 * WhatsApp notification service
 * Supports multiple providers: Unipile, WaSenderAPI, MessageBird
 */

// WaSenderAPI implementation
export async function sendWhatsAppMessage(
  to: string,
  message: string
): Promise<boolean> {
  try {
    if (!process.env.WASENDERAPI_TOKEN) {
      console.warn("WASENDERAPI_TOKEN not configured");
      return false;
    }

    const response = await fetch("https://api.wasenderapi.com/v1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.WASENDERAPI_TOKEN}`,
      },
      body: JSON.stringify({
        phone: to,
        message: message,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("WaSenderAPI error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending WhatsApp message via WaSenderAPI:", error);
    return false;
  }
}

// Unipile implementation
export async function sendWhatsAppMessageUnipile(
  to: string,
  message: string
): Promise<boolean> {
  try {
    if (!process.env.UNIPILE_API_KEY) {
      console.warn("UNIPILE_API_KEY not configured");
      return false;
    }

    const response = await fetch("https://api.unipile.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.UNIPILE_API_KEY}`,
      },
      body: JSON.stringify({
        to: to,
        text: message,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Unipile error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending WhatsApp message via Unipile:", error);
    return false;
  }
}
