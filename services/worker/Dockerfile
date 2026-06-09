FROM node:22-slim AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/db/package.json ./packages/db/
COPY packages/scan/package.json ./packages/scan/
COPY packages/gitlab-mcp/package.json ./packages/gitlab-mcp/
COPY packages/agent-platform/package.json ./packages/agent-platform/
COPY services/worker/package.json ./services/worker/
COPY packages/db/prisma ./packages/db/prisma
RUN npm ci --workspace @warden/worker --include-workspace-root
RUN npx prisma generate --schema ./packages/db/prisma/schema.prisma

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY packages ./packages
COPY services/worker ./services/worker
COPY demo/debt-lab ./demo/debt-lab
ENV REPO_LOCAL_PATH=/app/demo/debt-lab
WORKDIR /app/services/worker
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 8080) + '/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["npx", "tsx", "src/index.ts"]
