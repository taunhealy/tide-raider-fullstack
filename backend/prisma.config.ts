/// <reference types="node" />

import { defineConfig, env } from "prisma/config";

export default defineConfig({
  engine: "classic",
  datasource: {
    // Use a dummy URL during build if DATABASE_URL is not set (for Prisma client generation)
    // The actual DATABASE_URL will be used at runtime
    url: env("DATABASE_URL") || "postgresql://dummy:dummy@localhost:5432/dummy",
  },
});
