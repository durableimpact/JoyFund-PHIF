# Support Ticket System - Implementation Plan

## Overview
Implement a full support ticket system where users (Donors, Hospital Admins, Receptionists, Social Workers) can submit issues/requests to administrators, and System Admins can manage, respond to, and resolve tickets.

---

## 1. Backend: New Django App `support/`

### 1.1 Models

```
backend/support/
├── models/
│   ├── __init__.py
│   ├── ticket.py          # SupportTicket + TicketEvent
│   └── message.py         # TicketMessage (conversation thread)
├── serializers/
│   ├── __init__.py
│   └── ticket.py
├── views/
│   ├── __init__.py
│   └── ticket.py
├── urls.py
├── admin.py
├── apps.py
├── signals.py
├── filters.py
├── tasks/
│   ├── __init__.py
│   └── notifications.py   # Celery tasks for email notifications
└── migrations/
```

#### TicketStatus (TextChoices)
```python
class TicketStatus(models.TextChoices):
    OPEN = "OPEN", "Open"
    IN_PROGRESS = "IN_PROGRESS", "In Progress"
    WAITING_FOR_USER = "WAITING_FOR_USER", "Waiting for User"
    RESOLVED = "RESOLVED", "Resolved"
    CLOSED = "CLOSED", "Closed"
```

#### TicketCategory (TextChoices)
```python
class TicketCategory(models.TextChoices):
    GENERAL = "GENERAL", "General Inquiry"
    BUG_REPORT = "BUG_REPORT", "Bug Report"
    FEATURE_REQUEST = "FEATURE_REQUEST", "Feature Request"
    ACCOUNT_ISSUE = "ACCOUNT_ISSUE", "Account Issue"
    PAYMENT_ISSUE = "PAYMENT_ISSUE", "Payment Issue"
    VOUCHER_ISSUE = "VOUCHER_ISSUE", "Voucher Issue"
    HOSPITAL_ISSUE = "HOSPITAL_ISSUE", "Hospital Issue"
    BENEFICIARY_ISSUE = "BENEFICIARY_ISSUE", "Beneficiary Issue"
    OTHER = "OTHER", "Other"
```

#### TicketPriority (TextChoices)
```python
class TicketPriority(models.TextChoices):
    LOW = "LOW", "Low"
    MEDIUM = "MEDIUM", "Medium"
    HIGH = "HIGH", "High"
    URGENT = "URGENT", "Urgent"
```

#### SupportTicket Model
```python
class SupportTicket(models.Model):
    id = UUIDField(primary_key=True)
    ticket_number = CharField(max_length=20, unique=True)  # Auto-generated: TKT-2026-00001
    
    # Relations
    created_by = ForeignKey(User, related_name="created_tickets")
    assigned_to = ForeignKey(SystemAdmin, null=True, blank=True, related_name="assigned_tickets")
    
    # Fields
    subject = CharField(max_length=255)
    description = TextField()
    category = CharField(choices=TicketCategory)
    priority = CharField(choices=TicketPriority, default=TicketPriority.MEDIUM)
    status = CharField(choices=TicketStatus, default=TicketStatus.OPEN)
    
    # Optional context links
    related_campaign = ForeignKey(Campaign, null=True, blank=True)
    related_voucher = ForeignKey(Voucher, null=True, blank=True)
    related_hospital = ForeignKey(Hospital, null=True, blank=True)
    related_beneficiary = ForeignKey(Beneficiary, null=True, blank=True)
    
    # Timestamps
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)
    resolved_at = DateTimeField(null=True, blank=True)
    closed_at = DateTimeField(null=True, blank=True)
    
    # Metadata
    resolution_notes = TextField(blank=True)
    
    class Meta:
        indexes = [status, category, priority, created_by, assigned_to, created_at]
        ordering = ['-created_at']
```

#### TicketEvent Model (Audit Trail)
```python
class TicketEvent(BaseEvent):
    ticket = ForeignKey(SupportTicket, related_name="events")
```

