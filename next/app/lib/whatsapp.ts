import { getMessageBirdClient } from "./messagebird";

export async function sendWhatsAppMessage(
  to: string,
  message: string,
  templateId?: string,
  variables?: Record<string, string>
): Promise<boolean> {
  try {
    const body: any = {};

    // Set up receiver
    body.receiver = {
      contacts: [
        {
          identifierValue: to,
        },
      ],
    };

    // Use template if provided (required for initiating conversations)
    if (templateId) {
      body.template = {
        projectId: process.env.MESSAGEBIRD_PROJECT_ID,
        version: templateId,
        locale: "en",
        variables: variables || {},
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
      throw new Error(
        `MessageBird API error: ${response.status} ${response.statusText}`
      );
    }

    return true;
  } catch (error) {
    console.error("MessageBird WhatsApp error:", error);
    return false;
  }
}
