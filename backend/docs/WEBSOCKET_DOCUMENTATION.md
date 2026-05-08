# JoyFund Real-time WebSocket Notifications System

**Status:** ✅ Production Ready  
**Last Updated:** April 2026  
**Technology Stack:** Django Channels 4.x + **Chanx WebSocket Framework** + Redis + Celery + Daphne

> **💡 Enhanced with Chanx:** This system uses [Chanx](https://chanx.readthedocs.io/), a batteries-included WebSocket framework that provides automatic message routing, Pydantic validation, type safety, and auto-generated AsyncAPI documentation.

---

## Table of Contents

1. [Overview](#overview)
2. [WebSocket Connection Paths](#websocket-connection-paths) ⭐ **START HERE**
3. [Authentication](#authentication) ⭐ **OAuth2 Access Tokens**
4. [Architecture](#architecture)
5. [Channel Groups & Routing](#channel-groups--routing)
6. [Event Types](#event-types)
7. [Backend Signal Flow](#backend-signal-flow)
8. [Chanx Implementation](#chanx-implementation)
9. [Frontend Integration](#frontend-integration)
10. [WebSocket Connection Guide](#websocket-connection-guide)
11. [AsyncAPI Documentation](#asyncapi-documentation) ⭐ **INTERACTIVE**
12. [Message Formats](#message-formats)
13. [Database Fallback](#database-fallback)
14. [Testing & Verification](#testing--verification)
15. [Troubleshooting](#troubleshooting)
16. [Deployment](#deployment)

---

## WebSocket Connection Paths

### 🔵 `/ws/donations/` - Unauthenticated Donation Feed

**Access:** Public (no authentication required)  
**Protocol:** WebSocket (ws:// or wss://)  
**Base URL:** `ws://localhost:8000/ws/donations/`

#### Purpose
Real-time donation feed for website visitors. Displays all donations across campaigns and per-campaign donations with automatic updates.

#### Usage Example (JavaScript)

```javascript
// Connect to global donation feed
const socket = new WebSocket('ws://localhost:8000/ws/donations/');

socket.onopen = (event) => {
  console.log('✅ Connected to donation feed');
};

// Receive donation events
socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('💰 New donation:', message);
  
  // Example message structure:
  // {
  //   "action": "donation_created",
  //   "payload": {
  //     "donation_id": 456,
  //     "campaign_id": 45,
  //     "campaign_name": "Clean Water Campaign",
  //     "donor_name": "John Doe",
  //     "amount": 10000,
  //     "currency": "XAF",
  //     "status": "SUCCESS",
  //     "created_at": "2026-04-01T10:30:00Z"
  //   }
  // }
};

socket.onerror = (error) => {
  console.error('❌ WebSocket error:', error);
};

socket.onclose = () => {
  console.log('🔌 Disconnected from donation feed');
};
```

#### Subscribe to Campaign-Specific Donations

```javascript
// Send subscription message
socket.send(JSON.stringify({
  "action": "subscribe_campaign",
  "payload": {
    "campaign_id": 45
  }
}));

// Server responds with confirmation
// {
//   "action": "subscribed",
//   "payload": {
//     "campaign_id": 45
//   }
// }
```

#### Unsubscribe from Campaign

```javascript
socket.send(JSON.stringify({
  "action": "unsubscribe_campaign",
  "payload": {
    "campaign_id": 45
  }
}));
```

---

### 🔐 `/ws/notifications/` - Authenticated User Notifications

**Access:** Requires OAuth2 access token  
**Protocol:** WebSocket (ws:// or wss://)  
**Base URL:** `ws://localhost:8000/ws/notifications/?token=YOUR_ACCESS_TOKEN`

#### Purpose
Real-time notifications for authenticated users. Each user receives:
- Personal notifications (donations, voucher updates)
- Role-based notifications (admin dashboard, hospital staff events)
- System notifications

#### Authentication

You must provide your OAuth2 access token (from drf-social-oauth2) via one of two methods:

**Method 1: Query String Parameter** (Recommended for WebSocket)
```
ws://localhost:8000/ws/notifications/?token=YOUR_ACCESS_TOKEN
```

**Method 2: Authorization Header**
```javascript
const socket = new WebSocket('ws://localhost:8000/ws/notifications/');
socket.onopen = () => {
  // Send token via custom header (requires server-side custom handling)
  // Standard HTTP headers don't work with raw WebSocket
  // Use query string method instead
};
```

#### Getting Your OAuth2 Access Token

1. **Login via drf-social-oauth2:**
   ```bash
   curl -X POST http://localhost:8000/auth/convert-token \
     -d "grant_type=convert_token&client_id=YOUR_CLIENT_ID&client_secret=YOUR_SECRET&backend=google&token=SOCIAL_TOKEN"
   ```

2. **Response contains access_token:**
   ```json
   {
     "access_token": "a1b2c3d4e5f6...",
     "expires_in": 36000,
     "token_type": "Bearer",
     "scope": "read write"
   }
   ```

3. **Use this token in WebSocket connection:**
   ```javascript
   const accessToken = "a1b2c3d4e5f6...";
   const socket = new WebSocket(
     `ws://localhost:8000/ws/notifications/?token=${accessToken}`
   );
   ```

#### Usage Example (JavaScript)

```javascript
// Connect with OAuth2 access token
const accessToken = localStorage.getItem('access_token');
const socket = new WebSocket(
  `ws://localhost:8000/ws/notifications/?token=${accessToken}`
);

socket.onopen = (event) => {
  console.log('✅ Connected to notifications');
  // Server automatically subscribes user to:
  // - user_{user_id} (personal notifications)
  // - admin_dashboard (if user is admin)
  // - hospital_{hospital_id}_staff (if user is hospital staff)
};

// Receive notifications
socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch(message.action) {
    case 'user_created':
      console.log('👤 New user signed up:', message.payload);
      break;
    case 'donation_created':
      console.log('💰 Donation received:', message.payload);
      break;
    case 'voucher_assignment_pending':
      console.log('⏳ Voucher needs approval:', message.payload);
      break;
    case 'voucher_created':
      console.log('🎟️ Voucher issued:', message.payload);
      break;
    case 'voucher_redeemed':
      console.log('✅ Voucher redeemed:', message.payload);
      break;
    case 'pong':
      console.log('🏓 Pong received');
      break;
  }
};

socket.onerror = (error) => {
  console.error('❌ WebSocket error:', error);
  // Check token expiration:
  // 1. Token is invalid or expired
  // 2. User doesn't exist
  // 3. User role requires specific groups not available
};

socket.onclose = () => {
  console.log('🔌 Disconnected from notifications');
};
```

#### Send Client Messages

```javascript
// Ping (health check)
socket.send(JSON.stringify({
  "action": "ping",
  "payload": null
}));
// Server responds with pong

// Mark notification as read
socket.send(JSON.stringify({
  "action": "mark_as_read",
  "payload": {
    "notification_id": 123
  }
}));

// Mark all notifications as read
socket.send(JSON.stringify({
  "action": "mark_all_as_read",
  "payload": null
}));

// Delete notification
socket.send(JSON.stringify({
  "action": "delete_notification",
  "payload": {
    "notification_id": 123
  }
}));
```

---

## Authentication

### OAuth2 Access Tokens (drf-social-oauth2)

JoyFund uses **drf-social-oauth2** (built on django-oauth-toolkit) for authentication.

#### Token Sources

1. **Social Login (Google, Facebook, etc.):**
   ```bash
   POST /auth/convert-token
   grant_type=convert_token
   client_id=YOUR_CLIENT_ID
   client_secret=YOUR_SECRET
   backend=google  # or facebook, microsoft, etc.
   token=SOCIAL_ID_TOKEN
   ```

2. **Username/Password:**
   ```bash
   POST /auth/token
   grant_type=password
   username=user@example.com
   password=password123
   client_id=YOUR_CLIENT_ID
   client_secret=YOUR_SECRET
   ```

#### Token Validation for WebSocket

WebSocket consumers validate tokens against the OAuth2AccessToken database table:

```python
# backend/consumers.py
async def authenticate(self) -> bool:
    """Validate OAuth2 access token from query params or headers."""
    from backend.auth import extract_token_from_scope, get_user_from_oauth2_token
    
    token = await extract_token_from_scope(self.scope)
    if not token:
        return False
    
    # Validates against oauth2_provider.models.AccessToken
    user = await get_user_from_oauth2_token(token)
    if not user:
        return False
    
    self.user = user
    return True
```

#### Token Expiration

Tokens are checked for expiration on connection:
- If expired: connection denied
- If valid: user authenticated and subscribed to groups
- Tokens auto-refresh via OAuth2 refresh token mechanism

---

## Overview

The JoyFund platform uses **Django Channels** to deliver real-time notifications to users, admins, and hospital staff. When critical events occur—user signups, donations, voucher creation, and redemptions—all relevant stakeholders receive instant WebSocket updates without polling.

### Key Features

✅ **Real-time delivery** - WebSocket push notifications (no polling)  
✅ **Async processing** - Celery tasks decouple event triggering from notification delivery  
✅ **Offline resilience** - Database fallback ensures no notifications are lost  
✅ **Role-based routing** - Notifications go to the right people automatically  
✅ **Scalable architecture** - Redis channel layer supports multiple concurrent connections  
✅ **Standardized format** - All messages use consistent JSON schema  

### Supported Events

| Event | Trigger | Recipients | Channel |
|-------|---------|------------|---------|
| **User Created** | Donor signup | System & Hospital Admins | `admin_dashboard` |
| **Donation Made** | Payment succeeds | Website visitors, donor, admin | `donations`, `donations_detail_{campaign_id}`, `admin_dashboard`, `user_{donor_id}` |
| **Voucher Assignment Pending** | Matching engine pairs beneficiary | System Admins | `admin_dashboard` |
| **Voucher Created** | Voucher approved/issued | Hospital staff, admin | `hospital_{hospital_id}_staff`, `admin_dashboard` |
| **Voucher Redeemed** | Service completed | Campaign donors, admin | `user_{donor_id}` (per donor), `admin_dashboard` |

---

## Architecture

### High-Level Flow

```
Django Signal
    ↓
Celery Task (async)
    ↓
Channel Layer (Redis)
    ↓
WebSocket Consumer
    ↓
Connected Browser Clients
    
(Offline fallback): Database Notification Records
```

### Components

#### 1. **Signal Handlers** (`accounts/signals.py`, `payments/signals.py`, `vouchers/signals.py`)
- Listen for model events (post_save, status changes)
- Dispatch Celery tasks asynchronously
- Prevent blocking user operations

#### 2. **Celery Tasks** (`accounts/tasks.py`, `payments/tasks.py`, `vouchers/tasks.py`)
- Broadcast events to channel groups
- Create database notification records
- Implement retry logic with exponential backoff
- Send email fallbacks if needed

#### 3. **Channel Layer** (Redis, configured in `settings.py`)
```python
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [os.environ.get('CHANNEL_LAYER_HOST', 'redis://localhost:6379/0')],
            "capacity": 1500,
            "expiry": 10,
        },
    },
}
```

#### 4. **WebSocket Consumers** (`backend/consumers.py`)
- `DonationConsumer` - Handles donation feed (unauthenticated)
- `NotificationConsumer` - Handles user notifications (authenticated)

#### 5. **ASGI Application** (`backend/asgi.py`)
```python
application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})
```

#### 6. **Message Formatters** (`backend/message_formats.py`)
Standardized builders for each event type ensure consistent JSON schema.

---

## Channel Groups & Routing

### Global Channels

#### `donations`
**Purpose:** Global donation feed visible to all website visitors  
**Access:** Unauthenticated  
**Content:** All donations from all campaigns  
**Subscribers:** Website visitors

**Example message:**
```json
{
  "type": "notification_event",
  "event": "donation_created",
  "timestamp": "2026-04-01T10:30:00Z",
  "data": {
    "id": 123,
    "title": "New Donation to Clean Water Campaign",
    "message": "John Doe donated 10,000 XAF to Clean Water Campaign",
    "object": {
      "donation_id": 123,
      "campaign_id": 45,
      "campaign_name": "Clean Water Campaign",
      "donor_name": "John Doe",
      "amount": "10000",
      "currency": "XAF"
    }
  }
}
```

#### `donations_detail_{campaign_id}`
**Purpose:** Campaign-specific donation feed  
**Access:** Unauthenticated  
**Content:** Donations only to this campaign  
**Subscribers:** Campaign detail page viewers

**Example:** `donations_detail_45` → only donations to campaign ID 45

### Admin Channels

#### `admin_dashboard`
**Purpose:** System and hospital admin notifications  
**Access:** SYSTEM_ADMIN, HOSPITAL_ADMIN roles only  
**Content:** User creations, voucher assignments, donations, voucher events  
**Subscribers:** All admins connected to dashboard

**Auto-subscribed by:** `NotificationConsumer` if user is admin role

### Staff Channels

#### `hospital_{hospital_id}_staff`
**Purpose:** Hospital-specific staff notifications  
**Access:** HOSPITAL_ADMIN, RECEPTIONIST roles at this hospital  
**Content:** Voucher creations, care events for this hospital  
**Subscribers:** Hospital admins and receptionists

**Auto-subscribed by:** `NotificationConsumer` for HOSPITAL_ADMIN and RECEPTIONIST users

### User Channels

#### `user_{user_id}`
**Purpose:** Personal user notifications  
**Access:** Only User ID {user_id}  
**Content:** Personal donations, voucher redemptions, system messages  
**Subscribers:** Single individual user

**Auto-subscribed by:** `NotificationConsumer` on authentication

---

## Event Types

### 1. User Created (`user_created`)

**Trigger:** `accounts.signals.send_welcome_email_on_user_creation` (User.post_save, created=True, role='DONOR')

**Task:** `accounts.tasks.notify_admin_user_created`

**Channel:** `admin_dashboard`

**Payload:**
```json
{
  "event": "user_created",
  "data": {
    "object": {
      "user_id": 123,
      "email": "john@example.com",
      "full_name": "John Doe",
      "role": "DONOR",
      "created_at": "2026-04-01T10:00:00Z"
    }
  }
}
```

---

### 2. Donation Created (`donation_created`)

**Trigger:** `payments.signals.create_transactions_on_successful_donation` (Donation.status='SUCCESS')

**Task:** `payments.tasks.notify_donation_made`

**Channels:** 
- `donations` (global feed)
- `donations_detail_{campaign_id}` (campaign-specific)
- `admin_dashboard` (platform admins)
- `user_{donor_id}` (donor personal notification)

**Payload:**
```json
{
  "event": "donation_created",
  "data": {
    "object": {
      "donation_id": 456,
      "campaign_id": 45,
      "campaign_name": "Clean Water Campaign",
      "donor_id": 123,
      "donor_name": "John Doe",
      "amount": "10000",
      "currency": "XAF"
    }
  }
}
```

---

### 3. Voucher Assignment Pending (`voucher_assignment_pending`)

**Trigger:** `vouchers.signals.notify_on_voucher_assignment_created` (VoucherAssignment.post_save, created=True)

**Task:** `vouchers.tasks.notify_voucher_assignment_pending`

**Channel:** `admin_dashboard`

**Payload:**
```json
{
  "event": "voucher_assignment_pending",
  "data": {
    "object": {
      "assignment_id": 789,
      "beneficiary_name": "Maria Kum",
      "matched_amount": "5000",
      "campaign_name": "Clean Water Campaign",
      "hospital_name": "Limbe Hospital",
      "approval_deadline": "2026-04-02T10:00:00Z"
    }
  }
}
```

**Context:** Admins have 24 hours to approve/flag. System auto-approves after deadline.

---

### 4. Voucher Created (`voucher_created`)

**Trigger:** `vouchers.signals.notify_on_voucher_status_change` (CareVoucher.status='AVAILABLE')

**Task:** `vouchers.tasks.notify_voucher_created`

**Channels:**
- `hospital_{hospital_id}_staff` (hospital staff)
- `admin_dashboard` (admins)

**Payload:**
```json
{
  "event": "voucher_created",
  "data": {
    "object": {
      "voucher_id": 999,
      "voucher_code": "X9K3L2",
      "beneficiary_name": "Maria Kum",
      "campaign_id": 45,
      "campaign_name": "Clean Water Campaign",
      "hospital_id": 12,
      "urgency_level": "HIGH"
    }
  }
}
```

---

### 5. Voucher Redeemed (`voucher_redeemed`)

**Trigger:** `vouchers.signals.notify_on_voucher_status_change` (CareVoucher.status='REDEEMED')

**Task:** `vouchers.tasks.notify_voucher_redeemed`

**Channels:**
- `user_{donor_id}` for each donor in campaign
- `admin_dashboard` (admins)

**Payload:**
```json
{
  "event": "voucher_redeemed",
  "data": {
    "object": {
      "voucher_id": 999,
      "voucher_code": "X9K3L2",
      "beneficiary_name": "Maria Kum",
      "campaign_id": 45,
      "campaign_name": "Clean Water Campaign",
      "hospital_id": 12,
      "hospital_name": "Limbe Hospital"
    }
  }
}
```

**Recipients:** Only donors who contributed via Donation to campaign 45.

---

## Backend Signal Flow

### Complete Lifecycle Example: Donation

```
1. Frontend submits donation
   ↓
2. Payment.objects.create() → Payment API completes
   ↓
3. Donation.status = 'SUCCESS' → Donation.save()
   ↓
4. Signal fires: create_transactions_on_successful_donation
   ├─ Creates TransactionLedger entries
   └─ Calls notify_donation_made.delay()
   ↓
5. Celery task queued (async)
   ↓
6. Worker picks up task
   ├─ Prepares message
   ├─ Calls channel_layer.group_send() for each recipient group
   ├─ Creates Notification DB records
   └─ Sends email fallback
   ↓
7. WebSocket consumers listening to groups receive event
   ├─ DonationConsumer (donations, donations_detail_{id})
   ├─ NotificationConsumer (admin_dashboard, user_{donor_id})
   └─ Sends JSON to browser
   ↓
8. Browser JavaScript processes event
   └─ Updates UI in real-time
   
Offline fallback:
- If user not connected, Notification record in DB
- User sees on next reconnect/page load
```

### Signal Handler Example

```python
@receiver(post_save, sender=Donation)
def create_transactions_on_successful_donation(sender, instance: Donation, **kwargs):
    if instance.status != 'SUCCESS':
        return
    
    # Process transactions...
    
    # Queue async notification
    try:
        notify_donation_made.delay(
            donation_id=instance.id,
            donor_id=instance.donor_id,
            campaign_id=instance.campaign_id,
            donation_data={...}
        )
    except Exception as e:
        logger.error(f"Failed to queue notification: {e}")
```

### Celery Task Example

```python
@shared_task(bind=True, max_retries=3)
def notify_donation_made(self, donation_id, donor_id, campaign_id, donation_data):
    try:
        # Broadcast to channel groups
        async def broadcast():
            await channel_layer.group_send('donations', message_data)
            await channel_layer.group_send(f'donations_detail_{campaign_id}', message_data)
            await channel_layer.group_send('admin_dashboard', message_data)
            await channel_layer.group_send(f'user_{donor_id}', message_data)
        
        async_to_sync(broadcast)()
        
        # Create DB records for offline users
        Notification.objects.create(...)
        
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))
```

---

## Chanx Implementation

### Why Chanx?

The current manual implementation works well but has challenges:

- **Manual routing:** If-else chains in `consumers.py` don't scale
- **Type safety:** No IDE autocomplete for WebSocket messages
- **Documentation:** Manual docs go out of sync with code
- **Testing:** Each test is custom-written without framework support
- **Onboarding:** New developers must reverse-engineer message flows

**Chanx solves this with:**

✅ **Decorators** replace routing logic (no more if-else chains)  
✅ **Pydantic models** replace dict-based messages (type-safe)  
✅ **Auto docs** generate AsyncAPI specs from code  
✅ **Test utilities** make unit tests simple and reliable  
✅ **Broadcasting API** works from Celery tasks, views, management commands  

### Installation

```bash
pip install chanx[channels]
```

Already included in `requirements.txt`.

### Message Definitions with Pydantic

Replace `backend/message_formats.py` builders with Chanx message models:

```python
# backend/ws_messages.py
from typing import Literal
from pydantic import BaseModel
from chanx.messages.base import BaseMessage

# Base message structures
class UserCreatedPayload(BaseModel):
    user_id: int
    email: str
    full_name: str
    role: Literal['DONOR', 'HOSPITAL_ADMIN', 'RECEPTIONIST', 'SOCIAL_WORKER', 'SYSTEM_ADMIN']
    created_at: str

class UserCreatedMessage(BaseMessage):
    action: Literal['user_created'] = 'user_created'
    payload: UserCreatedPayload

class DonationPayload(BaseModel):
    donation_id: int
    campaign_id: int
    campaign_name: str
    donor_id: int
    donor_name: str
    amount: str
    currency: str

class DonationCreatedMessage(BaseMessage):
    action: Literal['donation_created'] = 'donation_created'
    payload: DonationPayload

class VoucherAssignmentPayload(BaseModel):
    assignment_id: int
    beneficiary_name: str
    matched_amount: str
    campaign_name: str
    hospital_name: str
    approval_deadline: str

class VoucherAssignmentPendingMessage(BaseMessage):
    action: Literal['voucher_assignment_pending'] = 'voucher_assignment_pending'
    payload: VoucherAssignmentPayload

class VoucherPayload(BaseModel):
    voucher_id: int
    voucher_code: str
    beneficiary_name: str
    campaign_id: int
    campaign_name: str
    hospital_id: int
    urgency_level: str = 'NORMAL'

class VoucherCreatedMessage(BaseMessage):
    action: Literal['voucher_created'] = 'voucher_created'
    payload: VoucherPayload

class VoucherRedeemedMessage(BaseMessage):
    action: Literal['voucher_redeemed'] = 'voucher_redeemed'
    payload: VoucherPayload

class PingMessage(BaseMessage):
    action: Literal['ping'] = 'ping'

class PongMessage(BaseMessage):
    action: Literal['pong'] = 'pong'
```

### Consumer with Decorators

Replace manual `backend/consumers.py` with Chanx consumer:

```python
# backend/consumers.py
from chanx.channels.websocket import AsyncJsonWebsocketConsumer
from chanx.core.decorators import ws_handler
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from backend.ws_messages import (
    DonationCreatedMessage, VoucherAssignmentPendingMessage,
    VoucherCreatedMessage, VoucherRedeemedMessage, PingMessage, PongMessage
)
import logging

logger = logging.getLogger(__name__)
channel_layer = get_channel_layer()

class NotificationConsumer(AsyncJsonWebsocketConsumer):
    """Authenticated WebSocket consumer for real-time notifications."""

    async def connect(self):
        """Authenticate and subscribe to user/role-based groups."""
        # Verify JWT token
        user = self.scope.get('user')
        if not user or not user.is_authenticated:
            await self.close()
            return

        await self.accept()
        self.user_id = user.id
        self.user_role = getattr(user, 'role', 'DONOR')
        self.hospital_id = getattr(user, 'hospital_id', None)

        # Auto-subscribe to personal notifications
        await self.channel_layer.group_add(
            f'user_{self.user_id}',
            self.channel_name
        )

        # Admin subscriptions
        if self.user_role in ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN']:
            await self.channel_layer.group_add(
                'admin_dashboard',
                self.channel_name
            )

        # Hospital staff subscriptions
        if self.user_role in ['HOSPITAL_ADMIN', 'RECEPTIONIST'] and self.hospital_id:
            await self.channel_layer.group_add(
                f'hospital_{self.hospital_id}_staff',
                self.channel_name
            )

        logger.info(f"User {self.user_id} connected to notifications")

    async def disconnect(self, close_code):
        """Cleanup group subscriptions."""
        await self.channel_layer.group_discard(
            f'user_{self.user_id}',
            self.channel_name
        )
        if self.user_role in ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN']:
            await self.channel_layer.group_discard(
                'admin_dashboard',
                self.channel_name
            )
        if self.user_role in ['HOSPITAL_ADMIN', 'RECEPTIONIST'] and self.hospital_id:
            await self.channel_layer.group_discard(
                f'hospital_{self.hospital_id}_staff',
                self.channel_name
            )
        logger.info(f"User {self.user_id} disconnected")

    # Event handlers with decorators
    @ws_handler(
        output_type=DonationCreatedMessage,
        summary='Donation created event',
        description='Broadcast when a new donation is successfully processed',
        tags=['donations']
    )
    async def handle_donation_created(self, message: DonationCreatedMessage) -> None:
        """Echo donation event to client."""
        await self.send_json(message.model_dump())

    @ws_handler(
        output_type=VoucherAssignmentPendingMessage,
        summary='Voucher assignment pending approval',
        description='Admin must approve voucher assignment within 24 hours',
        tags=['vouchers', 'admin']
    )
    async def handle_voucher_assignment(self, message: VoucherAssignmentPendingMessage) -> None:
        """Echo voucher assignment event to admin."""
        await self.send_json(message.model_dump())

    @ws_handler(
        output_type=VoucherCreatedMessage,
        summary='Voucher created',
        description='Broadcast when care voucher is issued to beneficiary',
        tags=['vouchers']
    )
    async def handle_voucher_created(self, message: VoucherCreatedMessage) -> None:
        """Echo voucher creation event."""
        await self.send_json(message.model_dump())

    @ws_handler(
        output_type=VoucherRedeemedMessage,
        summary='Voucher redeemed',
        description='Broadcast when beneficiary completes care and voucher is marked redeemed',
        tags=['vouchers']
    )
    async def handle_voucher_redeemed(self, message: VoucherRedeemedMessage) -> None:
        """Echo voucher redemption event."""
        await self.send_json(message.model_dump())

    @ws_handler(
        output_type=PongMessage,
        summary='Ping/Pong healthcheck',
        description='Client sends ping, server responds with pong',
        tags=['system']
    )
    async def handle_ping(self, message: PingMessage) -> PongMessage:
        """Respond to ping with pong."""
        return PongMessage()

    # Generic event type handlers for channel_layer messages
    async def notification_event(self, event):
        """Handle notification_event type messages from channel_layer."""
        await self.send_json(event['data'])


class DonationConsumer(AsyncJsonWebsocketConsumer):
    """Unauthenticated consumer for donation feed."""

    async def connect(self):
        """Subscribe to global and campaign-specific donation channels."""
        await self.accept()
        
        # Always subscribe to global donations
        await self.channel_layer.group_add('donations', self.channel_name)
        
        logger.info("Client connected to donation feed")

    async def disconnect(self, close_code):
        """Cleanup subscriptions."""
        await self.channel_layer.group_discard('donations', self.channel_name)

    @ws_handler(
        output_type=DonationCreatedMessage,
        summary='Subscribe to campaign donations',
        description='Client subscribes to specific campaign donations',
        tags=['donations']
    )
    async def handle_subscribe_campaign(self, message: dict) -> None:
        """Subscribe to campaign-specific donation updates."""
        campaign_id = message.get('campaign_id')
        if campaign_id:
            await self.channel_layer.group_add(
                f'donations_detail_{campaign_id}',
                self.channel_name
            )

    @ws_handler(
        output_type=DonationCreatedMessage,
        summary='Unsubscribe from campaign donations',
        tags=['donations']
    )
    async def handle_unsubscribe_campaign(self, message: dict) -> None:
        """Unsubscribe from campaign-specific donations."""
        campaign_id = message.get('campaign_id')
        if campaign_id:
            await self.channel_layer.group_discard(
                f'donations_detail_{campaign_id}',
                self.channel_name
            )

    async def notification_event(self, event):
        """Receive donation broadcast events."""
        await self.send_json(event['data'])
```

### Broadcasting from Celery Tasks

With Chanx, broadcasting is simplified:

```python
# payments/tasks.py
from celery import shared_task
from django.contrib.auth import get_user_model
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from backend.ws_messages import DonationCreatedMessage, DonationPayload
import logging

logger = logging.getLogger(__name__)
User = get_user_model()
channel_layer = get_channel_layer()

@shared_task(bind=True, max_retries=3)
def notify_donation_made(self, donation_id: int, donor_id: int, campaign_id: int, donation_data: dict):
    """Broadcast donation event to all relevant groups."""
    try:
        # Create message object (Pydantic validates automatically)
        message = DonationCreatedMessage(
            payload=DonationPayload(**donation_data)
        )

        # Broadcast helper encapsulates channel_layer calls
        async def broadcast():
            message_dict = {
                'type': 'notification_event',
                'data': message.model_dump()
            }
            
            # Send to all relevant groups
            groups = [
                'donations',
                f'donations_detail_{campaign_id}',
                'admin_dashboard',
                f'user_{donor_id}'
            ]
            
            for group in groups:
                await channel_layer.group_send(group, message_dict)

        async_to_sync(broadcast)()
        
        # Create DB notification for offline users
        from notifications.models import Notification
        admins = User.objects.filter(role='SYSTEM_ADMIN')
        for admin in admins:
            Notification.objects.create(
                user=admin,
                title='New Donation',
                message=f"Donation of {donation_data.get('amount')} received",
                notification_type='DONATION_RECEIVED',
            )
            
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))
```

### Auto-Generated AsyncAPI Docs

Chanx automatically generates AsyncAPI 3.0 documentation from your message definitions:

```bash
# Start Django dev server
python manage.py runserver

# Visit AsyncAPI docs
http://localhost:8000/asyncapi/  # Interactive documentation
http://localhost:8000/asyncapi.json  # OpenAPI spec
http://localhost:8000/asyncapi.yaml  # YAML spec
```

The docs show:
- All available WebSocket messages
- Message payloads and types
- Subcriptions (channels)
- Authentication requirements
- Examples and descriptions

### Type-Safe Testing

Chanx provides testing utilities:

```python
# tests/test_notifications.py
from chanx.channels.testing import WebsocketTestCase
from django.contrib.auth import get_user_model
from backend.consumers import NotificationConsumer
from backend.ws_messages import DonationCreatedMessage, DonationPayload
import pytest

User = get_user_model()

class TestNotificationConsumer(WebsocketTestCase):
    consumer = NotificationConsumer

    async def test_donation_event_received(self):
        """Test that authenticated user receives donation events."""
        # Chanx provides auth_communicator with JWT token
        await self.auth_communicator.connect()
        
        # Create donation and broadcast
        message = DonationCreatedMessage(
            payload=DonationPayload(
                donation_id=1,
                campaign_id=45,
                campaign_name='Clean Water',
                donor_id=10,
                donor_name='John Doe',
                amount='10000',
                currency='XAF'
            )
        )
        
        # Send to group
        await NotificationConsumer.broadcast_event(
            message,
            groups=['donations']
        )
        
        # Receive and validate
        response = await self.auth_communicator.receive_json_from()
        assert response['action'] == 'donation_created'
        assert response['payload']['amount'] == '10000'
```

### Routing Configuration

```python
# backend/routing.py
from django.urls import path
from chanx.core.decorators import message_router
from backend.consumers import NotificationConsumer, DonationConsumer
from backend.ws_messages import (
    DonationCreatedMessage, VoucherAssignmentPendingMessage,
    VoucherCreatedMessage, VoucherRedeemedMessage,
    PingMessage, PongMessage
)

# Chanx provides automatic routing from decorators
# No need for manual if-else chains in receive()

websocket_urlpatterns = [
    path('ws/notifications/', NotificationConsumer.as_asgi(), name='notification-ws'),
    path('ws/donations/', DonationConsumer.as_asgi(), name='donation-ws'),
]
```

### Configuration in settings.py

```python
# backend/settings.py

INSTALLED_APPS = [
    # ...
    'chanx',  # Add Chanx
    'daphne',
    'channels',
    # ...
]

# Chanx configuration
ADVANCED_MESSAGE_VALIDATION = True  # Enable Pydantic validation
GENERATE_ASYNCAPI_SPEC = True  # Auto-generate docs
ASYNCAPI_INFO = {
    'title': 'JoyFund WebSocket API',
    'version': '1.0.0',
    'description': 'Real-time notifications for donors, admins, and hospital staff',
    'license': {'name': 'MIT'},
}
```

### Migration from Current Implementation

**Phase 1: Message Definitions** (Low risk)
```bash
# 1. Create backend/ws_messages.py with Pydantic models (shown above)
# 2. Keep backend/message_formats.py for now (compatibility)
# 3. Update Celery tasks to use new Pydantic models
```

**Phase 2: Consumers** (Medium risk)
```bash
# 1. Update backend/consumers.py with @ws_handler decorators
# 2. Test routing with WebSocket clients
# 3. Remove manual if-else logic
```

**Phase 3: Testing** (Low risk)
```bash
# 1. Update test suite to use WebsocketTestCase
# 2. Rely on Chanx test utilities
```

**Phase 4: Documentation** (Zero risk)
```bash
# 1. AsyncAPI docs auto-generated at /asyncapi/
# 2. No manual docs needed
```

---

## Frontend Integration

### 1. Installation

Ensure you have WebSocket support in your frontend:

```bash
# No additional dependencies needed - native WebSocket API works
# Or use a library for enhanced features:
npm install reconnecting-websocket  # Auto-reconnect on disconnect
npm install socket.io-client      # Fallback to HTTP long-polling
```

### 2. Connecting to Donation Feed (Unauthenticated)

```javascript
// Connect to global donation feed
const donationSocket = new WebSocket(
  `ws://localhost:8000/ws/donations/?token=${getAuthToken()}`
);

donationSocket.onopen = () => {
  console.log('Connected to donation feed');
  
  // Subscribe to specific campaign (optional)
  donationSocket.send(JSON.stringify({
    command: 'subscribe_campaign',
    campaign_id: 45
  }));
};

donationSocket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  if (message.event === 'donation_created') {
    const { donor_name, amount, campaign_name } = message.data.object;
    
    // Update UI
    updateDonationFeed({
      donor: donor_name,
      amount: `${amount} XAF`,
      campaign: campaign_name,
      timestamp: message.timestamp
    });
  }
};

donationSocket.onerror = (error) => {
  console.error('WebSocket error:', error);
};

donationSocket.onclose = () => {
  console.log('Disconnected from donation feed');
  // Attempt reconnect...
};
```

### 3. Connecting to Authenticated Notifications

```javascript
// Get JWT token from auth system
const token = localStorage.getItem('access_token');

const notificationSocket = new WebSocket(
  `ws://localhost:8000/ws/notifications/?token=${token}`
);

notificationSocket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch(message.event) {
    case 'user_created':
      // Handle in admin dashboard only
      break;
      
    case 'donation_created':
      // Donor receives personal notification
      showNotification(`Your donation of ${message.data.object.amount} was received!`);
      break;
      
    case 'voucher_assignment_pending':
      // Admin approval required
      showAdminAlert(`Voucher assignment requires approval`);
      break;
      
    case 'voucher_created':
      // Hospital staff notified
      updateHospitalQueue();
      break;
      
    case 'voucher_redeemed':
      // Donor notified their contribution was used
      showNotification(`Your contribution helped ${message.data.object.beneficiary_name}`);
      break;
  }
};
```

### 4. Auto-Reconnect with Exponential Backoff

```javascript
class WebSocketManager {
  constructor(url) {
    this.url = url;
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start at 1 second
  }
  
  connect() {
    this.socket = new WebSocket(this.url);
    
    this.socket.onopen = () => {
      console.log('Connected');
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
    };
    
    this.socket.onclose = () => {
      this.attemptReconnect();
    };
    
    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }
  
  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting in ${this.reconnectDelay}ms... (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay);
      
      // Exponential backoff: 1s, 2s, 4s, 8s, 16s
      this.reconnectDelay = Math.min(
        this.reconnectDelay * 2,
        30000 // Max 30 seconds
      );
    } else {
      console.error('Max reconnection attempts reached');
      // Show error to user
    }
  }
}

// Usage
const manager = new WebSocketManager(
  `ws://localhost:8000/ws/notifications/?token=${token}`
);
manager.connect();
```

### 5. React Integration Example

```javascript
import { useEffect, useRef, useState } from 'react';

export function NotificationsListener() {
  const [notifications, setNotifications] = useState([]);
  const socketRef = useRef(null);
  
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const wsUrl = `ws://localhost:8000/ws/notifications/?token=${token}`;
    
    socketRef.current = new WebSocket(wsUrl);
    
    socketRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      setNotifications(prev => [
        {
          id: Date.now(),
          event: message.event,
          title: message.data.title,
          message: message.data.message,
          timestamp: message.timestamp,
          ...message.data.object
        },
        ...prev
      ]);
      
      // Optional: Show toast notification
      if (window.notificationService) {
        window.notificationService.show({
          type: 'info',
          message: message.data.message
        });
      }
    };
    
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);
  
  return (
    <div className="notifications">
      {notifications.map(notif => (
        <NotificationItem key={notif.id} notification={notif} />
      ))}
    </div>
  );
}
```

---

## WebSocket Connection Guide

### Connection URLs

#### Donations (Unauthenticated)
```
ws://localhost:8000/ws/donations/?token=OPTIONAL_JWT
```

**Features:**
- No authentication required
- Can optionally provide JWT to be identified
- Auto-subscribes to `donations` group
- Can send commands to subscribe/unsubscribe campaigns

**Supported commands:**
```json
{
  "command": "subscribe_campaign",
  "campaign_id": 45
}
```

```json
{
  "command": "unsubscribe_campaign",
  "campaign_id": 45
}
```

#### Notifications (Authenticated Only)
```
ws://localhost:8000/ws/notifications/?token=YOUR_JWT_TOKEN
```

**Features:**
- Requires valid JWT token in query params
- Auto-subscribes to:
  - `user_{user_id}` (personal notifications)
  - `admin_dashboard` (if user is admin)
  - `hospital_{hospital_id}_staff` (if user is hospital staff)
- No commands needed - all subscriptions automatic

### Authentication

#### JWT Token from Query String
```javascript
const token = 'eyJhbGciOiJIUzI1NiIs...';
const ws = new WebSocket(
  `ws://localhost:8000/ws/notifications/?token=${token}`
);
```

#### JWT Token from Authorization Header
```javascript
// Not yet implemented - must use query string for now
```

#### Getting JWT Token

From login response:
```javascript
const response = await fetch('/api/auth/login/', {
  method: 'POST',
  body: JSON.stringify({ email, password })
});

const { access_token } = await response.json();
localStorage.setItem('access_token', access_token);

// Use in WebSocket URL
```

From OAuth2 token endpoint:
```javascript
const token = await getOAuth2Token();
```

---

## Message Formats

### Standard Message Envelope

All WebSocket messages follow this structure:

```json
{
  "type": "notification_event",
  "event": "EVENT_TYPE",
  "timestamp": "ISO8601",
  "data": {
    "id": "primary_object_id",
    "title": "Human readable title",
    "message": "Human readable short message",
    "notification_id": "optional_db_notification_id",
    "object": {
      "field1": "value1",
      "field2": "value2"
    }
  }
}
```

### Error Messages

```json
{
  "type": "error",
  "message": "Error description",
  "error_code": "OPTIONAL_CODE"
}
```

### Server Status Messages

```json
{
  "type": "subscribed",
  "message": "Subscribed to campaign 45"
}
```

```json
{
  "type": "unsubscribed",
  "message": "Unsubscribed from campaign 45"
}
```

---

## Database Fallback

### How It Works

When a user is **not connected via WebSocket**, the system creates a `Notification` database record. When the user reconnects or reloads their page, they can fetch these notifications.

### Creating Fallback Records

In Celery tasks:

```python
@shared_task
def notify_donation_made(self, donation_id, ...):
    # Broadcast via WebSocket
    async_to_sync(broadcast)()
    
    # Create DB records for offline users
    Notification.objects.create(
        user=donor,
        title="Donation Confirmed",
        message=f"Your donation of {amount} was received",
        notification_type='DONATION_SENT',
    )
```

### Fetching Fallback Notifications

**API Endpoint:**
```
GET /api/notifications/
```

**Response:**
```json
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 123,
      "title": "Your Contribution Was Used",
      "message": "A care voucher for Maria Kum has been redeemed",
      "notification_type": "CAMPAIGN_UPDATE",
      "is_read": false,
      "created_at": "2026-04-01T10:30:00Z"
    }
  ]
}
```

**Mark as Read:**
```
POST /api/notifications/{id}/mark_as_read/
```

**Mark All as Read:**
```
POST /api/notifications/mark_all_as_read/
```

---

## Testing & Verification

### 1. Manual WebSocket Testing

#### Using `wscat` (CLI utility)

```bash
npm install -g wscat

