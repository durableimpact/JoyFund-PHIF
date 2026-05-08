import pytest
from datetime import date
from beneficiaries.serializers import (
    BeneficiaryDetailSerializer, BeneficiaryCreateSerializer, BeneficiaryUpdateSerializer
)
from beneficiaries.models import Beneficiary, Gender, BeneficiaryCategory
from accounts.models import SocialWorker
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.fixture
def social_worker(db):
    """Create a social worker."""
    user = User.objects.create_user(
        email='socialworker@test.com',
        password='testpass124',
        role='SOCIAL_WORKER'
    )
    return SocialWorker.objects.create(user=user)


@pytest.fixture
def beneficiary_instance(db, social_worker):
    """Create a beneficiary instance."""
    return Beneficiary.objects.create(
        full_name='Jane Smith',
        date_of_birth=date(1990, 5, 15),
        gender=Gender.FEMALE,
        category=BeneficiaryCategory.MATERNAL,
        phone='256701234567',
        email='jane@example.com',
        region='Western Region',
        city='Fort Portal',
        address='Plot 42, Main Street',
        national_id_number='CM1234567890',
        emergency_contact_name='John Smith',
        emergency_contact_phone='256702345678',
        emergency_contact_relationship='Spouse',
        enrolled_by=social_worker
    )


@pytest.mark.django_db
@pytest.mark.serializer
class TestBeneficiaryDetailSerializer:
    """Test BeneficiaryDetailSerializer."""

    def test_serialize_beneficiary(self, beneficiary_instance):
        """Test serializing a beneficiary instance."""
        serializer = BeneficiaryDetailSerializer(beneficiary_instance)
        data = serializer.data
        assert data['full_name'] == 'Jane Smith'
        assert data['phone'] == '256701234567'
        assert data['gender'] == 'FEMALE'

    def test_serialized_data_has_required_fields(self, beneficiary_instance):
        """Test that all required fields are present in serialized data."""
        serializer = BeneficiaryDetailSerializer(beneficiary_instance)
        data = serializer.data
        required_fields = [
            'id', 'full_name', 'date_of_birth', 'gender', 'category',
            'phone', 'email', 'region', 'city', 'address',
            'national_id_number', 'emergency_contact_name',
            'emergency_contact_phone', 'emergency_contact_relationship',
            'chronic_conditions', 'expected_delivery_date', 'enrolled_by_id'
        ]
        for field in required_fields:
            assert field in data

    def test_enrolled_by_id_is_read_only(self, beneficiary_instance):
        """Test that enrolled_by_id is read-only."""
        serializer = BeneficiaryDetailSerializer(beneficiary_instance)
        assert serializer.fields['enrolled_by_id'].read_only is True

    def test_serialize_with_null_optional_fields(self, social_worker):
        """Test serialization with null optional fields."""
        beneficiary = Beneficiary.objects.create(
            full_name='Test Person',
            date_of_birth=date(1990, 1, 1),
            phone='256701234567',
            region='Region',
            city='City',
            address='Address',
            national_id_number='CMTEST001',
            emergency_contact_name='Contact',
            emergency_contact_phone='256702345678',
            emergency_contact_relationship='Friend',
            enrolled_by=social_worker
            # No email, chronic_conditions, expected_delivery_date
        )
        serializer = BeneficiaryDetailSerializer(beneficiary)
        data = serializer.data
        assert data['email'] is None
        assert data['chronic_conditions'] is None
        assert data['expected_delivery_date'] is None


