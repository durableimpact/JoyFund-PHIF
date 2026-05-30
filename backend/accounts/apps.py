import os
import sys

from django.apps import AppConfig


class AccountsConfig(AppConfig):
    name = 'accounts'

    def ready(self):
        """
        Import signals and run development user seeding when the server starts.
        """
        import accounts.signals  # noqa: F401

        if 'runserver' in sys.argv and os.environ.get('RUN_MAIN') == 'true':
            try:
                # from accounts.utils.init_users import ensure_seed_users

                # ensure_seed_users()
                pass
            except Exception as exc:
                # Avoid crashing startup if the database isn't ready yet.
                print('Seed user initialization skipped:', str(exc))
