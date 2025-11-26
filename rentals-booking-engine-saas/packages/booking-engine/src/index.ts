import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "dotenv";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./trpc/routers";
import { createContext } from "./trpc/context";

config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

// tRPC endpoint
app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "booking-engine",
  });
});

// Root endpoint
app.get("/", (_req: Request, res: Response) => {
  res.json({
    message: "Rentals Booking Engine SaaS API",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    endpoints: {
      health: "/health",
      trpc: "/trpc",
    },
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Booking Engine API running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 CORS enabled for: ${process.env.CORS_ORIGIN || "http://localhost:3000"}`);
  console.log(`⚡ tRPC endpoint: http://localhost:${PORT}/trpc`);
});

export default app;