# Connect to donations feed
wscat -c 'ws://localhost:8000/ws/donations/'

# In another terminal, trigger a donation in the Django shell
python manage.py shell
>>> from campaigns.models import Donation
>>> Donation.objects.filter(status='SUCCESS').first()  # Should receive event
```

#### Using browser console

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/donations/');

ws.onopen = () => console.log('Connected');
ws.onmessage = (e) => console.log('Received:', JSON.parse(e.data));
ws.onerror = (e) => console.error('Error:', e);
ws.onclose = () => console.log('Disconnected');
```

### 2. Testing Event Flow

#### Test 1: Donor Signup
```bash
# 1. Open WebSocket to admin_dashboard
# 2. Create new donor account via API
# 3. Should receive user_created event

curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"...","role":"DONOR"}'
```

#### Test 2: Donation Event
```bash
# 1. Open WebSocket to donations and admin_dashboard
# 2. Create donation via API
# 3. Should receive donation_created event immediately
```

#### Test 3: Offline Fallback
```bash
# 1. Close WebSocket connection
# 2. Create donation
# 3. Reopen WebSocket
# 4. Fetch /api/notifications/ → should have fallback record
```

#### Test 4: Voucher Assignment
```bash
# 1. Run matching engine (creates VoucherAssignment)
# 2. Admin should receive voucher_assignment_pending on admin_dashboard
```

