from django.apps import AppConfig


class AccountsConfig(AppConfig):
    name = 'accounts'
    
    def ready(self):
        """
        Import signals when the app is ready.
        This ensures signal handlers are registered when Django starts.
        """
        import accounts.signals  # noqa: F401
