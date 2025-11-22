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
//    - Production: https://tide-raider-backend-o6rx5gs5rq-uc.a.run.app/api/auth/google/callback
//    - Development: http://localhost:4001/api/auth/google/callback
//
// IMPORTANT: These must EXACTLY match (including protocol, no trailing slashes)
// Only initialize Google OAuth strategy if credentials are available
// This allows the server to start in Docker without OAuth credentials (for local dev)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:
          process.env.BACKEND_URL && process.env.BACKEND_URL.startsWith("http")
            ? `${process.env.BACKEND_URL}/api/auth/google/callback`
            : process.env.NODE_ENV === "production"
              ? `https://tide-raider-backend-o6rx5gs5rq-uc.a.run.app/api/auth/google/callback`
              : `http://localhost:4001/api/auth/google/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const name = profile.displayName;
          const picture = profile.photos?.[0]?.value;
          const googleId = profile.id;

          if (!email) {
            return done(
              new Error("No email found in Google profile"),
              undefined
            );
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
} else {
  console.warn(
    "[auth] ⚠️ Google OAuth credentials not found. OAuth routes will not be available."
  );
  console.warn(
    "[auth] Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable OAuth."
  );
}

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
    console.warn("[auth] ⚠️ Google OAuth not configured - missing credentials");
    return res.status(503).json({
      error: "OAuth not configured",
      message:
        "OAuth is not available. Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
    });
  }

  // Log the callback URL that will be used
  // Only use BACKEND_URL if it's a valid HTTP/HTTPS URL (not a database URL)
  const callbackURL =
    process.env.BACKEND_URL && process.env.BACKEND_URL.startsWith("http")
      ? `${process.env.BACKEND_URL}/api/auth/google/callback`
      : process.env.NODE_ENV === "production"
        ? `https://tide-raider-backend-o6rx5gs5rq-uc.a.run.app/api/auth/google/callback`
        : `http://localhost:4001/api/auth/google/callback`;

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
 * State parameter is preserved automatically by Passport
 */
