from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    name = 'notifications'
    
    def ready(self):
        """
        Import signals when the app is ready.
        This ensures signal handlers are registered when Django starts.
        """
        import notifications.signals  # noqa: F401
