# Load Testing Quick Reference

## Fast Start

If you want to test RIGHT NOW:

```bash
cd "/home/ivantom/Desktop/Code/Projects/durable impact/JoyFund-PHIF/backend"

# First ensure services are running
docker-compose up -d
docker-compose ps  # Wait until all show "healthy"

# Install Locust (one-time)
pip install locust

# Then pick one of these:

# Option 1: Interactive - Control from browser
locust -f locustfile.py --host=http://localhost
# Then go to http://localhost:8089

# Option 2: Quick test script
./run_load_test.sh stress  # Quick 2-min stress test

# Option 3: Full suite
./run_load_test.sh suite   # Run all tests in sequence
```

## What to Expect - Results Interpretation

When Locust runs, you'll see a table like this:

```
Type        Name                                  # requests  # fails   Median   95%    99%    100%    | Requests/s  Failures/s
 GET         /api/beneficiaries/?page=1          5000        0         120      350    800    2100    | 2500       0.00
 GET         /api/campaigns/?page=1              4000        10        150      400    1200   2500    | 2000       5.00
 POST        /api/donations/                     1000        0         200      500    1500   3000    | 500        0.00
         Total                                   10000       10        130      360    950    3000    | 5000       5.00
```

### Understanding the Columns:

| Column | What it means |
|--------|---------------|
| **# requests** | Total API calls made to this endpoint |
| **# fails** | Failed requests (errors, timeouts) |
| **Median** | 50% of requests finished within this time (ms) |
| **95%** | 95% of requests finished within this time (ms) |
| **99%** | 99% of requests finished within this time (ms) |
| **100%** | Slowest request total time (ms) |
| **Requests/s** | Throughput - requests per second |

### What's GOOD?

✅ **Response Times (Lower is better):**
- Median < 100ms
- 95% < 300ms  
- 99% < 1000ms

✅ **Error Rate (Lower is better):**
- < 0.1% failures
- No timeouts
- All requests complete successfully

✅ **Throughput (Higher is better):**
- Light load (50-500 users): 300-3,000 req/sec
- Medium load (2,000 users): 5,000-15,000 req/sec
- Heavy load (5,000 users): 15,000-35,000 req/sec
- **Stress load (10,000 users): 40,000-50,000+ req/sec ← TARGET**

## Side-by-side Monitoring

While test runs, open another terminal:

```bash
# Watch real-time resource usage
docker stats

# Or check specific metrics:

# 1. Database connection pool usage
docker-compose exec db psql -U joyfund -d joyfund -c \
  "SELECT count(*) as connections FROM pg_stat_activity;"

# 2. Redis memory usage  
docker-compose exec redis redis-cli INFO memory | grep used_memory_human

# 3. Server CPU/Memory
top  # or just docker stats (better)

# 4. Error logs
docker-compose logs -f web-worker-1 | grep ERROR
```

### Peak Capacity Signs

When your system hits max capacity, you'll see:
- ⚠️ Response times jump from 100ms → 500ms+
- ⚠️ Database connections rising toward 500 limit
- ⚠️ CPU usage 90%+ on all worker containers
- ⚠️ Memory 80%+ on web-worker containers
- ⚠️ Start seeing some failed requests (connection timeouts)

At this point = **System is at limit; add more containers/nodes needed**

## Test Progression

Recommended test sequence:

1. **Baseline** (50 users, 1 min)
   - Warm up system
   - Ensure basic connectivity
   - Expected: 300-500 req/sec, <50ms latency

2. **Light Load** (500 users, 2 min)
   - Test normal concurrent usage
   - Should handle easily
   - Expected: 1,000-3,000 req/sec, <100ms latency

3. **Medium Load** (2,000 users, 2 min)
   - Approaching typical peak times
   - Latency increase acceptable
   - Expected: 5,000-15,000 req/sec, <200ms latency

4. **Heavy Load** (5,000 users, 3 min)
   - Sustained high load
   - System working hard but stable
   - Expected: 15,000-35,000 req/sec, <300ms latency

5. **Stress Test** (10,000 users, 2 min)
   - Push to limit
   - See where bottlenecks are
   - Expected: 40,000-50,000+ req/sec, <500ms latency or failures start

## Common Issues & Solutions

### "Connection refused" error
```bash
# Check containers are running
docker-compose ps

# If not, start them
docker-compose up -d

# If stuck, restart all
docker-compose down
docker-compose up -d
```

### High failure rate (>1%)
```bash
# Check Django logs for errors
docker-compose logs -f web-worker-1 | grep ERROR

# Check if database is hitting connection limit
docker-compose exec db psql -U joyfund -d joyfund -c \
  "SELECT count(*) FROM pg_stat_activity;" 

# If nearing 500, that's the bottleneck
```

### Slow response times even at light load
```bash
# Check if a specific query is slow
docker-compose exec db psql -U joyfund -d joyfund -c \
  "SELECT query, calls, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 5;"

# Check database CPU usage
docker stats

# If database CPU > 50%, need indexes or query optimization
```

### Memory keeps growing
```bash
# Check for memory leaks
docker stats

# If one container keeps going up, check logs
docker-compose logs web-worker-1 | tail -20

# May need to restart that container
docker-compose restart web-worker-1
```

## Expected Capacity Validation

Your system is designed for:
- **4 Gunicorn workers** × **8 processes** = **32 concurrent processes**
- Each process: ~1,500 req/sec = **48,000 req/sec total**

Test results should confirm:
- ✅ At 50 users: ~500 req/sec, latency <50ms
- ✅ At 500 users: ~3,000 req/sec, latency <100ms
- ✅ At 2,000 users: ~15,000 req/sec, latency <200ms
- ✅ At 5,000 users: ~32,000 req/sec, latency <300ms
- ✅ At 10,000 users: ~48,000 req/sec, latency <500ms

If you're NOT hitting these targets, look for:
1. Slow database queries
2. Missing indexes
3. Memory constraints
4. CPU throttling

## Export Results

To save results for comparison:

```bash
locust -f locustfile.py --host=http://localhost --users=5000 \
  --csv=results --run-time=3m --headless

# Creates:
# - results_stats.csv
# - results_stats_history.csv

# View in Excel or this command:
cat results_stats.csv
```

## Next Level: Targeted Testing

Once you know your baseline, test specific endpoints:

```python
# Create endpoint_test.py with focus on specific API:
from locust import HttpUser, task, between

class APITest(HttpUser):
    wait_time = between(0.5, 1.5)
    
    @task
    def test_donation_endpoint(self):
        self.client.post("/api/donations/", json={...})
```

This helps identify which endpoints are bottlenecks.
