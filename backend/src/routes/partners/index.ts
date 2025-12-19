import { Router, Request, Response } from "express";
import { prisma } from "../../lib/prisma";

const router = Router();

// POST /api/partners/register
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { businessName, contactName, email, paypalEmail } = req.body;

    // 1. Generate a Code from Business Name
    // Remove spaces, special chars, uppercase, limit to 15 chars
    let baseCode = businessName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .substring(0, 15);
    
    // Ensure code is at least 3 chars
    if (baseCode.length < 3) baseCode = "PARTNER";

    // Check availability and append random number if taken
    let finalCode = baseCode;
    let isTaken = await prisma.promoCode.findUnique({ where: { code: finalCode } });
    
    if (isTaken) {
       finalCode = `${baseCode}${Math.floor(Math.random() * 1000)}`;
    }

    console.log(`[Partners] Registering ${businessName} with code ${finalCode}`);

    // 2. Create User (if not exists)
    // We do NOT set a password here. They are a "Partner User".
    // If they want to login, they would need to go through "Forgot Password" or social login with same email.
    let user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: contactName || businessName,
          // role: "PARTNER" // If you have roles in schema
        }
      });
    }

    // 3. Create Partner Profile
    await prisma.partnerProfile.upsert({
      where: { userId: user.id },
      update: { paypalEmail },
      create: {
        userId: user.id,
        paypalEmail,
        balance: 0,
        totalPaid: 0
      }
    });

    // 4. Create Promo Code
    const promo = await prisma.promoCode.create({
      data: {
        code: finalCode,
        ownerId: user.id,
        description: `Partner code for ${businessName}`,
        discountPercent: 10,
        commissionPercent: 20,
        isActive: true,
        trialDays: 14,
        usedCount: 0
      }
    });

    // 5. Send Welcome Email
    const { sendEmail } = await import("../../lib/email");
    const loginUrl = process.env.FRONTEND_URL || "https://www.tideraider.com";
    
    await sendEmail(
      email,
      "Welcome to the Tide Raider Partner Program! 🌊",
      `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px;">
        <h1 style="color: #0f172a;">Welcome to the Crew, ${contactName || businessName}!</h1>
        <p>Thanks for joining the Tide Raider Partner Program. We're stoked to have you on board.</p>
        
        <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #64748b; font-size: 14px;">YOUR PROMO CODE</p>
          <p style="margin: 10px 0 0 0; font-size: 32px; font-weight: bold; color: #0f172a; letter-spacing: 2px;">${finalCode}</p>
        </div>

        <h3>How it works:</h3>
        <ol>
          <li><strong>Share your code:</strong> Give this code to your customers.</li>
          <li><strong>They save:</strong> They get 10% off their subscription.</li>
          <li><strong>You earn:</strong> You get 20% commission on every payment they make, forever.</li>
        </ol>

        <h3>Automatic Payouts</h3>
        <p>We automatically pay out your commissions to <strong>${paypalEmail}</strong> on the 1st of every month (for balances over $20).</p>

        <p style="margin-top: 30px;">
          <a href="${loginUrl}/dashboard" style="background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Dashboard</a>
        </p>
        
        <p style="font-size: 12px; color: #64748b; margin-top: 40px;">
          To access your dashboard, simply log in with this email address (${email}).
        </p>
      </div>
      `
    );

    return res.json({
      success: true,
      code: finalCode,
      message: "Partner registered successfully"
    });

  } catch (error) {
    console.error("Partner Registration Failed:", error);
    return res.status(500).json({ error: "Registration failed" });
  }
});

export default router;
