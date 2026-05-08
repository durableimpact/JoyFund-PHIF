#!/bin/sh
# ──────────────────────────────────────────────────────────────────────────────
# Docker entrypoint
# Waits for the DB to be ready, applies migrations, then runs the given command.
# ──────────────────────────────────────────────────────────────────────────────
set -e

echo "⏳  Waiting for database..."
python << 'EOF'
import os, sys, time
import psycopg2

host = os.environ.get("DB_HOST", "db")
port = os.environ.get("DB_PORT", "5432")
name = os.environ.get("DB_NAME", "joyfund")
user = os.environ.get("DB_USER", "joyfund")
password = os.environ.get("DB_PASSWORD", "joyfund")

retries = 30
while retries:
    try:
        psycopg2.connect(host=host, port=port, dbname=name, user=user, password=password)
        print("✅  Database is ready.")
        break
    except psycopg2.OperationalError:
        retries -= 1
        print(f"   Not ready yet, retrying... ({retries} attempts left)")
        time.sleep(2)
else:
    print("❌  Could not connect to the database. Exiting.")
    sys.exit(1)
EOF

echo "🔄  Applying database migrations..."
python manage.py migrate --noinput

echo "📦  Collecting static files..."
python manage.py collectstatic --noinput --clear

echo "🚀  Starting: $@"
exec "$@"
