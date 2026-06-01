# JoyFund Database Backup & Restore Guide

## Overview

JoyFund uses an automated daily backup system that stores database dumps in two places:

- **Local (VPS):** `/backups/` inside the `joyfund_backup` container — kept forever, never deleted automatically
- **Remote (Backblaze B2):** `backups/postgres/` bucket — kept forever as offsite copy

Backups run automatically every day at **2:00 AM UTC** (3:00 AM Yaoundé time).

---

## Backup File Format

```
joyfund_YYYYMMDD_HHMMSS.sql.gz
```

Example:
```
joyfund_20260601_020000.sql.gz
```

---

## Check Backup Status

```bash
# List all local backups and their sizes
docker exec joyfund_backup ls -lh /backups/

# Check total backup size
docker exec joyfund_backup du -sh /backups/

# View backup logs
docker logs joyfund_backup --tail=100

# Check cron is running
docker exec joyfund_backup crontab -l
```

---

## Run a Manual Backup

Use this when you need an immediate backup outside the scheduled time — before a major deployment, schema change, or any risky operation.

```bash
# Trigger backup manually
docker exec joyfund_backup sh /backup.sh
```

You should see output like:
```
🔄 Starting JoyFund database backup - Mon Jun 1 02:00:00 UTC 2026
📦 Creating database dump...
✅ Backup created: joyfund_20260601_020000.sql.gz (2.5M)
☁️  Uploading to Backblaze B2...
✅ Uploaded to B2: backups/postgres/joyfund_20260601_020000.sql.gz
🎉 Backup completed successfully - Mon Jun 1 02:00:05 UTC 2026
📁 Current local backups:
-rw-r--r-- 1 root root 2.5M Jun 1 02:00 joyfund_20260601_020000.sql.gz
💾 Total backup size: 2.5M
```

---

## Restore from a Local Backup

Use this when the backup file is still available on the VPS.

### Step 1 — List available local backups

```bash
docker exec joyfund_backup ls -lh /backups/
```

### Step 2 — Choose a backup file and restore

```bash
# Replace BACKUP_FILE with the actual filename
BACKUP_FILE=joyfund_20260601_020000.sql.gz

# Decompress and restore
docker exec joyfund_backup sh -c "
  gunzip -c /backups/${BACKUP_FILE} | \
  PGPASSWORD=\${DB_PASSWORD} psql \
    -h joyfund_postgres \
    -U \${DB_USER} \
    -d \${DB_NAME}
"
```

### Step 3 — Verify the restore

```bash
docker exec joyfund_backup sh -c "
  PGPASSWORD=\${DB_PASSWORD} psql \
    -h joyfund_postgres \
    -U \${DB_USER} \
    -d \${DB_NAME} \
    -c '\dt'
"
```

---

## Restore from Backblaze B2

Use this when the VPS backup has been lost, corrupted, or the server was destroyed.

### Step 1 — List available backups on B2

```bash
docker exec joyfund_backup python3 -c "
import boto3, os

s3 = boto3.client('s3',
    endpoint_url=f'https://s3.{os.environ[\"B2_S3_REGION_NAME\"]}.backblazeb2.com',
    aws_access_key_id=os.environ['B2_ACCESS_KEY_ID'],
    aws_secret_access_key=os.environ['B2_SECRET_ACCESS_KEY'],
)

response = s3.list_objects_v2(
    Bucket=os.environ['B2_STORAGE_BUCKET_NAME'],
    Prefix='backups/postgres/'
)

for obj in response.get('Contents', []):
    size_mb = obj['Size'] / 1024 / 1024
    print(f\"{obj['Key']}  ({size_mb:.1f} MB)  {obj['LastModified']}\")
"
```

### Step 2 — Download the backup from B2

```bash
# Replace BACKUP_FILE with the filename you want to restore
BACKUP_FILE=joyfund_20260601_020000.sql.gz

docker exec joyfund_backup python3 -c "
import boto3, os

s3 = boto3.client('s3',
    endpoint_url=f'https://s3.{os.environ[\"B2_S3_REGION_NAME\"]}.backblazeb2.com',
    aws_access_key_id=os.environ['B2_ACCESS_KEY_ID'],
    aws_secret_access_key=os.environ['B2_SECRET_ACCESS_KEY'],
)

s3.download_file(
    os.environ['B2_STORAGE_BUCKET_NAME'],
    'backups/postgres/${BACKUP_FILE}',
    '/backups/restore_${BACKUP_FILE}'
)
print('✅ Downloaded successfully to /backups/restore_${BACKUP_FILE}')
" 
```

### Step 3 — Restore from the downloaded file

```bash
docker exec joyfund_backup sh -c "
  gunzip -c /backups/restore_${BACKUP_FILE} | \
  PGPASSWORD=\${DB_PASSWORD} psql \
    -h joyfund_postgres \
    -U \${DB_USER} \
    -d \${DB_NAME}
"
```

### Step 4 — Verify the restore

```bash
docker exec joyfund_backup sh -c "
  PGPASSWORD=\${DB_PASSWORD} psql \
    -h joyfund_postgres \
    -U \${DB_USER} \
    -d \${DB_NAME} \
    -c 'SELECT COUNT(*) FROM accounts_user;'
"
```

---

## Restore to a Fresh Server (Disaster Recovery)

Use this when the entire VPS is lost and you are setting up from scratch.

### Step 1 — Set up the new server

