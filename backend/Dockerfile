# ─────────────────────────────────────────────────────────────
# Tide Raider Backend – Extreme Optimization for Production
# ─────────────────────────────────────────────────────────────

# Stage 0: Base System Dependencies
FROM node:22-slim AS base

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 \
    libatk1.0-0 libatspi2.0-0 libcups2 libdbus-1-3 libdrm2 libgbm1 \
    libgtk-3-0 libnspr4 libnss3 libxcomposite1 libxdamage1 libxfixes3 \
    libxkbcommon0 libxrandr2 libxss1 libxtst6 wget xdg-utils \
    python3 python3-pip python3-venv ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Stage 1: Build Dependencies (Full npm install)
FROM base AS build-deps
COPY package*.json ./
COPY prisma ./prisma/
RUN SUPABASE_SKIP_BINARY_DOWNLOAD=1 npm ci --legacy-peer-deps

# Stage 3: Python Dependencies
FROM base AS python-deps
COPY requirements.txt ./
RUN pip install --break-system-packages -r requirements.txt

# Stage 4: Build the Application
FROM base AS builder
COPY --from=build-deps /app/node_modules ./node_modules
COPY . .
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN ./node_modules/.bin/prisma generate && npm run build

# Stage 5: Production Node Modules
FROM base AS prod-deps
COPY package*.json ./
COPY prisma ./prisma/
RUN SUPABASE_SKIP_BINARY_DOWNLOAD=1 npm ci --omit=dev --legacy-peer-deps && \
    npm install prisma@6.2.1 --no-save --legacy-peer-deps
RUN ./node_modules/.bin/prisma generate

# Stage 6: Final Production Runner
FROM base AS runner
RUN groupadd -r appuser && useradd -r -m -g appuser appuser
WORKDIR /app

# Copy production assets
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts

# Copy Python packages
COPY --from=python-deps /usr/local/lib/python3.11/dist-packages /usr/local/lib/python3.11/dist-packages
COPY --from=python-deps /usr/local/bin /usr/local/bin

# Install Playwright Chromium (Lean)
ENV PLAYWRIGHT_BROWSERS_PATH=/app/pw-browsers \
    NODE_ENV=production \
    PORT=8080 \
    HOME=/home/appuser

RUN npx playwright install chromium && \
    chown -R appuser:appuser /home/appuser /app

USER appuser
EXPOSE 8080
CMD ["npm", "start"]