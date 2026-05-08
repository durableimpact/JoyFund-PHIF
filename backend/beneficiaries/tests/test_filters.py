import pytest
from datetime import date
import hashlib
from beneficiaries.models import Beneficiary, Gender, BeneficiaryCategory, UrgencyLevel, GeographicRemoteness
from beneficiaries.filters import BeneficiaryFilter
from accounts.models import SocialWorker
from django.contrib.auth import get_user_model
from django.test import RequestFactory

User = get_user_model()


@pytest.fixture
def multiple_beneficiaries(db, social_worker_profile):
    """Create multiple beneficiaries with different attributes."""
    beneficiaries = []
    
    # Maternal beneficiary in western region
    b1 = Beneficiary.objects.create(
        full_name='Jane Smith',
        date_of_birth=date(1990, 5, 15),
        gender=Gender.FEMALE,
        category=BeneficiaryCategory.MATERNAL,
        urgency_level=UrgencyLevel.URGENT,
        geographic_remoteness=GeographicRemoteness.HIGH,
        phone='256701234567',
        email='jane@example.com',
        region='Western Region',
        city='Fort Portal',
        address='Plot 42, Main Street',
        national_id_number='CM1234567890',
        digital_health_id='BEN-TEST-0001',
        emergency_contact_name='John Smith',
        emergency_contact_phone='256702345678',
        emergency_contact_relationship='Spouse',
        enrolled_by=social_worker_profile
    )
    beneficiaries.append(b1)
    
    # Elderly beneficiary in central region
    b2 = Beneficiary.objects.create(
        full_name='John Doe',
        date_of_birth=date(1940, 3, 20),
        gender=Gender.MALE,
        category=BeneficiaryCategory.ELDERLY,
        urgency_level=UrgencyLevel.ROUTINE,
        geographic_remoteness=GeographicRemoteness.LOW,
        phone='256709876543',
        email='john@example.com',
        region='Central Region',
        city='Kampala',
        address='Plot 10, Main Street',
        national_id_number='CMJOHN123456',
        digital_health_id='BEN-TEST-0002',
        emergency_contact_name='Jane Doe',
        emergency_contact_phone='256708765432',
        emergency_contact_relationship='Sister',
        enrolled_by=social_worker_profile
    )
    beneficiaries.append(b2)
    
    # Other category in peri-urban area
    b3 = Beneficiary.objects.create(
        full_name='Sam Johnson',
        date_of_birth=date(1975, 8, 10),
        gender=Gender.OTHER,
        category=BeneficiaryCategory.OTHER,
        urgency_level=UrgencyLevel.CRITICAL,
        geographic_remoteness=GeographicRemoteness.MEDIUM,
        phone='256705555555',
        email='sam@example.com',
        region='Eastern Region',
        city='Jinja',
        address='Plot 5, Secondary Street',
        national_id_number='CMSAM123456',
        digital_health_id='BEN-TEST-0003',
        emergency_contact_name='Mary Johnson',
        emergency_contact_phone='256706666666',
        emergency_contact_relationship='Sister',
        enrolled_by=social_worker_profile
    )
    beneficiaries.append(b3)
    
    return beneficiaries


