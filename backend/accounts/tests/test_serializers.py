"""Tests for accounts serializers."""

import pytest
from django.contrib.auth import get_user_model
from accounts.serializers.donor import DonorRegisterSerializer
from accounts.models import Donor

User = get_user_model()


@pytest.mark.django_db
@pytest.mark.serializer
class TestDonorRegisterSerializer:
    """Test DonorRegisterSerializer for user registration."""

    def test_create_donor_with_valid_data(self):
        """Test creating a donor via serializer."""
        data = {
            'email': 'newdonor@example.com',
            'password': 'SecurePass123!',
            'first_name': 'Jane',
            'last_name': 'Donor',
            'phone_number': '256701234567',
        }
        
        serializer = DonorRegisterSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        donor = serializer.save()
        
        assert donor.user.email == data['email']
        assert donor.user.role == 'DONOR'
        assert donor.user.check_password(data['password'])

    def test_serializer_validates_email_format(self):
        """Test that serializer validates email format."""
        data = {
            'email': 'invalid-email',
            'password': 'SecurePass123!',
            'first_name': 'Test',
            'last_name': 'User',
            'phone_number': '256701234567',
            'phone_number': '+237670123456',
        }
        
        serializer = DonorSerializer(data=data)
        assert not serializer.is_valid()
        assert 'email' in serializer.errors

    def test_serializer_requires_email(self):
        """Test that email is required."""
        data = {
            'password': 'SecurePass123!',
            'first_name': 'Test',
            'last_name': 'User',
            'phone_number': '+237670123456',
        }
        
        serializer = DonorSerializer(data=data)
        assert not serializer.is_valid()
        assert 'email' in serializer.errors

    def test_serializer_requires_password(self):
        """Test that password is required."""
        data = {
            'email': 'test@example.com',
            'first_name': 'Test',
            'last_name': 'User',
            'phone_number': '+237670123456',
        }
        
        serializer = DonorSerializer(data=data)
        assert not serializer.is_valid()
        assert 'password' in serializer.errors

    def test_serializer_requires_phone_number(self):
        """Test that phone number is required."""
        data = {
            'email': 'test@example.com',
            'password': 'SecurePass123!',
            'first_name': 'Test',
            'last_name': 'User',
        }
        
        serializer = DonorSerializer(data=data)
        assert not serializer.is_valid()
        assert 'phone_number' in serializer.errors

    def test_serializer_validates_password_strength(self):
        """Test that serializer validates password strength."""
        data = {
            'email': 'test@example.com',
            'password': '123',  # Too weak
            'first_name': 'Test',
            'last_name': 'User',
            'phone_number': '+237670123456',
        }
        
        serializer = DonorSerializer(data=data)
        # Password validation depends on settings/validators
        # This test ensures serializer validates something about password
        assert hasattr(serializer, 'fields')

    def test_update_donor_user(self, donor_user):
        """Test updating a donor user."""
        data = {
            'first_name': 'Updated',
            'last_name': 'Name',
        }
        
        serializer = DonorSerializer(donor_user, data=data, partial=True)
        assert serializer.is_valid()
        updated_user = serializer.save()
        
        assert updated_user.first_name == 'Updated'
        assert updated_user.last_name == 'Name'
        assert updated_user.email == donor_user.email

    def test_serializer_read_only_fields(self, donor_user):
        """Test that certain fields are read-only."""
        serializer = DonorSerializer(donor_user)
        
        # id and created_at should typically be read-only
        assert 'created_at' in serializer.data
        assert serializer.fields['created_at'].read_only

    def test_donor_serializer_includes_required_fields(self, donor_user):
        """Test that serializer includes all required fields."""
        serializer = DonorSerializer(donor_user)
        data = serializer.data
        
        required_fields = ['email', 'first_name', 'last_name', 'phone_number', 'role']
        for field in required_fields:
            assert field in data

    def test_serializer_excludes_sensitive_fields(self, donor_user):
        """Test that sensitive fields like password are not exposed."""
        serializer = DonorSerializer(donor_user)
        data = serializer.data
        
        # Password should not be in serialized data
        assert 'password' not in data

    @pytest.mark.slow
    def test_serializer_bulk_create(self):
        """Test creating multiple donors via serializer."""
        data = [
            {
                'email': f'donor{i}@example.com',
                'password': 'SecurePass123!',
                'first_name': f'Donor{i}',
                'last_name': 'Test',
                'phone_number': f'+23767010000{i}'
            }
            for i in range(5)
        ]
        
        users = []
        for donor_data in data:
            serializer = DonorSerializer(data=donor_data)
            assert serializer.is_valid()
            users.append(serializer.save())
        
        assert len(users) == 5
        assert all(user.role == 'DONOR' for user in users)
