# Use Node.js 22
FROM node:22-slim

# Install dependencies for Playwright/Chromium
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libnss3-dev \
    libnspr4-dev \
    libwayland-client0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    libxss1 \
    libgconf-2-4 \
    libxtst6 \
    libxshmfence1 \
    libglu1-mesa \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (needed for TypeScript build)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
# Set a dummy DATABASE_URL for Prisma client generation (not used at runtime)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Copy JavaScript eval files to dist (they're not compiled by TypeScript)
# These files are loaded at runtime and must be present in dist
RUN mkdir -p dist/lib/scrapers && \
    cp src/lib/scrapers/windy-eval.js dist/lib/scrapers/windy-eval.js && \
    cp src/lib/scrapers/windguru-eval.js dist/lib/scrapers/windguru-eval.js

# Remove dev dependencies to reduce image size
# Note: We keep src/ folder for reference, but only dist/ is used at runtime
RUN npm prune --production

# Cloud Run expects containers to listen on PORT env var (defaults to 8080)
# The server code already handles this: process.env.PORT || "4001"
ENV PORT=8080
EXPOSE 8080

# Start server
CMD ["npm", "start"]

