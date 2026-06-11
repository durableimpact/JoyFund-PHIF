# Production Troubleshooting Guide

This document addresses common production issues discovered during deployment and how to prevent them.

---

## Issue 1: Invalid HTTP_HOST Header - DisallowedHost Error

### Error Message
```
ERROR django.core.exceptions.DisallowedHost: Invalid HTTP_HOST header: 'joyfund_web_2:8000'. The domain name provided is not valid according to RFC 1034/1035.
```

### Root Cause
When running `prod.yml` in Docker, monitoring systems (Prometheus, health checks) make requests using container hostnames like `joyfund_web_2:8000`. These container names contain underscores, which violate RFC 1034/1035 hostname standards. Even with `ALLOWED_HOSTS = ["*"]`, Django's `get_host()` method validates the hostname format strictly.

### Solution Implemented

#### 1. **Custom Middleware** (`backend/middleware.py`)
Added `FixRemoteAddrMiddleware` that:
- Intercepts requests early in the middleware chain
- Detects container hostnames with underscores
- Rewrites the `HTTP_HOST` header to `localhost:port` format
- Allows monitoring systems and health checks to work without errors

#### 2. **Settings Configuration** (`backend/settings.py`)
```python
# Added to MIDDLEWARE list
MIDDLEWARE = [
    ...,
    "backend.middleware.FixRemoteAddrMiddleware",  # Must be early!
    "django.middleware.common.CommonMiddleware",
    ...,
]

# Added ALLOWED_HOSTS handling for container names
ALLOWED_HOSTS = [
    # Either use ["*"] or add container names explicitly:
    "joyfund_web_1",
    "joyfund_web_2",
    "localhost",
    "127.0.0.1",
    # Your production domain(s)
]
```

### Prevention Checklist
- ✅ Middleware is placed **before** `django.middleware.common.CommonMiddleware`
- ✅ Environment variable `ALLOWED_HOSTS` is set in `envs/prod/.env`
- ✅ Prometheus configuration points to valid hostnames (see below)

### Prometheus Configuration Fix

If you see errors in `docker logs joyfund_prometheus`, update `prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'django'
    # Use container names as they resolve in the Docker network
    # The middleware will rewrite the HOST header if needed
    static_configs:
      - targets: ['joyfund_web_1:8000', 'joyfund_web_2:8000']
    metrics_path: '/metrics'
```

---

## Issue 2: Docker Compose --remove-orphans Stopping Unexpected Containers

### Error Behavior
```bash
docker compose up --remove-orphans
# Removes: joyfund_postgres, joyfund_redis, joyfund_web_1, joyfund_web_2, etc.
```

### Root Cause
The `--remove-orphans` flag removes **any container** not defined in the current compose file. When running `prod.yml`, containers from other compose files (like those started separately or by different services) get deleted.

### Solution Applied
- ✅ Removed `--remove-orphans` from `.github/workflows/backend-deploy.yml`
- ✅ Removed `--remove-orphans` from `.github/workflows/frontend-deploy.yml`

### Updated Commands
```bash
# Old (DANGEROUS)
docker compose -f prod.yml up --build --remove-orphans -d

# New (SAFE)
docker compose -f prod.yml up --build -d
```

### Prevention Checklist
- ✅ Never use `--remove-orphans` with multiple compose files
- ✅ Use `docker compose down` instead if you need to clean up
- ✅ Use `docker image prune -f` to remove unused images (already in workflows)

---

## Issue 3: Campaign List Serializer Missing Fields

### Requirement
Return campaign list with: `[title, description, cover_image, goal, progress_percentage, total_net_raised, slug, id, total_number_of_successfull_donations]`

### Solution
The `CampaignListSerializer` in `campaigns/serializers/campaign.py` already includes all required fields:

```python
class CampaignListSerializer(serializers.ModelSerializer):
    total_net_raised = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()
    total_number_of_successfull_donations = serializers.SerializerMethodField()
    goal = serializers.DecimalField(
        source="goal_amount", max_digits=12, decimal_places=2, read_only=True
    )

    class Meta:
        model = Campaign
        fields = [
            "id",
            "title",
            "description",
            "cover_image",
            "goal",
            "slug",
            "total_net_raised",
            "progress_percentage",
            "total_number_of_successfull_donations",
        ]
```

### Usage in Views
The `CampaignViewSet.list()` method automatically applies annotations for optimal performance:

```python
def list(self, request, *args, **kwargs):
    queryset = self.filter_queryset(self.get_queryset()).annotate(
        total_net_raised_calc=Coalesce(
            Sum("donations__net_amount", filter=Q(donations__status="SUCCESS")),
            Value(0, ...),
        ),
        total_number_of_successfull_donations_calc=Coalesce(
            Count("donations", filter=Q(donations__status="SUCCESS")),
            Value(0),
        ),
    )
    # Returns CampaignListSerializer with all fields populated
```

### Response Example
```json
{
  "count": 42,
  "next": "http://api.joyfund.cm/api/campaigns/?page=2",
  "previous": null,
  "results": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "title": "Safe Delivery Fund",
      "description": "Help provide maternal healthcare...",
      "cover_image": "https://s3.../campaigns/cover.jpg",
      "goal": "5000.00",
      "slug": "safe-delivery-fund",
      "total_net_raised": "3250.75",
      "progress_percentage": 65.01,
      "total_number_of_successfull_donations": 12
    }
  ]
}
```

