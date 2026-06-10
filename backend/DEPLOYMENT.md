# JoyFund Backend — Deployment & Setup Guide

## Overview

JoyFund backend is a Django + GeoDjango application deployed on a Contabo VPS using
Docker Compose, Nginx Proxy Manager, and a full monitoring stack.

**Stack:**
- Django 6 + GeoDjango (ASGI via Gunicorn + Uvicorn)
- PostgreSQL 16 + PostGIS (self-hosted)
- RabbitMQ (message broker)
- Redis (cache + Celery backend)
- Celery (async tasks + beat scheduler)
- Nginx Proxy Manager (reverse proxy + SSL)
- Prometheus + Grafana + Loki + Promtail (monitoring)
- Netdata (server metrics)
- pgAdmin (database UI)
- Backblaze B2 (offsite backup storage)

---

## Project Structure

```
JoyFund/
├── backend/
│   ├── prod.yml              ← Docker Compose for all backend services
│   ├── Dockerfile            ← Django image
│   ├── entrypoint.sh         ← DB wait + migrations + collectstatic
│   ├── backup.sh             ← Database backup script
│   ├── prometheus.yml        ← Prometheus scrape config
│   ├── promtail.yml          ← Log shipping config
│   ├── pgadmin-servers.json  ← pgAdmin auto-connect config
│   ├── BACKUP.md             ← Backup & restore guide
│   ├── DEPLOYMENT.md         ← This file
│   └── envs/
│       └── prod/
│           └── .env          ← Production environment variables
├── frontend/
│   ├── docker-compose.yml    ← Frontend compose
│   ├── Dockerfile            ← Next.js image
│   └── .env                  ← Frontend environment variables
└── npm/
    └── docker-compose.yml    ← Nginx Proxy Manager compose
```

---

## First Time Server Setup

### Step 1 — SSH into the VPS

```bash
ssh root@75.119.133.208
```

### Step 2 — Install Docker

```bash
apt-get update
apt-get install -y docker.io docker-compose-plugin
systemctl enable docker
systemctl start docker
```

### Step 3 — Clone the repository

```bash
mkdir -p /root/projects/JoyFund
cd /root/projects/JoyFund
git clone https://github.com/your-org/JoyFund.git .
```

### Step 4 — Create external network and volumes

```bash
docker network create joyfund_network
docker volume create joyfund_static_volume
docker volume create joyfund_media_volume
```

### Step 5 — Create environment file

```bash
mkdir -p /root/projects/JoyFund/backend/envs/prod
nano /root/projects/JoyFund/backend/envs/prod/.env
```

Fill in all required variables (see Environment Variables section below).

### Step 6 — Start NPM (Nginx Proxy Manager) first

```bash
cd /root/projects/JoyFund/npm
docker compose up -d
```

Access NPM at `http://75.119.133.208:81`
- Default email: `admin@example.com`
- Default password: `changeme`

### Step 7 — Start the backend

```bash
cd /root/projects/JoyFund/backend
docker compose -f prod.yml --env-file ./envs/prod/.env up -d
```

### Step 8 — Start the frontend

```bash
cd /root/projects/JoyFund/frontend
docker compose --env-file .env up -d --build
```

### Step 9 — Create superuser

Wait for the web worker to be fully started:

```bash
docker logs joyfund_web_1 --tail=20
# Wait until you see: Application startup complete.
```

Then create the superuser:

```bash
docker exec -it joyfund_web_1 python manage.py createsuperuser
```

Or with all fields explicitly (use this if the interactive version fails):

```bash
docker exec -it joyfund_web_1 python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
User.objects.create_superuser(
    email='admin@joy-fund.com',
    password='yourpassword',
    username='admin',
    phone_number='+237600000000',
    first_name='Admin',
    last_name='JoyFund',
)
print('Superuser created successfully')
"
```

---

## Daily Deployment (After Code Changes)

The GitHub Actions workflow handles deployment automatically on push to `main`.
For manual deployment:

```bash
cd /root/projects/JoyFund/backend

# Pull latest code
git fetch origin main
git reset --hard origin/main

# Rebuild and restart only Django + Celery (not infra)
docker compose -f prod.yml --env-file ./envs/prod/.env up \
  --build \
  --no-deps \
  --force-recreate \
  -d \
  web-worker-1 web-worker-2 \
  celery-worker-1 celery-worker-2 \
  celery-beat
```

For frontend deployment:

```bash
cd /root/projects/JoyFund/frontend

git fetch origin main
git reset --hard origin/main

docker compose --env-file .env up -d --build
```

---

## Service Management

### Check all running containers

```bash
docker ps
```

### Check logs

```bash
# Django
docker logs joyfund_web_1 --tail=50 -f

# Celery worker
docker logs joyfund_celery_1 --tail=50 -f

# All backend services at once
docker compose -f prod.yml --env-file ./envs/prod/.env logs --tail=50 -f
```

