import { NextResponse } from "next/server";
import { sendEmail } from "@/app/lib/email";
import { prisma } from "@/app/lib/prisma";
import { adRejectionTemplate } from "@/app/lib/email-templates";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { action, reason } = await request.json();
    const adRequest = await prisma.adRequest.findUnique({
      where: { id },
    });

    if (!adRequest) {
      return NextResponse.json(
        { error: "Ad request not found" },
        { status: 404 }
      );
    }

    if (action === "approve") {
      await prisma.adRequest.update({
        where: { id },
        data: { status: "active" },
      });

      // Create notification for approval
      await prisma.notification.create({
        data: {
          userId: adRequest.userId ?? "",
          type: "AD",
          title: "Ad Request Approved",
          message: `Your advertisement "${adRequest.title || adRequest.companyName}" has been approved and is now active.`,
          read: false,
          adRequestId: adRequest.id,
        },
      });

      // Send approval email
      await sendEmail(
        adRequest.contactEmail,
        "Your Ad Request Has Been Approved",
        `Your advertisement request for ${adRequest.title} has been approved.`
      );
    } else {
      await prisma.adRequest.update({
        where: { id },
        data: {
          status: "rejected",
          rejectionReason: reason,
        },
      });

      // Create notification for rejection
      await prisma.notification.create({
        data: {
          userId: adRequest.userId ?? "",
          type: "AD",
          title: "Ad Request Rejected",
          message: `Your advertisement "${adRequest.title || adRequest.companyName}" has been rejected. Reason: ${reason}`,
          read: false,
          adRequestId: adRequest.id,
        },
      });

      // Send rejection email
      await sendEmail(
        adRequest.contactEmail,
        "Your Ad Request Status",
        adRejectionTemplate(adRequest.title || adRequest.companyName, reason)
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error handling ad request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
