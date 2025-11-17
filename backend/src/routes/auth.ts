import { Router, Request, Response } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = Router();

// Test route to verify routing works
router.get("/test", (req: Request, res: Response) => {
  res.json({
    message: "Auth routes are working",
    timestamp: new Date().toISOString(),
  });
});

// JWT secret - should match frontend
const JWT_SECRET =
  process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "your-secret-key";

// Frontend URL for redirects
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// Configure Passport Google Strategy
//
// GOOGLE CLOUD CONSOLE CONFIGURATION REQUIRED:
//
// 1. Authorized JavaScript origins (where OAuth is initiated from):
//    - Production: https://www.tideraider.com
//    - Development: http://localhost:3000
//
// 2. Authorized redirect URIs (where Google redirects after OAuth):
//    - Production: https://tide-raider-backend.fly.dev/api/auth/google/callback
//    - Development: http://localhost:3001/api/auth/google/callback
//
// IMPORTANT: These must EXACTLY match (including protocol, no trailing slashes)
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL:
        process.env.BACKEND_URL && process.env.BACKEND_URL.startsWith("http")
          ? `${process.env.BACKEND_URL}/api/auth/google/callback`
          : process.env.FLY_APP_NAME || process.env.NODE_ENV === "production"
            ? `https://tide-raider-backend.fly.dev/api/auth/google/callback`
            : `http://localhost:3001/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName;
        const picture = profile.photos?.[0]?.value;
        const googleId = profile.id;

        if (!email) {
          return done(new Error("No email found in Google profile"), undefined);
        }

        // Find or create user
        let user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              name: name || email.split("@")[0],
              image: picture || null,
              hasActiveTrial: false,
              subscriptionStatus: null,
              subscriptionEndsAt: null,
            },
          });
          console.log(`[auth] ✅ Created new user: ${user.id}`);
        } else {
          // Update user info if needed
          if (name && name !== user.name) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { name, image: picture || user.image },
            });
          }
          console.log(`[auth] ✅ Found existing user: ${user.id}`);
        }

        // Link Google account if not already linked
        const existingAccount = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: "google",
              providerAccountId: googleId,
            },
          },
        });

        if (!existingAccount) {
          await prisma.account.upsert({
            where: {
              provider_providerAccountId: {
                provider: "google",
                providerAccountId: googleId,
              },
            },
            update: {},
            create: {
              userId: user.id,
              type: "oauth",
              provider: "google",
              providerAccountId: googleId,
            },
          });
          console.log(`[auth] ✅ Linked Google account for user: ${user.id}`);
        }

        return done(null, user);
      } catch (error) {
        console.error("[auth] ❌ OAuth callback error:", error);
        return done(error, undefined);
      }
    }
  )
);

// Serialize user for session (we use JWT, so minimal)
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Shared OAuth handler function
const handleGoogleOAuth = (req: Request, res: Response, next: any) => {
  console.log("[auth] 🔐 Google OAuth route accessed");
  console.log("[auth] Request method:", req.method);
  console.log("[auth] Request query:", req.query);
  console.log("[auth] Request headers:", {
    host: req.headers.host,
    origin: req.headers.origin,
    referer: req.headers.referer,
  });

  // Check if Google OAuth is configured
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error(
      "[auth] ❌ Google OAuth not configured - missing credentials"
    );
    return res.status(500).json({
      error: "OAuth not configured",
      message: "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set",
    });
  }

  // Log the callback URL that will be used
  // Only use BACKEND_URL if it's a valid HTTP/HTTPS URL (not a database URL)
  const callbackURL =
    process.env.BACKEND_URL && process.env.BACKEND_URL.startsWith("http")
      ? `${process.env.BACKEND_URL}/api/auth/google/callback`
      : process.env.FLY_APP_NAME || process.env.NODE_ENV === "production"
        ? `https://tide-raider-backend.fly.dev/api/auth/google/callback`
        : `http://localhost:3001/api/auth/google/callback`;

  console.log("[auth] 📍 Callback URL:", callbackURL);
  console.log(
    "[auth] 🔑 Client ID:",
    process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + "..."
  );

  next();
};

/**
 * GET /api/auth/google
 * Initiate Google OAuth flow
 */
router.get(
  "/google",
  handleGoogleOAuth,
  passport.authenticate("google", {
    scope: ["profile", "email"],
    accessType: "offline",
    prompt: "select_account",
  })
);

/**
 * POST /api/auth/google
 * Handle POST requests (from NextAuth signIn) - redirect to GET handler
 */
