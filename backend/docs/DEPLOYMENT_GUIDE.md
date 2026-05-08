# JoyFund Backend - Deployment Guide

## Quick Start (Development)

```bash
# 1. Clone the repository
git clone <repo-url>
cd backend

# 2. Create virtual environment
python -m venv env
source env/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set environment variables
cp .env.example .env
# Edit .env with your settings

# 5. Run migrations
python manage.py migrate

# 6. Create superuser
python manage.py createsuperuser

# 7. Start development server
python manage.py runserver
```

---

## Production Deployment

### Prerequisites
- Linux server (Ubuntu 20.04+ recommended)
- PostgreSQL 14+ with PostGIS
- RabbitMQ 3.10+
- Redis 7.0+
- Nginx
- Python 3.9+

### Step-by-Step Installation

#### 1. **System Setup**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y python3 python3-pip python3-venv git nginx postgresql postgresql-contrib postgresql-14-postgis redis-server rabbitmq-server curl wget

# Create app user
sudo useradd -m -s /bin/bash joyfund
sudo usermod -aG sudo joyfund
```

#### 2. **Clone Application**
```bash
cd /opt
sudo git clone <repo-url> joyfund
sudo chown -R joyfund:joyfund joyfund
cd joyfund/backend
```

#### 3. **Set Up Python Environment**
```bash
python3 -m venv env
source env/bin/activate
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
pip install gunicorn
```

#### 4. **Configure Environment**
```bash
cp .env.example .env
nano .env  # Edit with production values

# Set permissions
chmod 600 .env
```

#### 5. **Database Setup**
```bash
# Create database and PostGIS extension
sudo -u postgres createdb joyfund
sudo -u postgres psql joyfund -c "CREATE EXTENSION postgis;"
sudo -u postgres psql joyfund -c "CREATE EXTENSION postgis_topology;"

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput
```

#### 6. **Test Application**
```bash
# Test Gunicorn
gunicorn --config gunicorn_config.py backend.wsgi:application

# In another terminal, test the app
curl http://localhost:8000/health/
```

#### 7. **Create Systemd Services**

**Django/Gunicorn:**
```bash
sudo cp gunicorn_config.py /app/
sudo tee /etc/systemd/system/joyfund.service > /dev/null <<EOF
[Unit]
Description=JoyFund Django Application
After=network.target postgresql.service redis.service rabbitmq.service
Requires=postgresql.service redis.service rabbitmq.service

[Service]
Type=notify
User=joyfund
Group=joyfund
WorkingDirectory=/opt/joyfund/backend
ExecStart=/opt/joyfund/backend/env/bin/gunicorn --config gunicorn_config.py backend.wsgi:application
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable joyfund
sudo systemctl start joyfund
```

**Celery Worker:**
```bash
sudo cp celery.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable celery
sudo systemctl start celery
```

**Celery Beat:**
```bash
sudo cp celery-beat.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable celery-beat
sudo systemctl start celery-beat
```

#### 8. **Configure Nginx**
```bash
# Copy Nginx config
sudo cp nginx.conf /etc/nginx/sites-available/joyfund
sudo ln -s /etc/nginx/sites-available/joyfund /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

#### 9. **Install SSL Certificate**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly -n --agree-tos -m admin@example.com -d api.joyfund.com

# Enable auto-renewal
sudo systemctl enable certbot.timer
```

#### 10. **Verify Services**
```bash
# Check all services are running
sudo systemctl status joyfund
sudo systemctl status celery
sudo systemctl status celery-beat
sudo systemctl status redis-server
sudo systemctl status rabbitmq-server
sudo systemctl status postgresql
sudo systemctl status nginx

# Check logs
tail -f /var/log/syslog
tail -f /opt/joyfund/backend/logs/django.log
```

---

## Health Checks

### API Health
```bash
curl -H "Authorization: Bearer <token>" https://api.joyfund.com/health/
```

### Database
```bash
psql -U joyfund -d joyfund -c "SELECT 1;"
```

### Redis
```bash
redis-cli ping
# Should return PONG
```

### RabbitMQ
```bash
sudo rabbitmqctl status
```

### Celery
```bash
# Monitor active tasks
celery -A backend inspect active

# Check queue length
celery -A backend inspect reserved
```

---

## Monitoring & Logging

### View Logs
```bash
# Django errors
tail -f /opt/joyfund/backend/logs/django.log

