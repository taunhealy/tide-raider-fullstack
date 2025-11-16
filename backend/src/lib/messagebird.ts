/**
 * MessageBird WhatsApp service
 */

let messagebirdModule: any = null;

export function getMessageBirdClient() {
  if (!process.env.MESSAGEBIRD_API_KEY) {
    throw new Error("MESSAGEBIRD_API_KEY is not configured");
  }

  if (!messagebirdModule) {
    try {
      messagebirdModule = require("messagebird")(
        process.env.MESSAGEBIRD_API_KEY
      );
    } catch (error) {
      console.error("Failed to load MessageBird module:", error);
      throw error;
    }
  }

  return messagebirdModule;
}

export async function sendWhatsAppMessage(
  to: string,
  message: string,
  templateId?: string,
  templateVariables?: Record<string, string>
): Promise<boolean> {
  try {
    if (!process.env.MESSAGEBIRD_API_KEY) {
      console.warn("MESSAGEBIRD_API_KEY not configured");
      return false;
    }

    const messagebird = getMessageBirdClient();
    const workspaceId = process.env.MESSAGEBIRD_WORKSPACE_ID;
    const channelId = process.env.MESSAGEBIRD_CHANNEL_ID;

    if (!workspaceId || !channelId) {
      console.error(
        "MESSAGEBIRD_WORKSPACE_ID and MESSAGEBIRD_CHANNEL_ID are required"
      );
      return false;
    }

    return new Promise((resolve) => {
      const params: any = {
        to: to,
        from: channelId,
        type: "text",
        content: {
          text: message,
        },
      };

      if (templateId && templateVariables) {
        params.type = "template";
        params.content = {
          template: {
            name: templateId,
            parameters: templateVariables,
          },
        };
      }

      messagebird.conversations.send(
        workspaceId,
        params,
        (err: any, response: any) => {
          if (err) {
            console.error("MessageBird error:", err);
            resolve(false);
          } else {
            resolve(true);
          }
        }
      );
    });
  } catch (error) {
    console.error("Error sending WhatsApp message via MessageBird:", error);
    return false;
  }
}