#### TicketMessage Model
```python
class TicketMessage(models.Model):
    id = UUIDField(primary_key=True)
    ticket = ForeignKey(SupportTicket, related_name="messages")
    sender = ForeignKey(User, related_name="ticket_messages")
    message = TextField()
    is_internal = BooleanField(default=False)  # Internal notes (admin-only)
    created_at = DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
```

### 1.2 API Endpoints

```
/api/support/
├── tickets/                          # GET (list), POST (create)
│   ├── {ticket_id}/                  # GET (detail), PATCH (update)
│   ├── {ticket_id}/messages/         # GET (list), POST (send message)
│   ├── {ticket_id}/assign/           # POST (assign to admin)
│   ├── {ticket_id}/status/           # PATCH (change status)
│   ├── {ticket_id}/close/            # POST (close ticket)
│   └── {ticket_id}/events/           # GET (audit trail)
├── my-tickets/                       # GET (user's own tickets)
├── stats/                            # GET (ticket statistics for admin)
└── categories/                       # GET (available categories)
```

### 1.3 Permissions
- **Any authenticated user**: Create tickets, view own tickets, send messages on own tickets
- **System Admin**: View all tickets, assign, change status, close, add internal notes
- **Assigned Admin**: Manage assigned tickets

### 1.4 Signals & Notifications
- On ticket creation → Notify all System Admins via in-app + email
- On ticket assigned → Notify assigned admin + ticket creator
- On new message → Notify the other party (user/admin)
- On status change → Notify ticket creator
- On ticket resolved/closed → Notify ticket creator

### 1.5 Ticket Number Generation
Auto-increment format: `TKT-YYYY-NNNNN` (e.g., `TKT-2026-00001`)
Generated via a `post_save` signal or `save()` override.

---

## 2. Frontend: New Pages & Components

### 2.1 System Admin Dashboard Pages

```
frontend/app/(protected)/dashboard/system-admin/support/
├── page.tsx                    # Ticket list with filters
├── [ticketId]/
│   └── page.tsx                # Ticket detail + conversation
└── stats/
    └── page.tsx                # Ticket analytics
```

#### Ticket List Page (`/dashboard/system-admin/support/`)
- Table with columns: Ticket #, Subject, Category, Priority, Status, Created By, Assigned To, Created At
- Filters: status, category, priority, assigned_to, date range
- Search by ticket number or subject
- Bulk actions: assign, change status

#### Ticket Detail Page (`/dashboard/system-admin/support/[ticketId]`)
- Ticket metadata sidebar (subject, category, priority, status, creator info, timestamps)
- Conversation thread (messages from user + admin)
- Internal notes section (admin-only, not visible to user)
- Action buttons: Assign, Change Status, Close
- Status change history (audit trail)

### 2.2 User Dashboard Pages

```
frontend/app/(protected)/dashboard/{role}/support/
├── page.tsx                    # My tickets list
├── new/
│   └── page.tsx                # Create new ticket
└── [ticketId]/
    └── page.tsx                # View ticket + reply
```

#### Available for all roles:
- `donor/support/`
- `hospital-admin/support/`
- `receptionist/support/`
- `social-worker/support/`

#### Create Ticket Page
- Form fields: Subject, Category, Priority, Description
- Optional: Link to related campaign/voucher/hospital/beneficiary
- File attachments (future enhancement)

#### My Tickets Page
- List of user's own tickets with status indicators
- Quick create button

#### Ticket Detail Page (User View)
- Conversation thread
- Reply input
- Status badge (read-only for user)

### 2.3 Reusable Components

