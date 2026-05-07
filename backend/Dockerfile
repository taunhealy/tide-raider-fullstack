# ─────────────────────────────────────────────────────────────
# Tide Raider Backend – Production Optimized Dockerfile
# ─────────────────────────────────────────────────────────────

# Stage 1: Build Environment
FROM node:22-slim AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
# Install all dependencies including devDependencies for build
RUN npm ci --legacy-peer-deps
COPY . .
# Set dummy DB URL for build-time prisma generation
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npx prisma generate && npm run build

# Stage 2: Production Dependencies (Node)
FROM node:22-slim AS prod-deps
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev --legacy-peer-deps && \
    npx prisma generate

# Stage 3: Python Environment
FROM python:3.11-slim AS python-builder
WORKDIR /app
COPY requirements.txt ./
# Install to a specific prefix to make copying easier
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Stage 4: Final Production Runner
FROM node:22-slim AS runner
WORKDIR /app

# Install runtime system dependencies (minimal)
# ca-certificates for HTTPS, ffmpeg for video, python3 for AI scripts
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    ffmpeg \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Install Playwright Chromium dependencies (minimal runtime libs)
# 'install-deps' is the official way to get exactly what's needed
RUN npx playwright install-deps chromium && \
    rm -rf /var/lib/apt/lists/*

# Copy production assets from stages
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
# Copy Python packages
COPY --from=python-builder /install /usr/local

# Playwright setup
ENV PLAYWRIGHT_BROWSERS_PATH=/app/pw-browsers \
    NODE_ENV=production \
    PORT=8080 \
    HOME=/home/appuser

# Install only Chromium browser
RUN npx playwright install chromium

# Final setup: Non-root user for security
RUN groupadd -r appuser && useradd -r -m -g appuser appuser && \
    chown -R appuser:appuser /app /home/appuser

USER appuser
EXPOSE 8080
CMD ["npm", "start"]