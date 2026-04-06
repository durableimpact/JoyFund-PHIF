import pytest
from datetime import timedelta
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.utils import timezone
from disbursements.models import EscrowLedgerEntry
from campaigns.models import Campaign
from accounts.models import Donor
from vouchers.models import CareVoucher, VoucherAssignment

User = get_user_model()


@pytest.fixture
def donor_user(db):
    """Create a donor user."""
    return User.objects.create_user(
        email='donor@test.com',
        password='testpass124',
        role='DONOR'
    )


@pytest.fixture
def donor(db, donor_user):
    """Create a donor profile."""
    return Donor.objects.create(user=donor_user)


@pytest.fixture
def campaign(db, donor):
    """Create a campaign."""
    return Campaign.objects.create(
        donor=donor,
        title='Emergency Medical Fund',
        description='Help with emergency medical expenses',
        event_type='BIRTHDAY',
        goal_amount=Decimal('10000.00'),
        impact_goal_count=20,
        impact_service_category='Healthcare',
        end_date=timezone.now() + timedelta(days=30),
        status='ACTIVE'
    )


@pytest.mark.django_db
@pytest.mark.model
class TestEscrowLedgerEntryModel:
    """Test EscrowLedgerEntry model."""

    def test_create_escrow_entry_with_valid_data(self, campaign):
        """Test creating escrow entry with valid data."""
        entry = EscrowLedgerEntry.objects.create(
            campaign=campaign,
            amount=Decimal('5000.00'),
            status=EscrowLedgerEntry.Status.PENDING,
            triggered_by_milestone='Campaign reached 50% of goal'
        )
        assert entry.amount == Decimal('5000.00')
        assert entry.campaign == campaign
        assert entry.status == EscrowLedgerEntry.Status.PENDING

    def test_escrow_entry_status_choices(self, campaign):
        """Test all escrow entry status choices."""
        statuses = [
            EscrowLedgerEntry.Status.PENDING,
            EscrowLedgerEntry.Status.READY,
            EscrowLedgerEntry.Status.ASSIGNED,
            EscrowLedgerEntry.Status.RETURNED,
        ]
        
        for idx, status in enumerate(statuses):
            entry = EscrowLedgerEntry.objects.create(
                campaign=campaign,
                amount=Decimal('1000.00'),
                status=status
            )
            assert entry.status == status

    def test_escrow_entry_default_status(self, campaign):
        """Test that default status is PENDING."""
        entry = EscrowLedgerEntry.objects.create(
            campaign=campaign,
            amount=Decimal('1000.00')
        )
        assert entry.status == EscrowLedgerEntry.Status.PENDING

    def test_escrow_entry_timestamps(self, campaign):
        """Test escrow entry timestamps."""
        entry = EscrowLedgerEntry.objects.create(
            campaign=campaign,
            amount=Decimal('1000.00')
        )
        assert entry.created_at is not None
        assert entry.ready_at is None
        assert entry.assigned_at is None
        assert entry.returned_at is None

    def test_escrow_entry_ready_timestamp(self, campaign):
        """Test setting ready_at timestamp."""
        entry = EscrowLedgerEntry.objects.create(
            campaign=campaign,
            amount=Decimal('1000.00'),
            status=EscrowLedgerEntry.Status.READY,
            ready_at=timezone.now()
        )
        assert entry.ready_at is not None

    def test_escrow_entry_assigned_timestamp(self, campaign):
        """Test setting assigned_at timestamp."""
        entry = EscrowLedgerEntry.objects.create(
            campaign=campaign,
            amount=Decimal('1000.00'),
            status=EscrowLedgerEntry.Status.ASSIGNED,
            assigned_at=timezone.now()
        )
        assert entry.assigned_at is not None

    def test_escrow_entry_returned_timestamp(self, campaign):
        """Test setting returned_at timestamp."""
        entry = EscrowLedgerEntry.objects.create(
            campaign=campaign,
            amount=Decimal('1000.00'),
            status=EscrowLedgerEntry.Status.RETURNED,
            returned_at=timezone.now()
        )
        assert entry.returned_at is not None

    def test_escrow_entry_string_representation(self, campaign):
        """Test __str__ method."""
        entry = EscrowLedgerEntry.objects.create(
            campaign=campaign,
            amount=Decimal('5000.00'),
            status=EscrowLedgerEntry.Status.PENDING
        )
        expected = f"{entry.amount} XAF from '{campaign.title}' — {entry.get_status_display()}"
        assert str(entry) == expected

    def test_escrow_entry_with_notes(self, campaign):
        """Test escrow entry with notes."""
        notes = 'Waiting for campaign verification'
        entry = EscrowLedgerEntry.objects.create(
            campaign=campaign,
            amount=Decimal('1000.00'),
            notes=notes
        )
        assert entry.notes == notes

    def test_escrow_entry_with_milestone_description(self, campaign):
        """Test triggered_by_milestone field."""
        milestone = 'Campaign reached fundraising goal'
        entry = EscrowLedgerEntry.objects.create(
            campaign=campaign,
            amount=Decimal('5000.00'),
            triggered_by_milestone=milestone
        )
        assert entry.triggered_by_milestone == milestone

    def test_escrow_entry_assignment_optional(self, campaign):
        """Test that assignment is optional."""
        entry = EscrowLedgerEntry.objects.create(
            campaign=campaign,
            amount=Decimal('1000.00')
        )
        assert entry.assignment is None

    def test_escrow_entry_cascade_delete_with_campaign(self, campaign):
        """Test that escrow entries are deleted when campaign is deleted."""
        entry = EscrowLedgerEntry.objects.create(
            campaign=campaign,
            amount=Decimal('1000.00')
        )
        campaign_id = campaign.id
        campaign.delete()
        assert not EscrowLedgerEntry.objects.filter(campaign_id=campaign_id).exists()

    def test_multiple_escrow_entries_per_campaign(self, campaign):
        """Test that campaign can have multiple escrow entries."""
        entry1 = EscrowLedgerEntry.objects.create(
            campaign=campaign,
            amount=Decimal('2000.00')
        )
        entry2 = EscrowLedgerEntry.objects.create(
            campaign=campaign,
            amount=Decimal('3000.00')
        )
        
        campaign_entries = EscrowLedgerEntry.objects.filter(campaign=campaign)
        assert campaign_entries.count() == 2
        total = sum(e.amount for e in campaign_entries)
        assert total == Decimal('5000.00')

    def test_escrow_entry_ordering(self, campaign):
        """Test that entries are ordered by created_at descending."""
        entry1 = EscrowLedgerEntry.objects.create(
            campaign=campaign,
            amount=Decimal('1000.00')
        )
        entry2 = EscrowLedgerEntry.objects.create(
            campaign=campaign,
            amount=Decimal('2000.00')
        )
        
        entries = list(EscrowLedgerEntry.objects.all())
        # Should be in reverse chronological order (most recent first)
        assert entries[0].created_at >= entries[1].created_at

    def test_escrow_entry_amount_precision(self, campaign):
        """Test decimal precision for amount."""
        entry = EscrowLedgerEntry.objects.create(
            campaign=campaign,
            amount=Decimal('1234.56')
        )
        assert entry.amount == Decimal('1234.56')

    def test_escrow_entry_large_amount(self, campaign):
        """Test with large amounts."""
        large_amount = Decimal('999999999.99')
        entry = EscrowLedgerEntry.objects.create(
            campaign=campaign,
            amount=large_amount
        )
        assert entry.amount == large_amount

    def test_escrow_entry_workflow_pending_to_ready(self, campaign):
        """Test workflow: PENDING -> READY."""
        entry = EscrowLedgerEntry.objects.create(
            campaign=campaign,
            amount=Decimal('1000.00'),
            status=EscrowLedgerEntry.Status.PENDING
        )
        
        # Transition to READY
        entry.status = EscrowLedgerEntry.Status.READY
        entry.ready_at = timezone.now()
        entry.save()
        
        entry.refresh_from_db()
        assert entry.status == EscrowLedgerEntry.Status.READY
        assert entry.ready_at is not None

    def test_escrow_entry_workflow_ready_to_assigned(self, campaign):
        """Test workflow: READY -> ASSIGNED."""
        entry = EscrowLedgerEntry.objects.create(
            campaign=campaign,
            amount=Decimal('1000.00'),
            status=EscrowLedgerEntry.Status.READY,
            ready_at=timezone.now()
        )
        
        # Transition to ASSIGNED
        entry.status = EscrowLedgerEntry.Status.ASSIGNED
        entry.assigned_at = timezone.now()
        entry.save()
        
        entry.refresh_from_db()
        assert entry.status == EscrowLedgerEntry.Status.ASSIGNED
        assert entry.assigned_at is not None

    def test_escrow_entry_workflow_assigned_to_returned(self, campaign):
        """Test workflow: ASSIGNED -> RETURNED (when voucher expires)."""
        entry = EscrowLedgerEntry.objects.create(
            campaign=campaign,
            amount=Decimal('1000.00'),
            status=EscrowLedgerEntry.Status.ASSIGNED,
            assigned_at=timezone.now()
        )
        
        # Transition to RETURNED
        entry.status = EscrowLedgerEntry.Status.RETURNED
        entry.returned_at = timezone.now()
        entry.save()
        
        entry.refresh_from_db()
        assert entry.status == EscrowLedgerEntry.Status.RETURNED
        assert entry.returned_at is not None

    def test_escrow_entry_without_assignment(self, campaign):
        """Test escrow entry that doesn't have a voucher assignment."""
        entry = EscrowLedgerEntry.objects.create(
            campaign=campaign,
            amount=Decimal('1000.00'),
            status=EscrowLedgerEntry.Status.READY
        )
        assert entry.assignment is None

    def test_empty_milestone_description(self, campaign):
        """Test empty triggered_by_milestone."""
        entry = EscrowLedgerEntry.objects.create(
            campaign=campaign,
            amount=Decimal('1000.00'),
            triggered_by_milestone=''
        )
        assert entry.triggered_by_milestone == ''

    def test_empty_notes(self, campaign):
        """Test empty notes field."""
        entry = EscrowLedgerEntry.objects.create(
            campaign=campaign,
            amount=Decimal('1000.00'),
            notes=''
        )
        assert entry.notes == ''
