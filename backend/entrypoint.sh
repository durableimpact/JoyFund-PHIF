#!/bin/sh
set -e

echo "⏳  Waiting for database..."
python << 'EOF'
import os, sys, time
import psycopg2

database_url = os.environ.get("DATABASE_URL")
if not database_url:
    print("❌  DATABASE_URL is not set. Exiting.")
    sys.exit(1)

# Add connect_timeout to the URL if not present
if "connect_timeout" not in database_url:
    separator = "&" if "?" in database_url else "?"
    database_url = f"{database_url}{separator}connect_timeout=10"

retries = 15
while retries:
    try:
        conn = psycopg2.connect(database_url)
        conn.close()
        print("✅  Database is ready.")
        break
    except Exception as e:
        retries -= 1
        print(f"   Not ready yet ({retries} left): {type(e).__name__}: {e}")
        time.sleep(2)
else:
    print("❌  Could not connect after 15 attempts. Exiting.")
    sys.exit(1)
EOF

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