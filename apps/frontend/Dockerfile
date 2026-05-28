# Production Dockerfile for Revenue Leak Radar Frontend
# Built from the monorepo root context
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /app

# Copy root config files first (package.json contains packageManager field for corepack)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy core workspace packages
COPY packages/schemas ./packages/schemas
COPY packages/mock-data ./packages/mock-data
COPY packages/agent-prompts ./packages/agent-prompts

# Copy frontend app
COPY apps/frontend ./apps/frontend

# Install dependencies using the lockfile
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN mkdir -p apps/frontend/public && pnpm --filter frontend build

# Production runner stage
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy static assets and standalone server built by Next.js
COPY --from=builder /app/apps/frontend/public ./apps/frontend/public

# Copy the standalone folder and public resources
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/static ./apps/frontend/.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "apps/frontend/server.js"]
