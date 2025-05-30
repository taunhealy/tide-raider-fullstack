// Initialize with your API key from MessageBird dashboard
export function getMessageBirdClient() {
  if (!process.env.MESSAGEBIRD_API_KEY) {
    throw new Error("MessageBird API key is not configured");
  }
  // Use require instead of import for messagebird
  const messagebirdModule = require("messagebird");
  return messagebirdModule(process.env.MESSAGEBIRD_API_KEY);
}

export async function sendWhatsAppMessage(
  to: string,
  message: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.bird.com/workspaces/${process.env.MESSAGEBIRD_WORKSPACE_ID}/channels/${process.env.MESSAGEBIRD_CHANNEL_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `AccessKey ${process.env.MESSAGEBIRD_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiver: {
            contacts: [
              {
                identifierValue: to,
              },
            ],
          },
          body: {
            type: "text",
            text: {
              text: message,
            },
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `MessageBird API error: ${response.status} ${response.statusText}`
      );
    }

    return true;
  } catch (error) {
    console.error("MessageBird error:", error);
    return false;
  }
}
