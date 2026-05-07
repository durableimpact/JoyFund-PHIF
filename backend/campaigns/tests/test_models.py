import pytest
from datetime import datetime, timedelta
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.utils import timezone
from campaigns.models import Campaign, Payment, Donation
from accounts.models import Donor

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
        title='Help John Recover',
        description='Support John in recovering from surgery',
        event_type='PROMOTION',
        goal_amount=Decimal('5000.00'),
        impact_goal_count=10,
        impact_service_category='Healthcare',
        end_date=timezone.now() + timedelta(days=30),
        status='ACTIVE'
    )


@pytest.fixture
def payment(db):
    """Create a payment."""
    return Payment.objects.create(
        payment_method='MTN',
        phone_number='256701234567',
        amount=Decimal('500.00'),
        payment_status='SUCCESS',
        payment_reference='REF123456'
    )


@pytest.mark.django_db
@pytest.mark.model
class TestCampaignModel:
    """Test Campaign model."""

    def test_create_campaign_with_valid_data(self, donor):
        """Test creating campaign with valid data."""
        campaign = Campaign.objects.create(
            donor=donor,
            title='Emergency Fund',
            description='Help us raise funds',
            event_type='BIRTHDAY',
            goal_amount=Decimal('10000.00'),
            end_date=timezone.now() + timedelta(days=30),
            status='ACTIVE'
        )
        assert campaign.title == 'Emergency Fund'
        assert campaign.goal_amount == Decimal('10000.00')
        assert campaign.donor == donor

    def test_campaign_default_values(self, donor):
        """Test default values for campaign."""
        campaign = Campaign.objects.create(
            donor=donor,
            title='Test Campaign',
            description='Test',
            event_type='WEDDING',
            goal_amount=Decimal('1000.00'),
            end_date=timezone.now() + timedelta(days=7)
        )
        assert campaign.current_amount == Decimal('0.00')
        assert campaign.is_public is True
        assert campaign.is_active is True
        assert campaign.status == 'DRAFT'

    def test_campaign_event_types(self, donor):
        """Test all event types."""
        event_types = ['BIRTHDAY', 'WEDDING', 'PROMOTION', 'GRADUATION', 'MEMORIAL']
        for event_type in event_types:
            campaign = Campaign.objects.create(
                donor=donor,
                title=f'Campaign {event_type}',
                description='Test',
                event_type=event_type,
                goal_amount=Decimal('1000.00'),
                end_date=timezone.now() + timedelta(days=7)
            )
            assert campaign.event_type == event_type

    def test_campaign_status_choices(self, donor):
        """Test all campaign status choices."""
        statuses = ['DRAFT', 'ACTIVE', 'INACTIVE', 'FUNDED', 'CLOSED', 'CANCELLED']
        for idx, status in enumerate(statuses):
            campaign = Campaign.objects.create(
                donor=donor,
                title=f'Campaign {status}',
                description='Test',
                event_type='BIRTHDAY',
                goal_amount=Decimal('1000.00'),
                end_date=timezone.now() + timedelta(days=7),
                status=status
            )
            assert campaign.status == status

    def test_campaign_timestamps(self, campaign):
        """Test campaign timestamps."""
        assert campaign.created_at is not None
        assert campaign.start_date is not None
        assert campaign.end_date > timezone.now()

    def test_campaign_string_representation(self, campaign):
        """Test __str__ method."""
        assert str(campaign) == campaign.title

    def test_progress_percentage_zero(self, donor):
        """Test progress percentage with zero goal."""
        campaign = Campaign.objects.create(
            donor=donor,
            title='Zero Goal',
            description='Test',
            event_type='BIRTHDAY',
            goal_amount=Decimal('0.00'),
            current_amount=Decimal('0.00'),
            end_date=timezone.now() + timedelta(days=7)
        )
        assert campaign.progress_percentage == 0

    def test_progress_percentage_partial(self, donor):
        """Test progress percentage with partial funding."""
        campaign = Campaign.objects.create(
            donor=donor,
            title='Partial Fund',
            description='Test',
            event_type='BIRTHDAY',
            goal_amount=Decimal('1000.00'),
            current_amount=Decimal('500.00'),
            end_date=timezone.now() + timedelta(days=7)
        )
        assert campaign.progress_percentage == 50.0

    def test_progress_percentage_overfunded(self, donor):
        """Test progress percentage with overfunding."""
        campaign = Campaign.objects.create(
            donor=donor,
            title='Overfunded',
            description='Test',
            event_type='BIRTHDAY',
            goal_amount=Decimal('1000.00'),
            current_amount=Decimal('1500.00'),
            end_date=timezone.now() + timedelta(days=7)
        )
        assert campaign.progress_percentage == 150.0

    def test_progress_percentage_fully_funded(self, donor):
        """Test progress percentage at 100%."""
        campaign = Campaign.objects.create(
            donor=donor,
            title='Fully Funded',
            description='Test',
            event_type='BIRTHDAY',
            goal_amount=Decimal('1000.00'),
            current_amount=Decimal('1000.00'),
            end_date=timezone.now() + timedelta(days=7)
        )
        assert campaign.progress_percentage == 100.0

    def test_campaign_is_public_default(self, donor):
        """Test is_public default is True."""
        campaign = Campaign.objects.create(
            donor=donor,
            title='Public Campaign',
            description='Test',
            event_type='BIRTHDAY',
            goal_amount=Decimal('1000.00'),
            end_date=timezone.now() + timedelta(days=7)
        )
        assert campaign.is_public is True

    def test_campaign_private(self, donor):
        """Test creating a private campaign."""
        campaign = Campaign.objects.create(
            donor=donor,
            title='Private Campaign',
            description='Test',
            event_type='BIRTHDAY',
            goal_amount=Decimal('1000.00'),
            end_date=timezone.now() + timedelta(days=7),
            is_public=False
        )
        assert campaign.is_public is False