# Celery logs
tail -f /opt/joyfund/backend/logs/celery.log

# Nginx logs
tail -f /var/log/nginx/joyfund_access.log
tail -f /var/log/nginx/joyfund_error.log

# System logs
journalctl -u joyfund -f
journalctl -u celery -f
```

### Monitor Performance
```bash
# CPU/Memory
top -p $(pgrep -f gunicorn)

# Database connections
psql -U joyfund -d joyfund -c "SELECT count(*) FROM pg_stat_activity;"

# Redis info
redis-cli INFO stats

# Open connections
netstat -an | grep ESTABLISHED | wc -l
```

---

## Troubleshooting

### Django not starting
```bash
# Check syntax
python manage.py check

# Check migrations
python manage.py showmigrations

# Run migrations
python manage.py migrate --verbosity=2
```

### RabbitMQ connection refused
```bash
# Check RabbitMQ status
sudo systemctl status rabbitmq-server

# Restart RabbitMQ
sudo systemctl restart rabbitmq-server

# Check RabbitMQ user
sudo rabbitmqctl list_users
```

### Database connection error
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -U joyfund -d joyfund -c "SELECT version();"

# Check logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### High memory usage
```bash
# Reduce Celery concurrency
# Edit .env: CELERY_CONCURRENCY=2

# Reduce Gunicorn workers
# Edit .env: GUNICORN_WORKERS=4
```

---

## Backup & Recovery

### Database Backup
```bash
# Full backup
pg_dump -U joyfund -d joyfund > joyfund_backup_$(date +%Y%m%d_%H%M%S).sql

# Compressed backup
pg_dump -U joyfund -d joyfund | gzip > joyfund_backup_$(date +%Y%m%d_%H%M%S).sql.gz

# To cloud (S3)
pg_dump -U joyfund -d joyfund | gzip | aws s3 cp - s3://joyfund-backups/db/joyfund_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restore Database
```bash
# From SQL file
psql -U joyfund -d joyfund < joyfund_backup_20240318.sql

# From compressed file
gunzip -c joyfund_backup_20240318.sql.gz | psql -U joyfund -d joyfund
```

### Media Files Backup
```bash
# Backup to cloud
aws s3 sync /opt/joyfund/backend/media s3://joyfund-backups/media/
```

---

## Scaling Tips

### Load Distribution
1. **Multiple Gunicorn workers** (already configured)
2. **Load balancer** (Nginx/HAProxy for round-robin)
3. **Database read replicas** for read-heavy queries

### Caching Strategy
- Session data → Redis
- API responses → Redis (5 min TTL)
- Static files → CDN (Cloudflare/AWS CloudFront)

### Celery Scaling
```bash
# Run multiple workers
celery -A backend worker -n worker1@%h
celery -A backend worker -n worker2@%h
celery -A backend worker -n worker3@%h

# Or use supervisor/systemd to manage multiple instances
```

### Database Optimization
```sql
-- Analyze tables
ANALYZE;

-- Vacuum
VACUUM ANALYZE;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan 
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;
```

---

## Security Hardening

### Firewall
```bash
# Allow only necessary ports
sudo ufw enable
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
```

### SSH Hardening
```bash
# Edit /etc/ssh/sshd_config
PermitRootLogin no
PubkeyAuthentication yes
PasswordAuthentication no
X11Forwarding no

# Restart SSH
sudo systemctl restart sshd
```

### Database Security
```bash
# Restrict PostgreSQL access
# Edit /etc/postgresql/14/main/pg_hba.conf
# host    all             all             127.0.0.1/32            md5
# host    all             all             ::1/128                 md5
```

---

## Maintenance Schedule

| Task | Frequency | Command |
|------|-----------|---------|
| Database VACUUM | Weekly | `psql -U joyfund -d joyfund -c "VACUUM ANALYZE;"` |
| Database backup | Daily | `0 2 * * * /path/to/backup_script.sh` |
| Log rotation | Daily | (Configured in Django settings) |
| Security updates | Weekly | `sudo apt update && sudo apt upgrade` |
| SSL renewal | 60 days before expiry | `sudo certbot renew` |

---

## Support

- **Documentation**: [Django Docs](https://docs.djangoproject.com/)
- **RabbitMQ**: [Management UI](http://localhost:15672) (user: guest, password: guest)
- **PostgreSQL**: [PostGIS Docs](https://postgis.net/docs/)
- **Redis**: `redis-cli` command line tool
