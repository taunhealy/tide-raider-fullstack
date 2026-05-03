import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { generateUniqueReferralCode, rewardReferrer } from "../lib/referrals";
import jwt from "jsonwebtoken";
import { decode } from "next-auth/jwt";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
    name?: string;
    isSubscribed?: boolean;
    hasActiveTrial?: boolean;
    credits?: number;
  };
  // Remove the cookies property - it's already provided by Express/cookie-parser
}

// Middleware to verify JWT token from NextAuth
export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authReq = req as AuthRequest;
  try {
    // Get token from Authorization header or cookie
    // Priority: 1. Authorization header, 2. auth-token cookie (our JWT), 3. NextAuth cookies (for backward compatibility)
    const authHeader = req.headers.authorization;
    // Sanitize the header to remove hidden/control characters that cause "Invalid character in header content"
    const sanitizedHeader = authHeader?.replace(/[\x00-\x1F\x7F-\x9F]/g, "");

    const token = sanitizedHeader?.startsWith("Bearer ")
      ? sanitizedHeader.substring(7)
      : (req as any).cookies?.["auth-token"] || // Our JWT cookie
        (req as any).cookies?.["next-auth.session-token"] ||
        (req as any).cookies?.["__Secure-next-auth.session-token"];

    if (!token) {
      console.log("[auth] No token found in Authorization header or cookies");
      return res.status(401).json({ error: "Authentication required" });
    }

    // Verify JWT token
    // Support multiple secret names for compatibility: JWT_SECRET (our backend), NEXTAUTH_SECRET, AUTH_SECRET
    const secret =
      process.env.JWT_SECRET ||
      process.env.NEXTAUTH_SECRET ||
      process.env.AUTH_SECRET;
    if (!secret) {
      console.error(
        "[auth] JWT_SECRET, NEXTAUTH_SECRET, or AUTH_SECRET is not configured"
      );
      throw new Error(
        "JWT_SECRET, NEXTAUTH_SECRET, or AUTH_SECRET is not configured"
      );
    }

    let userId: string | undefined;
    let decoded: {
      sub?: string;
      id?: string;
      email?: string;
      name?: string;
    };

    try {
      // 1. Try standard JWT verify (for our custom auth-token)
      try {
        decoded = jwt.verify(token, secret) as {
          sub?: string;
          id?: string;
          email?: string;
          name?: string;
        };
      } catch (jwtError) {
        // 2. If verify fails, try NextAuth decode (for encrypted session tokens)
        console.log("[auth] jwt.verify failed, attempting NextAuth decode...");
        try {
          const nextAuthDecoded = await decode({
            token,
            secret,
          });

          if (nextAuthDecoded) {
            console.log("[auth] NextAuth decode successful");
            decoded = nextAuthDecoded as any;
          } else {
            console.error("[auth] Both jwt.verify and NextAuth decode failed");
            throw jwtError;
          }
        } catch (decodeError) {
          console.error("[auth] NextAuth decode error:", decodeError);
          throw jwtError;
        }
      }

      userId = decoded.id || decoded.sub;
      if (!userId) {
        console.log("[auth] Token decoded but no userId found");
        return res.status(401).json({ error: "Invalid token" });
      }
    } catch (error) {
      console.error(
        "[auth] Token verification failed:",
        error instanceof Error ? error.message : error
      );
      return res.status(401).json({ error: "Invalid token" });
    }

    // Fetch user from database

    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionStatus: true,
        hasActiveTrial: true,
        trialEndDate: true,
      },
    });

    // If user doesn't exist, try to create them from JWT token data
    if (!user) {
      console.log(
        `[auth] ⚠️ User not found in database for userId: ${userId}, attempting to create...`
      );

      if (decoded.email) {
        try {
          // Get referrer from cookie
          const referrerCode = (req as any).cookies?.["referral-code"];
          let referrerId = null;
          if (referrerCode) {
            const referrer = await prisma.user.findUnique({ where: { referralCode: referrerCode } });
            if (referrer) {
              referrerId = referrer.id;
              await rewardReferrer(referrer.id, 10);
            }
          }

          const myReferralCode = await generateUniqueReferralCode(decoded.name || decoded.email);

          // Try to create user with email and ID from token
          user = await prisma.user.create({
            data: {
              id: userId,
              email: decoded.email,
              name: decoded.name || decoded.email.split("@")[0], // Use email prefix if no name
              referralCode: myReferralCode,
              referredById: referrerId,
            },
            select: {
              id: true,
              email: true,
              name: true,
              subscriptionStatus: true,
              hasActiveTrial: true,
              trialEndDate: true,
            },
          });
          console.log(
            `[auth] ✅ Created new user in database: ${user.id}, email: ${user.email}`
          );
        } catch (createError: any) {
          // If creation fails (e.g., email already exists with different ID), try to find by email
          if (createError.code === "P2002") {
            console.log(
              `[auth] ⚠️ User with email ${decoded.email} exists with different ID, fetching by email...`
            );
            user = await prisma.user.findUnique({
              where: { email: decoded.email },
              select: {
                id: true,
                email: true,
                name: true,
                subscriptionStatus: true,
                hasActiveTrial: true,
                trialEndDate: true,
              },
            });
            if (user) {
              console.log(
                `[auth] ✅ Found user by email: ${user.id} (token had ${userId})`
              );
              // Update the user ID to match the token if needed
              // Note: This is a workaround - ideally frontend and backend should use the same database
            }
          } else {
            console.error(`[auth] ❌ Failed to create user:`, createError);
            return res
              .status(401)
              .json({ error: "User not found and could not be created" });
          }
        }
      } else {
        console.log(`[auth] ❌ Cannot create user: no email in token`);
        return res.status(401).json({ error: "User not found" });
      }
    }

    if (!user) {
      console.log(`[auth] ❌ User still not found after creation attempt`);
      return res.status(401).json({ error: "User not found" });
    }

    // Calculate active trial status based on date
    const now = new Date();
    const hasActiveTrial = user.hasActiveTrial && user.trialEndDate && new Date(user.trialEndDate) > now;

    // Attach user to request
    authReq.user = {
      id: user.id,
      email: user.email || undefined,
      name: user.name || undefined,
      isSubscribed: user.subscriptionStatus === "ACTIVE",
      hasActiveTrial: hasActiveTrial || false,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: "Invalid token" });
    }
    console.error("Authentication error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
}

