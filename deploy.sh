#!/bin/sh
set -e

COMPOSE="docker compose -f backend/prod.yml --env-file ./backend/envs/prod/.env"

# Map service name → container name
container_name() {
  case "$1" in
    web-worker-1)     echo "joyfund_web_1" ;;
    web-worker-2)     echo "joyfund_web_2" ;;
    web-worker-3)     echo "joyfund_web_3" ;;
    celery-worker-1)  echo "joyfund_celery_1" ;;
    celery-worker-2)  echo "joyfund_celery_2" ;;
    celery-beat)      echo "joyfund_celery_beat" ;;
    *)                echo "" ;;
  esac
}

echo "🔄  Pulling latest code..."
git fetch origin main
git reset --hard origin/main

# ── Frontend ──
echo "🏗️   Rebuilding frontend..."
docker compose --env-file frontend/.env -f frontend/docker-compose.yml build
echo "🚀  Rolling restart of frontend (2 replicas)..."
docker compose --env-file frontend/.env -f frontend/docker-compose.yml up -d --wait --wait-timeout 60

# ── Backend ──
echo "🏗️   Rebuilding backend image..."
$COMPOSE build

echo "🔄  Rolling restart of backend services..."

# Restart web workers one at a time so at least 2 of 3 stay serving.
# Stop the old container first to avoid name conflicts, then start the
# new one and wait for its healthcheck to pass.
for worker in web-worker-1 web-worker-2 web-worker-3; do
  cname=$(container_name "$worker")
  echo "  ↻ Restarting $worker ($cname)..."
  docker stop "$cname" 2>/dev/null || true
  docker rm "$cname" 2>/dev/null || true
  $COMPOSE up -d --no-deps --wait --wait-timeout 60 "$worker"
  echo "  ✓ $worker is healthy"
done

# Restart celery workers
for worker in celery-worker-1 celery-worker-2; do
  cname=$(container_name "$worker")
  echo "  ↻ Restarting $worker ($cname)..."
  docker stop "$cname" 2>/dev/null || true
  docker rm "$cname" 2>/dev/null || true
  $COMPOSE up -d --no-deps --wait --wait-timeout 30 "$worker"
done

# Restart celery beat
echo "  ↻ Restarting celery-beat..."
cname=$(container_name "celery-beat")
docker stop "$cname" 2>/dev/null || true
docker rm "$cname" 2>/dev/null || true
$COMPOSE up -d --no-deps celery-beat

# ── Cleanup ──
echo "🧹  Pruning unused images..."
docker image prune -f

echo "✅  Deploy complete."
