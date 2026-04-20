# ANC (Antenatal Care) Tracking System Documentation

## Overview

The ANC tracking system is a comprehensive Django application for managing and tracking Antenatal Care visits for pregnant beneficiaries in the JoyFund PHIF system. It enables social workers to enroll beneficiaries, schedule ANC visits, track completion, identify high-risk pregnancies, and generate completion certificates.

## Models

### 1. ANCEnrollment
Main model for managing ANC enrollments.

**Fields:**
- `beneficiary` (ForeignKey): Reference to Beneficiary being enrolled
- `social_worker` (ForeignKey): Assigned social worker (nullable)
- `campaign` (ForeignKey): Associated campaign (nullable)
- `status` (CharField): Enrollment status (ACTIVE, COMPLETED, DROPPED_OUT, DELIVERED)
- `enrollment_date` (DateField): Date of enrollment (auto-set to today)
- `gestational_age_at_enrollment` (IntegerField): Weeks of pregnancy (4-42)
- `expected_delivery_date` (DateField): Expected delivery date
- `delivery_date` (DateField): Actual delivery date if occurred
- `high_risk` (BooleanField): Flag for high-risk pregnancies
- `completion_date` (DateField): Date marked as completed
- `notes` (TextField): Additional notes
- `created_at`, `updated_at` (DateTimeField): Timestamps

**Properties:**
- `visits_completed` - Count of completed visits
- `completion_percentage` - Percentage of visits completed (0-100)

**Related Models:**
- `visits` (Reverse ForeignKey from ANCVisit): All visits for this enrollment

### 2. ANCVisit
Model for individual ANC visits.

**Fields:**
- `enrollment` (ForeignKey): Parent ANCEnrollment
- `visit_number` (IntegerField): Visit sequence (1-4)
- `status` (CharField): Visit status (SCHEDULED, COMPLETED, MISSED, RESCHEDULED, CANCELLED)
- `scheduled_date` (DateField): Planned visit date
- `actual_date` (DateField): Actual visit date (nullable)
- `weight_kg` (DecimalField): Beneficiary weight in kg (nullable)
- `blood_pressure` (CharField): Blood pressure reading as "systolic/diastolic" (nullable)
- `hemoglobin_level` (DecimalField): Hemoglobin level in g/dL (nullable)
- `clinical_notes` (TextField): Clinical observations
- `complications_noted` (BooleanField): Flag for complications
- `referred_to_hospital` (BooleanField): Flag for hospital referral
- `referral_reason` (CharField): Reason for referral (nullable)
- `created_by` (ForeignKey): User who recorded the visit
- `created_at`, `updated_at` (DateTimeField): Timestamps

**Display Methods:**
- `get_visit_number_display()` - Returns formatted visit name with weeks

### 3. MissedAppointmentAlert
Alert system for missed ANC visits.

**Fields:**
- `enrollment` (ForeignKey): Parent ANCEnrollment
- `visit` (ForeignKey): Missed ANCVisit
- `missed_date` (DateField): Date visit was missed
- `alert_sent_at` (DateTimeField): When notification was sent
- `follow_up_date` (DateField): Scheduled follow-up date
- `status` (CharField): Alert status (ACTIVE, RESOLVED, DISMISSED)
- `follow_up_notes` (TextField): Notes from follow-up attempt
- `rescheduled_visit` (DateField): When visit was rescheduled (nullable)
- `resolved_date` (DateTimeField): When alert was resolved
- `created_at`, `updated_at` (DateTimeField): Timestamps

### 4. ANCCompletionCertificate
Certificate model for completed ANC programs.

**Fields:**
- `enrollment` (ForeignKey): Parent ANCEnrollment
- `certificate_number` (CharField): Unique certificate ID
- `status` (CharField): Certificate status (PENDING, GENERATED, PRINTED, ISSUED)
- `completion_date` (DateField): Program completion date
- `issued_date` (DateField): Certificate generation date
- `issued_date_actual` (DateField): Actual issuance date (nullable)
- `generated_by` (ForeignKey): User who generated certificate
- `issued_by` (ForeignKey): User who issued certificate (nullable)
- `certificate_file` (FileField): PDF certificate file
- `created_at`, `updated_at` (DateTimeField): Timestamps

