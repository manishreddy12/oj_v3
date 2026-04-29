# ─────────────────────────────────────────────────────────────────────────────
# Build context: project root  (cd OJ_Pre && docker build -f api-service/Dockerfile .)
# The shared/ directory sits at the project root and is required by this service.
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: install production deps ─────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /build

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force


FROM node:20-alpine AS production

RUN apk add --no-cache dumb-init wget

WORKDIR /app/api-service

COPY --from=deps /build/node_modules ./node_modules
COPY . ./

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 -G nodejs
USER nodejs

ENV NODE_ENV=production
ENV LOG_FORMAT=json
ENV PORT=5000

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]



# FROM node:20-alpine AS deps

# WORKDIR /build
# COPY package*.json ./
# RUN npm ci --only=production && npm cache clean --force

# # ── Stage 2: final image ──────────────────────────────────────────────────────
# FROM node:20-alpine AS production

# # dumb-init: proper PID-1 signal forwarding (SIGTERM → graceful shutdown)
# RUN apk add --no-cache dumb-init

# # Mirror monorepo layout inside the container:
# #   /app/shared/          ← shared utilities
# #   /app/api-service/     ← this service (WORKDIR)
# WORKDIR /app/api-service

# # Copy production node_modules from deps stage
# COPY --from=deps /build/node_modules ./node_modules

# # Copy application source
# COPY . ./

# # Copy shared module (required as ../shared relative to this service)
# COPY . ./

# # Non-root user for security
# RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 -G nodejs
# USER nodejs

# ENV NODE_ENV=production
# ENV LOG_FORMAT=json

# EXPOSE 5000

# HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
#   CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# ENTRYPOINT ["dumb-init", "--"]
# CMD ["node", "server.js"]
