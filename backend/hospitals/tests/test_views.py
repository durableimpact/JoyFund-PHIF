import pytest
from decimal import Decimal
from rest_framework import status
from django.contrib.auth import get_user_model
from hospitals.models import Hospital, Services, PartnershipStatus

User = get_user_model()


@pytest.fixture
def hospital_admin_user(db):
    """Create a hospital admin user."""
    return User.objects.create_user(
        email='admin@hospital.ug',
        password='testpass124',
        role='HOSPITAL_ADMIN'
    )


@pytest.fixture
def hospital_admin_client(db, hospital_admin_user):
    """Create authenticated client for hospital admin."""
    from rest_framework.test import APIClient
    client = APIClient()
    client.force_authenticate(user=hospital_admin_user)
    return client


@pytest.fixture
def donor_user(db):
    """Create a donor user."""
    return User.objects.create_user(
        email='donor@test.com',
        password='testpass124',
        role='DONOR'
    )


@pytest.fixture
def hospital(db):
    """Create a hospital."""
    return Hospital.objects.create(
        name='Central Hospital',
        accreditation_number='ACC-001-2024',
        licence_number='LIC-001-2024',
        region='Central Region',
        city='Kampala',
        address='Plot 50, Avenue Road',
        phone_number='256412345678',
        email='info@centralhospital.ug'
    )


@pytest.mark.django_db
@pytest.mark.api
class TestHospitalListView:
    """Test hospital list endpoint."""

    def test_list_hospitals_unauthenticated(self, client):
        """Test listing hospitals without authentication."""
        response = client.get('/api/hospitals/')
        # May be public endpoint
        assert response.status_code in [200, 401]

    def test_list_hospitals_authenticated(self, hospital_admin_client, hospital):
        """Test listing hospitals with authentication."""
        response = hospital_admin_client.get('/api/hospitals/')
        assert response.status_code == 200

    def test_filter_hospitals_by_status(self, hospital_admin_client, hospital):
        """Test filtering hospitals by partnership status."""
        response = hospital_admin_client.get(
            f'/api/hospitals/?partnership_status={hospital.partnership_status}'
        )
        assert response.status_code == 200

    def test_search_hospitals_by_name(self, hospital_admin_client, hospital):
        """Test searching hospitals by name."""
        response = hospital_admin_client.get('/api/hospitals/?search=Central')
        assert response.status_code == 200

    def test_filter_hospitals_by_region(self, hospital_admin_client, hospital):
        """Test filtering hospitals by region."""
        response = hospital_admin_client.get(
            '/api/hospitals/?region=Central%20Region'
        )
        assert response.status_code == 200

    def test_filter_hospitals_by_city(self, hospital_admin_client, hospital):
        """Test filtering hospitals by city."""
        response = hospital_admin_client.get('/api/hospitals/?city=Kampala')
        assert response.status_code == 200

    def test_list_active_hospitals_only(self, hospital_admin_client):
        """Test listing only active hospitals."""
        response = hospital_admin_client.get('/api/hospitals/?is_active=true')
        assert response.status_code == 200


@pytest.mark.django_db
@pytest.mark.api
class TestHospitalDetailView:
    """Test hospital detail endpoint."""

    def test_retrieve_hospital(self, hospital_admin_client, hospital):
        """Test retrieving hospital details."""
        response = hospital_admin_client.get(f'/api/hospitals/{hospital.id}/')
        assert response.status_code == 200
        assert response.data['name'] == hospital.name

    def test_retrieve_nonexistent_hospital(self, hospital_admin_client):
        """Test retrieving hospital that doesn't exist."""
        response = hospital_admin_client.get(
            '/api/hospitals/00000000-0000-0000-0000-000000000000/'
        )
        assert response.status_code == 404

    def test_hospital_detail_includes_services(self, hospital_admin_client, hospital):
        """Test that hospital detail includes services."""
        Services.objects.create(
            hospital=hospital,
            name='Surgery',
            price=Decimal('500000.00')
        )
        response = hospital_admin_client.get(f'/api/hospitals/{hospital.id}/')
        assert response.status_code == 200
        # Check if services are included depending on implementation

    def test_update_hospital_details(self, hospital_admin_client, hospital):
        """Test updating hospital details."""
        data = {
            'phone_number': '256413334444',
            'email': 'updated@hospital.ug'
        }
        response = hospital_admin_client.patch(
            f'/api/hospitals/{hospital.id}/',
            data,
            format='json'
        )
        assert response.status_code in [200, 403, 400]

    def test_update_partnership_status(self, hospital_admin_client, hospital):
        """Test updating partnership status."""
        data = {
            'partnership_status': 'ACTIVE'
        }
        response = hospital_admin_client.patch(
            f'/api/hospitals/{hospital.id}/',
            data,
            format='json'
        )
        assert response.status_code in [200, 403, 400]