// Optional authentication - doesn't fail if no token
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authReq = req as AuthRequest;
  try {
    const authHeader = req.headers.authorization;
    // Sanitize the header to remove hidden/control characters
    const sanitizedHeader = authHeader?.replace(/[\x00-\x1F\x7F-\x9F]/g, "");

    const token = sanitizedHeader?.startsWith("Bearer ")
      ? sanitizedHeader.substring(7)
      : req.cookies?.["auth-token"] || // Our JWT cookie
        req.cookies?.["next-auth.session-token"] ||
        req.cookies?.["__Secure-next-auth.session-token"];

    if (token) {
      const secret =
        process.env.JWT_SECRET ||
        process.env.NEXTAUTH_SECRET ||
        process.env.AUTH_SECRET;
      if (secret) {
        try {
          let decoded: any;
          try {
            decoded = jwt.verify(token, secret);
          } catch (e) {
            decoded = await decode({ token, secret });
          }

          const userId = decoded?.id || decoded?.sub;
          if (userId) {
            const user = await prisma.user.findUnique({
              where: { id: userId },
              select: {
                id: true,
                email: true,
                name: true,
                subscriptionStatus: true,
                hasActiveTrial: true,
                trialEndDate: true,
              },
            });

            if (user) {
              // Calculate active trial status based on date
              const now = new Date();
              const hasActiveTrial = user.hasActiveTrial && user.trialEndDate && new Date(user.trialEndDate) > now;

              authReq.user = {
                id: user.id,
                email: user.email || undefined,
                name: user.name || undefined,
                isSubscribed: user.subscriptionStatus === "ACTIVE",
                hasActiveTrial: hasActiveTrial || false,
              };
            }
          }
        } catch (error) {
          // Token invalid, continue without user
        }
      }
    }
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
}
