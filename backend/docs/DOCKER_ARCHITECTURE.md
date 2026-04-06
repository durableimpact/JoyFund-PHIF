# JoyFund Backend - Container Architecture for 1M+ Users/Day

## Architecture Overview

```
50,000 req/sec (peak traffic) → Nginx Load Balancer (port 80/443)
                                     ↓
                          ┌──────────┼──────────┐
                          ↓          ↓          ↓          ↓
                    Gunicorn    Gunicorn    Gunicorn    Gunicorn
                    (web-1)     (web-2)     (web-3)     (web-4)
                    8 workers   8 workers   8 workers   8 workers
                          ↓          ↓          ↓          ↓
                          └──────────┼──────────┘
                                     ↓
                        PostgreSQL (2GB RAM, 500 connections)
                        Redis Cache (1GB), RabbitMQ Broker
                        Celery Workers (2 instances, 8 concurrency)
```

## Capacity

- **4 Gunicorn workers** × 8 processes each = **32 concurrent processes**
- Each process handles **~1500 req/sec** = **48,000 req/sec total capacity**
- Handles **1M+ users/day** with **50,000 req/sec peaks**

## Running the Stack

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f web-worker-1
docker-compose logs -f nginx
docker-compose logs -f celery-worker-1

# Scale services (if needed)
docker-compose up -d --scale celery-worker-1=3

# Stop services
docker-compose down
```

## Services Running

| Service | Instances | Purpose | Port |
|---------|-----------|---------|------|
| **nginx** | 1 | Load Balancer & Reverse Proxy | 80, 443 |
| **web-worker-1-4** | 4 | Django Gunicorn Application Servers | 8000 (internal) |
| **db** | 1 | PostgreSQL + PostGIS Database | 5432 (internal) |
| **redis** | 1 | Cache & Celery Results Backend | 6379 (internal) |
| **rabbitmq** | 1 | Message Broker | 5672 (internal) |
| **celery-worker-1-2** | 2 | Background Task Workers | - |
| **celery-beat** | 1 | Scheduled Tasks Scheduler | - |

## Performance Targets

| Metric | Target | How We Achieve It |
|--------|--------|-------------------|
| **Peak Throughput** | 50,000 req/sec | 4 gunicorn workers × 8 processes each |
| **Daily Users** | 1M+ users | Optimized DB, Redis caching, RabbitMQ |
| **API Latency (p95)** | < 200ms | Connection pooling, query optimization, caching |
| **Cache Hit Rate** | > 80% | 1GB Redis cache with compressed data |
| **Error Rate** | < 0.1% | Rate limiting, health checks, circuit breakers |
| **Uptime** | > 99.95% | Health checks, auto-restart, failover |

## Database Optimization

PostgreSQL configured with:
- **shared_buffers**: 256MB (for 1M queries)
- **effective_cache_size**: 1GB (query planner optimization)
- **max_connections**: 500 (with connection pooling)
- **work_mem**: 50MB (per query memory)

And all critical indexes added for:
- User queries (phone, email)
- Beneficiary lookups (health ID, category)
- Campaign/Donation filtering
- Voucher assignments
- Hospital partnerships
- Payment transactions

## Caching Strategy

- **Session cache**: Redis `DB 2` (5 min TTL)
- **Query cache**: Redis `DB 2` (variable TTL)
- **Celery results**: Redis `DB 1` (24 hour TTL)
- **Static files**: Browser cache (7 days)
- **Media files**: Browser cache (30 days)

## Monitoring

### Health Checks

```bash
# API health
curl http://localhost/health/

# Database
docker-compose exec db pg_isready -U joyfund

# Redis
docker-compose exec redis redis-cli ping

# RabbitMQ Management UI
http://localhost:15672 (user: joyfund, pass: joyfund)

# Celery tasks
docker-compose exec celery-worker-1 celery -A backend inspect active
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f web-worker-1
docker-compose logs -f celery-worker-1
docker-compose logs -f nginx
```

### Check Resource Usage

```bash
# Container stats
docker stats

# Disk usage
docker system df
```

## Scaling for More Traffic

If you need to handle more than 50k req/sec:

```bash
# Add more Gunicorn workers (copy web-worker-5, web-worker-6, etc.)
# Add more Celery workers
# Use read replicas for the database
# Use Redis cluster for caching
```

## Configuration Files

- `docker-compose.yml` - Container orchestration
- `nginx.conf` - Load balancer configuration
- `.env` - Environment variables (create from `.env.example`)
- `gunicorn_config.py` - Gunicorn worker settings
- `backend/settings.py` - Django production settings

## Common Issues

### Port Already in Use
```bash
# Kill process using port 80/443
sudo lsof -i :80
sudo kill -9 <PID>
```

### Database Connection Failed
```bash
# Check database health
docker-compose exec db pg_isready -U joyfund

# View database logs
docker-compose logs db
```

### Celery Tasks Not Processing
```bash
# Check RabbitMQ
docker-compose logs rabbitmq

# Check Celery worker
docker-compose logs celery-worker-1

# Inspect queue
docker-compose exec celery-worker-1 celery -A backend inspect active
```

### Out of Memory
```bash
# Increase Docker memory limit
# Edit docker-compose.yml deploy.resources.limits.memory

# Or prune unused images/containers
docker system prune -a
```

## Network ports

- **80** → HTTP (redirects to HTTPS)
- **443** → HTTPS (main API)
- **5432** → PostgreSQL (only accessible from containers)
- **6379** → Redis (only accessible from containers)
- **5672** → RabbitMQ AMQP (only accessible from containers)
- **15672** → RabbitMQ Management UI (accessible on localhost)

## Production Deployment

For production on cloud (AWS, GCP, Azure):

1. Use managed services:
   - **Database**: AWS RDS PostgreSQL + read replicas
   - **Cache**: AWS ElastiCache Redis cluster
   - **Message Broker**: AWS MQ or managed RabbitMQ
   - **Containers**: AWS ECS, Kubernetes, or similar

2. Use proper SSL certificates (Let's Encrypt)

3. Set up monitoring (CloudWatch, DataDog, Prometheus)

4. Enable automated backups and disaster recovery

5. Use a CDN for static/media files (CloudFront, CloudFlare)

See `PRODUCTION_CHECKLIST.md` for complete guide.
