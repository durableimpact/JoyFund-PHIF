import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from notifications.models import Notification, NotificationType

User = get_user_model()


@pytest.fixture
def user(db):
    """Create a test user."""
    return User.objects.create_user(
        email='test@example.com',
        password='testpass124',
        role='DONOR'
    )


@pytest.fixture
def notification(db, user):
    """Create a notification."""
    return Notification.objects.create(
        user=user,
        title='Test Notification',
        message='This is a test notification',
        notification_type=NotificationType.SYSTEM
    )


@pytest.mark.django_db
@pytest.mark.model
class TestNotificationModel:
    """Test Notification model."""

    def test_create_notification_with_valid_data(self, user):
        """Test creating notification with valid data."""
        notification = Notification.objects.create(
            user=user,
            title='Welcome',
            message='Welcome to JoyFund',
            notification_type=NotificationType.WELCOME
        )
        assert notification.title == 'Welcome'
        assert notification.user == user
        assert notification.is_read is False

    def test_notification_types(self, user):
        """Test all notification types."""
        types = [
            NotificationType.WELCOME,
            NotificationType.SYSTEM,
            NotificationType.ANNOUNCEMENT,
            NotificationType.ALERT,
            NotificationType.CAMPAIGN_UPDATE,
            NotificationType.DONATION_RECEIVED,
            NotificationType.DONATION_SENT,
            NotificationType.BENEFICIARY_UPDATE,
            NotificationType.PAYMENT_NOTIFICATION,
            NotificationType.VERIFICATION_STATUS,
        ]
        
        for notif_type in types:
            notification = Notification.objects.create(
                user=user,
                title=f'Test {notif_type}',
                message='Test message',
                notification_type=notif_type
            )
            assert notification.notification_type == notif_type

    def test_notification_default_is_unread(self, user):
        """Test that is_read defaults to False."""
        notification = Notification.objects.create(
            user=user,
            title='Unread',
            message='Test',
            notification_type=NotificationType.SYSTEM
        )
        assert notification.is_read is False

    def test_mark_notification_as_read(self, notification):
        """Test marking notification as read."""
        assert notification.is_read is False
        notification.is_read = True
        notification.save()
        notification.refresh_from_db()
        assert notification.is_read is True

    def test_notification_timestamps(self, notification):
        """Test notification timestamps."""
        assert notification.created_at is not None
        assert notification.updated_at is not None
        assert notification.created_at <= timezone.now()

    def test_notification_string_representation(self, notification):
        """Test __str__ method."""
        expected = f"{notification.title} - {notification.user.email}"
        assert str(notification) == expected

    def test_notification_with_description(self, user):
        """Test notification with description."""
        notification = Notification.objects.create(
            user=user,
            title='Important',
            message='Important message',
            description='Additional details',
            notification_type=NotificationType.ALERT
        )
        assert notification.description == 'Additional details'

    def test_notification_with_action_url(self, user):
        """Test notification with action URL."""
        notification = Notification.objects.create(
            user=user,
            title='Action Required',
            message='Please verify your account',
            action_url='https://example.com/verify',
            notification_type=NotificationType.VERIFICATION_STATUS
        )
        assert notification.action_url == 'https://example.com/verify'

    def test_notification_optional_fields(self, user):
        """Test optional fields."""
        notification = Notification.objects.create(
            user=user,
            title='Test',
            message='Test message'
            # No description or action_url
        )
        assert notification.description is None
        assert notification.action_url is None

    def test_notification_cascade_delete_with_user(self, user):
        """Test that notifications are deleted when user is deleted."""
        notification = Notification.objects.create(
            user=user,
            title='Test',
            message='Test message',
            notification_type=NotificationType.SYSTEM
        )
        user_id = user.id
        user.delete()
        assert not Notification.objects.filter(user_id=user_id).exists()

    def test_multiple_notifications_per_user(self, user):
        """Test that a user can have multiple notifications."""
        notif1 = Notification.objects.create(
            user=user,
            title='Notification 1',
            message='Message 1',
            notification_type=NotificationType.SYSTEM
        )
        notif2 = Notification.objects.create(
            user=user,
            title='Notification 2',
            message='Message 2',
            notification_type=NotificationType.ALERT
        )
        
        user_notifications = Notification.objects.filter(user=user)
        assert user_notifications.count() == 2

    def test_notification_ordering_by_created_at(self, user):
        """Test that notifications are ordered by created_at descending."""
        notif1 = Notification.objects.create(
            user=user,
            title='First',
            message='First message',
            notification_type=NotificationType.SYSTEM
        )
        notif2 = Notification.objects.create(
            user=user,
            title='Second',
            message='Second message',
            notification_type=NotificationType.ALERT
        )
        
        notifications = list(Notification.objects.all())
        # Should be in reverse chronological order (most recent first)
        assert notifications[0].created_at >= notifications[1].created_at

    def test_filter_notifications_by_type(self, user):
        """Test filtering notifications by type."""
        Notification.objects.create(
            user=user,
            title='System',
            message='Message',
            notification_type=NotificationType.SYSTEM
        )
        Notification.objects.create(
            user=user,
            title='Alert',
            message='Message',
            notification_type=NotificationType.ALERT
        )
        
        alerts = Notification.objects.filter(notification_type=NotificationType.ALERT)
        assert alerts.count() == 1
        assert alerts.first().title == 'Alert'

    def test_filter_unread_notifications(self, user):
        """Test filtering unread notifications."""
        notif1 = Notification.objects.create(
            user=user,
            title='Unread',
            message='Message',
            notification_type=NotificationType.SYSTEM
        )
        notif2 = Notification.objects.create(
            user=user,
            title='Read',
            message='Message',
            notification_type=NotificationType.ALERT
        )
        notif2.is_read = True
        notif2.save()
        
        unread = Notification.objects.filter(is_read=False)
        assert unread.count() == 1
        assert unread.first().title == 'Unread'

    def test_notification_message_length(self, user):
        """Test notification with long message."""
        long_message = "A" * 1000
        notification = Notification.objects.create(
            user=user,
            title='Long Message',
            message=long_message,
            notification_type=NotificationType.SYSTEM
        )
        assert len(notification.message) == 1000

    def test_notification_default_type(self, user):
        """Test default notification type."""
        notification = Notification.objects.create(
            user=user,
            title='Test',
            message='Test'
            # No type specified
        )
        assert notification.notification_type == NotificationType.SYSTEM
