// Initialize with your API key from MessageBird dashboard
export function getMessageBirdClient() {
  if (!process.env.MESSAGEBIRD_API_KEY) {
    throw new Error("MessageBird API key is not configured");
  }
  // Use require instead of import for messagebird
  const messagebirdModule = require("messagebird");
  return messagebirdModule(process.env.MESSAGEBIRD_API_KEY);
}

/**
 * Send WhatsApp message via MessageBird API
 * 
 * For WhatsApp Business API:
 * - First message to a contact requires a template (24-hour window)
 * - After user replies, you can send free-form messages for 24 hours
 * 
 * @param to - Phone number in E.164 format (e.g., +1234567890)
 * @param message - Message text to send
 * @param templateId - Optional template ID for first-time messages
 * @param templateVariables - Optional variables for template messages
 * @returns Promise<boolean> - true if sent successfully
 */
export async function sendWhatsAppMessage(
  to: string,
  message: string,
  templateId?: string,
  templateVariables?: Record<string, string>
): Promise<boolean> {
  try {
    // Validate required environment variables
    if (!process.env.MESSAGEBIRD_API_KEY) {
      throw new Error("MESSAGEBIRD_API_KEY is not configured");
    }
    if (!process.env.MESSAGEBIRD_WORKSPACE_ID) {
      throw new Error("MESSAGEBIRD_WORKSPACE_ID is not configured");
    }
    if (!process.env.MESSAGEBIRD_CHANNEL_ID) {
      throw new Error("MESSAGEBIRD_CHANNEL_ID is not configured");
    }

    // Normalize phone number (ensure it starts with +)
    const normalizedPhone = to.startsWith("+") ? to : `+${to}`;

    const body: any = {
      receiver: {
        contacts: [
          {
            identifierValue: normalizedPhone,
          },
        ],
      },
    };

    // Use template if provided (required for initiating conversations)
    if (templateId && process.env.MESSAGEBIRD_PROJECT_ID) {
      body.template = {
        projectId: process.env.MESSAGEBIRD_PROJECT_ID,
        version: templateId,
        locale: "en",
        variables: templateVariables || {},
      };
    } else {
      // For ongoing conversations, use direct text message
      body.body = {
        type: "text",
        text: {
          text: message,
        },
      };
    }

    const response = await fetch(
      `https://api.bird.com/workspaces/${process.env.MESSAGEBIRD_WORKSPACE_ID}/channels/${process.env.MESSAGEBIRD_CHANNEL_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `AccessKey ${process.env.MESSAGEBIRD_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("MessageBird API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      
      // Provide more helpful error messages
      if (response.status === 401) {
        throw new Error("MessageBird API key is invalid");
      } else if (response.status === 404) {
        throw new Error("MessageBird workspace or channel not found");
      } else if (response.status === 400) {
        // For WhatsApp, 400 often means template required or invalid phone number
        throw new Error(`MessageBird API error: ${errorText || "Bad request - check phone number format and template requirements"}`);
      }
      
      throw new Error(
        `MessageBird API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const result = await response.json();
    console.log("WhatsApp message sent successfully:", result);
    return true;
  } catch (error) {
    console.error("MessageBird WhatsApp error:", error);
    return false;
  }
}
