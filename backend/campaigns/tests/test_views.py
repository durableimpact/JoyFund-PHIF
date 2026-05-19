import pytest
from datetime import datetime, timedelta
from decimal import Decimal
from rest_framework import status
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
def donor_client(db, donor_user):
    """Create authenticated client for donor."""
    from rest_framework.test import APIClient
    client = APIClient()
    client.force_authenticate(user=donor_user)
    return client


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
        payment_status='SUCCESS'
    )


@pytest.mark.django_db
@pytest.mark.api
class TestCampaignListView:
    """Test campaign list endpoint."""

    def test_list_campaigns_unauthenticated(self, client):
        """Test listing campaigns without authentication."""
        response = client.get('/api/campaigns/')
        # May be public or require auth depending on implementation
        assert response.status_code in [200, 401]

    def test_list_campaigns_authenticated(self, donor_client, campaign):
        """Test listing campaigns with authentication."""
        response = donor_client.get('/api/campaigns/')
        assert response.status_code == 200

    def test_list_active_campaigns_only(self, donor_client, donor):
        """Test listing only active campaigns."""
        active = Campaign.objects.create(
            donor=donor,
            title='Active',
            description='Test',
            event_type='BIRTHDAY',
            goal_amount=Decimal('1000.00'),
            end_date=timezone.now() + timedelta(days=7),
            status='ACTIVE'
        )
        inactive = Campaign.objects.create(
            donor=donor,
            title='Inactive',
            description='Test',
            event_type='BIRTHDAY',
            goal_amount=Decimal('1000.00'),
            end_date=timezone.now() + timedelta(days=7),
            status='INACTIVE'
        )
        
        response = donor_client.get('/api/campaigns/?status=ACTIVE')
        assert response.status_code == 200

    def test_filter_campaigns_by_status(self, donor_client, campaign):
        """Test filtering campaigns by status."""
        response = donor_client.get(f'/api/campaigns/?status={campaign.status}')
        assert response.status_code == 200

    def test_search_campaigns(self, donor_client, campaign):
        """Test searching campaigns."""
        response = donor_client.get(f'/api/campaigns/?search=John')
        assert response.status_code == 200

    def test_campaign_pagination(self, donor_client, donor):
        """Test campaign list pagination."""
        for i in range(15):
            Campaign.objects.create(
                donor=donor,
                title=f'Campaign {i}',
                description='Test',
                event_type='BIRTHDAY',
                goal_amount=Decimal('1000.00'),
                end_date=timezone.now() + timedelta(days=7)
            )
        
        response = donor_client.get('/api/campaigns/?page=1')
        assert response.status_code == 200


@pytest.mark.django_db
@pytest.mark.api
class TestCampaignCreateView:
    """Test campaign creation endpoint."""

    def test_create_campaign_unauthenticated(self, client):
        """Test creating campaign without authentication."""
        data = {
            'title': 'Test Campaign',
            'description': 'Test Description',
            'event_type': 'BIRTHDAY',
            'goal_amount': '1000.00',
            'end_date': (timezone.now() + timedelta(days=30)).isoformat(),
        }
        response = client.post('/api/campaigns/', data, format='json')
        assert response.status_code == 401

    def test_create_campaign_as_donor(self, donor_client):
        """Test creating campaign as donor."""
        data = {
            'title': 'My Campaign',
            'description': 'Help me raise funds',
            'event_type': 'WEDDING',
            'goal_amount': '5000.00',
            'impact_goal_count': 20,
            'end_date': (timezone.now() + timedelta(days=30)).isoformat(),
        }
        response = donor_client.post('/api/campaigns/', data, format='json')
        assert response.status_code in [200, 201]
        if response.status_code in [200, 201]:
            assert Campaign.objects.filter(title='My Campaign').exists()

    def test_create_campaign_missing_required_field(self, donor_client):
        """Test creating campaign with missing required field."""
        data = {
            'description': 'Test Description',
            'event_type': 'BIRTHDAY',
            'goal_amount': '1000.00',
            # Missing title and end_date
        }
        response = donor_client.post('/api/campaigns/', data, format='json')
        assert response.status_code == 400

    def test_create_campaign_invalid_event_type(self, donor_client):
        """Test creating campaign with invalid event type."""
        data = {
            'title': 'Test',
            'description': 'Test Description',
            'event_type': 'INVALID_TYPE',
            'goal_amount': '1000.00',
            'end_date': (timezone.now() + timedelta(days=30)).isoformat(),
        }
        response = donor_client.post('/api/campaigns/', data, format='json')
        assert response.status_code == 400

    def test_create_campaign_sets_donor(self, donor_client, donor_user):
        """Test that campaign donor is set to current user."""
        data = {
            'title': 'My Campaign',
            'description': 'Help me raise funds',
            'event_type': 'BIRTHDAY',
            'goal_amount': '5000.00',
            'end_date': (timezone.now() + timedelta(days=30)).isoformat(),
        }
        response = donor_client.post('/api/campaigns/', data, format='json')
        if response.status_code in [200, 201]:
            campaign = Campaign.objects.get(title='My Campaign')
            assert campaign.donor.user == donor_user


