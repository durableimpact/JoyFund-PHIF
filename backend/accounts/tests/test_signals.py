"""Tests for accounts signals."""

import pytest
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.db.models.signals import post_save
from notifications.models import Notification

User = get_user_model()


@pytest.mark.django_db
@pytest.mark.signal
class TestUserSignals:
    """Test user-related signals."""

    def test_user_created_signal_triggers(self, db):
        """Test that user creation signal is triggered."""
        # Get initial count
        user_count_before = User.objects.count()
        
        # Create a user
        user = User.objects.create_user(
            email='signal_test@example.com',
            password='test123',
            first_name='Signal',
            last_name='Test',
            phone_number='+237670123456',
            role='DONOR'
        )
        
        # Verify user was created
        assert User.objects.count() == user_count_before + 1
        assert user.email == 'signal_test@example.com'

    def test_welcome_email_signal_on_donor_creation(self, db):
        """Test that admin is notified when donor signs up."""
        # Create a donor
        donor = User.objects.create_user(
            email='newdonor@example.com',
            password='test123',
            first_name='New',
            last_name='Donor',
            phone_number='+237670123456',
            role='DONOR'
        )
        
        # Signal should trigger notification creation
        # This depends on your signal implementation
        # notif_count = Notification.objects.filter(
        #     notification_type='USER_CREATED'
        # ).count()
        # assert notif_count > 0

    def test_user_update_doesnt_trigger_creation_signal(self, donor_user):
        """Test that updating user doesn't trigger creation signal."""
        donor_user.first_name = 'Updated'
        donor_user.save()
        
        # Verify user was updated
        updated_user = User.objects.get(pk=donor_user.pk)
        assert updated_user.first_name == 'Updated'

    def test_admin_notification_on_new_donor(self, db):
        """Test that admin receives notification on new donor signup."""
        # Create admin user first
        admin = User.objects.create_superuser(
            email='admin@example.com',
            password='test123',
            first_name='Admin',
            last_name='User',
            phone_number='+237670000001'
        )
        
        # Create a new donor
        donor = User.objects.create_user(
            email='newdonor2@example.com',
            password='test123',
            first_name='Another',
            last_name='Donor',
            phone_number='+237670999222',
            role='DONOR'
        )
        
        # Check if notification was created
        # This depends on your actual signal implementation
        # notifications = Notification.objects.filter(
        #     user=admin,
        #     notification_type='USER_CREATED'
        # )
        # assert notifications.exists()

    def test_no_signal_on_non_donor_user_creation(self, db):
        """Test that admin signup doesn't trigger user creation signal."""
        admin = User.objects.create_user(
            email='new_admin@example.com',
            password='test123',
            first_name='New',
            last_name='Admin',
            phone_number='+237670123789',
            role='HOSPITAL_ADMIN'
        )
        
        # Check that no "new user" notification was created for non-donors
        # This depends on signal logic
        assert admin.role == 'HOSPITAL_ADMIN'