@pytest.mark.django_db
@pytest.mark.serializer
class TestBeneficiaryCreateSerializer:
    """Test BeneficiaryCreateSerializer."""

    def test_create_beneficiary_with_valid_data(self, social_worker):
        """Test creating beneficiary with valid data."""
        data = {
            'full_name': 'John Doe',
            'date_of_birth': '1990-05-15',
            'gender': 'MALE',
            'category': 'ELDERLY',
            'phone': '256701234567',
            'email': 'john@example.com',
            'region': 'Central Region',
            'city': 'Kampala',
            'address': 'Plot 10, Main Street',
            'national_id_number': 'CMJOHN123456',
            'emergency_contact_name': 'Jane Doe',
            'emergency_contact_phone': '256702345678',
            'emergency_contact_relationship': 'Sister',
        }
        serializer = BeneficiaryCreateSerializer(
            data=data,
            context={'enrolled_by': social_worker}
        )
        assert serializer.is_valid(), serializer.errors
        beneficiary = serializer.save()
        assert beneficiary.full_name == 'John Doe'
        assert beneficiary.enrolled_by == social_worker

    def test_create_requires_enrolled_by_in_context(self, social_worker):
        """Test that create requires enrolled_by in context."""
        data = {
            'full_name': 'John Doe',
            'date_of_birth': '1990-05-15',
            'gender': 'MALE',
            'category': 'ELDERLY',
            'phone': '256701234567',
            'region': 'Region',
            'city': 'City',
            'address': 'Address',
            'national_id_number': 'CMTEST001',
            'emergency_contact_name': 'Contact',
            'emergency_contact_phone': '256702345678',
            'emergency_contact_relationship': 'Friend',
        }
        serializer = BeneficiaryCreateSerializer(data=data, context={})
        assert serializer.is_valid()
        # Will raise error when save() is called without enrolled_by
        with pytest.raises(Exception):
            serializer.save()

    def test_create_serializer_excludes_enrolled_by(self, social_worker):
        """Test that create serializer doesn't accept enrolled_by in data."""
        data = {
            'full_name': 'John Doe',
            'date_of_birth': '1990-05-15',
            'gender': 'MALE',
            'category': 'ELDERLY',
            'phone': '256701234567',
            'region': 'Region',
            'city': 'City',
            'address': 'Address',
            'national_id_number': 'CMTEST001',
            'emergency_contact_name': 'Contact',
            'emergency_contact_phone': '256702345678',
            'emergency_contact_relationship': 'Friend',
            'enrolled_by': 'invalid'  # This should be ignored
        }
        serializer = BeneficiaryCreateSerializer(
            data=data,
            context={'enrolled_by': social_worker}
        )
        assert serializer.is_valid()

    def test_to_representation_returns_detail_serializer(self, social_worker):
        """Test that to_representation returns detail serializer data."""
        data = {
            'full_name': 'John Doe',
            'date_of_birth': '1990-05-15',
            'gender': 'MALE',
            'category': 'ELDERLY',
            'phone': '256701234567',
            'region': 'Region',
            'city': 'City',
            'address': 'Address',
            'national_id_number': 'CMTEST_REP001',
            'emergency_contact_name': 'Contact',
            'emergency_contact_phone': '256702345678',
            'emergency_contact_relationship': 'Friend',
        }
        serializer = BeneficiaryCreateSerializer(
            data=data,
            context={'enrolled_by': social_worker}
        )
        assert serializer.is_valid()
        beneficiary = serializer.save()
        representation = serializer.to_representation(beneficiary)
        assert 'enrolled_by_id' in representation
        assert representation['full_name'] == 'John Doe'

    def test_required_fields_validation(self, social_worker):
        """Test validation of required fields."""
        # Missing full_name
        data = {
            'date_of_birth': '1990-05-15',
            'gender': 'MALE',
            'phone': '256701234567',
            'region': 'Region',
            'city': 'City',
            'address': 'Address',
            'national_id_number': 'CMTEST001',
            'emergency_contact_name': 'Contact',
            'emergency_contact_phone': '256702345678',
            'emergency_contact_relationship': 'Friend',
        }
        serializer = BeneficiaryCreateSerializer(
            data=data,
            context={'enrolled_by': social_worker}
        )
        assert not serializer.is_valid()
        assert 'full_name' in serializer.errors

    def test_invalid_gender_choice(self, social_worker):
        """Test validation for invalid gender choice."""
        data = {
            'full_name': 'John Doe',
            'date_of_birth': '1990-05-15',
            'gender': 'UNKNOWN',
            'phone': '256701234567',
            'region': 'Region',
            'city': 'City',
            'address': 'Address',
            'national_id_number': 'CMTEST001',
            'emergency_contact_name': 'Contact',
            'emergency_contact_phone': '256702345678',
            'emergency_contact_relationship': 'Friend',
        }
        serializer = BeneficiaryCreateSerializer(
            data=data,
            context={'enrolled_by': social_worker}
        )
        assert not serializer.is_valid()
        assert 'gender' in serializer.errors


