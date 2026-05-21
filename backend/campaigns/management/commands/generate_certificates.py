"""
Management command to generate impact certificates for completed campaigns.

Usage:
    python manage.py generate_certificates                    # Generate for all campaigns at goal
    python manage.py generate_certificates <campaign_id>      # Generate for specific campaign
    python manage.py generate_certificates --force            # Regenerate even if already exists
    python manage.py generate_certificates --async            # Queue for background Celery processing
"""

from django.core.management.base import BaseCommand, CommandError
from campaigns.models import Campaign
from campaigns.tasks import generate_impact_certificates


class Command(BaseCommand):
    help = 'Generate impact certificates for campaigns that have reached their goals'

    def add_arguments(self, parser):
        parser.add_argument(
            'campaign_id',
            nargs='?',
            type=str,
            help='Specific campaign UUID to generate certificate for',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Regenerate certificates even if they already exist',
        )
        parser.add_argument(
            '--async',
            action='store_true',
            help='Queue for background Celery processing (non-blocking)',
        )

    def handle(self, *args, **options):
        force = options.get('force', False)
        campaign_id = options.get('campaign_id')
        use_async = options.get('async', False)

        try:
            if use_async:
                # Queue the task for async processing
                result = generate_impact_certificates.delay()
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ Certificate generation queued for background processing\n'
                        f'  Task ID: {result.id}\n'
                        f'  Make sure your Celery worker is running!'
                    )
                )
                return

            if campaign_id:
                # Generate for specific campaign
                try:
                    campaign = Campaign.objects.get(id=campaign_id)
                except Campaign.DoesNotExist:
                    raise CommandError(f'Campaign with ID {campaign_id} not found')

                if not campaign.goal_reached:
                    raise CommandError(
                        f'Campaign "{campaign.title}" has not reached its goal yet. '
                        f'Goal: {campaign.goal_amount} XAF, Raised: {campaign.total_net_raised} XAF'
                    )

                if campaign.certificate_generated and not force:
                    self.stdout.write(
                        self.style.WARNING(
                            f'  ⚠ Certificate already exists for "{campaign.title}" (use --force to regenerate)'
                        )
                    )
                else:
                    if campaign.generate_impact_certificate(force=force):
                        self.stdout.write(
                            self.style.SUCCESS(
                                f'  ✓ Generated certificate for: {campaign.title}'
                            )
                        )
                    else:
                        raise CommandError(f'Failed to generate certificate for {campaign.title}')
            else:
                # Generate for all campaigns at goal
                campaigns_at_goal = Campaign.objects.filter(is_active=True)
                
                generated_count = 0
                skipped_count = 0
                failed_count = 0

                self.stdout.write('Generating certificates for campaigns at goal...\n')

                for campaign in campaigns_at_goal:
                    if not campaign.goal_reached:
                        continue

                    if campaign.certificate_generated and not force:
                        self.stdout.write(f'  • "{campaign.title}" - already has certificate')
                        skipped_count += 1
                        continue

                    if campaign.generate_impact_certificate(force=force):
                        self.stdout.write(
                            self.style.SUCCESS(
                                f'  ✓ Generated certificate for: {campaign.title}'
                            )
                        )
                        generated_count += 1
                    else:
                        self.stdout.write(
                            self.style.ERROR(
                                f'  ✗ Failed to generate certificate for: {campaign.title}'
                            )
                        )
                        failed_count += 1

                # Summary
                self.stdout.write('\n' + '=' * 60)
                self.stdout.write(self.style.SUCCESS(f'Generated: {generated_count}'))
                self.stdout.write(self.style.WARNING(f'Skipped: {skipped_count}'))
                if failed_count > 0:
                    self.stdout.write(self.style.ERROR(f'Failed: {failed_count}'))
                self.stdout.write('=' * 60)

        except Exception as e:
            raise CommandError(f'Error: {str(e)}')
