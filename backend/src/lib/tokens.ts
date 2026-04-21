import jwt from "jsonwebtoken";
import { NotificationCategory } from "@prisma/client";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-for-preferences";

interface UnsubscribePayload {
  userId: string;
  category: NotificationCategory;
  type: "unsubscribe";
}

/**
 * Generate a signed token for a one-click unsubscribe link
 */
export function generateUnsubscribeToken(userId: string, category: NotificationCategory): string {
  const payload: UnsubscribePayload = {
    userId,
    category,
    type: "unsubscribe"
  };
  
  // Tokens for unsubscribing don't necessarily need to expire quickly, 
  // but 30 days is a safe window.
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

/**
 * Verify an unsubscribe token and return the payload
 */
export function verifyUnsubscribeToken(token: string): UnsubscribePayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as UnsubscribePayload;
    if (payload.type !== "unsubscribe") return null;
    return payload;
  } catch (error) {
    console.error("[TokenLib] Token verification failed:", error);
    return null;
  }
}
