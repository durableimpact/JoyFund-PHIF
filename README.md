# JoyFund-PHIF

> **Platform for Healthcare Impact Funding** — A solidarity-driven healthcare crowdfunding system built by [Durable Impact](https://durableimpact.org), digitising the spirit of communal giving to save lives and support those in need.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Services & Access](#services--access)
- [Monitoring](#monitoring)
- [Useful Commands](#useful-commands)
- [Contributing](#contributing)

---

## Overview

JoyFund-PHIF is a healthcare donation and voucher management platform that empowers individuals, organisations, and communities to fund medical care for the poor and vulnerable. It digitalises the traditional Cameroonian *Njangi* solidarity culture, enabling transparent, accountable, and impactful healthcare contributions.

**Core capabilities:**

- Healthcare crowdfunding campaigns with real-time fund tracking
- Voucher lifecycle management for hospital-redeemable medical credits
- Multi-portal access for Donors, Contributors, Social Workers, Hospitals, and Administrators
- Integrated mobile money payments via MTN MoMo and Orange Money through Notch Pay
- Full audit trail with structured activity, request, and error logging

---

## Architecture

JoyFund runs as a set of isolated Docker services grouped into three independent compose stacks, all communicating over a shared external Docker network.

```
Internet
    │
    ▼
Nginx Proxy Manager  (SSL termination, reverse proxy)
    │
    ├── joyfund.cm           ──▶  Next.js Frontend      :3000
    ├── api.joyfund.cm       ──▶  Django API Workers     :8000
    ├── grafana.joyfund.cm   ──▶  Grafana Dashboard      :3001
    ├── prometheus.joyfund.cm──▶  Prometheus Metrics     :9090
    └── netdata.joyfund.cm   ──▶  Netdata Server Monitor :19999

Internal Backend Network (never exposed to internet)
    ├── Redis          (cache + Celery broker)
    ├── RabbitMQ       (message broker)
    ├── Celery Workers (async task processing)
    ├── Celery Beat    (scheduled tasks)
    ├── Loki           (log aggregation)
    └── Promtail       (log collection)

External Services
    └── Neon           (managed PostgreSQL database)
```

**Stack:**

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router) |
| Backend API | Django REST Framework + Gunicorn |
| Database | Neon (serverless PostgreSQL) |
| Cache | Redis |
| Task Queue | Celery + RabbitMQ |
| Reverse Proxy | Nginx Proxy Manager |
| Metrics | Prometheus + Grafana |
| Logs | Loki + Promtail + Grafana |
| Server Monitoring | Netdata |

---

## Prerequisites

Ensure the following are installed on your VPS before deploying:

- Docker `>= 24.0`
- Docker Compose `>= 2.20`
- A domain name with DNS A records pointing to your VPS IP
- Open ports: `80`, `81`, `443` on your firewall

---

## Project Structure

```
joyfund/
├── docker-compose.yml			# Nginx Proxy Manager + Netdata
│
├── frontend/                   # Next.js application
│   ├── docker-compose.yml
│   ├── Dockerfile
│   └── .env
│
└── backend/                    # Django API + all backend services
    ├── docker-compose.yml
    ├── Dockerfile
    ├── prometheus.yml          # Prometheus scrape config
    ├── promtail.yml            # Promtail log collection config
    ├── gunicorn_config.py
    └── envs/
        └── prod/
            └── .env
```

---

## Environment Variables

### `frontend/.env`
```bash
NEXT_PUBLIC_API_URL=https://api.joyfund.cm
```

### `backend/envs/prod/.env`
```bash
# Django
SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=api.joyfund.cm
DJANGO_SETTINGS_MODULE=joyfund.settings.production

# Database (Neon)
DATABASE_URL=postgresql://user:password@ep-xxx-pooler.eu-central-1.aws.neon.tech/joyfund?sslmode=require

# Redis
REDIS_URL=redis://joyfund_redis:6379/0

# RabbitMQ
RABBITMQ_DEFAULT_USER=joyfund
RABBITMQ_DEFAULT_PASS=your-rabbitmq-password
CELERY_BROKER_URL=amqp://joyfund:your-rabbitmq-password@joyfund_rabbitmq:5672/

# Payments
NOTCHPAY_PUBLIC_KEY=your-notchpay-public-key
NOTCHPAY_SECRET_KEY=your-notchpay-secret-key

# Monitoring
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=your-grafana-password

# Sentry
SENTRY_DSN=https://your-dsn@sentry.io/...
```

> Never commit `.env` files to version control. Use `.env.example` files as templates.

---

## Deployment

### 1. Create the shared Docker network
This is a one-time step. The network persists across all compose stacks.

```bash
docker network create joyfund_network
```

### 2. Deploy Nginx Proxy Manager + Netdata

```bash
cd npm/
docker compose up -d
```

Open the NPM admin UI at `http://your-vps-ip:81` and log in with the default credentials:

```
Email:    admin@example.com
Password: changeme
```

> Change these immediately after first login.

### 3. Deploy the Backend

```bash
cd backend/
docker compose up -d
```

Run database migrations against Neon on first deploy:

```bash
docker exec joyfund_web_1 python manage.py migrate
docker exec joyfund_web_1 python manage.py collectstatic --no-input
```

### 4. Deploy the Frontend

```bash
cd frontend/
docker compose up -d
```

### 5. Configure Proxy Hosts in NPM

In the NPM UI (`http://your-vps-ip:81`), add the following proxy hosts under **Hosts → Proxy Hosts**. Enable **Force SSL** and **Request a new SSL certificate** for each:

| Domain | Forward Hostname | Port |
|---|---|---|
| `joyfund.cm` | `joyfund_frontend` | `3000` |
| `api.joyfund.cm` | `joyfund_web_1` | `8000` |
| `grafana.joyfund.cm` | `joyfund_grafana` | `3001` |
| `prometheus.joyfund.cm` | `joyfund_prometheus` | `9090` |
| `netdata.joyfund.cm` | `joyfund_netdata` | `19999` |

### 6. Configure Grafana Data Sources

Open `https://grafana.joyfund.cm` and add two data sources:

**Prometheus:**
```
Connections → Data Sources → Add → Prometheus
URL: http://joyfund_prometheus:9090
```

**Loki:**
```
Connections → Data Sources → Add → Loki
URL: http://joyfund_loki:3100
```

Then import the Django dashboard via **Dashboards → Import → ID: `9528`**.

### 7. Verify Everything is Running

```bash
docker ps
```

All containers should show status `Up` with a healthy indicator where applicable.

---

## Services & Access

| Service | URL | Notes |
|---|---|---|
| Frontend | `https://joyfund.cm` | Public facing app |
| Backend API | `https://api.joyfund.cm` | DRF API |
| Django Admin | `https://api.joyfund.cm/admin` | Superuser only |
| Grafana | `https://grafana.joyfund.cm` | Metrics + logs dashboard |
| Prometheus | `https://prometheus.joyfund.cm` | Raw metrics (restrict access) |
| Netdata | `https://netdata.joyfund.cm` | Real-time server monitoring |
| NPM Admin | `http://your-vps-ip:81` | Proxy + SSL management |

---

## Monitoring

JoyFund uses a three-layer monitoring approach:

**Infrastructure** — Netdata tracks real-time CPU, RAM, disk, network, and per-container stats across the entire VPS.

**Application Metrics** — Prometheus scrapes Django's `/metrics` endpoint (via `django-prometheus`) every 15 seconds. Grafana visualises request rates, error rates, response times, DB query durations, and cache hit ratios.

**Log Aggregation** — Promtail collects logs from all Docker containers and ships them to Loki. Grafana's Loki data source lets you query logs in real time:

```
# All Django errors
{app="joyfund_django"} |= "ERROR"

# Payment-related events
{app="joyfund_django"} |= "payment"

# Celery task failures
{app="joyfund_celery"} |= "FAILURE"
```

**Error Tracking** — Sentry captures every unhandled exception with full stack traces, request context, and instant alerts.

---

## Useful Commands

```bash
# View logs for a specific service
docker compose logs -f web-worker-1
docker compose logs -f celery-worker-1

# Restart a single service
docker compose restart web-worker-1

# Run Django management commands
docker exec joyfund_web_1 python manage.py migrate
docker exec joyfund_web_1 python manage.py createsuperuser
docker exec joyfund_web_1 python manage.py collectstatic --no-input

# Check resource usage per container
docker stats

# Rebuild and restart after code changes
docker compose up -d --build web-worker-1 web-worker-2

# Stop all services in a stack
docker compose down

# Stop all services and remove volumes (destructive)
docker compose down -v
```

---

## Contributing

JoyFund is developed and maintained by [Durable Impact](https://durableimpact.org). For internal contributors:

1. Never push directly to `main` — open a pull request
2. All environment variables go in `.env` files, never hardcoded
3. Run migrations in staging before production
4. Tag releases using semantic versioning: `v1.0.0`

---

<p align="center">
  Built with ❤️ by <strong>Durable Impact</strong> — saving lives through technology
</p>