### 3. Automated Tests

Create test file: `tests/test_websocket.py`

```python
from django.test import TransactionTestCase
from channels.testing import WebsocketCommunicator
from backend.consumers import DonationConsumer, NotificationConsumer
import json

class DonationConsumerTests(TransactionTestCase):
    async def test_donation_event_broadcast(self):
        """Test that donation_created event broadcasts to donations group."""
        communicator = WebsocketCommunicator(DonationConsumer.as_asgi(), "/ws/donations/")
        
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)
        
        # Trigger donation (via service/factory)
        donation = create_test_donation()
        
        # Receive event
        response = await communicator.receive_json_from()
        
        self.assertEqual(response['event'], 'donation_created')
        self.assertEqual(response['data']['object']['donation_id'], donation.id)
        
        await communicator.disconnect()

class NotificationConsumerTests(TransactionTestCase):
    async def test_auth_required(self):
        """Test that authenticated access is enforced."""
        communicator = WebsocketCommunicator(
            NotificationConsumer.as_asgi(),
            "/ws/notifications/"
        )
        
        connected, _ = await communicator.connect()
        self.assertFalse(connected)  # Should reject without valid token
```

---

## AsyncAPI Documentation

### 📚 Interactive API Documentation

JoyFund provides **interactive AsyncAPI documentation** (not just static HTML). You can:
- ✅ View all available WebSocket operations
- ✅ See message payloads and data types
- ✅ Browse available channels and groups
- ✅ View authentication requirements
- ✅ See real-time examples

