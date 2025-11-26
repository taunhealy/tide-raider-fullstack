import rateLimit from "express-rate-limit";

/**
 * Rate limiting middleware to prevent abuse
 */

export const generalRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10), // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10), // 100 requests per minute
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: "Too many authentication attempts, please try again later.",
  skipSuccessfulRequests: true,
});

export const paymentRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 payment requests per minute
  message: "Too many payment requests, please try again later.",
});

