# Load Testing Guide for JoyFund

## Step 1: Start Docker Services

```bash
cd /home/ivantom/Desktop/Code/Projects/durable\ Impact/JoyFund-PHIF/backend
docker-compose up -d
```

Wait for services to be healthy (2-3 minutes):
```bash
docker-compose ps
```

## Step 2: Install Locust (if not already installed)

```bash
# Activate your Python environment
source env/bin/activate

# Install locust
pip install locust
```

## Step 3: Run Load Tests

### Test 1: Realistic User Load (Warm-up)
```bash
locust -f locustfile.py \
  --host=http://localhost \
  --users=100 \
  --spawn-rate=10 \
  --run-time=2m
```
- This simulates 100 concurrent users
- Ramps up at 10 users/second
- Runs for 2 minutes
- Tests realistic usage patterns

### Test 2: Stress Test (Peak Capacity)
```bash
locust -f locustfile.py \
  --host=http://localhost \
  --users=5000 \
  --spawn-rate=500 \
  --run-time=3m
```
- Simulates 5,000 concurrent users
- Aggressive ramp-up (500 users/sec)
- Runs for 3 minutes
- Stresses the system

### Test 3: Burst Load (50k req/sec target)
```bash
locust -f locustfile.py::QuickLoadUser \
  --host=http://localhost \
  --users=10000 \
  --spawn-rate=1000 \
  --run-time=2m
```
- Simulates 10,000 users with minimal thinking time
- Aggressive ramp-up (1,000 users/sec)
- Can generate 50,000+ req/sec depending on endpoint

## Step 4: Monitor System While Testing

### In separate terminal, watch Docker resource usage:
```bash
docker stats --no-stream
```

Expected output:
```
CONTAINER          CPU %    MEM USAGE   MEM %
joyfund-db-1       15%      850MB       42%
joyfund-redis-1    8%       512MB       51%
web-worker-1       25%      250MB       50%
web-worker-2       25%      250MB       50%
web-worker-3       25%      250MB       50%
web-worker-4       25%      250MB       50%
nginx-1            5%       30MB        3%
```

### Monitor database connections:
```bash
docker-compose exec db psql -U joyfund -d joyfund -c \
  "SELECT count(*) as active_connections FROM pg_stat_activity;"
```

Expected: Should stay under 500 (your pool limit)

### Monitor Redis memory:
```bash
docker-compose exec redis redis-cli INFO memory
```

Expected: Used memory should stay under 1GB

### Monitor RabbitMQ:
```bash
# Visit RabbitMQ management UI
open http://localhost:15672
# Login: guest/guest
# Check Connections, Channels, Memory usage
```

## Step 5: Analyze Results

Locust will show:
- **Requests/sec**: Total throughput
- **Response times**: p50, p95, p99 latencies
- **Failures**: Any errors (500s, timeouts)
- **Users**: Actual concurrent users

Key metrics to validate:
- ✅ **Throughput**: Should sustain 40k+ req/sec (our target is 48k for 4 × 8 workers)
- ✅ **Latency p95**: Should be < 500ms for API calls
- ✅ **Error rate**: Should be < 0.1%
- ✅ **Database connections**: Should stay < 300 (out of 500 limit)
- ✅ **Memory**: No service should approach limits

## Step 6: Real-time Dashboard

Run Locust with Web UI for real-time monitoring:

```bash
locust -f locustfile.py --host=http://localhost
```

Then open browser to: `http://localhost:8089`

Configure in UI:
- Number of users: 100 to start, increase to 5000
- Hatch rate: 10-100 users/sec
- Run time: Set to test duration

## Example Test Sequence

### Baseline (Warm-up):
```bash
locust -f locustfile.py --host=http://localhost --users=50 --spawn-rate=5 --run-time=1m
```
Expected: 100-500 req/sec

### Light Load:
```bash
locust -f locustfile.py --host=http://localhost --users=500 --spawn-rate=50 --run-time=2m
```
Expected: 1,000-3,000 req/sec

### Medium Load:
```bash
locust -f locustfile.py --host=http://localhost --users=2000 --spawn-rate=200 --run-time=2m
```
Expected: 5,000-15,000 req/sec

### Heavy Load:
```bash
locust -f locustfile.py --host=http://localhost --users=5000 --spawn-rate=500 --run-time=3m
```
Expected: 15,000-35,000 req/sec (should start seeing response time increase)

### Peak/Stress:
```bash
locust -f locustfile.py ::QuickLoadUser --host=http://localhost --users=10000 --spawn-rate=1000 --run-time=2m
```
Expected: 40,000-50,000+ req/sec (system at max capacity)

## Troubleshooting

### Issue: "Connection refused" errors
```bash
# Check services are running
docker-compose ps

# Check logs
docker-compose logs -f nginx
docker-compose logs -f web-worker-1
```

### Issue: High error rate
```bash
# Check Django logs
docker-compose logs django --tail=100

# Check slow queries
docker-compose exec db psql -U joyfund -d joyfund -c \
  "SELECT query, calls, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

### Issue: Memory spikes
```bash
# Check what's using memory
docker-compose exec redis redis-cli --bigkeys

# Check database cache
docker-compose exec db psql -U joyfund -d joyfund -c \
  "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size FROM pg_tables ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC LIMIT 10;"
```

### Issue: Slow response times
```bash
# Enable slow query log
docker-compose exec db psql -U joyfund -d joyfund -c \
  "ALTER SYSTEM SET log_min_duration_statement = 1000;"  # 1 second queries
docker-compose restart db

# View slow queries
docker-compose logs db | grep "duration:"
```

## Expected Capacity Verification

Your system architecture:
- **4 Gunicorn workers** × **8 processes each** = **32 processes**
- Each process can handle ~1,500 req/sec = **48,000 req/sec total capacity**

| Users | Req/Sec | Response Time | CPU Usage | Memory | DB Conns | Status |
|-------|---------|---------------|-----------|--------|----------|--------|
| 100   | 300     | <50ms         | 10%       | 40%    | ~30      | ✅ OK |
| 500   | 1,500   | <100ms        | 20%       | 50%    | ~80      | ✅ OK |
| 2,000 | 5,000   | <200ms        | 40%       | 60%    | ~200     | ✅ OK |
| 5,000 | 15,000  | <300ms        | 60%       | 70%    | ~300     | ✅ OK |
| 10,000| 40,000+ | <500ms        | 80-95%    | 80%    | ~400     | ✅ At Limit |

Once you hit 10,000 users (40k+ req/sec), you're at 80%+ system capacity. Going beyond requires horizontal scaling (more Docker nodes).

## Saving Results

Locust exports CSV reports:
```bash
locust -f locustfile.py --host=http://localhost --users=5000 \
  --csv=results --run-time=2m --headless
```

This creates:
- `results_stats.csv` - Per-endpoint statistics
- `results_stats_history.csv` - Performance over time

View results:
```bash
cat results_stats.csv
```
