# syntax=docker/dockerfile:1
FROM node:22.14.0-bullseye AS base

# Install system dependencies needed for native modules (e.g. canvas)
FROM base AS deps
RUN apt-get update && apt-get install -y \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    build-essential \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app

RUN npm install -g npm@latest

# Install app dependencies
COPY package.json package-lock.json  ./
RUN npm install --force

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Optionally disable Next.js telemetry if desired:
# ENV NEXT_TELEMETRY_DISABLED 1

RUN npm install -g npm@11.1.0
RUN npm run build

# Production image: copy built files and run Next.js
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# ENV NEXT_TELEMETRY_DISABLED 1

# Create system users
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs --ingroup nodejs

COPY --from=builder /app/public ./public

# Create cache folder for prerender and set proper permissions
RUN mkdir .next && chown nextjs:nodejs .next

# Copy Next.js standalone output (with output file tracing)
COPY --from=builder --chown=nextjs:nodejs /app/public /app/.next/standalone/
COPY --from=builder --chown=nextjs:nodejs /app/.next/static /app/.next/standalone/.next/
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]

