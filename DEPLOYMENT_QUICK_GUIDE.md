# JoyFund Deployment Quick Guide

A quick reference for deploying JoyFund in production after recent fixes.

---

## What Changed?

✅ **Fixed 3 critical production issues:**
1. Frontend CampaignPage refactored to use native React hooks (no more react-query)
2. Docker Compose prod.yml now validates correctly
3. Prometheus no longer gets "DisallowedHost" errors from container hostnames

---

## Pre-Deployment Checklist

- [ ] All code is committed and pushed to `main`
- [ ] `.env` file exists in `envs/prod/` with all required variables
- [ ] Database migrations are up-to-date (`python manage.py migrate`)
- [ ] Nginx Proxy Manager is running and configured
- [ ] SSL certificate is valid

---

## Deployment Command

```bash
#!/bin/bash
cd /root/projects/JoyFund/backend

# Pull latest code
git fetch origin main
git reset --hard origin/main

# Start all services WITHOUT --remove-orphans flag
# (The flag breaks docker-compose when multiple files are used)
docker compose -f prod.yml --env-file ./envs/prod/.env up \
  --build \
  -d

# Verify deployment
docker compose ps
docker logs joyfund_web_1 | head -20
```

---

## Validation Steps

### 1. Check Web Server
```bash
docker logs joyfund_web_1 | grep "Application startup complete"
# Expected: [8] [INFO] Application startup complete.

curl -s https://api.joyfund.cm/api/health/ | jq .
# Expected: {"status": "ok"}
```

### 2. Check Celery Workers
```bash
docker logs joyfund_celery_1 | tail -5
# Expected: No errors, tasks running

docker exec joyfund_celery_1 celery -A backend inspect active_queues
# Expected: List of active queues
```

### 3. Check Database
```bash
docker exec joyfund_postgres psql -U postgres -d joyfund_prod -c "SELECT COUNT(*) FROM campaigns;"
# Expected: Integer > 0
```

### 4. Check Prometheus Metrics
```bash
# Option A: From your browser
# Visit: https://prometheus.joyfund.cm/targets

# Option B: From command line
curl -s http://joyfund_prometheus:9090/api/v1/targets | jq '.data.activeTargets[0].labels'
# Expected: {"job": "django", "instance": "joyfund_web_1:8000"}
```

### 5. Check Logs for DisallowedHost Error
```bash
docker logs joyfund_web_1 | grep -i "disallowedhost"
# Expected: (no output = no errors!)

docker logs joyfund_web_1 | grep -i "metrics"
# Expected: 172.19.0.6:xxxxx - "GET /metrics HTTP/1.1" 200
```

---

## Common Issues & Fixes

### Issue: Can't connect to database
```bash
# Check DATABASE_URL in envs/prod/.env
docker logs joyfund_web_1 | grep -i "database"

# Verify postgres is running
docker compose ps | grep postgres
```

### Issue: Celery tasks not processing
```bash
# Check RabbitMQ connection
docker logs joyfund_celery_1 | grep -i "amqp\|rabbitmq"

# Verify RabbitMQ is healthy
docker compose ps | grep rabbitmq  # Should show "healthy"
```

### Issue: Static files 404
```bash
# Rebuild and copy static files
docker exec joyfund_web_1 python manage.py collectstatic --noinput

# Verify volume
docker inspect joyfund_static_volume | jq '.[0].Mountpoint'
```

### Issue: SSL certificate errors
```bash
# Check nginx-proxy-manager logs
docker logs joyfund_npm | tail -20

# Verify domain is pointing to server
nslookup api.joyfund.cm
dig api.joyfund.cm +short
```

### Issue: API returns 500 errors
```bash
# Check Django logs
docker logs joyfund_web_1 | grep -i "error\|exception" | tail -10

# Check for missing migrations
docker logs joyfund_web_1 | grep -i "migration"

# Run migrations if needed
docker exec joyfund_web_1 python manage.py migrate
```