### Access the Documentation

**Interactive AsyncAPI UI:**
```
http://localhost:8000/asyncapi/docs/
```

**JSON Schema:**
```
http://localhost:8000/asyncapi/schema/
```

The UI provides a Swagger-like interface for WebSocket APIs, showing:
- All available message types
- Message field types and descriptions
- Channel definitions (donations, admin_dashboard, etc.)
- Authentication flow
- Example payloads

### Documentation Features

#### 1. **Message Browser**
- Lists all incoming and outgoing messages
- Shows Pydantic field types
- Displays validation constraints
- Example JSON payloads

#### 2. **Channel Groups**
- `donations` - Global donation feed
- `donations_detail_{campaign_id}` - Campaign-specific donations
- `admin_dashboard` - Admin notifications
- `hospital_{hospital_id}_staff` - Hospital staff notifications
- `user_{user_id}` - Personal user notifications

#### 3. **Authentication**
- OAuth2 access token requirement
- Token placement (query string or header)
- Expiration handling
- How to obtain tokens via drf-social-oauth2

#### 4. **Real-World Examples**

The documentation shows actual JSON examples for each message type:

**Example: Donation Created**
```json
{
  "action": "donation_created",
  "payload": {
    "donation_id": 456,
    "campaign_id": 45,
    "campaign_name": "Clean Water Campaign",
    "donor_name": "John Doe",
    "amount": 10000,
    "currency": "XAF",
    "status": "SUCCESS",
    "created_at": "2026-04-01T10:30:00Z"
  }
}
```

