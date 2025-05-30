import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch user's ads
  const ads = await prisma.ad.findMany({
    where: { userId: session.user.id },
    include: {
      adRequest: true,
      _count: { select: { clicks: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch pending ad requests
  const pendingRequests = await prisma.adRequest.count({
    where: {
      userId: session.user.id,
      status: "PENDING",
    },
  });

  return NextResponse.json({ ads, pendingRequests });
} 