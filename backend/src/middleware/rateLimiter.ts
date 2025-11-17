import rateLimit from "express-rate-limit";

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs (increased from 100)
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
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

    // Check if this path matches any data-heavy route
    return dataHeavyRoutes.some((route) => path.startsWith(route));
  },
});

// More lenient rate limiter for data-heavy endpoints
// This uses a separate key generator to avoid conflicts with the global rate limiter
export const dataRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // Limit each IP to 2000 requests per windowMs for data endpoints (increased from 1000)
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use a different key prefix to avoid conflicts with global rate limiter
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
