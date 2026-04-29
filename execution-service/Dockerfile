# ─────────────────────────────────────────────────────────────────────────────
# Build context: project root  (cd OJ_Pre && docker build -f execution-service/Dockerfile .)
# Needs gcc/g++ (C/C++) and python3 for code execution.
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: install production deps ─────────────────────────────────────────
FROM node:20-bullseye-slim AS deps

WORKDIR /build
# COPY execution-service/package*.json ./
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# ── Stage 2: final image ──────────────────────────────────────────────────────
FROM node:20-bullseye-slim AS production

# Install language runtimes and dumb-init
RUN apt-get update && apt-get install -y --no-install-recommends \
      gcc \
      g++ \
      python3 \
      python3-pip \
      dumb-init \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Python alias
RUN ln -sf /usr/bin/python3 /usr/bin/python

# WORKDIR /app/execution-service

# COPY --from=deps /build/node_modules ./node_modules
# COPY execution-service/ ./
# COPY execution-service/shared/ /app/shared/

WORKDIR /app/execution-service

COPY --from=deps /build/node_modules ./node_modules
COPY . ./

# Temp directory for code execution sandbox
RUN mkdir -p /tmp/executions && chmod 777 /tmp/executions

# Non-root user (execution-service still needs to run compilers)
RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs -m nodejs
RUN chown nodejs:nodejs /tmp/executions

USER nodejs

# ENV NODE_ENV=docker
# ENV LOG_FORMAT=json

# EXPOSE 5001

# HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
#   CMD wget --no-verbose --tries=1 --spider http://localhost:5001/api/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
