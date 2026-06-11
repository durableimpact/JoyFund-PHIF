"""
Custom middleware for JoyFund backend
"""


class FixRemoteAddrMiddleware:
    """
    Middleware to handle requests from monitoring systems (Prometheus, health checks)
    that use container hostnames with underscores which violate RFC 1034/1035.

    Converts container hostnames to valid hosts or rewrites the HOST header.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # List of internal container hostnames to handle
        internal_hosts = [
            "joyfund_web_1",
            "joyfund_web_2",
            "joyfund_celery_1",
            "joyfund_celery_2",
            "joyfund_celery_beat",
            "joyfund_prometheus",
            "prometheus",
            "localhost",
        ]

        # Get the HTTP_HOST header
        http_host = request.META.get("HTTP_HOST", "")

        # If it's an internal container hostname with underscores, replace it with localhost
        if any(host in http_host for host in internal_hosts) and "_" in http_host:
            # Replace the hostname part with localhost, keeping the port if present
            if ":" in http_host:
                port = http_host.split(":")[-1]
                request.META["HTTP_HOST"] = f"localhost:{port}"
            else:
                request.META["HTTP_HOST"] = "localhost"

        response = self.get_response(request)
        return response