## API Endpoints

### ANC Enrollments

#### List/Create Enrollments
```
GET /api/anc/enrollments/
POST /api/anc/enrollments/
```

**Query Parameters:**
- `status`: Filter by enrollment status
- `high_risk`: Filter by risk level
- `search`: Search by beneficiary name or health ID

**Response:**
```json
{
  "count": 10,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "beneficiary": {...},
      "status": "ACTIVE",
      "status_display": "Active",
      "enrollment_date": "2024-01-15",
      "expected_delivery_date": "2024-05-15",
      "high_risk": false,
      "visits_completed": 2,
      "completion_percentage": 50
    }
  ]
}
```

#### Retrieve Enrollment
```
GET /api/anc/enrollments/{id}/
```

Returns detailed enrollment with nested visits and summary.

#### Mark Enrollment Complete
```
POST /api/anc/enrollments/{id}/mark_complete/
```

Marks enrollment as completed (requires all visits to be recorded).

#### Get Enrollment Progress
```
GET /api/anc/enrollments/{id}/get_progress/
```

Returns progress details including visit counts and alerts.

#### High Risk Summary
```
GET /api/anc/enrollments/high_risk_summary/
```

Returns summary of high-risk enrollments.

### ANC Visits

#### List/Create Visits
```
GET /api/anc/visits/
POST /api/anc/visits/
```

**Query Parameters:**
- `status`: Filter by visit status
- `enrollment`: Filter by enrollment ID
- `visit_number`: Filter by visit number

#### Mark Visit Completed
```
POST /api/anc/visits/{id}/mark_completed/
```

**Request Body:**
```json
{
  "actual_date": "2024-02-15",
  "weight_kg": 65.5,
  "blood_pressure": "120/80",
  "hemoglobin_level": 12.5,
  "clinical_notes": "Patient in good health",
  "complications_noted": false
}
```

#### Send Visit Reminder
```
POST /api/anc/visits/{id}/send_reminder/
```

Sends SMS/email reminder to beneficiary about upcoming visit.

#### List Overdue Visits
```
GET /api/anc/visits/overdue/
```

Returns all visits that are past their scheduled date and not completed.

### Missed Appointment Alerts

#### List Alerts
```
GET /api/anc/missed-appointments/
```

**Query Parameters:**
- `status`: Filter by alert status
- `enrollment`: Filter by enrollment

#### Resolve Alert
```
POST /api/anc/missed-appointments/{id}/resolve/
```

**Request Body:**
```json
{
  "follow_up_notes": "Visited beneficiary at home, rescheduled for next week"
}
```

#### Active Alerts
```
GET /api/anc/missed-appointments/active_alerts/
```

Returns all active missed appointment alerts.

### Completion Certificates

#### List Certificates
```
GET /api/anc/certificates/
```

**Query Parameters:**
- `status`: Filter by certificate status
- `search`: Search by certificate number or beneficiary name

#### Generate Certificate
```
POST /api/anc/certificates/generate_for_enrollment/
```

**Request Body:**
```json
{
  "enrollment_id": 1
}
```

## Celery Tasks

### 1. send_missed_appointment_notification(alert_id)
Sends email notification to social worker about missed appointment.
**Triggered:** Automatically when visit is marked as MISSED

### 2. send_visit_reminder(visit_id)
Sends SMS reminder to beneficiary about upcoming visit.
**Triggered:** Manual API call or scheduled

### 3. generate_completion_certificate(certificate_id)
Generates PDF certificate for completed enrollment.
**Triggered:** When certificate is requested via API

### 4. check_overdue_visits()
Daily task to identify and mark overdue visits as missed.
**Schedule:** Daily at 23:00 UTC

### 5. send_enrollment_completion_reminder()
Reminds social workers when enrollments are near completion (3/4 visits done).
**Schedule:** Daily at 10:00 UTC

### 6. cleanup_expired_alerts()
Marks old unresolved alerts as dismissed.
**Schedule:** Weekly

## Signals

### 1. handle_anc_enrollment_created
When an enrollment is created:
- Creates 4 scheduled ANC visits with appropriate timing
- Links to relevant campaign if available