### Restart a specific service

```bash
docker compose -f prod.yml --env-file ./envs/prod/.env restart web-worker-1
```

### Stop all services

```bash
docker compose -f prod.yml --env-file ./envs/prod/.env down
```

### Start all services

```bash
docker compose -f prod.yml --env-file ./envs/prod/.env up -d
```

---

## Creating a Superuser

Run this after every fresh database setup or disaster recovery:

```bash
# Interactive (recommended)
docker exec -it joyfund_web_1 python manage.py createsuperuser

# Non-interactive (use when SSH session has issues with interactive prompts)
docker exec -it joyfund_web_1 python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()

# Check if superuser already exists
if User.objects.filter(email='admin@joy-fund.com').exists():
    print('Superuser already exists')
else:
    User.objects.create_superuser(
        email='admin@joy-fund.com',
        password='yourpassword',
        username='admin',
        phone_number='+237600000000',
        first_name='Admin',
        last_name='JoyFund',
    )
    print('Superuser created successfully')
"
```

---

## Running Migrations Manually

```bash
docker exec -it joyfund_web_1 python manage.py migrate
```

Check migration status:

```bash
docker exec -it joyfund_web_1 python manage.py showmigrations
```

---

## Collecting Static Files Manually

```bash
docker exec -it joyfund_web_1 python manage.py collectstatic --noinput --clear
```

---

## Django Shell

```bash
docker exec -it joyfund_web_1 python manage.py shell
```

---

## Access URLs

| Service    | URL                                    | Notes                        |
|------------|----------------------------------------|------------------------------|
| Frontend   | https://joy-fund.com                   |                              |
| API        | https://api.joy-fund.com               |                              |
| Swagger    | https://api.joy-fund.com/swagger/      | API documentation            |
| Admin      | https://api.joy-fund.com/admin/        | Django admin panel           |
| NPM        | http://75.119.133.208:81               | Nginx Proxy Manager UI       |
| Grafana    | https://grafana.joy-fund.com           | Metrics dashboard            |
| Prometheus | https://prometheus.joy-fund.com        | Metrics collection           |
| Netdata    | https://netdata.joy-fund.com           | Server monitoring            |
| pgAdmin    | https://pgadmin.joy-fund.com           | Database UI (Cameroon IPs only) |

---

## NPM Proxy Host Configuration

