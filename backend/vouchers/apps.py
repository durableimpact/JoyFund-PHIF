from django.apps import AppConfig


class VouchersConfig(AppConfig):
    name = 'vouchers'
    
    def ready(self):
        """Import signal handlers when app is ready."""
        from . import signals  # noqa: F401 — registers post_save signal

