"""
Management command to create (or update) the OAuth2 Application used by the
Next.js frontend to authenticate users via the Resource Owner Password
Credentials grant.

Usage:
    python manage.py create_oauth_app
    python manage.py create_oauth_app --client-id my-id --client-secret my-secret

This is idempotent — safe to run multiple times.
"""
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Create (or update) the OAuth2 Application for the JoyFund frontend.'

    def add_arguments(self, parser):
        parser.add_argument('--client-id',     default='joyfund-frontend',    help='OAuth2 client_id')
        parser.add_argument('--client-secret', default='joyfund-secret-dev', help='OAuth2 client_secret')
        parser.add_argument('--name',          default='JoyFund Frontend',    help='Application name')

    def handle(self, *args, **options):
        from oauth2_provider.models import Application

        client_id     = options['client_id']
        client_secret = options['client_secret']
        name          = options['name']

        app, created = Application.objects.update_or_create(
            client_id=client_id,
            defaults={
                'name':                     name,
                'client_type':              Application.CLIENT_CONFIDENTIAL,
                'authorization_grant_type': Application.GRANT_PASSWORD,
                'client_secret':            client_secret,
                'skip_authorization':       True,
            },
        )

        verb = 'Created' if created else 'Updated'
        self.stdout.write(self.style.SUCCESS(
            f'{verb} OAuth2 Application:\n'
            f'  Name:          {app.name}\n'
            f'  client_id:     {app.client_id}\n'
            f'  client_secret: {app.client_secret}\n'
        ))
        self.stdout.write(self.style.WARNING(
            '\nAdd these to your frontend .env.local:\n'
            f'  DJANGO_OAUTH_CLIENT_ID={app.client_id}\n'
            f'  DJANGO_OAUTH_CLIENT_SECRET={app.client_secret}\n'
        ))
