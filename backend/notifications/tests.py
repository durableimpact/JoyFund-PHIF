"""
Tests for the notifications app, particularly push subscriptions and user login flow.
"""

from django.contrib.auth import get_user_model
from django.contrib.auth.signals import user_logged_in
from django.test import RequestFactory, TestCase

from notifications.models import PushSubscription

User = get_user_model()


class PushSubscriptionLinkingTestCase(TestCase):
    """
    Test that anonymous push subscriptions are properly linked to users when they log in.
    This ensures users who subscribed before authenticating receive targeted notifications.
    """

    def setUp(self):
        """Set up test fixtures."""
        self.factory = RequestFactory()
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
        )

    def test_anonymous_subscription_linked_on_login(self):
        """
        Test that an anonymous push subscription is linked to a user when they log in.

        Scenario:
        1. Anonymous user subscribes to push notifications
        2. User creates an account and logs in
        3. The subscription should now be linked to their user account
        """
        # Step 1: Create an anonymous subscription
        endpoint = "https://fcm.googleapis.com/fcm/send/test_endpoint_123"
        sub = PushSubscription.objects.create(
            endpoint=endpoint,
            p256dh_key="test_p256dh_key",
            auth_key="test_auth_key",
            user_agent="Mozilla/5.0...",
            user=None,  # Anonymous
        )

        # Verify it's anonymous
        self.assertIsNone(sub.user)
        self.assertEqual(PushSubscription.objects.filter(user__isnull=True).count(), 1)

        # Step 2: Simulate user login
        request = self.factory.get("/")
        request.user = self.user
        user_logged_in.send(sender=User, request=request, user=self.user)

        # Step 3: Verify the subscription is now linked
        sub.refresh_from_db()
        self.assertEqual(sub.user, self.user)
        self.assertEqual(PushSubscription.objects.filter(user__isnull=True).count(), 0)

    def test_multiple_anonymous_subscriptions_not_linked(self):
        """
        Test that multiple anonymous subscriptions are NOT linked on login.

        This is a safety measure: if there are multiple anonymous subscriptions,
        we can't be sure which one belongs to the user, so we don't link any.
        """
        # Create two anonymous subscriptions
        sub1 = PushSubscription.objects.create(
            endpoint="https://fcm.googleapis.com/fcm/send/endpoint1",
            p256dh_key="key1",
            auth_key="auth1",
            user=None,
        )
        sub2 = PushSubscription.objects.create(
            endpoint="https://fcm.googleapis.com/fcm/send/endpoint2",
            p256dh_key="key2",
            auth_key="auth2",
            user=None,
        )

        # Simulate login
        request = self.factory.get("/")
        request.user = self.user
        user_logged_in.send(sender=User, request=request, user=self.user)

        # Neither should be linked (conservative approach)
        sub1.refresh_from_db()
        sub2.refresh_from_db()
        self.assertIsNone(sub1.user)
        self.assertIsNone(sub2.user)

    def test_authenticated_user_register_after_anonymous(self):
        """
        Test that a user who already has authenticated subscriptions
        doesn't lose them when an anonymous subscription exists.
        """
        # User already has an authenticated subscription
        user_sub = PushSubscription.objects.create(
            endpoint="https://fcm.googleapis.com/fcm/send/user_endpoint",
            p256dh_key="user_key",
            auth_key="user_auth",
            user=self.user,
        )

        # Anonymous subscription exists
        anon_sub = PushSubscription.objects.create(
            endpoint="https://fcm.googleapis.com/fcm/send/anon_endpoint",
            p256dh_key="anon_key",
            auth_key="anon_auth",
            user=None,
        )

        # Simulate login
        request = self.factory.get("/")
        request.user = self.user
        user_logged_in.send(sender=User, request=request, user=self.user)

        # User subscription should remain unchanged
        user_sub.refresh_from_db()
        self.assertEqual(user_sub.user, self.user)

        # Anonymous subscription should not be linked (it's not new)
        anon_sub.refresh_from_db()
        self.assertIsNone(anon_sub.user)
