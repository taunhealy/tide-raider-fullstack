# ─────────────────────────────────────────────────────────────
# Tide Raider Backend – Optimized for Cloud Run (2025)
# ─────────────────────────────────────────────────────────────
FROM node:22-slim AS base

# Install only the exact system dependencies needed for Chromium/Playwright
RUN apt-get update && apt-get install -y --no-install-recommends \
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
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    libxss1 \
    libxtst6 \
    wget \
    xdg-utils \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user (Cloud Run strongly recommends this)
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

# ───── Stage 1: Install all dependencies (including dev) ─────
COPY package*.json ./
COPY requirements.txt ./
COPY prisma ./prisma/
RUN SUPABASE_SKIP_BINARY_DOWNLOAD=1 npm ci --legacy-peer-deps
RUN pip install --break-system-packages -r requirements.txt
RUN playwright install chromium

# ───── Stage 2: Build the app ─────
COPY . .
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npx prisma generate && \
    npm run build && \
    # Copy the raw .js eval files that are loaded at runtime
    mkdir -p dist/lib/scrapers && \
    cp src/lib/scrapers/windy-eval.js dist/lib/scrapers/windy-eval.js && \
    cp src/lib/scrapers/windguru-eval.js dist/lib/scrapers/windguru-eval.js

# ───── Stage 3: Production slim image ─────
FROM node:22-slim

# Re-install only the minimal system deps needed at runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
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
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Copy only what we need from the build stage
COPY --from=base /app /app

WORKDIR /app
ENV NODE_ENV=production \
    PORT=8080

# Switch to non-root user
USER appuser

EXPOSE 8080
CMD ["npm", "start"]