```
frontend/components/support/
├── ticket-list.tsx              # Shared ticket table component
├── ticket-detail.tsx            # Ticket detail layout
├── ticket-conversation.tsx      # Message thread
├── ticket-form.tsx              # Create/edit ticket form
├── ticket-status-badge.tsx      # Status indicator
├── ticket-priority-badge.tsx    # Priority indicator
├── ticket-assign-dialog.tsx     # Admin assignment dialog
├── ticket-status-dialog.tsx     # Status change dialog
└── ticket-stats-cards.tsx       # Statistics cards
```

### 2.4 Sidebar Navigation Updates

Add "Support" menu item to sidebar for all roles:
- **System Admin**: `support` → Lists all tickets
- **Other roles**: `support` → Lists own tickets + create new

Update files:
- `frontend/components/dashboard/sidebar/` - Add support menu item
- `frontend/lib/protected-routes.ts` - Add support routes
- `frontend/lib/role-redirect.ts` - No changes needed (support is not a default redirect)

---

## 3. Real-time Updates (WebSocket - Optional Enhancement)

### 3.1 New WebSocket Consumer
```
ws://backend/ws/support/
```
- Authenticated endpoint
- Groups: `ticket_{ticket_id}` for real-time message updates
- Events: new_message, status_change, ticket_assigned

### 3.2 Frontend Hook
```typescript
// hooks/use-support-socket.ts
- Connects to WebSocket for specific ticket
- Receives real-time message updates
- Triggers notification refresh
```

---

## 4. Integration Points

### 4.1 Existing Notification System
- Use `notifications.models.Notification` for in-app notifications
- Add new `NotificationType`: `SUPPORT_TICKET`
- Leverage existing signals for push + email delivery

### 4.2 Existing Activity Log
- Log ticket creation, status changes, assignments to `logs.ActivityLog`
- Use existing `logs.services` for consistent logging

### 4.3 Existing Auth System
- Use existing `User` model FK
- Use existing role-based permissions
- No new auth changes needed

---

## 5. Database Migration

After creating models:
```bash
cd backend
python manage.py makemigrations support
python manage.py migrate
```

---

## 6. Admin Interface

Register models in `backend/support/admin.py`:
- `SupportTicket` with list_display, list_filter, search_fields, readonly_fields
- `TicketMessage` inline on ticket admin
- `TicketEvent` readonly inline

---

## 7. API Documentation

The endpoints will automatically appear in Swagger/ReDoc via `drf-yasg` since we're using DRF ViewSets.

---

## 8. Implementation Order

### Phase 1: Backend Core
1. Create `support` Django app structure
2. Implement models (SupportTicket, TicketMessage, TicketEvent)
3. Create serializers
4. Implement ViewSets with permissions
5. Configure URLs
6. Add signals for notifications
7. Create and run migrations
8. Register admin

### Phase 2: Frontend Core
1. Create support components (ticket-list, ticket-form, ticket-detail, etc.)
2. Create System Admin support pages (list, detail)
3. Create User support pages (my tickets, create, view)
4. Update sidebar navigation for all roles
5. Update protected routes

### Phase 3: Enhancements
1. WebSocket real-time updates
2. File attachments
3. Ticket satisfaction rating
4. SLA tracking (response time, resolution time)
5. Canned responses for admins
6. Ticket export (CSV/PDF)

---

## 9. Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Ticket number format | `TKT-YYYY-NNNNN` | Human-readable, sortable, year-resettable |
| Message model | Separate `TicketMessage` | Clean separation, supports threading |
| Internal notes | `is_internal` flag on messages | Admin-only notes visible in thread |
| Audit trail | `TicketEvent` via `BaseEvent` | Consistent with existing pattern (MedicalClaim, etc.) |
| Notifications | Existing `Notification` model | Reuse existing infrastructure |
| Permissions | Role-based via DRF | Consistent with existing auth |
| Related objects | Optional FKs to Campaign/Voucher/Hospital/Beneficiary | Context linking without mandatory coupling |

---

## 10. Files to Create/Modify

