import { NextResponse } from "next/server";
import { sendEmail } from "@/app/lib/email";

export async function GET() {
  try {
    // Test email address
    const testEmail = "taunhealy@gmail.com";

    const success = await sendEmail(
      testEmail,
      "Test Email from Tide Raider",
      "<h1>Test Email</h1><p>This is a test email from your Tide Raider application!</p><p>If you received this, your Resend integration is working correctly.</p>"
    );

    if (success) {
      return NextResponse.json({
        success: true,
        message: `Test email sent to ${testEmail}`,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to send email",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json(
      {
        error: "Failed to send test email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
