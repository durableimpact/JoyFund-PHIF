import pytest
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta
from campaigns.models import Campaign, Donation, Payment

@pytest.fixture
def donor(db):
    from accounts.models import Donor
    from django.contrib.auth import get_user_model
    User = get_user_model()
    user = User.objects.create_user(email='leader@test.com', password='password123', role='DONOR')
    return Donor.objects.create(user=user)

@pytest.fixture
def campaigns(db, donor):
    c1 = Campaign.objects.create(
        donor=donor,
        title='Campaign 1',
        description='Desc 1',
        event_type='BIRTHDAY',
        goal_amount=Decimal('10000.00'),
        end_date=timezone.now() + timedelta(days=30),
        status='ACTIVE',
        is_public=True,
        is_active=True
    )
    c2 = Campaign.objects.create(
        donor=donor,
        title='Campaign 2',
        description='Desc 2',
        event_type='BIRTHDAY',
        goal_amount=Decimal('10000.00'),
        end_date=timezone.now() + timedelta(days=30),
        status='ACTIVE',
        is_public=True,
        is_active=True
    )
    c3 = Campaign.objects.create(
        donor=donor,
        title='Campaign 3',
        description='Desc 3',
        event_type='BIRTHDAY',
        goal_amount=Decimal('10000.00'),
        end_date=timezone.now() + timedelta(days=30),
        status='ACTIVE',
        is_public=True,
        is_active=True
    )
    return [c1, c2, c3]

def create_donation(campaign, amount, status='SUCCESS'):
    payment = Payment.objects.create(
        amount=amount,
        app_amount=amount, # Ensure app_amount matches so net_amount is calculated correctly
        payment_status=status,
        payment_method='MTN',
        phone_number='237600000000'
    )
    donation = Donation.objects.create(
        campaign=campaign,
        amount=amount,
        status=status,
        payment=payment
    )
    return donation

@pytest.mark.django_db
def test_leaderboard_sorting(client, campaigns):
    # Campaign 1: 1000 total (roughly, net will be 950)
    create_donation(campaigns[0], Decimal('1000.00'))
    
    # Campaign 2: 2000 total
    create_donation(campaigns[1], Decimal('2000.00'))
    
    # Campaign 3: 500 total
    create_donation(campaigns[2], Decimal('500.00'))
    
    response = client.get('/api/campaigns/leaderboard/')
    assert response.status_code == 200
    
    data = response.data
    results = data.get('results', data)
    
    assert len(results) == 3
    # Sorted by total_net_raised descending: C2, C1, C3
    assert results[0]['id'] == str(campaigns[1].id)
    assert results[1]['id'] == str(campaigns[0].id)
    assert results[2]['id'] == str(campaigns[2].id)
    
    # Check if total_net_raised is present in response and accurate
    # 2000 * 0.95 = 1900
    assert float(results[0]['total_net_raised']) == 1900.0

@pytest.mark.django_db
def test_leaderboard_excludes_private_or_inactive(client, donor):
    # Public active
    Campaign.objects.create(
        donor=donor,
        title='Public Active',
        description='Test',
        event_type='BIRTHDAY',
        goal_amount=Decimal('1000.00'),
        end_date=timezone.now() + timedelta(days=7),
        is_public=True,
        is_active=True,
        status='ACTIVE'
    )
    # Private
    Campaign.objects.create(
        donor=donor,
        title='Private',
        description='Test',
        event_type='BIRTHDAY',
        goal_amount=Decimal('1000.00'),
        end_date=timezone.now() + timedelta(days=7),
        is_public=False,
        is_active=True,
        status='ACTIVE'
    )
    # Inactive
    Campaign.objects.create(
        donor=donor,
        title='Inactive',
        description='Test',
        event_type='BIRTHDAY',
        goal_amount=Decimal('1000.00'),
        end_date=timezone.now() + timedelta(days=7),
        is_public=True,
        is_active=False,
        status='ACTIVE'
    )
    
    response = client.get('/api/campaigns/leaderboard/')
    assert response.status_code == 200
    results = response.data.get('results', response.data)
    assert len(results) == 1
    assert results[0]['title'] == 'Public Active'