@pytest.mark.django_db
@pytest.mark.serializer
class TestBeneficiaryUpdateSerializer:
    """Test BeneficiaryUpdateSerializer."""

    def test_update_beneficiary_with_valid_data(self, beneficiary_instance):
        """Test updating beneficiary with valid data."""
        data = {
            'full_name': 'Jane New Name',
            'phone': '256709876543',
        }
        serializer = BeneficiaryUpdateSerializer(
            beneficiary_instance,
            data=data,
            partial=True
        )
        assert serializer.is_valid(), serializer.errors
        updated = serializer.save()
        assert updated.full_name == 'Jane New Name'
        assert updated.phone == '256709876543'

    def test_partial_update(self, beneficiary_instance):
        """Test partial update with only some fields."""
        original_email = beneficiary_instance.email
        data = {'full_name': 'Updated Name'}
        serializer = BeneficiaryUpdateSerializer(
            beneficiary_instance,
            data=data,
            partial=True
        )
        assert serializer.is_valid()
        updated = serializer.save()
        assert updated.full_name == 'Updated Name'
        assert updated.email == original_email

    def test_update_excludes_enrolled_by(self, beneficiary_instance, social_worker):
        """Test that update serializer doesn't update enrolled_by."""
        user2 = User.objects.create_user(
            email='socialworker2@test.com',
            password='testpass124',
            role='SOCIAL_WORKER'
        )
        social_worker2 = SocialWorker.objects.create(user=user2)
        
        data = {
            'full_name': 'Updated Name',
            'enrolled_by': social_worker2.id
        }
        serializer = BeneficiaryUpdateSerializer(
            beneficiary_instance,
            data=data,
            partial=True
        )
        assert serializer.is_valid()
        updated = serializer.save()
        # enrolled_by should not change
        assert updated.enrolled_by == beneficiary_instance.enrolled_by

    def test_to_representation_returns_detail_serializer(self, beneficiary_instance):
        """Test that to_representation returns detail serializer data."""
        data = {'full_name': 'Updated Name'}
        serializer = BeneficiaryUpdateSerializer(
            beneficiary_instance,
            data=data,
            partial=True
        )
        assert serializer.is_valid()
        beneficiary = serializer.save()
        representation = serializer.to_representation(beneficiary)
        assert 'enrolled_by_id' in representation
        assert representation['full_name'] == 'Updated Name'

    def test_full_update(self, beneficiary_instance):
        """Test full update with all fields."""
        data = {
            'full_name': 'Completely New Name',
            'date_of_birth': '1992-03-20',
            'gender': 'OTHER',
            'category': 'ELDERLY',
            'phone': '256709876543',
            'email': 'newemail@example.com',
            'region': 'Eastern Region',
            'city': 'Jinja',
            'address': 'New Address',
            'national_id_number': 'CMNEW123456',
            'emergency_contact_name': 'New Contact',
            'emergency_contact_phone': '256708765432',
            'emergency_contact_relationship': 'Brother',
        }
        serializer = BeneficiaryUpdateSerializer(beneficiary_instance, data=data)
        assert serializer.is_valid()
        updated = serializer.save()
        assert updated.full_name == 'Completely New Name'
        assert updated.city == 'Jinja'
        assert updated.email == 'newemail@example.com'
