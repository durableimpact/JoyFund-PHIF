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
echo "🏗️   Rebuilding backend image..."
docker compose -f backend/prod.yml --env-file ./backend/envs/prod/.env build

echo "🔄  Rolling restart of backend services..."

# Restart web workers one at a time so at least 2 of 3 stay serving
# --wait blocks until the container's healthcheck passes
for worker in web-worker-1 web-worker-2 web-worker-3; do
  echo "  ↻ Restarting $worker..."
  docker compose -f backend/prod.yml --env-file ./backend/envs/prod/.env up -d --no-deps --wait --wait-timeout 60 "$worker"
  echo "  ✓ $worker is healthy"
done

# Restart celery workers
echo "  ↻ Restarting celery workers..."
docker compose -f backend/prod.yml --env-file ./backend/envs/prod/.env up -d --no-deps --wait --wait-timeout 30 celery-worker-1 celery-worker-2

# Restart celery beat
echo "  ↻ Restarting celery-beat..."
docker compose -f backend/prod.yml --env-file ./backend/envs/prod/.env up -d --no-deps celery-beat

# ── Cleanup ──
echo "🧹  Pruning unused images..."
docker image prune -f

echo "✅  Deploy complete."
