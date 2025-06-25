import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { date, beach, conditions, improvements } = body;

    // Save to database
    const feedback = await prisma.feedback.create({
      data: {
        date: new Date(date),
        beach: {
          connect: {
            id: beach.id,
          },
        },
        conditions: conditions,
        improvements,
      },
    });

    // Send notification email
    if (process.env.ADMIN_EMAIL) {
      await resend.emails.send({
        from: "noreply@yourdomain.com",
        to: process.env.ADMIN_EMAIL,
        subject: `New Feedback for ${beach.name}`,
        text: `
          Date: ${date}
          Beach: ${beach.name}
          
          Inaccurate Conditions:
          ${conditions.map((c: any) => `- ${c.title}`).join("\n")}
          
          Improvements:
          ${improvements}
        `,
      });
    }

    return NextResponse.json({ success: true, feedback });
  } catch (error) {
    console.error("Feedback submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}
