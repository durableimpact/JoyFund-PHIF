# Quick Reference: Production Deployment

## Migrations to Run

```bash
python manage.py migrate  # Applies all new indexes
```

## Environment Variables to Update

```bash
# .env file must have these for production:
SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=api.joyfund.com

# Database
DB_PASSWORD=production-password
DB_HOST=prod-db-host
DB_CONN_MAX_AGE=600

# RabbitMQ (Celery Broker)
CELERY_BROKER_URL=amqp://user:pass@rabbitmq-host:5672//

# Redis (Cache + Results)
CACHE_LOCATION=redis://redis-host:6379/2
CELERY_RESULT_BACKEND=redis://redis-host:6379/1

# Email
EMAIL_HOST_USER=your-email
EMAIL_HOST_PASSWORD=your-password

# Logging
DJANGO_LOG_LEVEL=WARNING  # INFO in staging, WARNING in prod
```

## Installation Checklist

```
[ ] Install django-redis: pip install -r requirements.txt
[ ] Run migrations: python manage.py migrate
[ ] Collect static: python manage.py collectstatic --noinput
[ ] Create superuser: python manage.py createsuperuser
[ ] Test locally: gunicorn backend.wsgi:application
```

## Services to Run

```bash
# Gunicorn (3+ instances for load balancing)
gunicorn --config gunicorn_config.py backend.wsgi:application

# Celery Worker(s)
celery -A backend worker --loglevel=info --concurrency=4

# Celery Beat (only 1 instance)
celery -A backend beat --scheduler django_celery_beat.schedulers:DatabaseScheduler

# Nginx (reverse proxy)
sudo systemctl start nginx

# Redis (cache & results)
redis-server

# RabbitMQ (message broker)
sudo systemctl start rabbitmq-server

# PostgreSQL (database)
sudo systemctl start postgresql
```

## Health Check URLs

```bash
# API alive?
curl https://api.joyfund.com/health/

# Django admin
https://api.joyfund.com/admin/

# RabbitMQ manager
http://rabbitmq-host:15672 (guest:guest)

# Celery flower (task monitoring)
celery -A backend flower --port=5555
http://localhost:5555
```

## Key Files

| File | Purpose |
|------|---------|
| `PRODUCTION_CHECKLIST.md` | Full setup checklist (start here) |
| `DEPLOYMENT_GUIDE.md` | Step-by-step deployment instructions |
| `gunicorn_config.py` | Gunicorn production config |
| `nginx.conf` | Nginx reverse proxy config |
| `celery.service` | Systemd service for Celery worker |
| `celery-beat.service` | Systemd service for Celery scheduler |

## Common Commands

```bash
# Check database indexes were created
psql joyfund -c "\d accounts_user"

# Monitor Celery tasks
celery -A backend inspect active

# View Django logs
tail -f logs/django.log

# Clear Redis cache
redis-cli FLUSHDB

# Restart Django
sudo systemctl restart joyfund

# View system logs
journalctl -u joyfund -f
```

## Performance Targets

| Metric | Target |
|--------|--------|
| API P95 Latency | < 200ms |
| Cache Hit Rate | > 80% |
| Database Connections | < 80% of max |
| Error Rate | < 0.1% |
| Queue Depth | < 1000 messages |

## Scaling Strategy

```
Users | Gunicorn | Celery | DB | Notes
------|----------|--------|-----|--------
1k    | 2 workers| 1 worker| 1x | MVP
10k   | 4 workers| 2 workers| 1x | Stable
100k  | 8 workers| 4 workers| 1x | Add read replicas
1M    | 16+ workers| 8+ workers| Cluster | Full HA
```

## Red Flags 🚨

| Symptom | Cause | Fix |
|---------|-------|-----|
| API timeout (>5s) | DB slow | Add index, check load |
| RabbitMQ queue backlog > 10k | Workers too slow | Add Celery workers |
| Redis memory > 90% | Cache too large | Reduce TTL or clear |
| DB connections maxed | Connection leak | Restart Django |
| 502 Bad Gateway | Gunicorn crash | Check logs, restart |

## Before Going Live

- [ ] Run `python manage.py check --deploy`
- [ ] Load test with 1000+ concurrent users
- [ ] Backup database and test restore
- [ ] Test all OAuth2 flows
- [ ] Verify email sending works
- [ ] Check all Celery tasks run
- [ ] Monitor for memory leaks (first 24h)
- [ ] Have rollback plan ready

## Support Quick Links

- [Django Deployment Checklist](https://docs.djangoproject.com/en/6.0/howto/deployment/checklist/)
- [RabbitMQ Production Checklist](https://www.rabbitmq.com/production-checklist.html)
- [PostgreSQL Performance](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Redis Persistence](https://redis.io/docs/management/persistence/)
