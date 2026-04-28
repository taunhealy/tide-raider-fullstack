# ─────────────────────────────────────────────────────────────
# Tide Raider Backend – Highly Optimized for Build Efficiency
# ─────────────────────────────────────────────────────────────
FROM node:22-slim AS base

# Install ALL system dependencies (Chromium, Python, FFmpeg) in one layer
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 \
    libatk1.0-0 libatspi2.0-0 libcups2 libdbus-1-3 libdrm2 libgbm1 \
    libgtk-3-0 libnspr4 libnss3 libxcomposite1 libxdamage1 libxfixes3 \
    libxkbcommon0 libxrandr2 libxss1 libxtst6 wget xdg-utils \
    python3 python3-pip python3-venv ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ───── Stage 1: Dependency Installation ─────
# These layers change infrequently
COPY package*.json requirements.txt ./
COPY prisma ./prisma/
COPY scripts ./scripts/

# Install Node dependencies skipping heavy binaries
RUN SUPABASE_SKIP_BINARY_DOWNLOAD=1 npm ci --legacy-peer-deps

# Install Python dependencies
RUN pip install --break-system-packages -r requirements.txt

# Install Playwright Chromium (this is a big layer, so keep it early)
ENV PLAYWRIGHT_BROWSERS_PATH=/app/pw-browsers
RUN npx playwright install chromium

# ───── Stage 2: Build the app ─────
COPY . .
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npx prisma generate && npm run build
# Copy non-TS assets that TSC ignores to dist
RUN mkdir -p dist/lib/scrapers && cp src/lib/scrapers/*.js dist/lib/scrapers/

# ───── Stage 3: Production Release ─────
# We use the base again to inherit system deps without re-running apt-get
FROM base AS runner

# Create non-root user WITH a writable home directory
# (-m creates /home/appuser; crawl4ai needs a writable HOME for its SQLite cache)
RUN groupadd -r appuser && useradd -r -m -g appuser appuser

WORKDIR /app

# Copy dependencies and built files
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/pw-browsers ./pw-browsers
COPY --from=base /app/requirements.txt ./requirements.txt
COPY --from=base /app/scripts ./scripts

# Ensure playwright knows where the browser is
ENV PLAYWRIGHT_BROWSERS_PATH=/app/pw-browsers \
    NODE_ENV=production \
    PORT=8080 \
    HOME=/home/appuser

# Ensure appuser can write to their home (crawl4ai cache) and /tmp
RUN chown -R appuser:appuser /home/appuser

# Switch to non-root user
USER appuser

EXPOSE 8080
CMD ["npm", "start"]