from django.core.management.base import BaseCommand
from accounts.utils.init_users import ensure_seed_users


class Command(BaseCommand):
    help = 'Initializes the database with default seeded users and a hospital.'

    def handle(self, *args, **kwargs):
        self.stdout.write('Starting seeded user initialization...')
        ensure_seed_users()
        self.stdout.write(self.style.SUCCESS('Seeded user initialization finished.'))
