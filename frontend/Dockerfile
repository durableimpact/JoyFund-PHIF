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
COPY package.json package-lock.json ./
RUN npm install --force

# Build the application
FROM base AS builder
WORKDIR /app

# ← Accept build args
ARG NEXT_PUBLIC_DJANGO_API_URL
ARG NEXT_PUBLIC_BACKEND_URL
ARG NEXT_PUBLIC_DJANGO_OAUTH_CLIENT_ID
ARG NEXT_PUBLIC_DJANGO_OAUTH_CLIENT_SECRET

# ← Bake them into the build
ENV NEXT_PUBLIC_DJANGO_API_URL=$NEXT_PUBLIC_DJANGO_API_URL
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_DJANGO_OAUTH_CLIENT_ID=$NEXT_PUBLIC_DJANGO_OAUTH_CLIENT_ID
ENV NEXT_PUBLIC_DJANGO_OAUTH_CLIENT_SECRET=$NEXT_PUBLIC_DJANGO_OAUTH_CLIENT_SECRET

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm install -g npm@11.1.0
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs --ingroup nodejs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
CMD ["node", "server.js"]