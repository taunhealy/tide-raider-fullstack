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
  private twilioAccountSid: string | undefined;
  private twilioAuthToken: string | undefined;
  private twilioWhatsAppNumber: string | undefined;

  constructor() {
    this.twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    this.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    this.twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER; // Format: whatsapp:+14155238886
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
   * Send WhatsApp message via Twilio
   */
  async sendMessage({
    to,
    message,
  }: SendWhatsAppMessageParams): Promise<WhatsAppServiceResponse> {
    // Validate required environment variables
    if (
      !this.twilioAccountSid ||
      !this.twilioAuthToken ||
      !this.twilioWhatsAppNumber
    ) {
      console.error(
        "[WhatsAppService] Missing Twilio configuration. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_NUMBER"
      );
      return {
        success: false,
        error: "WhatsApp service not configured",
      };
    }

    // Format and validate phone number
    const formattedPhone = this.formatPhoneNumber(to);
    if (!this.validatePhoneNumber(formattedPhone)) {
      return {
        success: false,
        error: `Invalid phone number format: ${to}. Please use E.164 format (e.g., +1234567890)`,
      };
    }

    // Ensure phone number has whatsapp: prefix for Twilio
    const whatsappTo = formattedPhone.startsWith("whatsapp:")
      ? formattedPhone
      : `whatsapp:${formattedPhone}`;

    try {
      // Dynamic import to avoid loading Twilio if not needed
      const twilio = require("twilio");
      const client = twilio(this.twilioAccountSid, this.twilioAuthToken);

      const twilioMessage = await client.messages.create({
        from: this.twilioWhatsAppNumber,
        to: whatsappTo,
        body: message,
      });

      console.log(
        `[WhatsAppService] Message sent successfully. SID: ${twilioMessage.sid}`
      );

      return {
        success: true,
        messageId: twilioMessage.sid,
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



