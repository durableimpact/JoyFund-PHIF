from django.apps import AppConfig


class LogsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'logs'
    verbose_name = 'Logging System'

    def ready(self):
        """
        Connect signal handlers when the app is ready.
        This ensures all signal receivers are registered.
        """
        import logs.signals  # noqa: F401