```bash
# Clone the repository
git clone https://github.com/your-org/JoyFund.git
cd JoyFund/backend

# Create the external network and volume
docker network create joyfund_network
docker volume create joyfund_static_volume

# Start only postgres and backup containers first
docker compose -f prod.yml --env-file ./envs/prod/.env up -d postgres db-backup
```

### Step 2 — Wait for postgres to be healthy

```bash
watch -n 2 'docker ps | grep postgres'
# Wait until it shows (healthy)
```

### Step 3 — Download and restore the latest backup from B2

```bash
# List backups to find the latest
docker exec joyfund_backup python3 -c "
import boto3, os
s3 = boto3.client('s3',
    endpoint_url=f'https://s3.{os.environ[\"B2_S3_REGION_NAME\"]}.backblazeb2.com',
    aws_access_key_id=os.environ['B2_ACCESS_KEY_ID'],
    aws_secret_access_key=os.environ['B2_SECRET_ACCESS_KEY'],
)
response = s3.list_objects_v2(
    Bucket=os.environ['B2_STORAGE_BUCKET_NAME'],
    Prefix='backups/postgres/'
)
objects = sorted(response.get('Contents', []), key=lambda x: x['LastModified'], reverse=True)
print('Latest backup:', objects[0]['Key'])
"

# Download and restore (replace BACKUP_FILE with actual filename from above)
BACKUP_FILE=joyfund_20260601_020000.sql.gz

docker exec joyfund_backup python3 -c "
import boto3, os
s3 = boto3.client('s3',
    endpoint_url=f'https://s3.{os.environ[\"B2_S3_REGION_NAME\"]}.backblazeb2.com',
    aws_access_key_id=os.environ['B2_ACCESS_KEY_ID'],
    aws_secret_access_key=os.environ['B2_SECRET_ACCESS_KEY'],
)
s3.download_file(
    os.environ['B2_STORAGE_BUCKET_NAME'],
    'backups/postgres/${BACKUP_FILE}',
    '/backups/${BACKUP_FILE}'
)
print('Downloaded')
"

docker exec joyfund_backup sh -c "
  gunzip -c /backups/${BACKUP_FILE} | \
  PGPASSWORD=\${DB_PASSWORD} psql \
    -h joyfund_postgres \
    -U \${DB_USER} \
    -d \${DB_NAME}
"
```

### Step 4 — Start all remaining services

```bash
docker compose -f prod.yml --env-file ./envs/prod/.env up -d
```

---

## Manual Cleanup (When Disk is Getting Full)

Backups are never deleted automatically. When disk usage is getting high, manually delete old ones.

```bash
# Check disk usage
docker exec joyfund_backup du -sh /backups/
docker exec joyfund_backup ls -lht /backups/

# Delete backups older than 30 days manually (YOUR DECISION)
docker exec joyfund_backup find /backups/ -name "joyfund_*.sql.gz" -mtime +30 -delete

# Verify what's left
docker exec joyfund_backup ls -lh /backups/
```

> ⚠️ **IMPORTANT:** Before deleting any local backup, always verify that the same
> backup exists on Backblaze B2. Never delete local backups if B2 uploads have
> been failing recently.

---

## Backup Schedule

| Time (UTC)  | Time (Yaoundé) | Action                        |
|-------------|----------------|-------------------------------|
| 2:00 AM     | 3:00 AM        | Automatic daily backup runs   |

To change the backup time, update the cron expression in `prod.yml`:

```yaml
# Current: 2:00 AM UTC every day
echo '0 2 * * * sh /backup.sh >> /var/log/backup.log 2>&1'

# Examples:
# Every day at midnight UTC:   0 0 * * *
# Every day at 6 AM UTC:       0 6 * * *
# Twice a day (2AM and 2PM):   0 2,14 * * *
```

---

## Environment Variables Required

These must be set in `./envs/prod/.env`:

```env
# PostgreSQL
DB_NAME=joyfund
DB_USER=joyfund
DB_PASSWORD=yourpassword

# Backblaze B2
B2_ACCESS_KEY_ID=your_key_id
B2_SECRET_ACCESS_KEY=your_secret_key
B2_STORAGE_BUCKET_NAME=joyfund-backups
B2_S3_REGION_NAME=us-west-004
```

---

## Troubleshooting

### Backup container not starting
```bash
docker logs joyfund_backup --tail=50
```

### B2 upload failing
```bash
# Test B2 credentials
docker exec joyfund_backup python3 -c "
import boto3, os
s3 = boto3.client('s3',
    endpoint_url=f'https://s3.{os.environ[\"B2_S3_REGION_NAME\"]}.backblazeb2.com',
    aws_access_key_id=os.environ['B2_ACCESS_KEY_ID'],
    aws_secret_access_key=os.environ['B2_SECRET_ACCESS_KEY'],
)
print(s3.list_buckets())
"
```

### pg_dump failing
```bash
# Test postgres connection from backup container
docker exec joyfund_backup sh -c "
  PGPASSWORD=\${DB_PASSWORD} psql \
    -h joyfund_postgres \
    -U \${DB_USER} \
    -d \${DB_NAME} \
    -c 'SELECT 1'
"
```

### Check if cron is running
```bash
docker exec joyfund_backup ps aux | grep cron
```

---

*Last updated: June 2026 — JoyFund v1.0*
*Maintainer: Ivantom (Ivan Tomdieu Gottfried) — ivan.tomdieu@gmail.com*