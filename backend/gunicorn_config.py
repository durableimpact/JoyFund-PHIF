# Gunicorn configuration file for production
# Usage: gunicorn --config gunicorn_config.py backend.wsgi:application

import multiprocessing
import os

# Server socket
bind = ['0.0.0.0:8000']
backlog = 2048

# Worker processes
workers = int(os.environ.get('GUNICORN_WORKERS', multiprocessing.cpu_count() * 2 + 1))
worker_class = 'sync'  # Use 'gevent' for async/long-polling support
worker_connections = 1000
max_requests = 2000
max_requests_jitter = 200

# Timeouts
timeout = 30

# Logging
accesslog = os.environ.get('GUNICORN_ACCESS_LOG', '/app/logs/gunicorn_access.log')
errorlog = os.environ.get('GUNICORN_ERROR_LOG', '/app/logs/gunicorn_error.log')
loglevel = os.environ.get('GUNICORN_LOG_LEVEL', 'info')
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Server mechanics
daemon = False
pidfile = None
umask = 0
user = None
group = None
tmp_upload_dir = None

# SSL (if needed)
# keyfile = '/path/to/keyfile'
# certfile = '/path/to/certfile'
# ca_certs = '/path/to/ca_certs'

# Process naming
proc_name = 'joyfund-gunicorn'

# Server hooks
def post_worker_init(worker):
    """Called after worker initialization."""
    pass

def pre_fork(server, worker):
    """Called just before a worker is forked."""
    pass

def post_fork(server, worker):
    """Called just after a worker is forked."""
    pass

def pre_exec(server):
    """Called just before a new exec in a reload."""
    pass

def pre_request(worker, req):
    """Called just before a request."""
    pass

def post_request(worker, req, environ, resp):
    """Called just after a request."""
    pass

def child_exit(server, worker):
    """Called when a worker is gracefully killed."""
    pass

def worker_exit(server, worker):
    """Called when a worker is killed."""
    pass
