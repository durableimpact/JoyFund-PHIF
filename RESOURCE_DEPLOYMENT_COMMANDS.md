# Resource Allocation Update - Deployment Commands

Quick reference for deploying the resource limit updates to production.

---

## What's Changing?

✅ **Netdata** (docker-compose.yml): 0.5 CPU / 256M → 1.0 CPU / 512M  
✅ **Grafana** (prod.yml): 0.5 CPU / 256M → 1.0 CPU / 512M  
✅ **Promtail** (prod.yml): 0.25 CPU / 128M → 0.5 CPU / 256M  

This fixes OOM errors and CPU exhaustion alerts.

---

## Deploy to Production

### Step 1: Pull Latest Code
```bash
cd /root/projects/JoyFund

# Get latest
git fetch origin main
git reset --hard origin/main
```

### Step 2: Stop Current Services
```bash
cd /root/projects/JoyFund/backend

# Stop everything gracefully
docker compose -f prod.yml down
```

### Step 3: Start with New Resources
```bash
# Start all services with updated resource limits
docker compose -f prod.yml --env-file ./envs/prod/.env up -d --build
```

### Step 4: Verify Deployment
```bash
# Check all services started
docker compose ps

# Monitor logs
docker compose logs -f joyfund_web_1 joyfund_grafana joyfund_promtail

# Wait for "Application startup complete" message
```

---

## Validation Commands

### Check Resource Limits Applied
```bash
# Netdata (should be 512M = 536870912 bytes)
echo "Netdata Memory Limit:"
docker inspect joyfund_netdata | jq '.[0].HostConfig.Memory'

# Grafana (should be 512M = 536870912 bytes)
echo "Grafana Memory Limit:"
docker inspect joyfund_grafana | jq '.[0].HostConfig.Memory'

# Promtail (should be 256M = 268435456 bytes)
echo "Promtail Memory Limit:"
docker inspect joyfund_promtail | jq '.[0].HostConfig.Memory'
```

### Monitor Resource Usage
```bash
# Real-time statistics
docker stats

# Specific containers
docker stats joyfund_netdata joyfund_grafana joyfund_promtail
```

### Check for Errors
```bash
# Look for OOM or memory issues
docker logs joyfund_netdata | grep -i "oom\|memory\|killed"
docker logs joyfund_grafana | grep -i "oom\|memory\|killed"
docker logs joyfund_promtail | grep -i "oom\|memory\|killed"

# Should return nothing (no errors)
```

---

## Monitoring in Netdata

### Access Netdata Dashboard
```bash
# Local: http://localhost:19999
# Production: https://netdata.joyfund.cm or http://<ip>:19999
```

### Check Docker Container Stats
1. Navigate to the **Docker** section in the sidebar
2. Look at **Memory** and **CPU** usage
3. You should see increased limits in the graphs
4. Memory usage should be well below the new limits

---

## Monitoring in Grafana

### Access Grafana Alerts
```bash
# Local: http://localhost:3001
# Production: https://grafana.joyfund.cm
```

### Verify Alerts Cleared
1. Go to **Alerts** or **Alerting**
2. Check for these alerts - they should **resolve**:
   - `Cgroup joyfund_grafana memory utilization`
   - `Cgroup joyfund_netdata memory utilization`
   - `Cgroup joyfund_prometheus memory utilization`
   - `Cgroup joyfund_netdata CPU utilization`
   - `System OOM kills`

---

## Rollback (If Needed)

If issues occur, rollback to previous version:

```bash
cd /root/projects/JoyFund/backend

# Stop services
docker compose -f prod.yml down

# Go back to previous commit
git log --oneline -5
git reset --hard <PREVIOUS_COMMIT>

# Restart with old resource limits
docker compose -f prod.yml --env-file ./envs/prod/.env up -d

# Verify
docker logs joyfund_web_1 | head -10
```

---

## Troubleshooting

### Services Won't Start
```bash
# Check logs for errors
docker compose logs

# Ensure .env file exists
ls -la envs/prod/.env

# Restart Docker daemon if needed
sudo systemctl restart docker

# Try again
docker compose -f prod.yml --env-file ./envs/prod/.env up -d
```

### Memory Still Too High
```bash
# Check actual usage
docker stats joyfund_grafana --no-stream

# If still high, check for memory leaks in logs
docker logs joyfund_grafana | tail -50

# Restart individual service
docker restart joyfund_grafana
```

### Grafana Dashboard Slow
```bash
# Force restart
docker restart joyfund_grafana

# Check if datasources (Prometheus, Loki) are responsive
curl -s http://localhost:9090/api/v1/query?query=up | jq '.status'
```

---

## Expected Timeline

| Step | Duration | Notes |
|------|----------|-------|
| Pull code | < 1 min | Fast git operations |
| Stop services | 1-2 min | Graceful shutdown |
| Start services | 2-3 min | Container initialization |
| Migrations | 1-2 min | Django migrations (if any) |
| Verification | 2-3 min | Health checks and validation |
| **Total** | **~10 minutes** | No downtime if rolled out smoothly |

---

## Post-Deployment Checklist

- [ ] All services running: `docker compose ps`
- [ ] No containers restarting: `docker compose logs | grep -i "exit\|error"`
- [ ] Memory limits applied: `docker inspect joyfund_netdata | jq '.[0].HostConfig.Memory'`
- [ ] Netdata dashboard responsive: Visit http://localhost:19999 or https://netdata.joyfund.cm
- [ ] Grafana loads quickly: Visit http://localhost:3001 or https://grafana.joyfund.cm
- [ ] No OOM warnings in Netdata alerts
- [ ] Logs shipping to Loki: Check Promtail logs
- [ ] API responding: `curl -s https://api.joyfund.cm/api/campaigns/ | jq '.count'`

---

## Performance Expectations After Update

✅ **Grafana** - Dashboards load in <2s (was 5-10s)  
✅ **Netdata** - Real-time metrics without lag  
✅ **Promtail** - No log backlog or loss  
✅ **Overall** - No more OOM kills or crashes  
✅ **System** - Stable resource utilization  

---

## Support

For issues:
1. Check `RESOURCE_ALLOCATION_GUIDE.md` for detailed info
2. Review `PRODUCTION_TROUBLESHOOTING.md` for common problems
3. Monitor logs: `docker compose logs -f`
4. Check Netdata/Grafana dashboards

---

**Last Updated:** 2026-06-11  
**Version:** 1.0  
**Status:** ✅ Ready for Deployment