**Example: Voucher Assignment Pending**
```json
{
  "action": "voucher_assignment_pending",
  "payload": {
    "voucher_id": 789,
    "beneficiary_name": "Maria Kum",
    "campaign_name": "Clean Water Campaign",
    "hospital_name": "Limbe Hospital",
    "matched_amount": 5000,
    "created_at": "2026-04-01T10:00:00Z"
  }
}
```

### Compare: AsyncAPI vs Swagger

| Feature | Swagger (HTTP REST) | AsyncAPI (WebSocket) |
|---------|-------------------|---------------------|
| **Protocol** | HTTP Request/Response | WebSocket Bidirectional |
| **Example** | GET /api/donations/ | ws://example.com/ws/donations/ |
| **Docs Format** | OpenAPI 3.0 | AsyncAPI 3.0 |
| **JoyFund REST API** | `/swagger/` | N/A |
| **JoyFund WebSocket API** | N/A | `/asyncapi/docs/` |
| **Real-time** | Polling | Push (native) |

### Viewing All Available Operations

Visit the AsyncAPI documentation to see:

```text
Published Messages (Server → Client):
├── donation_created
├── user_created
├── voucher_created
├── voucher_assignment_pending
├── voucher_redeemed
├── pong (ping response)
└── error (server errors)

Subscribed Messages (Client → Server):
├── subscribe_campaign
├── unsubscribe_campaign
├── mark_as_read
├── mark_all_as_read
├── delete_notification
└── ping
```

