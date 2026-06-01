import os
import sys

from django.apps import AppConfig


class AccountsConfig(AppConfig):
    name = 'accounts'

    def ready(self):
        """
        Import signals and run startup seeding when the server starts.
        """
        import accounts.signals  # noqa: F401

        if 'runserver' in sys.argv and os.environ.get('RUN_MAIN') == 'true':
            try:
                from django.core.management import call_command
                call_command('create_oauth_app')
            except Exception as exc:
                # Avoid crashing startup if the database isn't ready yet.
                print('Startup seeding skipped:', str(exc))