### 2. handle_visit_status_change
When visit status is updated:
- Updates enrollment completion percentage
- Creates missed appointment alert if visit is marked as missed

### 3. handle_missed_appointment_resolution
When missed alert is resolved:
- Sets resolved_date timestamp

## Workflows

### Enrollment Workflow
```
1. Social worker creates enrollment for beneficiary
   └─ ANCEnrollment created with ACTIVE status
   └─ 4 ANCVisit records auto-created with SCHEDULED status
   └─ Visits scheduled at weeks: +2, +6, +10, +14

2. Social worker records visit completion
   POST /api/anc/visits/{id}/mark_completed/ with clinical data
   └─ Visit marked as COMPLETED
   └─ Enrollment completion_percentage updated

3. When all 4 visits completed
   POST /api/anc/enrollments/{id}/mark_complete/
   └─ Enrollment marked as COMPLETED
   └─ eligible for certificate generation

4. Social worker requests certificate
   POST /api/anc/certificates/generate_for_enrollment/
   └─ Certificate generated with unique number
   └─ PDF file created
   └─ Certificate marked as GENERATED

5. Certificate can be printed and issued
   └─ Status updated to PRINTED then ISSUED
```

### Missed Appointment Workflow
```
1. Visit scheduled date passes without completion
   └─ Daily check_overdue_visits task marks as MISSED
   └─ MissedAppointmentAlert auto-created
   └─ send_missed_appointment_notification triggered

2. Social worker notified
   └─ Receives email with beneficiary contact info
   └─ Can send reminder via send_visit_reminder endpoint

3. Social worker attempts follow-up
   └─ POST /api/anc/missed-appointments/{id}/resolve/
   └─ Can reschedule or mark as rescheduled

4. Alert resolved
   └─ Alert marked as RESOLVED
   └─ resolved_date timestamp set
```

## High-Risk Pregnancies

Flagged at enrollment using `high_risk` field. High-risk enrollments:
- Displayed prominently in dashboards
- Prioritized in alerts
- May require more frequent visits
- Tracked separately from regular enrollments

## Data Validation

### Enrollment Creation
- Expected delivery date must be in future
- Gestational age must be 4-42 weeks
- Cannot create if beneficiary has active enrollment
- Social worker role required if assigned

### Visit Recording
- Can only record completed visits for future dates
- Clinical data constraints:
  - Weight: typically 40-120 kg
  - Blood pressure: formatted as "systolic/diastolic"
  - Hemoglobin: typically 10-16 g/dL

## Django Admin

Fully configured admin interface with:
- Inline editing of visits within enrollment
- Color-coded status badges
- Progress bars for visit completion
- Search by beneficiary name or health ID
- Filtering by status, risk level, dates
- Detailed readonly fields with timestamps

## Testing

Comprehensive test suite includes:
- Model tests for all ANC models
- API endpoint tests
- Signal handler tests
- Task execution tests
- Data validation tests

Run tests:
```bash
python manage.py test anc
```

## Integration Points

### Beneficiaries
- Links to Beneficiary model for demographic data
- Phone, name, digital health ID

### Accounts  
- Social workers manage enrollments
- User tracking for visit records and certificates

### Campaigns
- Can associate enrollments with campaigns
- Track campaign effectiveness via ANC completion

### Notifications
- Can trigger notifications for missed appointments
- Mobile alerts for social workers

## Performance Optimization

- Database indexes on frequently queried fields:
  - `status`, `enrollment_date`, `high_risk`
  - Visit `scheduled_date`, `status`
  
- Select related/prefetch related in viewsets:
  - Beneficiary and social worker data preloaded
  - Visit counts optimized with aggregations

## Security

- Role-based access control
- Social workers see only their own enrollments
- Admin can view all enrollments
- Audit trail via created_at/updated_at timestamps
- Clinical data protected as PII

## Future Enhancements

Potential features:
- Automated SMS reminders to beneficiaries
- Integration with hospital referral system
- Mobile app for field-based data collection
- Analytics dashboard for program metrics
- Integration with national health systems
- Pregnancy complication tracking
- Delivery outcome tracking