router.get(
  "/google",
  (req: Request, res: Response, next: any) => {
    // Check if OAuth is configured first - if not, return error immediately
    // This prevents passport.authenticate from being called when strategy isn't registered
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.warn(
        "[auth] ⚠️ Google OAuth not configured - missing credentials"
      );
      return res.status(503).json({
        error: "OAuth not configured",
        message:
          "OAuth is not available. Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
      });
    }

    // OAuth is configured, proceed with normal flow
    handleGoogleOAuth(req, res, next);
  },
  (req: Request, res: Response, next: any) => {
    // Log the state parameter before Passport processes it
    const state = req.query.state as string | undefined;
    console.log(`[auth] 📍 State parameter received: ${state}`);
    if (state) {
      try {
        const decoded = decodeURIComponent(state);
        console.log(`[auth] 📍 Decoded state: ${decoded}`);
        // Store state in a cookie so we can retrieve it in the callback
        // Google OAuth will preserve state, but we'll also store it as backup
        res.cookie("oauth-state", state, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
          maxAge: 10 * 60 * 1000, // 10 minutes
          path: "/",
        });
      } catch (e) {
        console.log(`[auth] ⚠️ Could not decode state: ${state}`);
      }
    }
    next();
  },
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
  (req: Request, res: Response, next: any) => {
    // Check if OAuth is configured first
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.warn(
        "[auth] ⚠️ Google OAuth callback called but OAuth not configured"
      );
      return res.redirect(
        `${FRONTEND_URL}/auth/signin?error=OAuthNotConfigured`
      );
    }
    // OAuth is configured, proceed with authentication
    // Include scope to fix "Missing required parameter: scope" error
    passport.authenticate("google", {
      session: false,
      scope: ["profile", "email"],
      failureRedirect: `${FRONTEND_URL}/auth/signin?error=Callback`,
    })(req, res, next);
  },
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

      // Determine frontend URL from state, origin, or environment
      let frontendUrl = FRONTEND_URL;
      // Get state from query parameter (Google returns it) or from cookie (backup)
      const rawState =
        (req.query.state as string | undefined) ||
        (req.cookies?.["oauth-state"] as string | undefined);
      let state: string | undefined;

      try {
        state = rawState ? decodeURIComponent(rawState) : undefined;
        // Clear the oauth-state cookie after using it
        if (req.cookies?.["oauth-state"]) {
          res.clearCookie("oauth-state", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            path: "/",
          });
        }
      } catch (e) {
        console.error(`[auth] ⚠️ Error decoding state: ${rawState}`, e);
        state = rawState; // Use raw state if decoding fails
      }

      console.log(`[auth] 📍 Raw state from query: ${req.query.state}`);
      console.log(
        `[auth] 📍 Raw state from cookie: ${req.cookies?.["oauth-state"]}`
      );
      console.log(`[auth] 📍 Final state: ${state}`);
      console.log(`[auth] 📍 FRONTEND_URL env: ${FRONTEND_URL}`);
      console.log(`[auth] 📍 Origin header: ${req.headers.origin}`);
      console.log(`[auth] 📍 Referer header: ${req.headers.referer}`);

      // Redirect to frontend with success
      // Include token in URL so frontend can store it (cookie is on different domain)
      let redirectUrl: string;

      // PRIORITY 1: If state contains a full URL (starts with http:// or https://), use it directly
      // This is the most reliable way - the frontend explicitly tells us where to redirect
      if (
        state &&
        (state.startsWith("http://") || state.startsWith("https://"))
      ) {
        redirectUrl = `${state}#token=${encodeURIComponent(token)}`;
        console.log(`[auth] 🔀 Using full URL from state: ${redirectUrl}`);
        return res.redirect(redirectUrl);
      }

      // PRIORITY 2: If state is a relative path, try to detect frontend URL from Origin or Referer header
      // This handles cases where the frontend didn't pass a full URL in state
      if (state) {
        const origin = req.headers.origin || req.headers.referer;
        if (origin) {
          try {
            const originUrl = new URL(origin);
            // Only use origin if it's localhost or tideraider.com domain
            if (
              originUrl.hostname === "localhost" ||
              originUrl.hostname.includes("tideraider.com") ||
              originUrl.hostname.includes("tide-raider")
            ) {
              frontendUrl = `${originUrl.protocol}//${originUrl.host}`;
              console.log(
                `[auth] 📍 Detected frontend URL from origin: ${frontendUrl}`
              );
            }
          } catch (e) {
            // Invalid origin, use default
            console.log(
              `[auth] ⚠️ Invalid origin header, using default: ${FRONTEND_URL}`
            );
          }
        }
        redirectUrl = `${frontendUrl}${state}#token=${encodeURIComponent(token)}`;
        console.log(`[auth] 🔀 Using relative path from state: ${redirectUrl}`);
      } else {
        // PRIORITY 3: No state - use default
        redirectUrl = `${frontendUrl}/raid#token=${encodeURIComponent(token)}`;
        console.log(`[auth] 🔀 No state, using default: ${redirectUrl}`);
      }

      console.log(`[auth] 🔀 Final redirect URL: ${redirectUrl}`);
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
  const isProduction = process.env.NODE_ENV === "production";

  // Clear cookie with same settings as when it was set
  res.clearCookie("auth-token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    // Don't set domain - let browser handle it based on where cookie was set
  });

  // Also set cookie to empty with maxAge 0 to ensure it's cleared
  res.cookie("auth-token", "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: 0, // Expire immediately
  });

  console.log("[auth] ✅ Logout successful - cookie cleared");
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

    const isSubscribed = user.subscriptionStatus === "ACTIVE";

    // Log subscription status for debugging
    console.log("[auth/me] User subscription status:", {
      userId: user.id,
      email: user.email,
      subscriptionStatus: user.subscriptionStatus,
      isSubscribed,
      hasActiveTrial: user.hasActiveTrial,
      trialEndDate: user.trialEndDate,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        isSubscribed,
        hasActiveTrial: user.hasActiveTrial || false,
        trialEndDate: user.trialEndDate,
      },
    });
  } catch (error) {
    console.error("[auth] ❌ Get user error:", error);
    res.status(500).json({ error: "Failed to get user" });
  }
});

/**
 * PUT /api/auth/me
 * Update current user's profile (name)
 */
router.put("/me", authenticateToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Name cannot be empty" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: authReq.user.id },
      data: { name: name.trim() },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
      },
    });

    res.json({ name: updatedUser.name });
  } catch (error) {
    console.error("[auth] ❌ Update user error:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

export default router;
