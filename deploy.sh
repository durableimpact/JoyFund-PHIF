#!/bin/sh
set -e

echo "🔄  Pulling latest code..."
git pull origin main

echo "🏗️   Rebuilding backend..."
docker compose -f backend/prod.yml build

echo "🏗️   Rebuilding frontend..."
docker compose -f frontend/docker-compose.yml build

echo "🚀  Restarting backend..."
docker compose -f backend/prod.yml up -d

echo "🚀  Restarting frontend (2 replicas)..."
docker compose -f frontend/docker-compose.yml up -d --scale app=2

echo "✅  Deploy complete."
