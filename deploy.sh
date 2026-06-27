#!/bin/sh
set -e

echo "🔄  Pulling latest code..."
git fetch origin main
git reset --hard origin/main

# ── Frontend ──
echo "🏗️   Rebuilding frontend..."
docker compose --env-file frontend/.env -f frontend/docker-compose.yml build
echo "🚀  Restarting frontend (2 replicas)..."
docker compose --env-file frontend/.env -f frontend/docker-compose.yml up -d --scale app=2

# ── Backend ──
echo "🏗️   Rebuilding backend..."
docker compose -f backend/prod.yml --env-file ./backend/envs/prod/.env up \
              --build \
              -d

# ── Cleanup ──
echo "🧹  Pruning unused images..."
docker image prune -f

echo "✅  Deploy complete."