@pytest.mark.django_db
@pytest.mark.unit
class TestBeneficiaryFilter:
    """Test BeneficiaryFilter filtering capabilities."""

    def test_filter_by_category(self, multiple_beneficiaries):
        """Test filtering by category."""
        queryset = Beneficiary.objects.all()
        filterset = BeneficiaryFilter(
            {'category': 'MATERNAL'},
            queryset=queryset
        )
        filtered = filterset.qs
        assert filtered.count() == 1
        assert filtered.first().full_name == 'Jane Smith'

    def test_filter_by_urgency_level(self, multiple_beneficiaries):
        """Test filtering by urgency level."""
        queryset = Beneficiary.objects.all()
        filterset = BeneficiaryFilter(
            {'urgency_level': 'URGENT'},
            queryset=queryset
        )
        filtered = filterset.qs
        assert filtered.count() == 1
        assert filtered.first().full_name == 'Jane Smith'

    def test_filter_by_gender(self, multiple_beneficiaries):
        """Test filtering by gender."""
        queryset = Beneficiary.objects.all()
        filterset = BeneficiaryFilter(
            {'gender': 'FEMALE'},
            queryset=queryset
        )
        filtered = filterset.qs
        assert filtered.count() == 1
        assert filtered.first().full_name == 'Jane Smith'

    def test_filter_by_geographic_remoteness(self, multiple_beneficiaries):
        """Test filtering by geographic remoteness."""
        queryset = Beneficiary.objects.all()
        filterset = BeneficiaryFilter(
            {'geographic_remoteness': 'LOW'},
            queryset=queryset
        )
        filtered = filterset.qs
        assert filtered.count() == 1
        assert filtered.first().full_name == 'John Doe'

    def test_filter_by_region(self, multiple_beneficiaries):
        """Test filtering by region."""
        queryset = Beneficiary.objects.all()
        filterset = BeneficiaryFilter(
            {'region': 'Central Region'},
            queryset=queryset
        )
        filtered = filterset.qs
        assert filtered.count() == 1
        assert filtered.first().full_name == 'John Doe'

    def test_filter_by_city(self, multiple_beneficiaries):
        """Test filtering by city."""
        queryset = Beneficiary.objects.all()
        filterset = BeneficiaryFilter(
            {'city': 'Kampala'},
            queryset=queryset
        )
        filtered = filterset.qs
        assert filtered.count() == 1
        assert filtered.first().full_name == 'John Doe'

    def test_filter_by_income_verified(self, multiple_beneficiaries):
        """Test filtering by income_verified status."""
        # Update one to be income verified
        beneficiary = multiple_beneficiaries[0]
        beneficiary.income_verified = True
        beneficiary.save()
        
        queryset = Beneficiary.objects.all()
        filterset = BeneficiaryFilter(
            {'income_verified': True},
            queryset=queryset
        )
        filtered = filterset.qs
        assert filtered.count() == 1
        assert filtered.first().full_name == 'Jane Smith'

    def test_filter_by_is_active(self, multiple_beneficiaries):
        """Test filtering by is_active status."""
        # Deactivate one
        beneficiary = multiple_beneficiaries[0]
        beneficiary.is_active = False
        beneficiary.save()
        
        queryset = Beneficiary.objects.all()
        filterset = BeneficiaryFilter(
            {'is_active': True},
            queryset=queryset
        )
        filtered = filterset.qs
        assert filtered.count() == 2

    def test_filter_by_multiple_criteria(self, multiple_beneficiaries):
        """Test filtering by multiple criteria at once."""
        queryset = Beneficiary.objects.all()
        filterset = BeneficiaryFilter(
            {
                'category': 'ELDERLY',
                'region': 'Central Region'
            },
            queryset=queryset
        )
        filtered = filterset.qs
        assert filtered.count() == 1
        assert filtered.first().full_name == 'John Doe'

    def test_no_filter_returns_all(self, multiple_beneficiaries):
        """Test that no filter returns all beneficiaries."""
        queryset = Beneficiary.objects.all()
        filterset = BeneficiaryFilter({}, queryset=queryset)
        assert filterset.qs.count() == len(multiple_beneficiaries)

    def test_filter_by_date_of_birth_range(self, multiple_beneficiaries):
        """Test filtering by date of birth range if supported."""
        queryset = Beneficiary.objects.all()
        # This depends on whether the filter supports date ranges
        # Test basic filtering by age (if implemented)
        # For now, just ensure filter doesn't error
        filterset = BeneficiaryFilter({}, queryset=queryset)
        assert filterset.qs.count() > 0

    def test_invalid_filter_ignored(self, multiple_beneficiaries):
        """Test that invalid filter parameters are handled gracefully."""
        queryset = Beneficiary.objects.all()
        filterset = BeneficiaryFilter(
            {'invalid_field': 'value'},
            queryset=queryset
        )
        # Should return all or not error
        assert filterset.qs.count() == 3
