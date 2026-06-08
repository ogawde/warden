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
RUN npm ci --workspace @warden/worker --include-workspace-root

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY packages ./packages
COPY services/worker ./services/worker
WORKDIR /app/services/worker
EXPOSE 8080
CMD ["npx", "tsx", "src/index.ts"]
