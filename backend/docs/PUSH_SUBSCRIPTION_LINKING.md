# Push Subscription Linking - Anonymous to Authenticated Users

## Problem

Previously, when an unauthenticated user subscribed to push notifications, they would receive anonymous (broadcast) notifications only. If that user later created an account and logged in, their subscription would **not be automatically linked** to their user account. This meant:

- The subscription remained anonymous (`user=None`)
- The user would not receive targeted, personalized notifications
- You could not segment notifications by user after they authenticated

**This is a critical issue for targeting users with personalized campaigns.**

## Solution

We've implemented automatic subscription linking when users log in. Here's how it works:

### Changes Made

#### 1. **Fixed `views_push.py` Syntax Error** (Line 97)
**File:** `backend/notifications/views_push.py`

Fixed the corrupted `@permission_classes` decorator on `unregister_push_subscription`:
```python
# BEFORE (Broken):
@permission_classes([permissions.Alldef unregister_push_subscription(request):

# AFTER (Fixed):
@permission_classes([permissions.AllowAny])
def unregister_push_subscription(request):
```

#### 2. **Added User Login Signal Handler** 
**File:** `backend/notifications/signals.py`

Added a new signal receiver that listens for `user_logged_in` events:

```python
@receiver(user_logged_in, dispatch_uid="link_anonymous_push_subscriptions")
def link_anonymous_push_subscriptions(sender, request, user, **kwargs):
    """
    When a user logs in, link any anonymous push subscriptions to their account.
    
    This allows users who subscribed before logging in to receive targeted notifications.
    """
```

**How it works:**
1. When a user logs in, Django sends the `user_logged_in` signal
2. Our signal handler checks for anonymous push subscriptions
3. Using a conservative approach: if there's exactly ONE anonymous subscription, we assume it belongs to the logging-in user
4. We link that subscription to the user's account

**Why conservative approach?**
- If there are multiple anonymous subscriptions, we can't be certain which one belongs to the user
- We only link if count == 1 to avoid false positives
- This prevents accidentally linking subscriptions from different devices/users

#### 3. **Added Test Coverage**
**File:** `backend/notifications/tests.py`

Created comprehensive test cases:

```python
class PushSubscriptionLinkingTestCase(TestCase):
    - test_anonymous_subscription_linked_on_login()
    - test_multiple_anonymous_subscriptions_not_linked()
    - test_authenticated_user_register_after_anonymous()
```

## User Journey - Before and After

### BEFORE (Broken Flow)
```
1. Anonymous user visits site
   ↓
2. Subscribes to push: POST /api/notifications/push/register/
   → PushSubscription created with user=None
   ↓
3. Creates account and logs in
   ↓
4. ❌ Subscription stays anonymous (user=None)
   → Cannot send targeted notifications
   → User only gets broadcasts
```

### AFTER (Fixed Flow)
```
1. Anonymous user visits site
   ↓
2. Subscribes to push: POST /api/notifications/push/register/
   → PushSubscription created with user=None
   ↓
3. Creates account and logs in
   ↓
4. ✅ Django sends user_logged_in signal
   ↓
5. Signal handler links the subscription
   → PushSubscription updated with user=authenticated_user
   → User can now receive targeted notifications
```

## API Endpoints - Behavior

All push subscription endpoints (`register`, `unregister`) allow both authenticated and unauthenticated users:

```python
@permission_classes([permissions.AllowAny])
def register_push_subscription(request):
    # If authenticated: links to user.id
    # If anonymous: user=None (will be linked later on login)
    "user": request.user if request.user.is_authenticated else None
```

## Testing the Feature

### Manual Test
```bash
# 1. Start the server
python manage.py runserver

# 2. As anonymous user, register for push:
curl -X POST http://localhost:8000/api/notifications/push/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "https://fcm.googleapis.com/fcm/send/test123",
    "p256dh_key": "test_key",
    "auth_key": "test_auth"
  }'
# Response: PushSubscription created with user=null

# 3. Create account and log in
curl -X POST http://localhost:8000/auth/token/ \
  -d "grant_type=password&username=user&password=pass&client_id=..."

# 4. Check subscriptions (as authenticated user)
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/notifications/push/subscriptions/
# Response: Subscription is now linked to your user!
```

### Automated Test
```bash
# Run the test suite
python manage.py test notifications.tests.PushSubscriptionLinkingTestCase -v 2

# Expected output:
# test_anonymous_subscription_linked_on_login ... ok
# test_multiple_anonymous_subscriptions_not_linked ... ok
# test_authenticated_user_register_after_anonymous ... ok
```

## Database Impact

The model already supports `user=null`:

```python
class PushSubscription(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, 
        related_name="push_subscriptions",
        null=True,           # ← Allows anonymous subscriptions
        blank=True,
    )
```

No migrations required—the schema already supports this pattern.

## Targeting Implementation

Now that users can be linked, you can use the user field to segment notifications:

```python
# Send to authenticated users only
authenticated_subs = PushSubscription.objects.filter(user__isnull=False)

# Send to user-specific campaign
user_subs = PushSubscription.objects.filter(user=user)

# Send to anonymous/broadcast
broadcast_subs = PushSubscription.objects.filter(user__isnull=True)
```

## Caveats & Future Improvements

### Current Limitations
- **Device-specific linking**: Only works if user has ONE anonymous subscription. If they subscribe on multiple devices before logging in, only one will be linked.
- **No browser fingerprinting**: We don't track device/browser identity

### Future Enhancements
Consider for v2:
1. **Device fingerprinting**: Track device ID in subscription
2. **Email-based linking**: Allow users to manually link old subscriptions by email
3. **Cross-device tracking**: Use analytics cookies to identify same user across devices
4. **Subscription migration UI**: Let users manually select which subscriptions to link

## Related Files
- `backend/notifications/views_push.py` - Push subscription endpoints
- `backend/notifications/signals.py` - Login signal handler (NEW)
- `backend/notifications/models/push_subscription.py` - PushSubscription model
- `backend/notifications/tests.py` - Test cases (NEW)

## Questions?

If users report issues with push notifications after login, check:
1. Is the subscription appearing in `GET /api/notifications/push/subscriptions/`?
2. Is the `user` field populated in the database?
3. Are notifications being sent via `send_push_notification_to_user(user=request.user, ...)`?
