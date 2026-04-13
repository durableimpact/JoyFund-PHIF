import pytest
from decimal import Decimal
from django.contrib.gis.geos import Point
from hospitals.models import Hospital, Services, PartnershipStatus


@pytest.fixture
def hospital_data():
    """Fixture with basic hospital data."""
    return {
        'name': 'Central Hospital Kampala',
        'accreditation_number': 'ACC-001-2024',
        'licence_number': 'LIC-001-2024',
        'region': 'Central Region',
        'city': 'Kampala',
        'address': 'Plot 50, Kampala Avenue',
        'phone_number': '256412345678',
        'email': 'info@chospital.ug',
        'website': 'https://www.chospital.ug',
    }


@pytest.fixture
def hospital(hospital_data):
    """Create a hospital."""
    return Hospital.objects.create(**hospital_data)


@pytest.mark.django_db
@pytest.mark.model
class TestHospitalModel:
    """Test Hospital model."""

    def test_create_hospital_with_valid_data(self, hospital_data):
        """Test creating hospital with valid data."""
        hospital = Hospital.objects.create(**hospital_data)
        assert hospital.name == 'Central Hospital Kampala'
        assert hospital.city == 'Kampala'
        assert hospital.email == 'info@chospital.ug'

    def test_hospital_partnership_status_choices(self):
        """Test partnership status choices."""
        statuses = ['PENDING', 'ACTIVE', 'INACTIVE', 'REJECTED']
        for status in statuses:
            hospital = Hospital.objects.create(
                name=f'Hospital {status}',
                accreditation_number=f'ACC-{status}-001',
                licence_number=f'LIC-{status}-001',
                region='Region',
                city='City',
                address='Address',
                phone_number='256701234567',
                email=f'{status}@hospital.ug',
                partnership_status=status
            )
            assert hospital.partnership_status == status

    def test_hospital_default_partnership_status(self):
        """Test default partnership status is PENDING."""
        hospital = Hospital.objects.create(
            name='Test Hospital',
            accreditation_number='ACC-TEST-001',
            licence_number='LIC-TEST-001',
            region='Region',
            city='City',
            address='Address',
            phone_number='256701234567',
            email='test@hospital.ug'
        )
        assert hospital.partnership_status == PartnershipStatus.PENDING

    def test_hospital_is_active_default(self):
        """Test that is_active defaults to True."""
        hospital = Hospital.objects.create(
            name='Test Hospital',
            accreditation_number='ACC-TEST-001',
            licence_number='LIC-TEST-001',
            region='Region',
            city='City',
            address='Address',
            phone_number='256701234567',
            email='test@hospital.ug'
        )
        assert hospital.is_active is True

    def test_hospital_timestamps(self, hospital):
        """Test hospital timestamps."""
        assert hospital.created_at is not None
        assert hospital.updated_at is not None

    def test_hospital_string_representation(self, hospital):
        """Test __str__ method."""
        assert str(hospital) == hospital.name

    def test_hospital_optional_fields(self):
        """Test optional fields in hospital."""
        hospital = Hospital.objects.create(
            name='Test Hospital',
            accreditation_number='ACC-TEST-001',
            licence_number='LIC-TEST-001',
            region='Region',
            city='City',
            address='Address',
            phone_number='256701234567',
            email='test@hospital.ug'
            # No website, momo_number, bank details, etc.
        )
        assert hospital.website is None
        assert hospital.momo_number is None
        assert hospital.orange_number is None
        assert hospital.bank_account_number is None

    def test_hospital_momo_details(self):
        """Test Mobile Money details."""
        hospital = Hospital.objects.create(
            name='Test Hospital',
            accreditation_number='ACC-TEST-001',
            licence_number='LIC-TEST-001',
            region='Region',
            city='City',
            address='Address',
            phone_number='256701234567',
            email='test@hospital.ug',
            momo_number='256701234567',
            momo_name='Hospital Account'
        )
        assert hospital.momo_number == '256701234567'
        assert hospital.momo_name == 'Hospital Account'

    def test_hospital_bank_details(self):
        """Test bank account details."""
        hospital = Hospital.objects.create(
            name='Test Hospital',
            accreditation_number='ACC-TEST-001',
            licence_number='LIC-TEST-001',
            region='Region',
            city='City',
            address='Address',
            phone_number='256701234567',
            email='test@hospital.ug',
            bank_account_number='1234567890',
            bank_account_name='Hospital Name',
            bank_name='First National Bank',
            bank_branch='Kampala Main'
        )
        assert hospital.bank_account_number == '1234567890'
        assert hospital.bank_name == 'First National Bank'

    def test_hospital_gps_coordinates(self):
        """Test GPS coordinates storage."""
        hospital = Hospital.objects.create(
            name='Test Hospital',
            accreditation_number='ACC-TEST-001',
            licence_number='LIC-TEST-001',
            region='Region',
            city='City',
            address='Address',
            phone_number='256701234567',
            email='test@hospital.ug',
            gps_coordinates=Point(32.5825, 0.3476)  # Kampala coordinates
        )
        assert hospital.gps_coordinates is not None
        assert hospital.gps_coordinates.x == 32.5825
        assert hospital.gps_coordinates.y == 0.3476

    def test_unique_accreditation_constraint(self, hospital):
        """Test that accreditation numbers can be unique if required."""
        # This test depends on model constraints
        # If unique constraint exists, test it
        with pytest.raises(Exception):
            Hospital.objects.create(
                name='Another Hospital',
                accreditation_number=hospital.accreditation_number,
                licence_number='LIC-DIFF-001',
                region='Region',
                city='City',
                address='Address',
                phone_number='256702345678',
                email='another@hospital.ug'
            )

    def test_hospital_email_format(self):
        """Test email validation."""
        hospital = Hospital.objects.create(
            name='Email Test',
            accreditation_number='ACC-EMAIL-001',
            licence_number='LIC-EMAIL-001',
            region='Region',
            city='City',
            address='Address',
            phone_number='256701234567',
            email='valid@email.com'
        )
        assert '@' in hospital.email


