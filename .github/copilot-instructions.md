# Copilot Instructions - JoyFund PHIF Backend

## Project Overview

**JoyFund** is a transparent, tech-driven health donation platform enabling the **People's Health Insurance Fund (PHIF)**. It digitizes the Cameroonian "Njangi" solidarity concept to pool small donations from personal celebrations (birthdays, promotions, weddings) and direct them toward urgent maternal healthcare needs in resource-constrained settings.

**Core workflow:** Donor creates campaign → Contributors donate via Mobile Money → Social Worker enrolls Beneficiary → System assigns funds → Hospital validates and delivers care → Funds automatically transferred on PIN confirmation.

### Key Technology Stack
- **Backend:** Django 6.0.2 with Django REST Framework (DRF)
- **Database:** PostgreSQL (spatial support via GeoDjango)
- **Async Tasks:** Celery with RabbitMQ broker and Redis cache/results
- **Real-Time:** Django Channels with WebSocket support
- **API Documentation:** drf-yasg (Swagger/ReDoc)
- **Authentication:** OAuth2 (via oauth2_provider, drf_social_oauth2)
- **Payment Integration:** Flutterwave, Notch Pay (via campay library)

---

## Project Structure

```
backend/                          # Django project root
├── accounts/                      # User profiles, authentication, roles
│   ├── models/                    # BaseProfile, User role mixins
│   ├── views/                     # Auth endpoints, profile management
│   ├── serializers/               # User DTOs
│   ├── tasks/                     # Email notifications, user creation tasks
│   └── signals.py                 # Profile creation on user signup
├── campaigns/                     # Fundraising campaigns
│   ├── models.py                  # Campaign, Payment (old), Donation
│   └── views/                     # Campaign CRUD, donation endpoints
├── beneficiaries/                 # Vulnerable population registry
│   ├── models.py                  # Beneficiary, WaitingPoolEntry
│   └── serializers/               # Beneficiary enrollment forms
├── vouchers/                       # Core payment logic (most critical)
│   ├── models.py                  # CareVoucher, VoucherAssignment, VoucherAuditLog, HospitalPayout
│   ├── engine.py                  # Matching algorithm + fund assignment
│   ├── tasks.py                   # SMS delivery, voucher lifecycle, payout processing
│   └── signals.py                 # Audit logging, state transitions
├── hospitals/                      # Partner hospital registry
│   ├── models.py                  # Hospital, Department, HospitalUser
│   └── views/                     # Hospital portal (voucher validation, PIN confirmation)
├── payments/                       # Mobile Money transactions
│   ├── models.py                  # Payment, TransactionLog
│   ├── tasks.py                   # Payment processing, reconciliation
│   └── views/                     # Payment webhooks
├── notifications/                 # SMS and email delivery
│   ├── models.py                  # Notification, NotificationLog
│   └── tasks.py                   # SMS gateway integration
├── disbursements/                 # Hospital payouts (after voucher redemption)
│   ├── models.py                  # DisbursementRequest, DisbursementLog
│   └── views/                     # Payout confirmation
├── backend/                       # Django project settings
│   ├── settings.py                # Django config, env-based overrides
│   ├── celery.py                  # Celery app configuration
│   ├── consumers.py               # WebSocket message handlers
│   ├── urls.py                    # Root URL routing
│   └── middleware.py              # Request/response middleware
├── requirements.txt               # Python dependencies
├── manage.py                      # Django CLI entry point
├── docker-compose.yml             # Dev/prod service orchestration
├── Dockerfile                     # Multi-stage Django image
├── gunicorn_config.py            # Production WSGI server config
└── nginx.conf                     # Reverse proxy & load balancing
```

---

## Build, Test, and Lint Commands

### Prerequisites
```bash
# Activate virtual environment
source env/bin/activate

# Install dependencies (from root backend directory)
pip install -r requirements.txt
```

### Django Management Commands
```bash
# Check project configuration
python manage.py check

# Run all migrations
python manage.py migrate

# Create new migration (after model changes)
python manage.py makemigrations

# Create superuser account
python manage.py createsuperuser

# Run all tests
python manage.py test

# Run tests for a single app
python manage.py test accounts

# Run a single test class
python manage.py test accounts.tests.TestUserModel

# Run with verbose output and keep database after tests
python manage.py test --verbosity=2 --keepdb
```

### Running the Application

**Local development (outside Docker):**
```bash
# Start external services (Redis, RabbitMQ, PostgreSQL)
docker-compose up -d redis rabbitmq db

# In terminal 1: Django development server
python manage.py runserver

# In terminal 2: Celery worker
celery -A backend worker --loglevel=info --concurrency=2

# In terminal 3 (optional): Celery Beat scheduler
celery -A backend beat --loglevel=info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

**Docker (full production-like setup):**
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f django

# Stop all services
docker-compose down
```

