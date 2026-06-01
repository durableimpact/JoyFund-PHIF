#!/bin/sh
set -e

echo "🔄 Starting JoyFund database backup - $(date)"

# ── Config ────────────────────────────────────────────────────────────────────
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="joyfund_${TIMESTAMP}.sql.gz"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

# ── Create backup ─────────────────────────────────────────────────────────────
echo "📦 Creating database dump..."
PGPASSWORD="${DB_PASSWORD}" pg_dump \
    -h joyfund_postgres \
    -p 5432 \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    --no-password \
    --verbose \
    --format=plain \
    | gzip > "${BACKUP_PATH}"

# ── Verify backup is not empty ────────────────────────────────────────────────
if [ ! -s "${BACKUP_PATH}" ]; then
    echo "❌ Backup file is empty — aborting upload and keeping all existing backups"
    rm -f "${BACKUP_PATH}"
    exit 1
fi

echo "✅ Backup created: ${BACKUP_FILE} ($(du -sh ${BACKUP_PATH} | cut -f1))"

# ── Upload to Backblaze B2 ─────────────────────────────────────────────────────
echo "☁️  Uploading to Backblaze B2..."
python3 -c "
import boto3
import os
import sys

s3 = boto3.client(
    's3',
    endpoint_url=f'https://s3.{os.environ[\"B2_S3_REGION_NAME\"]}.backblazeb2.com',
    aws_access_key_id=os.environ['B2_ACCESS_KEY_ID'],
    aws_secret_access_key=os.environ['B2_SECRET_ACCESS_KEY'],
)

bucket = os.environ['B2_STORAGE_BUCKET_NAME']
backup_file = os.environ['BACKUP_FILE']
key = f'backups/postgres/{backup_file}'

try:
    s3.upload_file('${BACKUP_PATH}', bucket, key)
    print(f'✅ Uploaded to B2: {key}')
except Exception as e:
    print(f'❌ B2 upload failed: {e}')
    sys.exit(1)
" BACKUP_FILE="${BACKUP_FILE}"

echo "🎉 Backup completed successfully - $(date)"


echo "📁 Current local backups:"
ls -lh "${BACKUP_DIR}"
echo "💾 Total backup size: $(du -sh ${BACKUP_DIR} | cut -f1)"

# ── Disk usage warning ────────────────────────────────────────────────────────
BACKUP_SIZE=$(du -sb "${BACKUP_DIR}" | cut -f1)
BACKUP_SIZE_GB=$((BACKUP_SIZE / 1024 / 1024 / 1024))

if [ "${BACKUP_SIZE_GB}" -gt 50 ]; then
    echo "⚠️  WARNING: Backup directory is ${BACKUP_SIZE_GB}GB — consider manual cleanup"
fi