---

## General Production Deployment Checklist

### Before Deployment
- [ ] Set `DEBUG=False` in `envs/prod/.env`
- [ ] Set valid `ALLOWED_HOSTS` (domain names)
- [ ] Generate secure `SECRET_KEY`
- [ ] Configure `CELERY_BROKER_URL` (RabbitMQ)
- [ ] Configure `CACHE_URL` (Redis)
- [ ] Configure `DATABASE_URL` (PostgreSQL with SSL if cloud)
- [ ] Set AWS credentials if using S3

### Docker Compose Deployment
```bash
# From backend directory
cd /root/projects/JoyFund/backend

# Pull latest code
git fetch origin main
git reset --hard origin/main

# Start services (NO --remove-orphans!)
docker compose -f prod.yml --env-file ./envs/prod/.env up \
  --build \
  -d

# Verify services
docker compose ps
docker logs joyfund_web_1
docker logs joyfund_celery_1
```

### Post-Deployment Validation
```bash
# Check migrations ran
docker logs joyfund_web_1 | grep "Migrations and static files done"

# Verify API is responding
curl -i https://api.joyfund.cm/api/campaigns/

# Check Prometheus scraping
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[].labels.job'

# Monitor Celery workers
docker logs joyfund_celery_1 | tail -20
```

### Common Issues During Deployment

| Issue | Check | Fix |
|-------|-------|-----|
| Migrations fail | `docker logs joyfund_web_1` | Ensure DATABASE_URL is correct |
| Celery won't connect | `docker logs joyfund_celery_1` | Ensure CELERY_BROKER_URL is correct |
| Prometheus errors | `docker logs joyfund_prometheus` | Check metrics endpoint is accessible |
| SSL certificate errors | Check logs | Use proper domain in nginx-proxy-manager |
| API returns 500 | `docker logs joyfund_web_1` | Check SECRET_KEY, ALLOWED_HOSTS settings |

---

## Environment Variables Reference

Create `envs/prod/.env` with these required variables:

```bash
# Django Settings
DEBUG=False
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=api.joyfund.cm,www.joyfund.cm,localhost

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@joyfund_postgres:5432/joyfund_prod

# Cache & Queue
CACHE_URL=redis://joyfund_redis:6379/1
CELERY_BROKER_URL=amqp://joyfund:joyfund@joyfund_rabbitmq:5672//
CELERY_RESULT_BACKEND=redis://joyfund_redis:6379/2

# AWS S3 (if using)
USE_S3=True
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_STORAGE_BUCKET_NAME=joyfund-media
AWS_S3_REGION_NAME=us-east-1

# Email
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=noreply@joyfund.cm
EMAIL_HOST_PASSWORD=your-app-password

# Payment Gateways
FLUTTERWAVE_SECRET_KEY=your-key
NOTCH_PAY_API_KEY=your-key

# SMS Gateway
SMS_PROVIDER=orange
ORANGE_API_KEY=your-key

# Sentry Error Tracking
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project

# Monitoring
PROMETHEUS_ENABLED=True
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=secure-password
```

---

## Monitoring & Alerting

### Key Metrics to Monitor
1. **API Response Time**: Check in Prometheus under `django_http_request_duration_seconds`
2. **Celery Task Failures**: Monitor `celery_task_failed_total`
3. **Database Connections**: Check pool usage in PostgreSQL
4. **Cache Hit Rate**: Monitor Redis usage via Redis CLI or Grafana
5. **Error Rate**: Track 5xx responses in Prometheus

### Access Monitoring Dashboards
- **Prometheus**: http://prometheus.joyfund.cm (or internal: http://joyfund_prometheus:9090)
- **Grafana**: http://grafana.joyfund.cm (or internal: http://joyfund_grafana:3001)
- **Nginx Proxy Manager**: http://npm.joyfund.cm:81 (for SSL/reverse proxy config)

---

## Rollback Procedure

If deployment fails:

```bash
cd /root/projects/JoyFund/backend

# Stop current containers
docker compose -f prod.yml down

# Revert to previous commit
git reset --hard HEAD~1

# Restart services
docker compose -f prod.yml --env-file ./envs/prod/.env up \
  --build \
  -d

# Verify
docker logs joyfund_web_1
```

---

## Support & Debugging

### Enable Debug Logging
```bash
# Temporarily enable DEBUG for a container
docker exec joyfund_web_1 env DEBUG=True python manage.py shell

# Tail logs in real-time
docker compose logs -f joyfund_web_1 joyfund_celery_1
```

### Database Inspection
```bash
# Connect to PostgreSQL
docker exec -it joyfund_postgres psql -U postgres -d joyfund_prod

# Useful queries
SELECT * FROM campaigns LIMIT 5;
SELECT COUNT(*) FROM donations WHERE status='SUCCESS';
SELECT * FROM django_celery_results_taskresult ORDER BY date_done DESC LIMIT 10;
```

### Clear Caches & Queues (if needed)
```bash
# Flush Redis cache
docker exec joyfund_redis redis-cli FLUSHALL

# Purge Celery queue (WARNING: loses all pending tasks)
docker exec joyfund_celery_1 celery -A backend purge
```

---

**Last Updated:** 2026-06-11  
**Version:** 1.0