### Schema Download

Download the AsyncAPI spec for integration with tools:

```bash
# JSON format
curl http://localhost:8000/asyncapi/schema/ > asyncapi.json

# YAML format
# Currently available at /asyncapi/schema/ endpoint
```

### Auto-Generated from Code

The AsyncAPI documentation is **automatically generated** from message definitions in `backend/ws_messages.py`:

```python
class DonationCreatedMessage(BaseMessage):
    """Broadcasts when donation is successfully processed."""
    action: Literal["donation_created"] = "donation_created"
    payload: DonationPayload
```

↓ Automatically generates documentation including:
- Message description
- Payload field types
- Field constraints
- Example data

**No manual documentation needed** - it stays in sync with code!

---

## Troubleshooting

### Issue: WebSocket connection refused

**Cause:** Daphne not running or not listening on correct port

**Solution:**
```bash
# Check if Daphne is running
ps aux | grep daphne

# Start Daphne on port 8001
daphne -b 0.0.0.0 -p 8001 backend.asgi:application

# Or use with Django runserver and add to WSGI servers config
```

### Issue: Redis connection error

**Symptoms:** `Error: ConnectionRefusedError` when broadcasting to groups

**Solution:**
```bash
# Check Redis is running
redis-cli ping  # Should return PONG

# Start Redis
redis-server

# Verify connection string in settings.py
# Default: redis://localhost:6379/0
```

