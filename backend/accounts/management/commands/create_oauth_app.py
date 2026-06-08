"""
Management command to create the production admin user and OAuth2 Application
used by the Next.js frontend to authenticate users via the Resource Owner
Password Credentials grant.

This is idempotent — safe to run multiple times.

Usage:
    python manage.py create_oauth_app
"""
# from django.core.management.base import BaseCommand


# class Command(BaseCommand):
#     # This string is shown when running `python manage.py help create_oauth_app`.
#     help = 'Create the production admin user and OAuth2 Application for JoyFund.'

#     def handle(self, *args, **options):
#         # Import inside handle to avoid import-time dependency issues.
#         from django.contrib.auth import get_user_model
#         from django.db import transaction
#         from oauth2_provider.models import Application
#         from accounts.models import Role

#         # Get the active user model configured for this Django project.
#         User = get_user_model()

#         # Admin user configuration: email, password, name, and phone.
#         # These values are used to bootstrap the initial admin account.
#         admin_email = 'admin@joy-fund.com'
#         admin_password = 'Joyfund@2026'
#         admin_first_name = 'Durable'
#         admin_last_name = 'Impact'
#         admin_phone = '+237600000000'

#         # OAuth2 client application details are hard-coded for frontend auth.
#         # The public-facing app will use this client_id and client_secret.
#         client_id = 'KM0XsYiXUfFqtP1LskMypdbYxqcdeFsdkBrDpOau'
#         client_secret = '2lYEqrnFSCnAvCumAVkEGeqD4OB9hPsZpdYJ6T9oD3JkeVuz39ntCzhTfExRoZWTNPe7fZCxy2lN7UX8sYbfpk7a6gi8cgsZr5iAfRCgJvmcVOKZi3kq5dzeGOzB4ngW'

#         # Start a database transaction to keep the bootstrap steps atomic.
#         # If either creation/update fails, the transaction will roll back.
#         with transaction.atomic():
#             # --- Admin user creation/update ---
#             # Use get_or_create to avoid duplicating the user on repeated runs.
#             user, created = User.objects.get_or_create(
#                 email=admin_email,
#                 defaults={
#                     'first_name': admin_first_name,
#                     'last_name': admin_last_name,
#                     'phone_number': admin_phone,
#                     'role': Role.SYSTEM_ADMIN,
#                     'is_verified': True,
#                     'is_staff': True,
#                     'is_superuser': True,
#                     'is_active': True,
#                 },
#             )

#             if created:
#                 # If the user was newly created, set the raw password securely.
#                 user.set_password(admin_password)
#                 user.save()
#                 # Print successful creation details to the console.
#                 self.stdout.write(self.style.SUCCESS(
#                     f'Created admin user:\n'
#                     f'  Email:  {user.email}\n'
#                     f'  Name:   {user.get_full_name}\n'
#                     f'  Role:   {user.role}\n'
#                 ))
#             else:
#                 # Existing user is left unchanged for idempotence.
#                 self.stdout.write(self.style.WARNING(
#                     f'Admin user {admin_email} already exists — skipping.'
#                 ))

#             # --- OAuth2 application creation/update ---
#             # Use update_or_create so the app can be created or updated safely.
#             app, app_created = Application.objects.update_or_create(
#                 client_id=client_id,
#                 defaults={
#                     'name': 'JoyFund Frontend',
#                     'client_type': Application.CLIENT_CONFIDENTIAL,
#                     'authorization_grant_type': Application.GRANT_PASSWORD,
#                     'client_secret': client_secret,
#                     'skip_authorization': True,
#                 },
#             )

#             # Choose display text based on whether the application was created.
#             verb = 'Created' if app_created else 'Updated'
#             self.stdout.write(self.style.SUCCESS(
#                 f'{verb} OAuth2 Application:\n'
#                 f'  Name:          {app.name}\n'
#                 f'  client_id:     {app.client_id}\n'
#                 f'  client_secret: {app.client_secret}\n'
#             ))
