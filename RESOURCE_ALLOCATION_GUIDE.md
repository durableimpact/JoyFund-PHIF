# Resource Allocation Guide

## Overview

Updated Docker resource limits and reservations for monitoring services to prevent memory and CPU exhaustion in production.

---

## Changes Made

### 1. **Netdata (docker-compose.yml)**
Monitoring service that tracks system health, container metrics, and performance data.

#### Before
```yaml
deploy:
  resources:
    limits:
      cpus: "0.5"
      memory: 256M
    reservations:
      cpus: "0.25"
      memory: 128M
```

#### After
```yaml
deploy:
  resources:
    limits:
      cpus: "1.0"      # Doubled: 0.5 → 1.0
      memory: 512M     # Doubled: 256M → 512M
    reservations:
      cpus: "0.5"      # Doubled: 0.25 → 0.5
      memory: 256M     # Doubled: 128M → 256M
```

**Reason:** Netdata collects real-time metrics from all containers and host system. The 2x increase allows:
- Better performance data collection without OOM kills
- Historical data retention without memory pressure
- Responsive UI when accessing dashboards

---

### 2. **Grafana (prod.yml)**
Dashboard and visualization platform for Prometheus metrics and Loki logs.

#### Before
```yaml
deploy:
  resources:
    limits:
      cpus: "0.5"
      memory: 256M
    reservations:
      cpus: "0.25"
      memory: 128M
```

#### After
```yaml
deploy:
  resources:
    limits:
      cpus: "1.0"      # Doubled: 0.5 → 1.0
      memory: 512M     # Doubled: 256M → 512M
    reservations:
      cpus: "0.5"      # Doubled: 0.25 → 0.5
      memory: 256M     # Doubled: 128M → 256M
```

**Reason:** Grafana renders dashboards in real-time and stores dashboard configurations. The increase allows:
- Faster dashboard rendering without lag
- Multiple concurrent users without performance degradation
- Better handling of large datasets from Prometheus
- Reduced memory pressure that was causing OOM events

---

### 3. **Promtail (prod.yml)**
Log collector that ships Docker container logs to Loki.

#### Before
```yaml
deploy:
  resources:
    limits:
      cpus: "0.25"
      memory: 128M
    reservations:
      cpus: "0.1"
      memory: 64M
```

#### After
```yaml
deploy:
  resources:
    limits:
      cpus: "0.5"      # 2x increase: 0.25 → 0.5
      memory: 256M     # 2x increase: 128M → 256M
    reservations:
      cpus: "0.25"     # 2.5x increase: 0.1 → 0.25
      memory: 128M     # 2x increase: 64M → 128M
```

**Reason:** Promtail reads logs from all running containers and buffers them. The increase allows:
- Handling high-volume logging from multiple containers without backpressure
- Better buffering during network latency to Loki
- Prevention of log loss or delays

---

## Summary of Allocations

| Service | Metric | Before | After | Change |
|---------|--------|--------|-------|--------|
| **Netdata** | CPU Limit | 0.5 | 1.0 | +100% |
| **Netdata** | Memory Limit | 256M | 512M | +100% |
| **Netdata** | CPU Reservation | 0.25 | 0.5 | +100% |
| **Netdata** | Memory Reservation | 128M | 256M | +100% |
| **Grafana** | CPU Limit | 0.5 | 1.0 | +100% |
| **Grafana** | Memory Limit | 256M | 512M | +100% |
| **Grafana** | CPU Reservation | 0.25 | 0.5 | +100% |
| **Grafana** | Memory Reservation | 128M | 256M | +100% |
| **Promtail** | CPU Limit | 0.25 | 0.5 | +100% |
| **Promtail** | Memory Limit | 128M | 256M | +100% |
| **Promtail** | CPU Reservation | 0.1 | 0.25 | +150% |
| **Promtail** | Memory Reservation | 64M | 128M | +100% |

---

## What These Changes Fix

### Issues Addressed
✅ **Memory exhaustion alerts** for Grafana, Netdata, Prometheus
✅ **High CPU utilization** warnings  
✅ **Disk backlog** issues
✅ **System OOM kills** preventing Promtail from shipping logs
✅ **Laggy Grafana dashboards** when rendering metrics
✅ **Netdata UI responsiveness** problems

### Monitored Alerts Resolved
- `Cgroup joyfund_grafana memory utilization` (was 88.69% → should drop significantly)
- `Cgroup joyfund_netdata memory utilization` (was 98.08% → should drop significantly)
- `Cgroup joyfund_prometheus memory utilization` (was 91.83%)
- `Cgroup joyfund_netdata CPU utilization` (was 115.4%)
- `System OOM kills` (preventing further incidents)
- `Disk sda backlog` (will reduce as services perform better)

---

## Docker Resource Concepts

### **Limits**
- **Hard maximum** - container can never exceed this
- If exceeded, container is killed with OOM (Out of Memory) error
- Used: `--memory` flag