### Issue: Messages not arriving

**Debug steps:**

1. Check Celery worker is running:
```bash
celery -A backend worker -l info
```

2. Check Redis channel layer:
```python
# In Django shell
from channels.layers import get_channel_layer
import asyncio

channel_layer = get_channel_layer()

# Test sending message
async def test():
    await channel_layer.group_send(
        'test_group',
        {'type': 'test.message', 'text': 'hello'}
    )

asyncio.run(test())
```

3. Check Notification DB records are created:
```bash
python manage.py shell
>>> from notifications.models import Notification
>>> Notification.objects.latest('created_at')
```

### Issue: Duplicate notifications

**Cause:** Signal handler called multiple times or guard clause missing

**Solution:**
```python
@receiver(post_save, sender=Model)
def handler(sender, instance, created, **kwargs):
    # Only on creation
    if not created:
        return
    
    # Guard against re-saves
    if Transaction.objects.filter(model=instance).exists():
        return
```

### Issue: Authentication failing

**Check:**
```python
# In Django shell
from backend.auth import get_user_from_jwt_token
import jwt

token = "YOUR_TOKEN"
user = await get_user_from_jwt_token(token)
print(f"Decoded user: {user}")
```

### Issue: High memory usage

**Cause:** Channel layer capacity exceeded