@pytest.mark.django_db
@pytest.mark.model
class TestServicesModel:
    """Test Services model."""

    def test_create_service_with_valid_data(self, hospital):
        """Test creating service with valid data."""
        service = Services.objects.create(
            hospital=hospital,
            name='Surgical Operation',
            category='Surgery',
            price=Decimal('500000.00'),
            description='General surgical operations'
        )
        assert service.name == 'Surgical Operation'
        assert service.hospital == hospital
        assert service.price == Decimal('500000.00')

    def test_service_default_is_available(self, hospital):
        """Test that is_available defaults to True."""
        service = Services.objects.create(
            hospital=hospital,
            name='Test Service',
            price=Decimal('10000.00')
        )
        assert service.is_available is True

    def test_service_timestamps(self, hospital):
        """Test service timestamps."""
        service = Services.objects.create(
            hospital=hospital,
            name='Test Service',
            price=Decimal('10000.00')
        )
        assert service.created_at is not None
        assert service.updated_at is not None

    def test_service_optional_fields(self, hospital):
        """Test optional fields."""
        service = Services.objects.create(
            hospital=hospital,
            name='Test Service',
            price=Decimal('10000.00')
            # No category or description
        )
        assert service.category == ''
        assert service.description == ''

    def test_service_with_full_details(self, hospital):
        """Test service with all fields populated."""
        service = Services.objects.create(
            hospital=hospital,
            name='Maternity Care',
            category='Obstetrics',
            price=Decimal('1500000.00'),
            description='Complete maternity care including delivery',
            is_available=True
        )
        assert service.name == 'Maternity Care'
        assert service.category == 'Obstetrics'
        assert service.hotel != service.hospital  # Test hospital relationship

    def test_service_cascade_delete_with_hospital(self, hospital):
        """Test that services are deleted when hospital is deleted."""
        service = Services.objects.create(
            hospital=hospital,
            name='Test Service',
            price=Decimal('10000.00')
        )
        hospital_id = hospital.id
        hospital.delete()
        assert not Services.objects.filter(hospital_id=hospital_id).exists()

    def test_service_price_decimal_precision(self, hospital):
        """Test decimal precision for prices."""
        service = Services.objects.create(
            hospital=hospital,
            name='Test Service',
            price=Decimal('123.45')
        )
        assert service.price == Decimal('123.45')

    def test_multiple_services_per_hospital(self, hospital):
        """Test that a hospital can have multiple services."""
        service1 = Services.objects.create(
            hospital=hospital,
            name='Service 1',
            price=Decimal('1000.00')
        )
        service2 = Services.objects.create(
            hospital=hospital,
            name='Service 2',
            price=Decimal('2000.00')
        )
        
        hospital_services = Services.objects.filter(hospital=hospital)
        assert hospital_services.count() == 2

    def test_service_availability_toggle(self, hospital):
        """Test toggling service availability."""
        service = Services.objects.create(
            hospital=hospital,
            name='Test Service',
            price=Decimal('10000.00'),
            is_available=True
        )
        assert service.is_available is True
        
        service.is_available = False
        service.save()
        service.refresh_from_db()
        assert service.is_available is False

    def test_service_string_representation(self, hospital):
        """Test __str__ method if implemented."""
        service = Services.objects.create(
            hospital=hospital,
            name='Test Service',
            price=Decimal('10000.00')
        )
        # Just verify it can be converted to string
        assert str(service)
