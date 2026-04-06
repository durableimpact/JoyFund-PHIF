# Local Development Setup

## Running Django Locally (Outside Docker)

When you run Django locally using `python manage.py runserver` instead of Docker Compose, you need to ensure Celery workers are running to process background tasks.

### Prerequisites

1. **Docker Compose services must be running** for Redis and RabbitMQ:
   ```bash
   docker-compose up -d redis rabbitmq db
   ```

2. **Celery worker must be running locally**:
   ```bash
   # In a separate terminal
   celery -A backend worker --loglevel=info --concurrency=2
   ```

3. **(Optional) Celery Beat for scheduled tasks**:
   ```bash
   # In another separate terminal
   celery -A backend beat --loglevel=info --scheduler django_celery_beat.schedulers:DatabaseScheduler
   ```

### Configuration

The `settings.py` file is configured to use `localhost` by default for Celery/Redis connections when running outside Docker:

- **Celery Broker**: `amqp://joyfund:joyfund@localhost:5672//`
- **Redis Backend**: `redis://localhost:6379/1`
- **Cache**: `redis://localhost:6379/2`

When running inside Docker, these are overridden via environment variables to use Docker service names (`rabbitmq`, `redis`).

### Common Issues

#### Issue: RuntimeError - Retry limit exceeded while trying to reconnect to Celery

**Cause**: Celery worker is not running or cannot connect to Redis/RabbitMQ.

**Solution**:
1. Ensure Redis and RabbitMQ are running:
   ```bash
   docker ps | grep -E "redis|rabbitmq"
   ```

2. Start a local Celery worker:
   ```bash
   celery -A backend worker --loglevel=info --concurrency=2
   ```

3. Verify connection:
   ```bash
   python -c "import redis; r = redis.Redis(host='localhost', port=6379, db=1); print(r.ping())"
   ```

### Quick Start Script

Create a script `start_dev.sh`:

```bash
#!/bin/bash
# Start Docker services
docker-compose up -d redis rabbitmq db

# Wait for services to be ready
sleep 5

# Start Celery worker in background
celery -A backend worker --loglevel=info --concurrency=2 &

# Start Django development server
python manage.py runserver
```

### Stopping Services

```bash
# Stop Celery worker
pkill -f "celery.*worker"

# Stop Docker services
docker-compose down
```

## Production Docker Setup

For production, use the full Docker Compose setup:

```bash
docker-compose up -d
```

This starts all services including multiple Django workers, Celery workers, and Nginx load balancer.
