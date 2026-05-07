docker compose up redis db rabbitmq

celery -A backend worker -n worker1@%h --loglevel=info --concurrency=4 --max-tasks-per-child=1000 --time-limit=3600 --soft-time-limit=3300