router.post("/google", (req: Request, res: Response) => {
  console.log(
    "[auth] 📨 POST request to /api/auth/google - redirecting to GET"
  );
  // Extract state from query or body
  const state =
    (req.query.state as string) || (req.body?.state as string) || "/raid";
  // Redirect to GET handler
  return res.redirect(`/api/auth/google?state=${encodeURIComponent(state)}`);
});

/**
 * GET /api/auth/google/callback
 * Handle Google OAuth callback
 * Creates/updates user and issues JWT cookie, then redirects to frontend
 */
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${FRONTEND_URL}/auth/signin?error=Callback`,
  }),
  async (req: Request, res: Response) => {
    try {
      const user = req.user as any;

      if (!user || !user.id) {
        console.error("[auth] ❌ No user in OAuth callback");
        return res.redirect(`${FRONTEND_URL}/auth/signin?error=NoUser`);
      }

      // Create JWT token
      const token = jwt.sign(
        {
          id: user.id,
          sub: user.id,
          email: user.email,
          name: user.name,
        },
        JWT_SECRET,
        {
          expiresIn: "7d",
          algorithm: "HS256",
        }
      );

      // Set JWT as HTTP-only cookie
      const isProduction = process.env.NODE_ENV === "production";
      res.cookie("auth-token", token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/",
        domain: isProduction ? undefined : undefined, // Let browser set domain
      });

      console.log(
        `[auth] ✅ OAuth successful, redirecting to frontend with cookie for user: ${user.id}`
      );

      // Redirect to frontend with success
      // Include token in URL so frontend can store it (cookie is on different domain)
      const baseUrl = req.query.state
        ? `${FRONTEND_URL}${req.query.state}`
        : `${FRONTEND_URL}/raid`;

      // Add token to URL as hash (won't be sent to server, more secure than query param)
      const redirectUrl = `${baseUrl}#token=${encodeURIComponent(token)}`;

      res.redirect(redirectUrl);
    } catch (error) {
      console.error("[auth] ❌ OAuth callback error:", error);
      res.redirect(`${FRONTEND_URL}/auth/signin?error=Callback`);
    }
  }
);

/**
 * POST /api/auth/login
 * Handle manual login (for non-OAuth flows)
 * Frontend sends the OAuth code/token, backend verifies and issues JWT cookie
 */
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, name, picture, googleId } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split("@")[0],
          image: picture || null,
          hasActiveTrial: false,
          subscriptionStatus: null,
          subscriptionEndsAt: null,
        },
      });
      console.log(`[auth] ✅ Created new user: ${user.id}`);
    } else {
      // Update user info if needed
      if (name && name !== user.name) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { name, image: picture || user.image },
        });
      }
      console.log(`[auth] ✅ Found existing user: ${user.id}`);
    }

    // Link Google account if not already linked
    if (googleId) {
      const existingAccount = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider: "google",
            providerAccountId: googleId,
          },
        },
      });

      if (!existingAccount) {
        await prisma.account.create({
          data: {
            userId: user.id,
            type: "oauth",
            provider: "google",
            providerAccountId: googleId,
          },
        });
        console.log(`[auth] ✅ Linked Google account for user: ${user.id}`);
      }
    }

    // Create JWT token
    const token = jwt.sign(
      {
        id: user.id,
        sub: user.id,
        email: user.email,
        name: user.name,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
        algorithm: "HS256",
      }
    );

    // Set JWT as HTTP-only cookie
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("auth-token", token, {
      httpOnly: true,
      secure: isProduction, // Only send over HTTPS in production
      sameSite: isProduction ? "none" : "lax", // Allow cross-site in production
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    });

    // Also return token in response (for frontend to store if needed)
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      },
      token, // Optional: frontend can store this in memory/localStorage
    });
  } catch (error) {
    console.error("[auth] ❌ Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

/**
 * POST /api/auth/logout
 * Clear auth cookie
 */
router.post("/logout", (req: Request, res: Response) => {
  res.clearCookie("auth-token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
  res.json({ success: true, message: "Logged out" });
});

/**
 * GET /api/auth/me
 * Get current user from JWT cookie
 */
router.get("/me", authenticateToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: authReq.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        subscriptionStatus: true,
        hasActiveTrial: true,
        trialEndDate: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        isSubscribed: user.subscriptionStatus === "ACTIVE",
        hasActiveTrial: user.hasActiveTrial || false,
        trialEndDate: user.trialEndDate,
      },
    });
  } catch (error) {
    console.error("[auth] ❌ Get user error:", error);
    res.status(500).json({ error: "Failed to get user" });
  }
});

export default router;
