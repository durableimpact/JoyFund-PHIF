# PgBouncer Connection Pooling Setup

Adds PgBouncer in transaction pooling mode to protect Postgres from connection overload as traffic grows.

## Files

| File | Purpose |
|---|---|
| `prod_1.yml` | Docker Compose with PgBouncer service + Postgres timeouts |
| `backend/settings_1.py` | Django settings compatible with PgBouncer transaction pooling |

## What changed vs production

### prod_1.yml
- **Postgres**: `statement_timeout` and `idle_in_transaction_session_timeout` set as server-wide config (via `command`) instead of per-connection `SET`
- **New `pgbouncer` service**: Transaction pooling, max 25 real PG connections

### settings_1.py
- `DISABLE_SERVER_SIDE_CURSORS = True` — required for transaction pooling
- `CONN_MAX_AGE = 0` — Django opens/closes connections per-request; PgBouncer handles pooling
- Removed per-connection `options` (timeout settings moved to Postgres server config)

## Deploy steps

### 1. Deploy PgBouncer only (app still uses old config)

```bash
docker compose -f prod_1.yml --env-file ./envs/prod/.env up -d pgbouncer
```

Verify:

```bash
docker compose -f prod_1.yml --env-file ./envs/prod/.env logs pgbouncer
```

Expected: `LOG C-0x...: joyfund@postgres:5432/login OK` — shows PgBouncer connected to Postgres.

### 2. Point Django at PgBouncer

Edit `envs/prod/.env`:

```ini
DB_HOST=pgbouncer
DB_PORT=6432
```

### 3. Roll web workers

Replace the settings file in the container (or rebuild the image with `settings_1.py` as the active settings file).

Restart workers one at a time:

```bash
docker compose -f prod_1.yml --env-file ./envs/prod/.env up -d web-worker-1
# Wait. Check logs, test API health.
docker compose -f prod_1.yml --env-file ./envs/prod/.env up -d web-worker-2
# Wait. Check logs.
docker compose -f prod_1.yml --env-file ./envs/prod/.env up -d web-worker-3
```

### 4. Roll celery workers

```bash
docker compose -f prod_1.yml --env-file ./envs/prod/.env up -d celery-worker-1 celery-worker-2 celery-beat
```

## Verify it's working

Check PgBouncer stats:

```bash
docker exec -it joyfund_pgbouncer psql -U joyfund -d pgbouncer -c "SHOW STATS;"
docker exec -it joyfund_pgbouncer psql -U joyfund -d pgbouncer -c "SHOW POOLS;"
```

The `SHOW POOLS` output shows how many server connections are actually in use.

Check Postgres active connections:

```bash
docker exec joyfund_postgres psql -U joyfund -d joyfund -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"
```

With PgBouncer in transaction mode, this should stay well below the number of Django workers.

## Rollback

If something goes wrong:

1. Revert `envs/prod/.env`: `DB_HOST=postgres`, `DB_PORT=5432`
2. Switch back to the original `settings.py` (or remove `DISABLE_SERVER_SIDE_CURSORS` and restore `CONN_MAX_AGE`)
3. Restart all workers
4. Stop PgBouncer: `docker compose -f prod_1.yml --env-file ./envs/prod/.env rm -sf pgbouncer`

## Pool sizing guide

| Variable | Current | When to increase |
|---|---|---|
| `PGBOUNCER_DEFAULT_POOL_SIZE` | 25 | Each pool connection = 1 real PG connection. Monitor `SHOW POOLS` for `clients_waiting`. If requests queue up, increase. |
| `PGBOUNCER_MAX_CLIENT_CONN` | 200 | Max Django connections to PgBouncer. Should be >= total Gunicorn workers + Celery concurrency. |
| `PGBOUNCER_RESERVE_POOL_SIZE` | 5 | Extra connections for traffic spikes. Released after `RESERVE_POOL_TIMEOUT`. |

## What breaks without transaction pooling

- **Server-side cursors**: Disabled via `DISABLE_SERVER_SIDE_CURSORS`. Django's `.iterator()` fetches all results at once instead — fine for the small admin queries in this codebase.
- **Session-level `SET` commands**: `statement_timeout` and `idle_in_transaction_session_timeout` are now set server-wide on the Postgres container instead of per-connection.
- **`select_for_update()`**: Works correctly because all usages are inside `transaction.atomic()` blocks, which pin a backend connection from the pool for the full transaction duration.
