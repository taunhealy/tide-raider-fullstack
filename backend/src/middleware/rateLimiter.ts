import rateLimit from "express-rate-limit";

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  // Much higher limit in development to avoid localhost issues (all requests from same IP)
  max: process.env.NODE_ENV === "development" ? 10000 : 200, // 10000 for dev, 200 for prod
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // In development, skip rate limiting entirely for easier local testing
    if (process.env.NODE_ENV === "development") {
      return true;
    }

    // Skip global rate limiter for routes that have their own rate limiters
    // These routes will use dataRateLimiter or other specific limiters
    const path = req.path;
    const dataHeavyRoutes = [
      "/api/filtered-beaches",
      "/api/raid-logs",
      "/api/forecast",
      "/api/blog-posts",
      "/api/beach-ratings",
      "/api/alerts",
      "/api/beaches",
      "/api/regions",
    ];

    // Skip auth routes - they have their own rate limiter
    if (path.startsWith("/api/auth")) {
      return true;
    }

    // Check if this path matches any data-heavy route
    return dataHeavyRoutes.some((route) => path.startsWith(route));
  },
});

// More lenient rate limiter for data-heavy endpoints
// This uses a separate key generator to avoid conflicts with the global rate limiter
export const dataRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  // Increase limit in development to avoid issues with localhost (all requests from same IP)
  max: process.env.NODE_ENV === "development" ? 10000 : 2000, // Much higher limit for dev
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use a different key prefix to avoid conflicts with global rate limiter
    // In development, still track by IP but with much higher limits
    return `data-${req.ip}`;
  },
});

// Stricter rate limiter for auth endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many authentication attempts, please try again later.",
});

// Rate limiter for webhook endpoints
export const webhookRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: "Too many webhook requests, please try again later.",
});
