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
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authReq = req as AuthRequest;
  try {
    // Get token from Authorization header or cookie
    // Priority: 1. Authorization header, 2. auth-token cookie (our JWT), 3. NextAuth cookies (for backward compatibility)
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : (req as any).cookies?.["auth-token"] || // Our JWT cookie
        (req as any).cookies?.["next-auth.session-token"] ||
        (req as any).cookies?.["__Secure-next-auth.session-token"];

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
    let decoded: {
      sub?: string;
      id?: string;
      email?: string;
      name?: string;
    };

    try {
      decoded = jwt.verify(token, secret) as {
        sub?: string;
        id?: string;
        email?: string;
        name?: string;
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
          // Try to create user with email and ID from token
          user = await prisma.user.create({
            data: {
              id: userId,
              email: decoded.email,
              name: decoded.name || decoded.email.split("@")[0], // Use email prefix if no name
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

    // Attach user to request
    authReq.user = {
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
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authReq = req as AuthRequest;
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : req.cookies?.["auth-token"] || // Our JWT cookie
        req.cookies?.["next-auth.session-token"] ||
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
              authReq.user = {
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
