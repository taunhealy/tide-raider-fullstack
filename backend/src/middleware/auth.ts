import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
    name?: string;
    isSubscribed?: boolean;
    hasActiveTrial?: boolean;
  };
  // Remove the cookies property - it's already provided by Express/cookie-parser
}

// Middleware to verify JWT token from NextAuth
export async function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // Get token from Authorization header or cookie
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : req.cookies?.["next-auth.session-token"] ||
        req.cookies?.["__Secure-next-auth.session-token"];

    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Verify JWT token (NextAuth uses NEXTAUTH_SECRET or AUTH_SECRET)
    // Support both variable names for compatibility
    const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
    if (!secret) {
      throw new Error("NEXTAUTH_SECRET or AUTH_SECRET is not configured");
    }

    const decoded = jwt.verify(token, secret) as {
      sub?: string;
      id?: string;
      email?: string;
    };

    const userId = decoded.id || decoded.sub;
    if (!userId) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Fetch user from database
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

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email || undefined,
      name: user.name || undefined,
      isSubscribed: user.subscriptionStatus === "ACTIVE",
      hasActiveTrial: user.hasActiveTrial || false,
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
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : req.cookies?.["next-auth.session-token"] ||
        req.cookies?.["__Secure-next-auth.session-token"];

    if (token) {
      const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
      if (secret) {
        try {
          const decoded = jwt.verify(token, secret) as {
            sub?: string;
            id?: string;
          };
          const userId = decoded.id || decoded.sub;
          if (userId) {
            const user = await prisma.user.findUnique({
              where: { id: userId },
              select: {
                id: true,
                email: true,
                name: true,
                subscriptionStatus: true,
                hasActiveTrial: true,
              },
            });

            if (user) {
              req.user = {
                id: user.id,
                email: user.email || undefined,
                name: user.name || undefined,
                isSubscribed: user.subscriptionStatus === "ACTIVE",
                hasActiveTrial: user.hasActiveTrial || false,
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
