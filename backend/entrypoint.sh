#!/bin/sh
# ──────────────────────────────────────────────────────────────────────────────
# Docker entrypoint
# Waits for Neon DB to be reachable, then conditionally runs migrations.
# Migrations only run when RUN_MIGRATIONS=true (web-worker-1 only).
# ──────────────────────────────────────────────────────────────────────────────
set -e

echo "⏳  Waiting for database..."
python << 'EOF'
import os, sys, time
import psycopg2

# ── Parse DATABASE_URL (Neon format) ──────────────────────────────────────────
# postgresql://user:password@host:port/dbname?sslmode=require
database_url = os.environ.get("DATABASE_URL")

if not database_url:
    print("❌  DATABASE_URL is not set. Exiting.")
    sys.exit(1)

retries = 30
while retries:
    try:
        conn = psycopg2.connect(database_url)
        conn.close()
        print("✅  Database is ready.")
        break
    except psycopg2.OperationalError as e:
        retries -= 1
        print(f"   Not ready yet, retrying... ({retries} attempts left) — {e}")
        time.sleep(2)
else:
    print("❌  Could not connect to the database after 30 attempts. Exiting.")
    sys.exit(1)
EOF

# ── Migrations + collectstatic (web-worker-1 only) ────────────────────────────
# Set RUN_MIGRATIONS=true in docker-compose only for web-worker-1.
# All other containers (web-worker-2, celery workers, beat) skip this block.
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "🔄  Applying database migrations..."
    python manage.py migrate --noinput

    echo "📦  Collecting static files..."
    python manage.py collectstatic --noinput --clear

    echo "✔   Migrations and static files done."
else
    echo "⏭   Skipping migrations (RUN_MIGRATIONS not set)."
fi

echo "🚀  Starting: $@"
exec "$@"