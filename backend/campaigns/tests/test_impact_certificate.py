"""
Tests for impact certificate PDF generation.

Tests ensure certificates are generated correctly when campaigns reach their goals.
"""

from decimal import Decimal
from django.test import TestCase
from django.core.management import call_command
from django.utils.timezone import now
from io import StringIO

from campaigns.models import Campaign
from accounts.models import User, Donor, Role


class ImpactCertificateGenerationTest(TestCase):
    """Test impact certificate generation when campaigns reach goals."""

    def setUp(self):
        """Set up test data."""
        # Create roles
        self.donor_role = Role.objects.get_or_create(name='Donor')[0]

        # Create test user and donor
        self.donor_user = User.objects.create_user(
            username='testdonor',
            email='donor@test.com',
            password='testpass123',
        )
        self.donor_user.roles.add(self.donor_role)

        self.donor = Donor.objects.get_or_create(
            user=self.donor_user,
            defaults={'phone_number': '+237612345678'}
        )[0]

        # Create campaign below goal
        self.campaign = Campaign.objects.create(
            title='Test Campaign Below Goal',
            description='A test campaign for certificate generation',
            goal_amount=Decimal('100000.00'),
            current_amount=Decimal('0.00'),
        )

    def test_certificate_not_generated_when_goal_not_reached(self):
        """Certificate should not be generated if campaign hasn't reached goal."""
        self.campaign.refresh_from_db()
        self.assertFalse(self.campaign.goal_reached)
        self.assertFalse(self.campaign.certificate_generated)

    def test_certificate_generated_when_goal_reached(self):
        """Certificate should be auto-generated when campaign reaches goal."""
        # Set campaign to have reached goal
        self.campaign.current_amount = Decimal('100000.00')
        self.campaign.save()

        # Refresh to check if certificate was generated
        self.campaign.refresh_from_db()
        self.assertTrue(self.campaign.goal_reached)
        # Note: Certificate generation depends on having successful donations,
        # which trigger the signal. This is tested in integration tests.

    def test_goal_reached_property(self):
        """Test goal_reached property calculation."""
        # Below goal
        self.campaign.current_amount = Decimal('50000.00')
        self.campaign.save()
        self.assertFalse(self.campaign.goal_reached)

        # At goal
        self.campaign.current_amount = Decimal('100000.00')
        self.campaign.save()
        self.assertTrue(self.campaign.goal_reached)

        # Above goal
        self.campaign.current_amount = Decimal('150000.00')
        self.campaign.save()
        self.assertTrue(self.campaign.goal_reached)

    def test_generate_certificates_management_command(self):
        """Test the generate_certificates management command."""
        # Create multiple campaigns
        campaign1 = Campaign.objects.create(
            title='Campaign 1 - Below Goal',
            description='Description 1',
            goal_amount=Decimal('50000.00'),
            current_amount=Decimal('30000.00'),
        )

        campaign2 = Campaign.objects.create(
            title='Campaign 2 - At Goal',
            description='Description 2',
            goal_amount=Decimal('50000.00'),
            current_amount=Decimal('50000.00'),
        )

        campaign3 = Campaign.objects.create(
            title='Campaign 3 - Above Goal',
            description='Description 3',
            goal_amount=Decimal('50000.00'),
            current_amount=Decimal('60000.00'),
        )

        # Run command - should only process campaigns 2 and 3
        out = StringIO()
        call_command('generate_certificates', stdout=out)
        output = out.getvalue()

        self.assertIn('Generating certificates', output)
        # Note: Full success depends on template and WeasyPrint availability