### Linting and Code Quality
Currently no automated linting is configured. For code style, follow:
- **Format:** PEP 8 (use `black` or `autopep8` if you want to add it)
- **Import sorting:** Use `isort` conventions
- **Type hints:** Encouraged for complex functions but not enforced

### Load Testing
```bash
# Start load test (requires locustfile.py)
python -m locust -f locustfile.py --host=http://localhost:8000
```

---

## High-Level Architecture

### Core Patterns

#### 1. **Multi-Step Async Workflows (Voucher Lifecycle)**
The `vouchers` app orchestrates the most complex workflow:
- **Phase 1 (Assignment):** Beneficiary enrolled → Matching algorithm assigns available campaign funds
- **Phase 2 (Activation):** Admin approves assignment → 6-digit Voucher Code + 4-digit Patient PIN generated → SMS sent to beneficiary
- **Phase 3 (Validation):** Hospital enters Voucher Code → Funds "locked" to prevent re-use
- **Phase 4 (Care Delivery):** Hospital provides medical services
- **Phase 5 (Redemption):** Beneficiary provides Patient PIN → Funds transferred to hospital → Audit trail logged

**Key files:**
- `vouchers/models.py`: `CareVoucher` (state: draft → assigned → active → redeemed), `VoucherAssignment`, `VoucherAuditLog`, `HospitalPayout`
- `vouchers/engine.py`: `match_beneficiary()` algorithm—high-priority ranking by needs, geographic proximity
- `vouchers/tasks.py`: Async tasks (SMS delivery, state transitions, payout processing)
- `vouchers/signals.py`: Automatic audit logging on state changes

**Critical invariants:**
- A voucher has **exactly one Beneficiary, one Campaign (source of funds), and one Hospital (redemption location)**
- The 6-digit code must be validated before funds "lock"
- The 4-digit PIN is **secret until after care completion** (anti-fraud mechanism)
- `VoucherAuditLog` is immutable—every state change is logged with timestamp and actor

#### 2. **Role-Based Access Control**
User roles defined in `accounts/models/`:
- **Donor:** Launches campaigns, sees donation impact
- **Contributor:** Makes donations via Mobile Money
- **Beneficiary:** Receives voucher SMS, provides PIN at hospital
- **Social Worker:** Enrolls beneficiaries, verifies eligibility
- **Hospital Staff:** Validates vouchers, confirms care, provides PIN input
- **Admin:** Approves matches, oversees system

Permissions enforced via DRF and Django's permission system. Check `accounts/views/` for endpoint guards.

#### 3. **Celery Task Dependency Graph**
Multiple async tasks are triggered by state changes:

```
Donation Created
  ↓
Check if campaign complete → Trigger Matching (vouchers/tasks.py)
  ↓
Match selected → Notify Admin for approval
  ↓
Admin approves → Generate Voucher Code + PIN → Send SMS (notifications/tasks.py)
  ↓
PIN confirmed at hospital → Trigger Payout (vouchers/tasks.py + disbursements/)
  ↓
Payout complete → Notify Donor + Hospital
```

**Key Celery tasks:**
- `accounts/tasks/send_mail.py`: Email notifications (max retries=3, delay=60s)
- `vouchers/tasks.py`: Matching, SMS delivery, payout processing
- `payments/tasks.py`: Mobile Money settlement and reconciliation
- `notifications/tasks.py`: SMS gateway integration (Orange SMS API)

All tasks include error handling, retry logic, and logging to `VoucherAuditLog`.

#### 4. **Payment Flow Integration**
- **Campaigns receive donations** via Flutterwave/Notch Pay webhooks (payments/views.py)
- **Funds held in escrow** (virtual account per campaign)
- **Upon voucher redemption,** automatic payout to hospital bank account via disbursements app
- **Reconciliation** runs daily to match payments with database records

**Key models:** `campaigns.Payment` (deprecated, see `campaigns.Donation`), `payments.Payment`, `payments.TransactionLog`

#### 5. **Real-Time Notifications (WebSockets)**
`backend/consumers.py` handles WebSocket connections for live updates:
- Donor sees when contribution is used (fund "locked" at hospital)
- Hospital staff receives notification when voucher is assigned
- Admin gets alerts on high-priority cases

Uses Django Channels with daphne server.

#### 6. **Audit & Transparency**
`VoucherAuditLog` is the source of truth for all voucher state changes. It includes:
- Timestamp, actor (user), action, beneficiary, campaign, hospital
- Before/after state values
- Used in compliance reporting and fraud detection

### Service Dependencies

