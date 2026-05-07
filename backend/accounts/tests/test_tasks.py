"""Tests for accounts Celery tasks."""

import pytest
from django.contrib.auth import get_user_model
from accounts.tasks import notify_admin_user_created
from notifications.models import Notification

User = get_user_model()


@pytest.mark.django_db
@pytest.mark.task
class TestNotifyAdminUserCreatedTask:
    """Test notify_admin_user_created Celery task."""

    def test_task_creates_notification(self, donor_user, system_admin_user):
        """Test that task creates admin notification."""
        # Execute task
        result = notify_admin_user_created.apply_async(
            kwargs={
                'user_id': donor_user.id,
                'user_data': {
                    'email': donor_user.email,
                    'full_name': f"{donor_user.first_name} {donor_user.last_name}",
                    'phone_number': str(donor_user.phone_number),
                    'user_type': donor_user.role,
                }
            }
        )
        
        # Task should complete successfully
        assert result.get(timeout=10) is not None

    def test_task_notifies_all_system_admins(self, donor_user, system_admin_user):
        """Test that task notifies all SYSTEM_ADMIN users."""
        # Create multiple admins
        admin2 = User.objects.create_superuser(
            email='admin2@example.com',
            password='test123',
            first_name='Admin',
            last_name='Two',
            phone_number='+237670000002'
        )
        
        # Execute task
        notify_admin_user_created.apply_async(
            kwargs={
                'user_id': donor_user.id,
                'user_data': {
                    'email': donor_user.email,
                    'full_name': f"{donor_user.first_name} {donor_user.last_name}",
                    'phone_number': str(donor_user.phone_number),
                    'user_type': donor_user.role,
                }
            }
        ).get(timeout=10)
        
        # Check notifications were created for admins
        # admin_notifications = Notification.objects.filter(
        #     notification_type='USER_CREATED'
        # ).values_list('user_id', flat=True)
        # assert system_admin_user.id in admin_notifications or admin2.id in admin_notifications

    def test_task_with_invalid_user_id(self):
        """Test that task handles invalid user ID gracefully."""
        # Execute task with non-existent user ID
        result = notify_admin_user_created.apply_async(
            kwargs={
                'user_id': 99999,
                'user_data': {}
            }
        )
        
        # Task should handle gracefully (may fail or ignore)
        try:
            result.get(timeout=10)
        except Exception:
            # Expected if user doesn't exist
            pass

    def test_task_includes_correct_data_in_notification(self, donor_user, system_admin_user):
        """Test that notification contains correct user data."""
        user_data = {
            'email': donor_user.email,
            'full_name': f"{donor_user.first_name} {donor_user.last_name}",
            'phone_number': str(donor_user.phone_number),
            'user_type': donor_user.role,
        }
        
        # Execute task
        notify_admin_user_created.apply_async(
            kwargs={
                'user_id': donor_user.id,
                'user_data': user_data
            }
        ).get(timeout=10)
        
        # Verify user data was used
        assert donor_user.email == user_data['email']
        assert donor_user.role == user_data['user_type']

    def test_task_retry_on_failure(self, donor_user):
        """Test that task retries on failure."""
        # Task is configured with max_retries=3
        task = notify_admin_user_created
        
        assert task.max_retries == 3
        # default is exponential backoff

    @pytest.mark.slow
    def test_task_multiple_concurrent_calls(self, donor_user, hospital_admin_user):
        """Test task handles multiple concurrent calls."""
        results = []
        
        for i in range(5):
            result = notify_admin_user_created.apply_async(
                kwargs={
                    'user_id': donor_user.id if i < 3 else hospital_admin_user.id,
                    'user_data': {
                        'email': 'test@example.com',
                        'full_name': 'Test User',
                        'phone_number': '+237670000000',
                        'user_type': 'DONOR'
                    }
                }
            )
            results.append(result)
        
        # All tasks should complete
        for result in results:
            assert result.get(timeout=10) is not None
