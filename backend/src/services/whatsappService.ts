/**
 * WhatsApp Service
 * Handles sending WhatsApp messages via Twilio (or other providers)
 */

interface SendWhatsAppMessageParams {
  to: string; // Phone number in E.164 format (e.g., +1234567890)
  message: string;
}

interface WhatsAppServiceResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class WhatsAppService {
  private baseUrl: string | undefined;
  private apiKey: string | undefined;
  private instanceName: string | undefined;

  constructor() {
    this.baseUrl = process.env.EVOLUTION_BASE_URL;
    this.apiKey = process.env.EVOLUTION_API_KEY;
    this.instanceName = process.env.EVOLUTION_INSTANCE_NAME || "KeaLogic";
  }

  /**
   * Validate phone number format (E.164)
   */
  private validatePhoneNumber(phoneNumber: string): boolean {
    // E.164 format: + followed by country code and number (max 15 digits total)
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber);
  }

  /**
   * Format phone number to E.164 format
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters except +
    let cleaned = phoneNumber.replace(/[^\d+]/g, "");

    // If it doesn't start with +, add it
    if (!cleaned.startsWith("+")) {
      // Assume it's a local number, you might want to add country code detection
      // For now, we'll require the + prefix
      return phoneNumber; // Return as-is if invalid
    }

    return cleaned;
  }

  /**
   * Send WhatsApp message via Evolution API
   */
  async sendMessage({
    to,
    message,
  }: SendWhatsAppMessageParams): Promise<WhatsAppServiceResponse> {
    // Validate required environment variables
    if (!this.baseUrl || !this.apiKey) {
      console.error(
        "[WhatsAppService] Missing Evolution API configuration. Please set EVOLUTION_BASE_URL and EVOLUTION_API_KEY"
      );
      return {
        success: false,
        error: "WhatsApp service not configured",
      };
    }

    // Format phone number (remove non-digits)
    const cleanNumber = to.replace(/\D/g, "");

    try {
      const url = `${this.baseUrl.replace(/\/$/, "")}/message/sendText/${this.instanceName}`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": this.apiKey,
        },
        body: JSON.stringify({
          number: cleanNumber,
          text: message,
          linkPreview: false
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          error: `Evolution API Error: ${response.status} - ${error}`
        };
      }

      const data = await response.json();
      return {
        success: true,
        messageId: data.key?.id || "sent",
      };
    } catch (error: any) {
      console.error("[WhatsAppService] Error sending message:", error);
      return {
        success: false,
        error: error.message || "Failed to send WhatsApp message",
      };
    }
  }

  /**
   * Send messages to multiple recipients
   */
  async sendBulkMessages(
    recipients: string[],
    message: string
  ): Promise<{
    success: number;
    failed: number;
    results: Array<{
      phoneNumber: string;
      success: boolean;
      error?: string;
      messageId?: string;
    }>;
  }> {
    const results = await Promise.allSettled(
      recipients.map((phoneNumber) =>
        this.sendMessage({ to: phoneNumber, message })
      )
    );

    const processedResults = results.map((result, index) => {
      const phoneNumber = recipients[index];
      if (result.status === "fulfilled") {
        return {
          phoneNumber,
          success: result.value.success,
          error: result.value.error,
          messageId: result.value.messageId,
        };
      } else {
        return {
          phoneNumber,
          success: false,
          error: result.reason?.message || "Unknown error",
        };
      }
    });

    const successCount = processedResults.filter((r) => r.success).length;
    const failedCount = processedResults.length - successCount;

    return {
      success: successCount,
      failed: failedCount,
      results: processedResults,
    };
  }
}

export const whatsappService = new WhatsAppService();