@pytest.mark.django_db
@pytest.mark.model
class TestPaymentModel:
    """Test Payment model."""

    def test_create_payment_with_valid_data(self):
        """Test creating payment with valid data."""
        payment = Payment.objects.create(
            payment_method='MTN',
            phone_number='256701234567',
            amount=Decimal('1000.00'),
            payment_status='SUCCESS'
        )
        assert payment.amount == Decimal('1000.00')
        assert payment.payment_method == 'MTN'
        assert payment.payment_status == 'SUCCESS'

    def test_payment_methods(self):
        """Test all payment methods."""
        methods = ['MTN', 'ORANGE']
        for method in methods:
            payment = Payment.objects.create(
                payment_method=method,
                amount=Decimal('500.00')
            )
            assert payment.payment_method == method

    def test_payment_statuses(self):
        """Test all payment statuses."""
        statuses = ['PENDING', 'SUCCESS', 'FAILED']
        for status in statuses:
            payment = Payment.objects.create(
                payment_method='MTN',
                amount=Decimal('500.00'),
                payment_status=status
            )
            assert payment.payment_status == status

    def test_payment_default_status(self):
        """Test default payment status is PENDING."""
        payment = Payment.objects.create(
            payment_method='MTN',
            amount=Decimal('500.00')
        )
        assert payment.payment_status == 'PENDING'

    def test_payment_timestamps(self, payment):
        """Test payment timestamps."""
        assert payment.created_at is not None
        assert payment.updated_at is not None

    def test_payment_string_representation(self, payment):
        """Test __str__ method."""
        expected = f"{payment.payment_id} - {payment.amount} XAF ({payment.payment_status})"
        assert str(payment) == expected

    def test_payment_optional_fields(self):
        """Test optional fields in payment."""
        payment = Payment.objects.create(
            payment_method='MTN',
            amount=Decimal('500.00')
            # No phone_number or payment_reference
        )
        assert payment.phone_number == ''
        assert payment.payment_reference is None


