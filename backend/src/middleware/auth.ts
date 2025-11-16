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
    console.log(
      `[auth] 🔒 Authentication required for ${req.method} ${req.path}`
    );
    // Get token from Authorization header or cookie
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : req.cookies?.["next-auth.session-token"] ||
        req.cookies?.["__Secure-next-auth.session-token"];

    if (!token) {
      console.log("[auth] No token found in Authorization header or cookies");
      return res.status(401).json({ error: "Authentication required" });
    }

    console.log(
      `[auth] Token received (length: ${token.length}, first 20: ${token.substring(0, 20)}...)`
    );

    // Verify JWT token (NextAuth uses NEXTAUTH_SECRET or AUTH_SECRET)
    // Support both variable names for compatibility
    const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
    if (!secret) {
      console.error("[auth] NEXTAUTH_SECRET or AUTH_SECRET is not configured");
      throw new Error("NEXTAUTH_SECRET or AUTH_SECRET is not configured");
    }

    console.log(
      `[auth] Secret configured: ${secret ? "YES" : "NO"} (length: ${secret?.length || 0})`
    );
    if (secret) {
      console.log(
        `[auth] 🔑 Using secret to verify JWT (first 10 chars: ${secret.substring(0, 10)}...)`
      );
    }

    let userId: string | undefined;
    try {
      const decoded = jwt.verify(token, secret) as {
        sub?: string;
        id?: string;
        email?: string;
      };

      console.log(`[auth] Token verified successfully, decoded:`, {
        sub: decoded.sub,
        id: decoded.id,
        email: decoded.email,
      });

      userId = decoded.id || decoded.sub;
      if (!userId) {
        console.log("[auth] Token decoded but no userId found");
        return res.status(401).json({ error: "Invalid token" });
      }

      console.log(
        `[auth] ✅ Token verified successfully for userId: ${userId}, email: ${decoded.email || "N/A"}`
      );
    } catch (error) {
      console.error(
        "[auth] Token verification failed:",
        error instanceof Error ? error.message : error
      );
      return res.status(401).json({ error: "Invalid token" });
    }

    // Fetch user from database
    console.log(`[auth] 🔍 Fetching user from database for userId: ${userId}`);
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
      console.log(`[auth] ❌ User not found in database for userId: ${userId}`);
      return res.status(401).json({ error: "User not found" });
    }

    console.log(
      `[auth] ✅ Authentication successful - userId: ${user.id}, email: ${user.email || "N/A"}, name: ${user.name || "N/A"}`
    );

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

    console.log(
      `[auth] 🔓 Optional auth check for ${req.method} ${req.path} - token present: ${!!token}`
    );

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
              console.log(
                `[auth] ✅ Optional auth successful - userId: ${user.id}, email: ${user.email || "N/A"}`
              );
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