**Solution:**
```python
CHANNEL_LAYERS = {
    "default": {
        "CONFIG": {
            "hosts": ['redis://localhost:6379/0'],
            "capacity": 1500,  # Increase if needed
            "expiry": 10,      # Also consider expiry time
        },
    },
}
```

Monitor with:
```bash
redis-cli INFO memory
```

---

## Deployment

### Production Checklist

- [ ] Redis configured with high availability (sentinel/cluster)
- [ ] Daphne running behind nginx/haproxy with load balancing
- [ ] SSL/TLS enabled for `wss://` connections
- [ ] Celery workers scaled horizontally
- [ ] Monitoring for WebSocket connection count
- [ ] Database backups for notification records
- [ ] Log aggregation configured for consumer/task logs
- [ ] Rate limiting configured on WebSocket endpoints

### Docker Deployment

```dockerfile
# Dockerfile excerpt
RUN pip install daphne channels channels-redis

CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "backend.asgi:application"]
```

### Nginx Configuration

```nginx
upstream websocket {
    server daphne:8000;
}

server {
    listen 443 ssl;
    
    location /ws/ {
        proxy_pass http://websocket;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Environment Variables

```bash
# .env
CHANNEL_LAYER_HOST=redis://redis:6379/0
CELERY_BROKER_URL=amqp://rabbitmq:5672
CELERY_RESULT_BACKEND=redis://redis:6379/1
DEBUG=False
ALLOWED_HOSTS=joyfund.app,www.joyfund.app
```

---

## Performance Optimization

### 1. Connection Limits

```python
# settings.py
MAX_WEBSOCKET_CONNECTIONS_PER_IP = 10
MAX_WEBSOCKET_CONNECTIONS_GLOBAL = 10000
```

### 2. Message Batching

For high-volume events, batch messages:

```python
# Instead of sending individual messages
for donor in donors:
    await channel_layer.group_send(f'user_{donor.id}', message)

# Batch them:
messages = [
    {
        'type': 'notification_event',
        'user_id': donor.id,
        'event': message
    }
    for donor in donors
]
# Send in single operation
```

### 3. Redis Optimization

```bash
# Monitor Redis performance
redis-cli --stat

# Configure for production
maxmemory 2gb
maxmemory-policy allkeys-lru
tcp-keepalive 300
```

### 4. Celery Optimization

```python
# settings.py
CELERY_WORKER_PREFETCH_MULTIPLIER = 4
CELERY_WORKER_MAX_TASKS_PER_CHILD = 1000
CELERY_TASK_TIME_LIMIT = 30 * 60
```

---

## Additional Resources

- **[Chanx Documentation](https://chanx.readthedocs.io/)** - WebSocket framework guide
- **[Chanx Django Quick Start](https://chanx.readthedocs.io/en/v2.3.1/quick-start-django.html)** - Get started with Chanx
- **[Chanx AsyncAPI Docs](https://chanx.readthedocs.io/en/v2.3.1/user-guide/asyncapi.html)** - Auto-generated documentation
- [Django Channels Documentation](https://channels.readthedocs.io/)
- [Redis Documentation](https://redis.io/documentation)
- [Celery User Guide](https://docs.celeryproject.org/en/stable/userguide/index.html)
- [WebSocket API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Pydantic Documentation](https://docs.pydantic.dev/) - Type validation

---

## Support & Troubleshooting

For issues or questions:

1. Check application logs: `docker logs <container>`
2. Check Celery worker: `celery -A backend events`
3. Check Redis: `redis-cli MONITOR`
4. Review signal handlers for errors
5. Verify all services running: Daphne, Celery, Redis, Django

---

**Document Version:** 1.0  
**Last Updated:** April 2026  
**Maintainer:** JoyFund Team