@pytest.mark.django_db
@pytest.mark.model
class TestDonationModel:
    """Test Donation model."""

    def test_create_donation_with_valid_data(self, donor, campaign, payment):
        """Test creating donation with valid data."""
        donation = Donation.objects.create(
            donor=donor,
            campaign=campaign,
            amount=Decimal('500.00'),
            status='SUCCESS',
            payment=payment
        )
        assert donation.amount == Decimal('500.00')
        assert donation.donor == donor
        assert donation.campaign == campaign
        assert donation.payment == payment

    def test_donation_anonymous(self, campaign, payment):
        """Test anonymous donation."""
        donation = Donation.objects.create(
            campaign=campaign,
            amount=Decimal('500.00'),
            is_anonymous=True,
            donor_name='Anonymous',
            payment=payment
        )
        assert donation.is_anonymous is True
        assert donation.donor_name == 'Anonymous'

    def test_donation_with_message(self, donor, campaign, payment):
        """Test donation with message."""
        donation = Donation.objects.create(
            donor=donor,
            campaign=campaign,
            amount=Decimal('500.00'),
            message='Get well soon!',
            payment=payment
        )
        assert donation.message == 'Get well soon!'

    def test_donation_statuses(self, campaign, payment):
        """Test all donation statuses."""
        statuses = ['PENDING', 'SUCCESS', 'FAILED']
        for idx, status in enumerate(statuses):
            p = Payment.objects.create(
                payment_method='MTN',
                amount=Decimal('500.00')
            )
            donation = Donation.objects.create(
                campaign=campaign,
                amount=Decimal('500.00'),
                status=status,
                payment=p
            )
            assert donation.status == status

    def test_donation_default_status(self, campaign, payment):
        """Test default donation status is PENDING."""
        donation = Donation.objects.create(
            campaign=campaign,
            amount=Decimal('500.00'),
            payment=payment
        )
        assert donation.status == 'PENDING'

    def test_donation_timestamps(self, donor, campaign, payment):
        """Test donation timestamps."""
        donation = Donation.objects.create(
            donor=donor,
            campaign=campaign,
            amount=Decimal('500.00'),
            payment=payment
        )
        assert donation.created_at is not None
        assert donation.updated_at is not None

    def test_donation_string_representation(self, donor, campaign, payment):
        """Test __str__ method."""
        donation = Donation.objects.create(
            donor=donor,
            campaign=campaign,
            amount=Decimal('500.00'),
            donor_name='John Donor',
            payment=payment
        )
        expected = f"{donation.amount} XAF to {campaign.title} by John Donor"
        assert str(donation) == expected

    def test_donation_cascade_delete_with_campaign(self, donor, campaign, payment):
        """Test that donations are deleted when campaign is deleted."""
        donation = Donation.objects.create(
            donor=donor,
            campaign=campaign,
            amount=Decimal('500.00'),
            payment=payment
        )
        campaign_id = campaign.id
        campaign.delete()
        assert not Donation.objects.filter(campaign_id=campaign_id).exists()

    def test_donation_set_null_with_donor(self, donor, campaign, payment):
        """Test that donor is set to null when donor is deleted."""
        donation = Donation.objects.create(
            donor=donor,
            campaign=campaign,
            amount=Decimal('500.00'),
            payment=payment
        )
        donor_user = donor.user
        donor.delete()
        donation.refresh_from_db()
        assert donation.donor is None

    def test_donation_with_decimal_precision(self, campaign, payment):
        """Test decimal precision for amounts."""
        donation = Donation.objects.create(
            campaign=campaign,
            amount=Decimal('123.45'),
            payment=payment
        )
        assert donation.amount == Decimal('123.45')

    def test_donation_one_to_one_with_payment(self, campaign, payment):
        """Test one-to-one relationship with payment."""
        donation1 = Donation.objects.create(
            campaign=campaign,
            amount=Decimal('500.00'),
            payment=payment
        )
        
        # Try to create another donation with same payment
        with pytest.raises(Exception):  # IntegrityError
            Donation.objects.create(
                campaign=campaign,
                amount=Decimal('300.00'),
                payment=payment
            )