---

## Monitoring in Production

### Real-time Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f joyfund_web_1
docker compose logs -f joyfund_celery_1
docker compose logs -f joyfund_postgres
```

### Key Dashboards
| Tool | URL | Username | Notes |
|------|-----|----------|-------|
| Prometheus | https://prometheus.joyfund.cm | (none) | Metrics |
| Grafana | https://grafana.joyfund.cm | admin | Dashboards & alerts |
| Nginx PM | https://npm.joyfund.cm:81 | admin | SSL/proxy config |
| pgAdmin | https://pgadmin.joyfund.cm | (configured) | Database admin |

### Useful Commands
```bash
# Check container health
docker compose ps

# View resource usage
docker stats

# Check disk space
df -h /var/lib/docker/volumes

# Monitor database connections
docker exec joyfund_postgres psql -U postgres -d joyfund_prod -c \
  "SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;"

# Check Redis memory
docker exec joyfund_redis redis-cli info memory | grep "used_memory_human"

# Check RabbitMQ queues
docker exec joyfund_rabbitmq rabbitmqctl list_queues name messages
```

---

## Rollback Procedure

If deployment fails and you need to revert:

```bash
cd /root/projects/JoyFund/backend

# Stop everything
docker compose -f prod.yml down

# Revert code
git log --oneline -5        # See recent commits
git reset --hard <COMMIT>   # Go back to known-good commit

# Restart
docker compose -f prod.yml --env-file ./envs/prod/.env up --build -d

# Verify
docker logs joyfund_web_1 | head -20
```

---

## Environment Variables (Production)

Create `envs/prod/.env` with:

```bash
# Core
DEBUG=False
SECRET_KEY=<generate-new-one>
ALLOWED_HOSTS=api.joyfund.cm,www.joyfund.cm,localhost

# Database
DATABASE_URL=postgresql://user:pass@joyfund_postgres:5432/joyfund_prod

# Cache & Queue
CACHE_URL=redis://joyfund_redis:6379/1
CELERY_BROKER_URL=amqp://joyfund:joyfund@joyfund_rabbitmq:5672//
CELERY_RESULT_BACKEND=redis://joyfund_redis:6379/2

# AWS S3 (optional, for media uploads)
USE_S3=True
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
AWS_STORAGE_BUCKET_NAME=joyfund-media
AWS_S3_REGION_NAME=us-east-1

# Email notifications
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=noreply@joyfund.cm
EMAIL_HOST_PASSWORD=<app-password>

# Payment gateways
FLUTTERWAVE_SECRET_KEY=<key>
NOTCH_PAY_API_KEY=<key>

# SMS gateway
SMS_PROVIDER=orange
ORANGE_API_KEY=<key>

# Error tracking (optional)
SENTRY_DSN=https://<key>@sentry.io/project

# Monitoring
PROMETHEUS_ENABLED=True
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=<secure-password>
```

---

## Post-Deployment

1. **Verify API** - Test a few endpoints
   ```bash
   curl -i https://api.joyfund.cm/api/campaigns/
   curl -i https://api.joyfund.cm/api/hospitals/
   ```

2. **Test Payment Webhook** - Create a test donation
3. **Check Celery Tasks** - Verify async tasks are processing
4. **Monitor Errors** - Watch logs for 24 hours post-deployment
5. **Update Documentation** - Note any environment-specific changes

---

## Support & Debugging

### Get Help
- Check `PRODUCTION_TROUBLESHOOTING.md` for detailed guides
- Review `CHANGES_SUMMARY.md` for what was changed
- Run `docker compose logs` to see real-time errors

### Emergency Access
```bash
# SSH into VPS
ssh -i <key> root@<ip>

# Enter Django shell
docker exec -it joyfund_web_1 python manage.py shell

# Query database
docker exec -it joyfund_postgres psql -U postgres -d joyfund_prod
```

---

**Last Updated:** 2026-06-11  
**Version:** 1.0