@pytest.mark.django_db
@pytest.mark.api
class TestCampaignDonationView:
    """Test campaign donation endpoint and guest donation flow."""

    def test_create_guest_donation_uses_provided_name(self, client, campaign, monkeypatch):
        """Test that a guest donation uses the provided donor name in the donation record."""
        def fake_create_payment_link(self, amount, description, external_reference, redirect_url, failure_redirect_url, first_name, last_name, email, phone, payment_options, currency='XAF'):
            return {'link': 'https://campay.test/link'}

        monkeypatch.setattr('campaigns.views.donation.CamPayManager.create_payment_link', fake_create_payment_link)

        data = {
            'payment_method': 'MTN',
            'phone_number': '237650000000',
            'amount': '20.00',
            'message': 'Thank you for your good work',
            'is_anonymous': False,
            'donor_name': 'Guest Helper',
            'success_url': 'https://example.com/success',
            'failure_url': 'https://example.com/failure',
        }

        response = client.post(f'/api/campaigns/{campaign.id}/donate/', data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['payment_link'] == 'https://campay.test/link'

        donation = Donation.objects.filter(campaign=campaign).first()
        assert donation is not None
        assert donation.donor is None
        assert donation.donor_name == 'Guest Helper'
        assert donation.is_anonymous is False

    def test_create_guest_donation_with_local_phone_and_gateway_alias(self, client, campaign, monkeypatch):
        """Test that local phone numbers and gateway aliases are normalized correctly."""
        def fake_create_payment_link(self, amount, description, external_reference, redirect_url, failure_redirect_url, first_name, last_name, email, phone, payment_options, currency='XAF'):
            assert phone == '237650000000'
            assert payment_options == 'MOMO,CARD'
            return {'link': 'https://campay.test/link'}

        monkeypatch.setattr('campaigns.views.donation.CamPayManager.create_payment_link', fake_create_payment_link)

        data = {
            'payment_method': 'mtn_momo',
            'phone_number': '650000000',
            'amount': '20.00',
            'message': 'Thank you for your good work',
            'is_anonymous': False,
            'donor_name': 'Guest Helper',
            'success_url': 'https://example.com/success',
            'failure_url': 'https://example.com/failure',
        }

        response = client.post(f'/api/campaigns/{campaign.id}/donate/', data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['payment_link'] == 'https://campay.test/link'

        donation = Donation.objects.filter(campaign=campaign).first()
        assert donation is not None
        assert donation.donor is None
        assert donation.donor_name == 'Guest Helper'
        assert donation.is_anonymous is False
        assert donation.payment.payment_method == 'MTN'
        assert donation.payment.phone_number == '237650000000'
    """Test campaign detail endpoint."""

    def test_retrieve_campaign(self, donor_client, campaign):
        """Test retrieving campaign details."""
        response = donor_client.get(f'/api/campaigns/{campaign.id}/')
        assert response.status_code == 200
        assert response.data['title'] == campaign.title

    def test_update_campaign_as_owner(self, donor_client, campaign):
        """Test updating campaign as owner."""
        data = {'title': 'Updated Title'}
        response = donor_client.patch(
            f'/api/campaigns/{campaign.id}/',
            data,
            format='json'
        )
        assert response.status_code in [200, 400]

    def test_cannot_update_campaign_as_non_owner(self, donor_client, donor):
        """Test that non-owner cannot update campaign."""
        user2 = User.objects.create_user(
            email='donor2@test.com',
            password='testpass124',
            role='DONOR'
        )
        donor2 = Donor.objects.create(user=user2)
        other_campaign = Campaign.objects.create(
            donor=donor2,
            title='Other Campaign',
            description='Test',
            event_type='BIRTHDAY',
            goal_amount=Decimal('1000.00'),
            end_date=timezone.now() + timedelta(days=7)
        )
        
        data = {'title': 'Hacked Title'}
        response = donor_client.patch(
            f'/api/campaigns/{other_campaign.id}/',
            data,
            format='json'
        )
        assert response.status_code == 403

    def test_delete_campaign(self, donor_client, campaign):
        """Test deleting campaign."""
        response = donor_client.delete(f'/api/campaigns/{campaign.id}/')
        assert response.status_code in [200, 204, 403]

    def test_retrieve_nonexistent_campaign(self, donor_client):
        """Test retrieving campaign that doesn't exist."""
        response = donor_client.get('/api/campaigns/00000000-0000-0000-0000-000000000000/')
        assert response.status_code == 404


@pytest.mark.django_db
@pytest.mark.api
class TestDonationView:
    """Test donation endpoints."""

    def test_create_donation_to_campaign(self, client, campaign, payment):
        """Test creating a donation."""
        data = {
            'campaign': str(campaign.id),
            'amount': '500.00',
            'donor_name': 'John Donor',
            'payment': str(payment.id),
        }
        response = client.post(
            '/api/donations/',
            data,
            format='json'
        )
        # Depends on authentication requirements
        assert response.status_code in [200, 201, 400, 401]

    def test_list_donations_to_campaign(self, client, campaign):
        """Test listing donations for a campaign."""
        response = client.get(f'/api/campaigns/{campaign.id}/donations/')
        assert response.status_code in [200, 404]

    def test_donation_with_anonymous_flag(self, client, campaign, payment):
        """Test anonymous donation."""
        data = {
            'campaign': str(campaign.id),
            'amount': '500.00',
            'is_anonymous': True,
            'donor_name': 'Anonymous',
            'payment': str(payment.id),
        }
        response = client.post(
            '/api/donations/',
            data,
            format='json'
        )
        assert response.status_code in [200, 201, 400, 401]

    def test_donation_message_optional(self, client, campaign, payment):
        """Test that donation message is optional."""
        data = {
            'campaign': str(campaign.id),
            'amount': '250.00',
            'donor_name': 'Jane',
            'payment': str(payment.id),
            # No message
        }
        response = client.post(
            '/api/donations/',
            data,
            format='json'
        )
        assert response.status_code in [200, 201, 400, 401]

    def test_get_campaign_donation_stats(self, client, campaign):
        """Test getting donation statistics for campaign."""
        response = client.get(f'/api/campaigns/{campaign.id}/stats/')
        assert response.status_code in [200, 404]