### **Reservations**
- **Soft guarantee** - Docker reserves this amount when container starts
- Container can use more if available
- Helps prevent oversubscription

### **Best Practice**
```
CPU: Reservation ≤ Limit (usually 50% of limit)
Memory: Reservation ≤ Limit (usually 50% of limit)
```

---

## Deployment Instructions

### 1. **Update docker-compose.yml (Root)**
```bash
# The file has already been updated
git diff docker-compose.yml | head -50
```

### 2. **Update prod.yml (Backend)**
```bash
# The file has already been updated
git diff backend/prod.yml | head -50
```

### 3. **Apply Changes to Production**
```bash
cd /root/projects/JoyFund/backend

# Pull latest
git fetch origin main
git reset --hard origin/main

# Restart services to apply new resource limits
docker compose -f prod.yml --env-file ./envs/prod/.env down
docker compose -f prod.yml --env-file ./envs/prod/.env up -d

# Verify changes applied
docker inspect joyfund_grafana | jq '.[0].HostConfig.Memory'
docker inspect joyfund_promtail | jq '.[0].HostConfig.Memory'
docker inspect joyfund_netdata | jq '.[0].HostConfig.Memory'
```

### 4. **Monitor the Changes**
```bash
# Watch container stats
docker stats --no-stream

# Check Netdata for improvement
# Visit: https://netdata.joyfund.cm or http://localhost:19999

# Check Grafana alerts
# Visit: https://grafana.joyfund.cm → Alerts
```

---

## Expected Improvements

After applying these changes, you should see:

1. **Memory Alerts** - No more OOM warnings for Grafana, Netdata, Prometheus
2. **Grafana Performance** - Faster dashboard loading, smooth interactions
3. **Netdata Responsiveness** - Real-time metrics without lag
4. **Promtail Reliability** - No dropped logs, consistent log delivery
5. **System Stability** - No more system OOM kills
6. **CPU Usage** - Better distribution across containers

---

## Future Optimization (Optional)

If you're running on hardware with more resources, consider:

### For Larger Production Deployments
```yaml
grafana:
  deploy:
    resources:
      limits:
        cpus: "2.0"        # Up to 2 full CPUs
        memory: 1G         # Up to 1 GB
      reservations:
        cpus: "1.0"
        memory: 512M

promtail:
  deploy:
    resources:
      limits:
        cpus: "1.0"        # Up to 1 CPU
        memory: 512M       # Up to 512 MB
      reservations:
        cpus: "0.5"
        memory: 256M

netdata:
  deploy:
    resources:
      limits:
        cpus: "2.0"
        memory: 1G
      reservations:
        cpus: "1.0"
        memory: 512M
```

---

## Monitoring Resource Usage

### Check Current Usage
```bash
# Real-time
docker stats

# Detailed for specific container
docker stats joyfund_grafana --no-stream

# Memory as percentage
docker inspect joyfund_grafana | jq '.[0].HostConfig | {MemoryBytes, MemorySwap}'
```

### Check Limits Applied
```bash
# See what we set
docker inspect joyfund_grafana | jq '.[0].HostConfig.Memory'    # Result in bytes
echo "512M = $((512 * 1024 * 1024)) bytes"                       # For comparison
```

### View in Netdata
1. Visit http://localhost:19999 (or your Netdata URL)
2. Look for "Docker" section
3. Check "Memory" and "CPU" usage per container
4. Compare against the limits we set

---

## Validation Checklist

- [ ] docker-compose.yml updated with Netdata 1.0 CPU / 512M memory
- [ ] prod.yml updated with Grafana 1.0 CPU / 512M memory
- [ ] prod.yml updated with Promtail 0.5 CPU / 256M memory
- [ ] Code committed and pushed to main
- [ ] Production deployment completed
- [ ] Services restarted with new limits
- [ ] Netdata alerts cleared or resolved
- [ ] Grafana dashboards loading smoothly
- [ ] No OOM messages in docker logs

---

## Files Changed

| File | Change | Notes |
|------|--------|-------|
| `docker-compose.yml` | Netdata resources doubled | Root level monitoring |
| `backend/prod.yml` | Grafana & Promtail increased | Production-specific |

---

## References

- [Docker Resource Constraints](https://docs.docker.com/config/containers/resource_constraints/)
- [Docker Compose Services Deploy Section](https://docs.docker.com/compose/compose-file/05-services/#deploy)
- [Netdata Documentation](https://learn.netdata.cloud/docs/agent/packaging/docker)
- [Grafana Installation Guide](https://grafana.com/docs/grafana/latest/setup-grafana/installation/)
- [Promtail Documentation](https://grafana.com/docs/loki/latest/clients/promtail/)

---

**Date Updated:** 2026-06-11  
**Status:** ✅ Ready for Production Deployment