### New Files (Backend)
- `backend/support/__init__.py`
- `backend/support/apps.py`
- `backend/support/models/__init__.py`
- `backend/support/models/ticket.py`
- `backend/support/models/message.py`
- `backend/support/serializers/__init__.py`
- `backend/support/serializers/ticket.py`
- `backend/support/views/__init__.py`
- `backend/support/views/ticket.py`
- `backend/support/urls.py`
- `backend/support/admin.py`
- `backend/support/signals.py`
- `backend/support/filters.py`
- `backend/support/tasks/__init__.py`
- `backend/support/tasks/notifications.py`

### Modified Files (Backend)
- `backend/backend/api/urls.py` - Add `path("support/", include("support.urls"))`
- `backend/notifications/models/notification.py` - Add `SUPPORT_TICKET` to NotificationType

### New Files (Frontend)
- `frontend/app/(protected)/dashboard/system-admin/support/page.tsx`
- `frontend/app/(protected)/dashboard/system-admin/support/[ticketId]/page.tsx`
- `frontend/app/(protected)/dashboard/donor/support/page.tsx`
- `frontend/app/(protected)/dashboard/donor/support/new/page.tsx`
- `frontend/app/(protected)/dashboard/donor/support/[ticketId]/page.tsx`
- `frontend/app/(protected)/dashboard/hospital-admin/support/page.tsx`
- `frontend/app/(protected)/dashboard/hospital-admin/support/new/page.tsx`
- `frontend/app/(protected)/dashboard/hospital-admin/support/[ticketId]/page.tsx`
- `frontend/app/(protected)/dashboard/receptionist/support/page.tsx`
- `frontend/app/(protected)/dashboard/receptionist/support/new/page.tsx`
- `frontend/app/(protected)/dashboard/receptionist/support/[ticketId]/page.tsx`
- `frontend/app/(protected)/dashboard/social-worker/support/page.tsx`
- `frontend/app/(protected)/dashboard/social-worker/support/new/page.tsx`
- `frontend/app/(protected)/dashboard/social-worker/support/[ticketId]/page.tsx`
- `frontend/components/support/ticket-list.tsx`
- `frontend/components/support/ticket-detail.tsx`
- `frontend/components/support/ticket-conversation.tsx`
- `frontend/components/support/ticket-form.tsx`
- `frontend/components/support/ticket-status-badge.tsx`
- `frontend/components/support/ticket-priority-badge.tsx`
- `frontend/components/support/ticket-assign-dialog.tsx`
- `frontend/components/support/ticket-status-dialog.tsx`
- `frontend/components/support/ticket-stats-cards.tsx`
- `frontend/hooks/use-support-socket.ts`
- `frontend/types/support.ts`

### Modified Files (Frontend)
- `frontend/components/dashboard/sidebar/` - Add support menu item
- `frontend/lib/protected-routes.ts` - Add support routes
- `frontend/types/index.ts` - Export support types

---

## 11. Testing Strategy

### Backend Tests
- Model tests: ticket creation, number generation, status transitions
- Serializer tests: validation, nested serialization
- View tests: CRUD operations, permissions per role
- Signal tests: notification creation on events
- Integration tests: full ticket lifecycle

### Frontend Tests
- Component rendering tests
- Form submission tests
- Route protection tests

---

## 12. Future Enhancements

1. **File Attachments**: Allow users to attach screenshots/files to tickets
2. **Satisfaction Rating**: Let users rate resolved tickets (1-5 stars)
3. **SLA Tracking**: Track first response time and resolution time
4. **Canned Responses**: Pre-defined responses for common issues
5. **Ticket Merge**: Combine duplicate tickets
6. **Ticket Export**: Export tickets to CSV/PDF for reporting
7. **Auto-Assignment**: Round-robin or skill-based auto-assignment
8. **Knowledge Base**: Link tickets to FAQ/knowledge base articles
9. **Chat Widget**: Embedded support chat on public pages
10. **Email Integration**: Reply to tickets via email (inbound email processing)
