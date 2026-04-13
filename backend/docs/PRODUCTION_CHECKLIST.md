# Production Deployment Checklist for JoyFund Backend

> **Current Status**: Development environment  
> **Target**: Scale to 1M+ users/day  
> **Last Updated**: March 18, 2026

---

## ✅ Completed in Development

- [x] **Database Indexes** - Added indexes on critical fields for fast lookups
- [x] **Redis Caching** - Configured for session and query-result caching
- [x] **RabbitMQ Broker** - Switched from Redis to RabbitMQ for reliable job distribution
- [x] **API Pagination** - Configured limit/offset pagination (20 items per page)
- [x] **Rate Limiting** - Enabled throttling (100/hour anon, 1000/hour user)
- [x] **Connection Pooling** - Database connection pooling enabled
- [x] **Logging Infrastructure** - Structured logging with file rotation
- [x] **Session Caching** - Sessions stored in Redis for speed
- [x] **Security Hardening** - HTTPS/CSRF/XSS protections configured

---

## 🚀 Pre-Production Tasks (Do These First!)

### **1. Secrets & Environment Variables**
- [ ] **Generate strong SECRET_KEY**
  ```bash
  python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
  ```
- [ ] **Set DEBUG=False** in production
- [ ] **Update ALLOWED_HOSTS** with your production domain
- [ ] **Store all secrets in:** `.env`, AWS Secrets Manager, or similar
  - `SECRET_KEY`
  - `DB_PASSWORD`
  - `RABBITMQ` credentials
  - Email credentials
  - OAuth credentials (Google)
  
### **2. Database Setup**
- [ ] **Create PostgreSQL database** in production (AWS RDS/Azure Database/DigitalOcean)
  - Use PostgreSQL 14+ with PostGIS extension enabled
  - Enable automated backups (daily, 30-day retention)
  - Enable encryption at rest
  - Set up read replicas for scaling reads
  
- [ ] **Run migrations** on production database
  ```bash
  python manage.py migrate
  ```
  
- [ ] **Create superuser** for admin access
  ```bash
  python manage.py createsuperuser
  ```
  
- [ ] **Collect static files**
  ```bash
  python manage.py collectstatic --noinput
  ```

### **3. HTTP Server Setup (Gunicorn/ASGI)**
- [ ] **Install Gunicorn**
  ```bash
  pip install gunicorn
  ```
  
- [ ] **Configure Gunicorn** (create `gunicorn_config.py`)
  ```python
  import multiprocessing
  workers = multiprocessing.cpu_count() * 2 + 1
  worker_class = 'sync'  # or 'gevent' for async
  worker_connections = 1000
  max_requests = 1000
  max_requests_jitter = 50
  timeout = 30
  ```
  
- [ ] **Test Gunicorn startup**
  ```bash
  gunicorn --config gunicorn_config.py backend.wsgi:application
  ```

### **4. Reverse Proxy (Nginx/HAProxy)**
- [ ] **Install Nginx**
  ```bash
  sudo apt-get install nginx
  ```
  
- [ ] **Configure Nginx** (`/etc/nginx/sites-available/joyfund`)
  ```nginx
  upstream django {
      server localhost:8000;
      server localhost:8001;
      server localhost:8002;
  }
  
  server {
      listen 443 ssl http2;
      server_name api.joyfund.com;
      
      ssl_certificate /etc/letsencrypt/live/api.joyfund.com/fullchain.pem;
      ssl_certificate_key /etc/letsencrypt/live/api.joyfund.com/privkey.pem;
      
      ssl_ciphers HIGH:!aNULL:!MD5;
      ssl_prefer_server_ciphers on;
      
      location / {
          proxy_pass http://django;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;
      }
      
      location /static/ {
          alias /app/static/;
          expires 30d;
      }
      
      location /media/ {
          alias /app/media/;
      }
  }
  
  server {
      listen 80;
      server_name api.joyfund.com;
      return 301 https://$server_name$request_uri;
  }
  ```

### **5. Load Balancing**
- [ ] **Set up multiple Gunicorn workers** (at least 3-5)
- [ ] **Configure health checks** in load balancer
- [ ] **Enable sticky sessions** if auth requires it
- [ ] **Monitor backend health** with prometheus/datadog

### **6. SSL/TLS Certificates**
- [ ] **Obtain SSL certificate** from Let's Encrypt or AWS ACM
  ```bash
  sudo certbot certonly -n --agree-tos -m admin@joyfund.com -d api.joyfund.com
  ```
  
- [ ] **Enable automatic renewal** (cron job)
  ```bash
  0 3 * * * certbot renew --quiet
  ```

### **7. Database Backup & Recovery**
- [ ] **Set up automated backups** (daily at 2 AM UTC)
- [ ] **Test recovery** from backup regularly
- [ ] **Store backups** in S3/Azure Blob with encryption
- [ ] **Create disaster recovery plan** with RTO/RPO targets

### **8. Celery/RabbitMQ Production Setup**
- [ ] **Running RabbitMQ** in HA cluster (3+ nodes)
- [ ] **Celery worker** systemd service
  ```ini
  [Unit]
  Description=Celery Service
  After=network.target
  
  [Service]
  Type=forking
  User=www-data
  Group=www-data
  WorkingDirectory=/app
  ExecStart=/app/env/bin/celery -A backend worker --loglevel=info --concurrency=4
  Restart=always
  
  [Install]
  WantedBy=multi-user.target
  ```
  
- [ ] **Celery beat** for scheduled tasks
  ```bash
  celery -A backend beat --loglevel=info --scheduler django_celery_beat.schedulers:DatabaseScheduler
  ```
  
