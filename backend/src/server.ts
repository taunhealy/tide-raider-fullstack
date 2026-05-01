import "./setup"; // 1. Load envs first!
import "./lib/prisma"; // 2. Now initialize prisma

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";
import { errorHandler } from "./middleware/errorHandler";
import { rateLimiter } from "./middleware/rateLimiter";

const app = express();
const PORT = parseInt(process.env.PORT || "4001", 10);

console.log(`[server] Backend source RELOADED at ${new Date().toISOString()}`);

// Trust proxy (required for cloud proxies and rate limiting)
app.set("trust proxy", 1);

// Middleware
// CORS configuration - handle FRONTEND_URL with potential trailing whitespace
const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:3000").trim();
app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Session middleware for Passport (persistent store to avoid memory leaks)
const pgSession = require("connect-pg-simple")(session);
app.use(
  session({
    store: new pgSession({
      conString: process.env.DATABASE_URL || process.env.DATABASE_URL_SUPABASE,
      tableName: "session", // Ensure this table exists in your DB
      createTableIfMissing: true, // Automatically create the session table
    }),
    secret:
      process.env.NEXTAUTH_SECRET ||
      process.env.AUTH_SECRET ||
      "your-secret-key",
    resave: false,
    saveUninitialized: false,
    name: "tide-raider-session", // Renamed to avoid conflicts
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // Cross-site support in prod
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Apply rate limiting
app.use(rateLimiter);

// Request/Response logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  // Log incoming request
  console.log(`[${timestamp}] ${req.method} ${req.path}`, {
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    body:
      req.method !== "GET" && Object.keys(req.body || {}).length > 0
        ? req.body
        : undefined,
    ip: req.ip,
  });

  // Override res.json to log response
  const originalJson = res.json.bind(res);
  res.json = function (body: any) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const statusEmoji =
      statusCode >= 500 ? "❌" : statusCode >= 400 ? "⚠️" : "✅";

    console.log(
      `[${new Date().toISOString()}] ${statusEmoji} ${req.method} ${req.path} ${statusCode} (${duration}ms)`,
      {
        statusCode,
        duration: `${duration}ms`,
        responseSize: JSON.stringify(body || {}).length,
      }
    );
    return originalJson(body);
  };

  // Override res.status to capture status code
  const originalStatus = res.status.bind(res);
  res.status = function (code: number) {
    res.statusCode = code;
    return originalStatus(code);
  };

  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
import apiRouter from "./routes";
app.use("/api", apiRouter);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
// Use 0.0.0.0 to listen on all interfaces (avoids IPv4/IPv6 localhost issues)
const HOST = "0.0.0.0";
app.listen(PORT, HOST, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `🌐 Listening on ${HOST}:${PORT}${HOST === "0.0.0.0" ? " (accessible from all network interfaces)" : " (localhost only)"}`
  );

  // Start cron scheduler
  if (process.env.ENABLE_CRON !== "false") {
    const { getCronScheduler } = require("./services/cronScheduler");
    const scheduler = getCronScheduler();
    scheduler.start();
  } else {
    console.log("⏸️  Cron scheduler disabled (ENABLE_CRON=false)");
  }
});

// Server error handling is done via errorHandler middleware

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

export default app;
