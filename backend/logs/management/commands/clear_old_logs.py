"""
Management command to clear old log entries.
"""

import os
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from datetime import timedelta
from logs.models import ActivityLog, RequestLog, ErrorLog


class Command(BaseCommand):
    help = 'Delete old log entries based on retention policy.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=90,
            help='Default number of days to retain logs (default: 90)',
        )
        parser.add_argument(
            '--activity-days',
            type=int,
            default=None,
            help='Number of days to retain ActivityLog entries (overrides --days)',
        )
        parser.add_argument(
            '--request-days',
            type=int,
            default=30,
            help='Number of days to retain RequestLog entries (default: 30)',
        )
        parser.add_argument(
            '--error-days',
            type=int,
            default=None,
            help='Number of days to retain ErrorLog entries (overrides --days)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        default_days = options['days']
        activity_days = options.get('activity_days') or default_days
        request_days = options.get('request_days', 30)
        error_days = options.get('error_days') or default_days

        # Get retention days from environment variables (fallback)
        activity_days = int(os.environ.get('LOG_RETENTION_DAYS', activity_days))
        request_days = int(os.environ.get('LOG_REQUEST_RETENTION_DAYS', request_days))

        now = timezone.now()

        # Calculate cutoff dates
        activity_cutoff = now - timedelta(days=activity_days)
        request_cutoff = now - timedelta(days=request_days)
        error_cutoff = now - timedelta(days=error_days)

        # Count records to be deleted
        activity_count = ActivityLog.objects.filter(created_at__lt=activity_cutoff).count()
        request_count = RequestLog.objects.filter(created_at__lt=request_cutoff).count()
        error_count = ErrorLog.objects.filter(created_at__lt=error_cutoff).count()

        self.stdout.write(self.style.SUCCESS(f"\n{'='*60}"))
        self.stdout.write(self.style.SUCCESS(f"Log Cleanup Summary"))
        self.stdout.write(self.style.SUCCESS(f"{'='*60}"))

        self.stdout.write(f"\nRetention Policy:")
        self.stdout.write(f"  ActivityLog:  {activity_days} days (cutoff: {activity_cutoff})")
        self.stdout.write(f"  RequestLog:   {request_days} days (cutoff: {request_cutoff})")
        self.stdout.write(f"  ErrorLog:     {error_days} days (cutoff: {error_cutoff})")

        self.stdout.write(f"\nRecords to delete:")
        self.stdout.write(f"  ActivityLog:  {activity_count:,}")
        self.stdout.write(f"  RequestLog:   {request_count:,}")
        self.stdout.write(f"  ErrorLog:     {error_count:,}")
        self.stdout.write(f"  Total:        {activity_count + request_count + error_count:,}")

        if dry_run:
            self.stdout.write(self.style.WARNING(f"\n[DRY RUN] No records were deleted"))
            self.stdout.write(self.style.SUCCESS(f"{'='*60}\n"))
            return

        # Confirm deletion
        if activity_count + request_count + error_count == 0:
            self.stdout.write(self.style.SUCCESS(f"\nNo old logs to delete"))
            self.stdout.write(self.style.SUCCESS(f"{'='*60}\n"))
            return

        # Ask for confirmation
        confirm = input('\nProceed with deletion? (yes/no): ').strip().lower()
        if confirm != 'yes':
            self.stdout.write(self.style.WARNING(f"Deletion cancelled"))
            self.stdout.write(self.style.SUCCESS(f"{'='*60}\n"))
            return

        # Delete old logs
        try:
            ActivityLog.objects.filter(created_at__lt=activity_cutoff).delete()
            self.stdout.write(self.style.SUCCESS(f"✓ Deleted {activity_count:,} ActivityLog entries"))

            RequestLog.objects.filter(created_at__lt=request_cutoff).delete()
            self.stdout.write(self.style.SUCCESS(f"✓ Deleted {request_count:,} RequestLog entries"))

            ErrorLog.objects.filter(created_at__lt=error_cutoff).delete()
            self.stdout.write(self.style.SUCCESS(f"✓ Deleted {error_count:,} ErrorLog entries"))

            self.stdout.write(self.style.SUCCESS(f"\n✓ Total deleted: {activity_count + request_count + error_count:,} records"))
            self.stdout.write(self.style.SUCCESS(f"{'='*60}\n"))

        except Exception as e:
            raise CommandError(f'Error deleting logs: {str(e)}')