```
Django ──┬─→ PostgreSQL (data)
         ├─→ Redis (cache, Celery results backend)
         ├─→ RabbitMQ (Celery broker)
         ├─→ SMS Gateway (Orange API, via notifications app)
         ├─→ Payment Gateway (Flutterwave/Notch Pay webhooks)
         └─→ Daphne (WebSocket support)

Celery Worker ──→ RabbitMQ (broker)
              ├─→ Redis (results backend)
              └─→ PostgreSQL (task logging)

Celery Beat ──→ RabbitMQ (schedule tasks)
            └─→ PostgreSQL (django_celery_beat.PeriodicTask)
```

---

## Key Conventions

### 1. **Model Organization**
- **Base models** in `base.py` (abstract base classes like `TimeStampedModel`, `BaseProfile`)
- **Role models** use `NationalIDMixin` for KYC verification
- All models inherit from Django's `models.Model` with custom managers
- Foreign keys are explicit with `on_delete=models.PROTECT` or `on_delete=models.CASCADE` (rare)

### 2. **Serializers Pattern**
- Separate folders: `serializers/` subdirectory per app
- List serializers are lighter (fewer fields), detail serializers are comprehensive
- Use `PrimaryKeyRelatedField` for ForeignKey relationships, avoid nested serializers for performance

Example structure:
```python
# beneficiaries/serializers/__init__.py
from .list import BeneficiaryListSerializer
from .detail import BeneficiaryDetailSerializer
```

### 3. **View Organization**
- DRF ViewSets in `views/` subdirectory (split by resource type if large)
- Use `ListAPIView`, `CreateAPIView`, `RetrieveUpdateDestroyAPIView` for standard CRUD
- Custom actions via `@action(methods=['post', 'get'])` decorator
- Permission classes on ViewSet or individual actions

### 4. **Task Naming Conventions**
- Celery tasks are named by app + action: `accounts.send_welcome_email`, `vouchers.process_payout`
- Use task names in task decorator: `@app.task(name='app_name.action')`
- Error handling: catch exceptions, log to audit trail, retry with exponential backoff

### 5. **URL Routing Pattern**
Each app has `urls.py` with drf_nested_routers for nested resources:
```python
# beneficiaries/urls.py
router = SimpleRouter()
router.register(r'beneficiaries', BeneficiaryViewSet, basename='beneficiary')
urlpatterns = router.urls
```

### 6. **Environment Configuration**
Settings are environment-aware:
```python
# backend/settings.py
DEBUG = os.getenv('DEBUG', 'False') == 'True'
CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'amqp://joyfund:joyfund@localhost:5672//')
```

**Important:** `.env` file required locally (see `.env.example`). Never commit secrets.

### 7. **Testing Structure**
Each app has a `tests.py` file. For larger test suites, create a `tests/` directory with:
- `test_models.py`: Model unit tests
- `test_views.py`: API endpoint tests
- `test_tasks.py`: Celery task tests
- `test_serializers.py`: Serializer validation tests

### 8. **Database Best Practices**
- Migrations auto-created via `makemigrations`, committed to repo
- Each migration is a single, atomic change
- Use `RunPython` migrations for complex data transforms (with reverse function)
- Indexes on frequently-queried fields (email, phone, beneficiary_id)

### 9. **Logging & Debugging**
- App logs written to `logs/` directory (created by `run.sh`)
- Celery tasks log via Python's `logger` module
- For production issues, check `logs/django.log` and `logs/celery.log`
- Database queries logged when `DEBUG=True` via Django debug toolbar

### 10. **Common File Locations**
| Pattern | Location |
|---------|----------|
| Models | `app_name/models.py` or `app_name/models/__init__.py` |
| Serializers | `app_name/serializers/` |
| Views/ViewSets | `app_name/views/` or `app_name/views.py` |
| Celery tasks | `app_name/tasks.py` or `app_name/tasks/` |
| URL routing | `app_name/urls.py` |
| Tests | `app_name/tests.py` or `app_name/tests/` |
| Utilities | `app_name/utils/` (reusable helpers) |
| Filters | `app_name/filters.py` or `app_name/filters/` (DRF filters) |
| Admin | `app_name/admin.py` |

---

## Common Development Tasks

### Adding a New API Endpoint

1. **Define model** (or use existing)
2. **Create serializer** in `app/serializers/`
3. **Create ViewSet** in `app/views/`
4. **Register route** in `app/urls.py`
5. **Test** with `python manage.py test app.tests.TestViewSet`
6. **Document** via drf-yasg (auto-generated from docstrings)

### Running a Background Task Synchronously (for testing)
```python
# Instead of .delay() or .apply_async()
from accounts.tasks import send_welcome_email
send_welcome_email(user_id=1)  # Runs immediately in current process
```

### Adding a New Celery Task