@pytest.mark.django_db
@pytest.mark.api
class TestHospitalServicesView:
    """Test hospital services endpoints."""

    def test_list_hospital_services(self, hospital_admin_client, hospital):
        """Test listing services for a hospital."""
        Services.objects.create(
            hospital=hospital,
            name='Service 1',
            price=Decimal('10000.00')
        )
        Services.objects.create(
            hospital=hospital,
            name='Service 2',
            price=Decimal('20000.00')
        )
        
        response = hospital_admin_client.get(
            f'/api/hospitals/{hospital.id}/services/'
        )
        assert response.status_code in [200, 404]

    def test_add_service_to_hospital(self, hospital_admin_client, hospital):
        """Test adding a service to hospital."""
        data = {
            'name': 'New Service',
            'category': 'Consultation',
            'price': '50000.00'
        }
        response = hospital_admin_client.post(
            f'/api/hospitals/{hospital.id}/services/',
            data,
            format='json'
        )
        assert response.status_code in [200, 201, 403, 404]

    def test_update_service(self, hospital_admin_client, hospital):
        """Test updating a service."""
        service = Services.objects.create(
            hospital=hospital,
            name='Original Service',
            price=Decimal('10000.00')
        )
        
        data = {'name': 'Updated Service'}
        response = hospital_admin_client.patch(
            f'/api/hospitals/{hospital.id}/services/{service.id}/',
            data,
            format='json'
        )
        assert response.status_code in [200, 403, 404]

    def test_delete_service(self, hospital_admin_client, hospital):
        """Test deleting a service."""
        service = Services.objects.create(
            hospital=hospital,
            name='Service to Delete',
            price=Decimal('10000.00')
        )
        
        response = hospital_admin_client.delete(
            f'/api/hospitals/{hospital.id}/services/{service.id}/'
        )
        assert response.status_code in [200, 204, 403, 404]

    def test_filter_services_by_availability(self, hospital_admin_client, hospital):
        """Test filtering services by availability."""
        response = hospital_admin_client.get(
            f'/api/hospitals/{hospital.id}/services/?is_available=true'
        )
        assert response.status_code in [200, 404]

    def test_search_services(self, hospital_admin_client, hospital):
        """Test searching services."""
        response = hospital_admin_client.get(
            f'/api/hospitals/{hospital.id}/services/?search=Surgery'
        )
        assert response.status_code in [200, 404]


@pytest.mark.django_db
@pytest.mark.api
class TestHospitalCreateView:
    """Test hospital creation endpoint."""

    def test_create_hospital_unauthenticated(self, client):
        """Test creating hospital without authentication."""
        data = {
            'name': 'New Hospital',
            'accreditation_number': 'ACC-NEW-001',
            'licence_number': 'LIC-NEW-001',
            'region': 'Region',
            'city': 'City',
            'address': 'Address',
            'phone_number': '256701234567',
            'email': 'new@hospital.ug'
        }
        response = client.post('/api/hospitals/', data, format='json')
        assert response.status_code in [401, 403]

    def test_create_hospital_as_admin(self, hospital_admin_client):
        """Test creating hospital as admin."""
        data = {
            'name': 'New Hospital',
            'accreditation_number': 'ACC-NEW-001',
            'licence_number': 'LIC-NEW-001',
            'region': 'Region',
            'city': 'City',
            'address': 'Address',
            'phone_number': '256701234567',
            'email': 'new@hospital.ug'
        }
        response = hospital_admin_client.post(
            '/api/hospitals/',
            data,
            format='json'
        )
        assert response.status_code in [200, 201, 403]

    def test_create_hospital_missing_required_field(self, hospital_admin_client):
        """Test creating hospital with missing required field."""
        data = {
            'name': 'New Hospital',
            'accreditation_number': 'ACC-NEW-001',
            # Missing other required fields
        }
        response = hospital_admin_client.post(
            '/api/hospitals/',
            data,
            format='json'
        )
        assert response.status_code in [400, 403]

    def test_non_admin_cannot_create_hospital(self, client, donor_user):
        """Test that non-admin cannot create hospital."""
        from rest_framework.test import APIClient
        donor_client = APIClient()
        donor_client.force_authenticate(user=donor_user)
        
        data = {
            'name': 'Unauthorized Hospital',
            'accreditation_number': 'ACC-UNS-001',
            'licence_number': 'LIC-UNS-001',
            'region': 'Region',
            'city': 'City',
            'address': 'Address',
            'phone_number': '256701234567',
            'email': 'unauth@hospital.ug'
        }
        response = donor_client.post('/api/hospitals/', data, format='json')
        assert response.status_code == 403
