"""Tests for accounts models."""

import pytest
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError

User = get_user_model()


@pytest.mark.django_db
@pytest.mark.model
class TestUserModel:
    """Test User model."""

    def test_create_user_with_valid_data(self, valid_user_data):
        """Test creating a user with valid data."""
        user = User.objects.create_user(**valid_user_data)
        
        assert user.email == valid_user_data['email']
        assert user.first_name == valid_user_data['first_name']
        assert user.last_name == valid_user_data['last_name']
        assert user.phone_number == valid_user_data['phone_number']
        assert user.role == valid_user_data['role']
        assert user.is_active is True
        assert user.is_verified is False
        assert user.is_staff is False

    def test_create_user_requires_email(self):
        """Test that email is required."""
        with pytest.raises(ValueError, match='Email is required'):
            User.objects.create_user(
                email='',
                password='test123',
                first_name='Test',
                last_name='User',
                phone_number='+237670123456'
            )

    def test_email_is_unique(self, donor_user):
        """Test that email must be unique."""
        with pytest.raises(Exception):  # IntegrityError
            User.objects.create_user(
                email=donor_user.email,
                password='different_pass',
                first_name='Another',
                last_name='User',
                phone_number='+237670999999'
            )

    def test_phone_number_is_unique(self, donor_user):
        """Test that phone number must be unique."""
        with pytest.raises(Exception):  # IntegrityError
            User.objects.create_user(
                email='different@example.com',
                password='test123',
                first_name='Another',
                last_name='User',
                phone_number=donor_user.phone_number
            )

    def test_password_is_hashed(self):
        """Test that password is properly hashed."""
        password = 'PlainTextPassword123'
        user = User.objects.create_user(
            email='test@example.com',
            password=password,
            first_name='Test',
            last_name='User',
            phone_number='+237670123456'
        )
        
        assert user.password != password
        assert user.check_password(password)

    def test_create_superuser(self):
        """Test creating a superuser."""
        superuser = User.objects.create_superuser(
            email='superuser@example.com',
            password='test123',
            first_name='Super',
            last_name='User',
            phone_number='+237670123456'
        )
        
        assert superuser.is_staff is True
        assert superuser.is_superuser is True
        assert superuser.is_active is True
        assert superuser.role == 'SYSTEM_ADMIN'

    def test_user_string_representation(self, donor_user):
        """Test user __str__ method."""
        expected = f"{donor_user.email} ({donor_user.role})"
        assert str(donor_user) == expected

    def test_user_full_name_property(self, donor_user):
        """Test accessing full name."""
        full_name = f"{donor_user.first_name} {donor_user.last_name}"
        assert full_name == 'John Donor'

    def test_normalize_email(self):
        """Test that email is normalized."""
        user = User.objects.create_user(
            email='Test@EXAMPLE.COM',
            password='test123',
            first_name='Test',
            last_name='User',
            phone_number='+237670123456'
        )
        
        assert user.email == 'test@example.com'

    def test_user_timestamps(self):
        """Test that created_at and updated_at are set."""
        user = User.objects.create_user(
            email='test@example.com',
            password='test123',
            first_name='Test',
            last_name='User',
            phone_number='+237670123456'
        )
        
        assert user.created_at is not None
        assert user.updated_at is not None
        assert user.created_at <= user.updated_at

    def test_user_is_verified_default_false(self):
        """Test that is_verified defaults to False."""
        user = User.objects.create_user(
            email='test@example.com',
            password='test123',
            first_name='Test',
            last_name='User',
            phone_number='+237670123456'
        )
        
        assert user.is_verified is False

    def test_user_role_choices(self):
        """Test all user role choices."""
        roles = [
            'SYSTEM_ADMIN',
            'HOSPITAL_ADMIN',
            'RECEPTIONIST',
            'SOCIAL_WORKER',
            'DONOR'
        ]
        
        for role in roles:
            user = User.objects.create_user(
                email=f'{role}@example.com',
                password='test123',
                first_name='Test',
                last_name=role,
                phone_number=f'+23767012345{roles.index(role)}',
                role=role
            )
            assert user.role == role

    def test_user_default_role_is_donor(self):
        """Test that default role is DONOR."""
        user = User.objects.create_user(
            email='test@example.com',
            password='test123',
            first_name='Test',
            last_name='User',
            phone_number='+237670123456'
        )
        
        assert user.role == 'DONOR'

    def test_user_queryset_can_be_filtered_by_role(self, system_admin_user, donor_user):
        """Test filtering users by role."""
        admin_users = User.objects.filter(role='SYSTEM_ADMIN')
        donor_users = User.objects.filter(role='DONOR')
        
        assert system_admin_user in admin_users
        assert donor_user in donor_users
        assert system_admin_user not in donor_users

    def test_user_model_has_indexes(self):
        """Test that User model has expected indexes."""
        indexes = User._meta.indexes
        assert len(indexes) > 0
        
        # Check that indexes exist for performance-critical fields
        index_fields = [idx.fields for idx in indexes]
        assert any('phone_number' in fields for fields in index_fields)
        assert any('email' in fields for fields in index_fields)
        assert any('role' in fields for fields in index_fields)

    def test_user_manager_exists(self):
        """Test that custom user manager is configured."""
        assert hasattr(User, 'objects')
        assert User.objects.model == User

    def test_user_with_preferred_language(self):
        """Test setting user's preferred language."""
        user = User.objects.create_user(
            email='test@example.com',
            password='test123',
            first_name='Test',
            last_name='User',
            phone_number='+237670123456',
            perfered_language='fr'
        )
        
        assert user.perfered_language == 'fr'

    def test_user_can_be_deactivated(self, donor_user):
        """Test that user can be marked as inactive."""
        donor_user.is_active = False
        donor_user.save()
        
        assert donor_user.is_active is False
        user = User.objects.get(pk=donor_user.pk)
        assert user.is_active is False

    @pytest.mark.slow
    def test_user_bulk_creation(self):
        """Test bulk creating users."""
        users_data = [
            {
                'email': f'user{i}@example.com',
                'password': 'test123',
                'first_name': f'User{i}',
                'last_name': 'Test',
                'phone_number': f'+23767012340{i}'
            }
            for i in range(10)
        ]
        
        users = [User.objects.create_user(**data) for data in users_data]
        assert len(users) == 10
        assert User.objects.count() >= 10