- [ ] **Monitor Celery** with Flower
  ```bash
  pip install flower
  celery -A backend flower
  ```

### **9. Redis Production Setup**
- [ ] **Redis cluster** with Sentinel for HA
- [ ] **Redis persistence** (RDB + AOF)
- [ ] **Memory policies** configured
  ```
  maxmemory 2gb
  maxmemory-policy allkeys-lru
  ```
  
- [ ] **Redis auth** enabled with strong password

### **10. Email Configuration**
- [ ] **Configure SMTP** (SendGrid, AWS SES, etc.)
  - `EMAIL_HOST`
  - `EMAIL_PORT`
  - `EMAIL_HOST_USER`
  - `EMAIL_HOST_PASSWORD`
  
- [ ] **Test email sending**
  ```bash
  python manage.py shell
  >>> from django.core.mail import send_mail
  >>> send_mail('test', 'test', 'noreply@joyfund.com', ['admin@joyfund.com'])
  ```

### **11. Monitoring & Alerting**
- [ ] **Install monitoring stack** (Prometheus + Grafana / DataDog)
  - CPU, Memory, Disk usage
  - Database query performance
  - API response times
  - Error rates
  - Celery queue depth
  
- [ ] **Set up alerts** for:
  - CPU > 80%
  - Memory > 90%
  - Database connections > 80%
  - API error rate > 1%
  - Queue depth > 1000
  
- [ ] **Configure logging aggregation** (ELK Stack / CloudWatch)

### **12. Security Hardening**
- [ ] **Enable HTTPS only** (HSTS header)
  ```python
  SECURE_HSTS_SECONDS = 31536000
  SECURE_HSTS_INCLUDE_SUBDOMAINS = True
  SECURE_HSTS_PRELOAD = True
  ```
  
- [ ] **Set security headers**
  ```python
  SECURE_CONTENT_SECURITY_POLICY = {
      'default-src': ("'self'",),
  }
  ```
  
- [ ] **Configure CORS properly** (restrict to your domain)
  ```python
  CORS_ALLOWED_ORIGINS = [
      "https://joyfund.com",
      "https://www.joyfund.com",
  ]
  ```
  
- [ ] **Keep dependencies updated** (security patches)
  ```bash
  pip list --outdated
  ```
  
- [ ] **Enable DDoS protection** (AWS Shield, Cloudflare)

### **13. Testing Before Go-Live**
- [ ] **Load testing** (simulate 1M users/day)
  ```bash
  pip install locust
  locust -f locustfile.py --users 10000 --spawn-rate 100
  ```
  
- [ ] **Stress testing** database & cache
- [ ] **Failover testing** (kill a server, ensure system stays up)
- [ ] **Backup recovery test** (restore from backup, verify data)
- [ ] **Security audit** (OWASP Top 10)
- [ ] **API contract testing** with frontend
- [ ] **End-to-end production flow testing**

### **14. CI/CD Pipeline**
- [ ] **Set up GitHub Actions / GitLab CI**
  - Run tests on every PR
  - Code quality checks (flake8, black)
  - Security scanning (bandit, Safety)
  - Build Docker image
  - Push to registry
  
- [ ] **Deploy to staging** first
- [ ] **Auto-deploy to production** on main branch

### **15. Documentation & Runbooks**
- [ ] **Create deployment runbook**
- [ ] **Document database schema** and relationships
- [ ] **Create incident response guide**
- [ ] **Document scaling procedures**
- [ ] **Create troubleshooting guide**

---

## 📊 Performance Targets

At scale (1M users/day ≈ 12-15 req/sec peak):

| Metric | Target | Current |
|--------|--------|---------|
| API Latency (p95) | < 200ms | ⏳ |
| Cache Hit Rate | > 80% | ⏳ |
| Database Connections | < 80% | ⏳ |
| Error Rate | < 0.1% | ⏳ |
| Uptime | > 99.95% | ⏳ |

---

## 🔍 Monitoring Queries

### PostgreSQL Health
```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Slow queries
SELECT query, calls, total_time FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;

-- Index usage
SELECT schemaname, tablename, indexname, idx_scan FROM pg_stat_user_indexes ORDER BY idx_scan DESC;
```

### Redis Health
```bash
redis-cli INFO stats
redis-cli INFO memory
redis-cli DBSIZE
```

### RabbitMQ Health
```bash
rabbitmqctl status
rabbitmqctl list_queues name messages consumers
```

---

## 🚨 Post-Deployment (Week 1)

- [ ] Monitor error logs and fix any issues
- [ ] Watch database performance metrics
- [ ] Monitor API latency and throughput
- [ ] Check backup integrity
- [ ] Verify alert notifications work
- [ ] Do a full disaster recovery drill

---

## 🛠️ Maintenance Schedule

| Task | Frequency | Owner |
|------|-----------|-------|
| Database backups | Daily | DevOps |
| Update dependencies | Weekly | Dev Lead |
| Security patches | As needed | DevOps |
| Database maintenance (VACUUM, ANALYZE) | Weekly | DevOps |
| Log rotation | Daily | DevOps |
| Certificate renewal | 60 days before expiry | DevOps |

---

## 📝 Notes

- Scale horizontally by adding more Gunicorn workers and Celery workers
- Use database read replicas for read-heavy queries
- Consider caching frequently-accessed data (campaigns, hospitals)
- Monitor Celery queue depth and scale workers as needed
- Keep RabbitMQ and Redis in separate infrastructure
- Use managed services (AWS RDS, ElastiCache) for easier scaling

---

**Questions? Check the logs first! 🔍**
