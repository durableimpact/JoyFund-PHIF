"""
Global pytest configuration and fixtures for JoyFund testing.

Provides:
- Django test setup
- Common test fixtures (users, auth tokens, etc.)
- Test factories
- Database fixtures
"""

import pytest
from django.contrib.auth import get_user_model
from django.test import Client
from faker import Faker
from oauth2_provider.models import Application, AccessToken
from datetime import timedelta
from django.utils import timezone

User = get_user_model()
fake = Faker()


# ============================================================================
# Database and Django Setup
# ============================================================================

@pytest.fixture(scope='session')
def django_db_setup(django_db_setup, django_db_blocker):
    """Configure Django database for testing."""
    with django_db_blocker.unblock():
        pass


@pytest.fixture
def db_with_oauth_app(db):
    """Create OAuth2 application for token-based tests."""
    app = Application.objects.create(
        name='Test Client',
        client_type=Application.CLIENT_CONFIDENTIAL,
        authorization_grant_type=Application.GRANT_PASSWORD,
        client_id='test-client-id',
        client_secret='test-client-secret',
    )
    return app


# ============================================================================
# User Fixtures
# ============================================================================

@pytest.fixture
def donor_user(db):
    """Create a donor user."""
    user = User.objects.create_user(
        email='donor@example.com',
        password='testpass123',
        first_name='John',
        last_name='Donor',
        phone_number='+237670123456',
        role='DONOR',
        is_verified=True,
        is_active=True,
    )
    return user


@pytest.fixture
def hospital_admin_user(db):
    """Create a hospital admin user."""
    user = User.objects.create_user(
        email='hospital.admin@example.com',
        password='testpass123',
        first_name='Admin',
        last_name='Hospital',
        phone_number='+237671234567',
        role='HOSPITAL_ADMIN',
        is_verified=True,
        is_active=True,
    )
    return user


@pytest.fixture
def system_admin_user(db):
    """Create a system admin user."""
    user = User.objects.create_superuser(
        email='admin@example.com',
        password='testpass123',
        first_name='System',
        last_name='Admin',
        phone_number='+237672345678',
    )
    return user


@pytest.fixture
def receptionist_user(db):
    """Create a receptionist user."""
    user = User.objects.create_user(
        email='receptionist@example.com',
        password='testpass123',
        first_name='Receptionist',
        last_name='Test',
        phone_number='+237673456789',
        role='RECEPTIONIST',
        is_verified=True,
        is_active=True,
    )
    return user


@pytest.fixture
def social_worker_user(db):
    """Create a social worker user."""
    user = User.objects.create_user(
        email='worker@example.com',
        password='testpass123',
        first_name='Social',
        last_name='Worker',
        phone_number='+237674567890',
        role='SOCIAL_WORKER',
        is_verified=True,
        is_active=True,
    )
    return user


# ============================================================================
# Authentication Fixtures
# ============================================================================

@pytest.fixture
def access_token(db_with_oauth_app, donor_user):
    """Create a valid OAuth2 access token."""
    token = AccessToken.objects.create(
        user=donor_user,
        token='test-access-token-valid',
        application=db_with_oauth_app,
        expires=timezone.now() + timedelta(hours=1),
        scope='read write',
    )
    return token


@pytest.fixture
def expired_token(db_with_oauth_app, donor_user):
    """Create an expired OAuth2 access token."""
    token = AccessToken.objects.create(
        user=donor_user,
        token='test-access-token-expired',
        application=db_with_oauth_app,
        expires=timezone.now() - timedelta(hours=1),
        scope='read write',
    )
    return token


@pytest.fixture
def admin_access_token(db_with_oauth_app, system_admin_user):
    """Create a valid OAuth2 access token for admin."""
    token = AccessToken.objects.create(
        user=system_admin_user,
        token='test-access-token-admin',
        application=db_with_oauth_app,
        expires=timezone.now() + timedelta(hours=1),
        scope='read write',
    )
    return token


# ============================================================================
# Client Fixtures
# ============================================================================

@pytest.fixture
def client():
    """Django test client."""
    return Client()


@pytest.fixture
def authenticated_client(client, access_token):
    """Django test client with authentication header."""
    client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {access_token.token}'
    return client


@pytest.fixture
def admin_client(client, admin_access_token):
    """Django test client with admin authentication."""
    client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {admin_access_token.token}'
    return client


# ============================================================================
# Faker Fixtures for Data Generation
# ============================================================================

@pytest.fixture
def fake_email():
    """Generate a fake email."""
    return fake.email()


@pytest.fixture
def fake_phone():
    """Generate a fake phone number with Cameroon format."""
    return f'+237{fake.numerify("########")}'


@pytest.fixture
def fake_name():
    """Generate a fake full name."""
    return fake.name()


@pytest.fixture
def fake_text():
    """Generate fake text."""
    return fake.text(max_nb_chars=200)


# ============================================================================
# Common Test Data
# ============================================================================

@pytest.fixture
def valid_user_data():
    """Valid user creation data."""
    return {
        'email': 'newuser@example.com',
        'password': 'SecurePassword123!',
        'first_name': 'Test',
        'last_name': 'User',
        'phone_number': '+237675678901',
        'role': 'DONOR',
    }


@pytest.fixture
def invalid_user_data():
    """Invalid user data for validation testing."""
    return {
        'email': 'invalid-email',
        'password': '123',
        'first_name': '',
        'last_name': '',
        'phone_number': 'invalid-phone',
    }


# ============================================================================
# Profile Fixtures
# ============================================================================

@pytest.fixture
def system_admin_profile(db, system_admin_user):
    """Create a system admin profile."""
    from accounts.models import SystemAdmin
    admin_profile = SystemAdmin.objects.create(
        user=system_admin_user,
    )
    return admin_profile


@pytest.fixture
def social_worker_profile(db, social_worker_user, system_admin_profile):
    """Create a social worker profile."""
    from accounts.models import SocialWorker
    worker_profile = SocialWorker.objects.create(
        user=social_worker_user,
        organization='Test Organization',
        region_assigned='Test Region',
        enrolled_by=system_admin_profile,
        national_id_number='CM1234567890',
        is_approved=True,
    )
    return worker_profile


@pytest.fixture
def hospital_admin_profile(db, hospital_admin_user):
    """Create a hospital admin profile."""
    from accounts.models import HospitalAdmin
    admin_profile = HospitalAdmin.objects.create(
        user=hospital_admin_user,
    )
    return admin_profile


@pytest.fixture
def donor_profile(db, donor_user):
    """Create a donor profile."""
    from accounts.models import Donor
    donor = Donor.objects.create(
        user=donor_user,
    )
    return donor


@pytest.fixture
def receptionist_profile(db, receptionist_user):
    """Create a receptionist profile."""
    from accounts.models import Receptionist
    receptionist = Receptionist.objects.create(
        user=receptionist_user,
    )
    return receptionist


# ============================================================================
# Marker Configuration
# ============================================================================

def pytest_configure(config):
    """Register custom markers."""
    config.addinivalue_line('markers', 'slow: slow tests')
    config.addinivalue_line('markers', 'integration: integration tests')
    config.addinivalue_line('markers', 'unit: unit tests')
    config.addinivalue_line('markers', 'api: API endpoint tests')
    config.addinivalue_line('markers', 'model: model tests')
    config.addinivalue_line('markers', 'serializer: serializer tests')
    config.addinivalue_line('markers', 'signal: signal tests')
    config.addinivalue_line('markers', 'task: celery task tests')
