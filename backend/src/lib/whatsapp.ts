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

// Evolution API implementation
export async function sendWhatsAppMessageEvolution(
  to: string,
  message: string
): Promise<boolean> {
  try {
    const baseUrl = process.env.EVOLUTION_BASE_URL;
    const apiKey = process.env.EVOLUTION_API_KEY;
    const instance = process.env.EVOLUTION_INSTANCE_NAME || "KeaLogic";

    if (!baseUrl || !apiKey) {
      console.warn("Evolution API not configured (Base URL or API Key missing)");
      return false;
    }

    // Clean phone number: remove +, spaces, etc.
    const cleanNumber = to.replace(/\D/g, "");

    const url = `${baseUrl.replace(/\/$/, "")}/message/sendText/${instance}`;
    
    console.log(`[Evolution] 📤 Sending WhatsApp to ${cleanNumber} via instance ${instance}...`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": apiKey,
      },
      body: JSON.stringify({
        number: cleanNumber,
        textMessage: {
          text: message
        }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[Evolution] API error:", {
        status: response.status,
        data: error
      });
      return false;
    }

    const data = (await response.json()) as any;
    console.log(`[Evolution] ✅ Message sent successfully. ID: ${data.key?.id || 'unknown'}`);
    return true;
  } catch (error) {
    console.error("[Evolution] Error sending WhatsApp message:", error);
    return false;
  }
}

/**
 * Send WhatsApp via the best available provider
 */
export async function sendWhatsAppBoth(
  to: string,
  message: string
): Promise<boolean> {
  // 1. Try Evolution API first (Preferred)
  if (process.env.EVOLUTION_BASE_URL && process.env.EVOLUTION_API_KEY) {
    const success = await sendWhatsAppMessageEvolution(to, message);
    if (success) return true;
  }

  // 2. Fallback to Unipile
  if (process.env.UNIPILE_API_KEY) {
    const success = await sendWhatsAppMessageUnipile(to, message);
    if (success) return true;
  }

  // 3. Fallback to WaSenderAPI
  if (process.env.WASENDERAPI_TOKEN) {
    const success = await sendWhatsAppMessage(to, message);
    if (success) return true;
  }

  // 4. Fallback to MessageBird
  if (process.env.MESSAGEBIRD_API_KEY) {
    const { sendWhatsAppMessage: sendMessageBird } = await import("./messagebird");
    const success = await sendMessageBird(to, message);
    if (success) return true;
  }

  return false;
}