1. Create task in `app/tasks.py`
2. Use decorator: `@app.task(bind=True, max_retries=3)`
3. Handle exceptions and log to `VoucherAuditLog` if relevant
4. Call via `task_name.delay(arg1=val1)` from views/signals

### Debugging Celery Issues

```bash
# Inspect active tasks
celery -A backend inspect active

# Check worker stats
celery -A backend inspect stats

# Monitor with Flower (task monitoring dashboard)
celery -A backend flower --port=5555  # Visit http://localhost:5555
```

### Making a Migration

```bash
# After model changes
python manage.py makemigrations app_name

# Review migration file
cat app_name/migrations/0xxx_auto_date_time.py

# Apply migration
python manage.py migrate

# Show migration history
python manage.py showmigrations
```

---

## Typical Issues & Solutions

| Issue | Cause | Fix |
|-------|-------|-----|
| `ImportError: cannot import name 'X' from 'app.tasks'` | Task not defined or __init__.py not updated | Check `app/tasks/__init__.py` exports; use `from app.tasks import X` |
| Celery task not executing | Worker not running or broker unreachable | Start worker: `celery -A backend worker --loglevel=info` |
| `RuntimeError: Retry limit exceeded` | Celery can't reach Redis/RabbitMQ | Verify Docker services: `docker ps` |
| 404 on API endpoint | URL not registered or ViewSet not in router | Check `app/urls.py` and `backend/urls.py` |
| Migrations conflict | Multiple branches created migrations with same number | `python manage.py makemigrations --merge` |
| Tests fail locally but pass in CI | Different database state or missing migrations | Run `python manage.py migrate --run-syncdb` |

---

## API Testing & Development

### Testing Endpoints Locally

**With cURL:**
```bash
# Get list of beneficiaries
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/beneficiaries/

# Create a campaign
curl -X POST http://localhost:8000/api/campaigns/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"title": "Safe Delivery Fund", "target_amount": 5000}'

# Confirm voucher redemption
curl -X POST http://localhost:8000/api/vouchers/<id>/redeem/ \
  -H "Authorization: Bearer <token>" \
  -d '{"pin": "1234"}'
```

**Interactive API Browser:**
- **Swagger UI:** http://localhost:8000/swagger/ (after starting Django)
- **ReDoc:** http://localhost:8000/redoc/

Both are auto-generated from the DRF serializers and viewset docstrings. This is the easiest way to explore and test endpoints without leaving your browser.

### Authentication for API Testing

Most endpoints require OAuth2 tokens. To get a test token:

```bash
# Get OAuth2 token
curl -X POST http://localhost:8000/auth/token/ \
  -d "grant_type=password&username=testuser&password=testpass&client_id=YOUR_CLIENT_ID&client_secret=YOUR_SECRET"

# Extract token from response
export TOKEN="<access_token>"

# Use token in subsequent requests
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/campaigns/
```

Or log in via the Django admin at http://localhost:8000/admin/ to generate test tokens.

### Common API Scenarios

**Scenario 1: Create a campaign and receive donations**
```bash
# 1. Create campaign (as Donor)
POST /api/campaigns/ → Campaign created

# 2. Receive webhook from payment gateway (Flutterwave)
POST /api/payments/webhook/ → Payment recorded, donation linked

# 3. Check campaign balance
GET /api/campaigns/<id>/ → See total_raised vs target
```

**Scenario 2: Enroll beneficiary and assign voucher**
```bash
# 1. Enroll beneficiary (as Social Worker)
POST /api/beneficiaries/ → Beneficiary created with unique ID

# 2. Trigger matching (admin endpoint)
POST /api/vouchers/match/ → Voucher assigned, SMS sent

# 3. Hospital validates voucher code
POST /api/hospitals/validate-voucher/ → Code confirmed, funds locked

# 4. Confirm care + PIN provided
POST /api/vouchers/<id>/redeem/ → Funds transferred, audit logged
```

---

## Useful External Resources

- [Django 6.0 Docs](https://docs.djangoproject.com/en/6.0/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Celery Task Guide](https://docs.celeryproject.org/en/stable/userguide/tasks.html)
- [drf-yasg (Swagger)](https://drf-yasg.readthedocs.io/)
- [PostgreSQL Full-Text Search](https://www.postgresql.org/docs/current/textsearch.html) (if extending search)

---

## Quick Links to Key Files

- **Start here for local dev:** `LOCAL_DEVELOPMENT.md`
- **Production deployment:** `DEPLOYMENT_GUIDE.md`, `PRODUCTION_CHECKLIST.md`
- **Docker setup:** `DOCKER_QUICK_START.md`
- **API Overview:** `README.md` (backend)
- **Performance targets & scaling:** `QUICK_REFERENCE.md`