Each subdomain must be configured in NPM (http://75.119.133.208:81):

| Domain                      | Forward Hostname     | Port  | Websockets |
|-----------------------------|----------------------|-------|------------|
| joy-fund.com                | joyfund_frontend     | 3000  | ON         |
| www.joy-fund.com            | joyfund_frontend     | 3000  | ON         |
| api.joy-fund.com            | joyfund_web_1        | 8000  | ON         |
| grafana.joy-fund.com        | joyfund_grafana      | 3001  | OFF        |
| prometheus.joy-fund.com     | joyfund_prometheus   | 9090  | OFF        |
| netdata.joy-fund.com        | joyfund_netdata      | 19999 | OFF        |
| pgadmin.joy-fund.com        | joyfund_pgadmin      | 80    | OFF        |

For each proxy host:
1. Add it in NPM → Proxy Hosts → Add Proxy Host
2. Save without SSL first
3. Edit again → SSL tab → Request Let's Encrypt certificate
4. Enable Force SSL after certificate is issued

---

## DNS Records (Hostinger)

All A records point to VPS IP `75.119.133.208`:

```
Type   Name          Value
A      @             75.119.133.208
A      www           75.119.133.208
A      api           75.119.133.208
A      grafana       75.119.133.208
A      prometheus    75.119.133.208
A      netdata       75.119.133.208
A      pgadmin       75.119.133.208
```

**Important:** Delete all AAAA (IPv6) records — they cause Let's Encrypt certificate
failures because the VPS is not configured for IPv6.

---

## Environment Variables

All variables go in `./envs/prod/.env`:

```env
# ── Django ────────────────────────────────────────────────────────────────────
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=*
CORS_ALLOWED_ORIGINS=https://joy-fund.com,https://www.joy-fund.com,https://api.joy-fund.com
CSRF_TRUSTED_ORIGINS=https://joy-fund.com,https://www.joy-fund.com,https://api.joy-fund.com
FRONTEND_URL=https://joy-fund.com

# ── Database (self-hosted PostgreSQL) ─────────────────────────────────────────
DATABASE_URL=postgresql://joyfund:yourpassword@postgres:5432/joyfund
DB_NAME=joyfund
DB_USER=joyfund
DB_PASSWORD=yourpassword

# ── Redis ─────────────────────────────────────────────────────────────────────
CACHE_LOCATION=redis://redis:6379/2
CHANNEL_LAYER_HOST=redis://redis:6379/0
REDIS_HOST=redis

# ── RabbitMQ ──────────────────────────────────────────────────────────────────
RABBITMQ_DEFAULT_USER=ivantom
RABBITMQ_DEFAULT_PASS=yourpassword
CELERY_BROKER_URL=amqp://ivantom:yourpassword@rabbitmq:5672//
CELERY_RESULT_BACKEND=redis://redis:6379/1

# ── OAuth ─────────────────────────────────────────────────────────────────────
DJANGO_OAUTH_CLIENT_ID=your_client_id
DJANGO_OAUTH_CLIENT_SECRET=your_client_secret

# ── Email ─────────────────────────────────────────────────────────────────────
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=joyfund.notifications@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@joy-fund.com

# ── Backblaze B2 ──────────────────────────────────────────────────────────────
B2_ACCESS_KEY_ID=your_key_id
B2_SECRET_ACCESS_KEY=your_secret_key
B2_STORAGE_BUCKET_NAME=joyfund-backups
B2_S3_REGION_NAME=us-west-004

# ── Monitoring ────────────────────────────────────────────────────────────────
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=yourpassword
NETDATA_CLAIM_TOKEN=your_token

# ── pgAdmin ───────────────────────────────────────────────────────────────────
PGADMIN_DEFAULT_EMAIL=admin@joy-fund.com
PGADMIN_DEFAULT_PASSWORD=yourpassword
```

---

## Useful Docker Commands

```bash
# Check container resource usage
docker stats

# Check disk usage
df -h
docker system df

# Clean up unused images (safe to run anytime)
docker image prune -f

# Clean up everything unused (be careful)
docker system prune -f

# Enter a running container
docker exec -it joyfund_web_1 sh

# Check container health
docker inspect joyfund_rabbitmq | grep -A 10 '"Health"'

# Watch container status
watch -n 2 'docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"'
```

---

## Monitoring

### Grafana
- URL: https://grafana.joy-fund.com
- Default login: `admin` / set in `GRAFANA_ADMIN_PASSWORD`
- Add Prometheus as data source: `http://joyfund_prometheus:9090`
- Add Loki as data source: `http://joyfund_loki:3100`

### Netdata
- URL: https://netdata.joy-fund.com
- Shows real-time CPU, RAM, disk, network metrics
- Cloud dashboard: https://app.netdata.cloud

---

## Troubleshooting

### Web worker not starting
```bash
docker logs joyfund_web_1 --tail=100
```

### RabbitMQ unhealthy
```bash
# Check logs
docker logs joyfund_rabbitmq --tail=50

# Test manually
docker exec joyfund_rabbitmq rabbitmq-diagnostics ping
```

### Database connection failing
```bash
# Test connection from Django container
docker exec joyfund_web_1 python3 -c "
import psycopg2, os
conn = psycopg2.connect(os.environ['DATABASE_URL'], connect_timeout=10)
print('Connected successfully')
conn.close()
"
```

### 502 Bad Gateway on a subdomain
```bash
# Check if container is on joyfund_network
docker network inspect joyfund_network | grep -A 3 "Name"

# Manually connect if missing
docker network connect joyfund_network CONTAINER_NAME
```

### SSL certificate failing
```bash
# Check NPM logs
docker logs joyfund_npm --tail=50

# Most common cause: AAAA (IPv6) DNS records exist
# Fix: delete all AAAA records in Hostinger DNS
```

---

## GitHub Actions Secrets Required

Add these in GitHub → Repository → Settings → Secrets:

```
HOST      → 75.119.133.208
USER      → root
PASSWORD  → your VPS root password
```

---

## Server Migration & Storage Logic

If you change servers, remember that **Media & Static files** are stored in external Docker volumes to ensure they persist across container updates.

### 1. Storage Architecture
- **`joyfund_static_volume`**: Stores collected CSS, JS, and admin assets.
- **`joyfund_media_volume`**: Stores user-uploaded images and documents.
- These volumes are shared between the `backend` containers (to write) and the `npm` (Nginx Proxy Manager) container (to serve).

### 2. Migration Checklist
When moving to a new VPS:
1. **Recreate Volumes**: You MUST run the `docker volume create` commands from Step 4.
2. **Transfer Data**: If you want to keep existing images, you must back up the contents of `/var/lib/docker/volumes/joyfund_media_volume/_data` and restore them to the same path on the new server.
3. **Environment Toggles**: In your `.env`, ensure `USE_S3=False` if you want to keep using the VPS disk for storage.

---

## Backup

See `BACKUP.md` for complete backup and restore documentation.

---

*Last updated: June 2026 — JoyFund v1.0*
*Maintainer: Ivantom (Ivan Tomdieu Gottfried) — ivan.tomdieu@gmail.com*