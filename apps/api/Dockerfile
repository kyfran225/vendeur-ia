FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Copy root monorepo files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./

# Copy packages
COPY packages ./packages

# Copy API app
COPY apps/api ./apps/api

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the project
RUN pnpm build --filter @vendeur-ia/api

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=base /app/package.json ./
COPY --from=base /app/pnpm-lock.yaml ./
COPY --from=base /app/apps/api/package.json ./apps/api/
COPY --from=base /app/apps/api/dist ./apps/api/dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps/api/node_modules ./apps/api/node_modules

EXPOSE 3001

CMD ["pnpm", "--filter", "@vendeur-ia/api", "start"]
