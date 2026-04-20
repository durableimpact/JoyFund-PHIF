# ANC System - API Usage Examples

This document provides practical examples of how to use the ANC tracking system API.

## Authentication Setup

All endpoints require authentication. First, get an access token:

```bash
curl -X POST http://localhost:8000/auth/token/ \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=user@example.com&password=yourpassword&grant_type=password&client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET"
```

This returns a response like:
```json
{
  "access_token": "your_access_token_here",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

Set this as a header for all subsequent requests:
```bash
AUTH_TOKEN="your_access_token_here"
```

## 1. Create an ANC Enrollment

Create a new ANC enrollment for a beneficiary.

```bash
curl -X POST http://localhost:8000/api/anc/enrollments/ \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "beneficiary_id": 1,
    "gestational_age_at_enrollment": 16,
    "expected_delivery_date": "2024-06-10",
    "high_risk": false,
    "notes": "Regular pregnancy, no complications"
  }'
```

**Response (201 Created):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "beneficiary": {
    "id": 1,
    "name": "Jane Doe",
    "phone": "+256700000000",
    "digital_health_id": "DHI123456"
  },
  "status": "ACTIVE",
  "status_display": "Active",
  "enrollment_date": "2024-01-15",
  "expected_delivery_date": "2024-06-10",
  "high_risk": false,
  "visits_completed": 0,
  "completion_percentage": 0,
  "visits_summary": {
    "total": 4,
    "completed": 0,
    "scheduled": 4,
    "missed": 0,
    "percentage": 0
  }
}
```

## 2. List All Enrollments

Get a list of all enrollments with filtering options.

```bash
# List all active enrollments
curl -X GET "http://localhost:8000/api/anc/enrollments/?status=ACTIVE" \
  -H "Authorization: Bearer $AUTH_TOKEN"

# List high-risk enrollments
curl -X GET "http://localhost:8000/api/anc/enrollments/?high_risk=true" \
  -H "Authorization: Bearer $AUTH_TOKEN"

# Search by beneficiary name
curl -X GET "http://localhost:8000/api/anc/enrollments/?search=jane" \
  -H "Authorization: Bearer $AUTH_TOKEN"

# Order by expected delivery date
curl -X GET "http://localhost:8000/api/anc/enrollments/?ordering=expected_delivery_date" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

**Response (200 OK):**
```json
{
  "count": 10,
  "next": "http://localhost:8000/api/anc/enrollments/?page=2",
  "previous": null,
  "results": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "beneficiary": "Jane Doe",
      "beneficiary_id": "DHI123456",
      "status": "ACTIVE",
      "status_display": "Active",
      "enrollment_date": "2024-01-15",
      "expected_delivery_date": "2024-06-10",
      "high_risk": false,
      "visits_completed": 2,
      "completion_percentage": 50
    }
  ]
}
```

## 3. Get Enrollment Details

Retrieve detailed information about a specific enrollment.

```bash
ENROLLMENT_ID="123e4567-e89b-12d3-a456-426614174000"

curl -X GET "http://localhost:8000/api/anc/enrollments/$ENROLLMENT_ID/" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

**Response (200 OK):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "beneficiary": {
    "id": 1,
    "name": "Jane Doe",
    "phone": "+256700000000",
    "digital_health_id": "DHI123456",
    "location": "Kampala"
  },
  "status": "ACTIVE",
  "status_display": "Active",
  "enrollment_date": "2024-01-15",
  "expected_delivery_date": "2024-06-10",
  "high_risk": false,
  "visits": [
    {
      "id": "visit-uuid-1",
      "visit_number": 1,
      "status": "COMPLETED",
      "scheduled_date": "2024-01-29",
      "actual_date": "2024-01-29",
      "weight_kg": 65.5,
      "blood_pressure": "120/80",
      "hemoglobin_level": 12.5
    },
    {
      "id": "visit-uuid-2",
      "visit_number": 2,
      "status": "COMPLETED",
      "scheduled_date": "2024-02-26",
      "actual_date": "2024-02-26",
      "weight_kg": 66.0,
      "blood_pressure": "118/78",
      "hemoglobin_level": 12.3
    }
  ],
  "progress_percentage": 50,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-02-26T14:15:00Z"
}
```

## 4. Record a Visit Completion

Mark a visit as completed with clinical data.

```bash
VISIT_ID="visit-uuid-3"

curl -X POST "http://localhost:8000/api/anc/visits/$VISIT_ID/mark_completed/" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "actual_date": "2024-03-25",
    "weight_kg": 66.5,
    "blood_pressure": "119/79",
    "hemoglobin_level": 12.4,
    "clinical_notes": "Patient in good health, no complications",
    "complications_noted": false,
    "referred_to_hospital": false
  }'
```

**Response (200 OK):**
```json
{
  "id": "visit-uuid-3",
  "enrollment": "123e4567-e89b-12d3-a456-426614174000",
  "visit_number": 3,
  "visit_number_display": "Third Visit (30 weeks)",
  "status": "COMPLETED",
  "status_display": "Completed",
  "scheduled_date": "2024-03-24",
  "actual_date": "2024-03-25",
  "weight_kg": "66.50",
  "blood_pressure": "119/79",
  "hemoglobin_level": "12.40",
  "clinical_notes": "Patient in good health, no complications",
  "complications_noted": false,
  "referred_to_hospital": false,
  "created_at": "2024-03-25T10:30:00Z"
}
```

## 5. Get Enrollment Progress

Get a summary of enrollment progress.

```bash
ENROLLMENT_ID="123e4567-e89b-12d3-a456-426614174000"

curl -X GET "http://localhost:8000/api/anc/enrollments/$ENROLLMENT_ID/get_progress/" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

**Response (200 OK):**
```json
{
  "enrollment_id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "Active",
  "completion_percentage": 75,
  "visits": {
    "total": 4,
    "completed": 3,
    "missed": 0,
    "scheduled": 1
  },
  "alerts": {
    "active_missed_appointments": 0
  },
  "high_risk": false,
  "days_since_enrollment": 70
}
```

## 6. List Overdue Visits

Get all visits that are overdue.

```bash
curl -X GET "http://localhost:8000/api/anc/visits/overdue/" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

**Response (200 OK):**
```json
{
  "count": 2,
  "visits": [
    {
      "id": "visit-uuid-4",
      "enrollment": "enrollment-uuid",
      "visit_number": 4,
      "status": "SCHEDULED",
      "scheduled_date": "2024-04-17",
      "is_overdue": true,
      "created_by_name": "John Smith"
    }
  ]
}
```

## 7. Send Visit Reminder

Send a reminder SMS to the beneficiary about an upcoming visit.

```bash
VISIT_ID="visit-uuid-4"

curl -X POST "http://localhost:8000/api/anc/visits/$VISIT_ID/send_reminder/" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

**Response (200 OK):**
```json
{
  "detail": "Reminder sent successfully."
}
```

## 8. Mark Enrollment as Completed

Mark an enrollment as completed when all visits are done.

```bash
ENROLLMENT_ID="123e4567-e89b-12d3-a456-426614174000"

curl -X POST "http://localhost:8000/api/anc/enrollments/$ENROLLMENT_ID/mark_complete/" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

**Response (200 OK):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "COMPLETED",
  "status_display": "Completed",
  "completion_percentage": 100,
  "completion_date": "2024-04-20"
}
```

## 9. List Missed Appointment Alerts

View all missed appointment alerts.

```bash
# List all active alerts
curl -X GET "http://localhost:8000/api/anc/missed-appointments/active_alerts/" \
  -H "Authorization: Bearer $AUTH_TOKEN"

# List all alerts (including resolved)
curl -X GET "http://localhost:8000/api/anc/missed-appointments/" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

**Response (200 OK):**
```json
{
  "count": 1,
  "alerts": [
    {
      "id": "alert-uuid",
      "enrollment_id": "enrollment-uuid",
      "beneficiary_name": "Jane Doe",
      "visit_number": 2,
      "missed_date": "2024-02-26",
      "alert_sent_at": "2024-02-26T15:30:00Z",
      "follow_up_date": "2024-02-29",
      "status": "ACTIVE",
      "status_display": "Active",
      "days_overdue": 25
    }
  ]
}
```

## 10. Resolve a Missed Appointment Alert

Mark a missed appointment alert as resolved.

```bash
ALERT_ID="alert-uuid"

curl -X POST "http://localhost:8000/api/anc/missed-appointments/$ALERT_ID/resolve/" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "follow_up_notes": "Visited beneficiary at home on 2024-02-29. She was sick. Rescheduled visit for 2024-03-10."
  }'
```

**Response (200 OK):**
```json
{
  "id": "alert-uuid",
  "status": "RESOLVED",
  "resolved_date": "2024-02-29T10:30:00Z",
  "follow_up_notes": "Visited beneficiary at home on 2024-02-29. She was sick. Rescheduled visit for 2024-03-10."
}
```

## 11. Generate Completion Certificate

Generate a certificate for a completed enrollment.

```bash
curl -X POST "http://localhost:8000/api/anc/certificates/generate_for_enrollment/" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enrollment_id": 1
  }'
```

**Response (201 Created):**
```json
{
  "id": "cert-uuid",
  "certificate_number": "ANC-KLA-2024-0001",
  "enrollment": 1,
  "beneficiary_name": "Jane Doe",
  "status": "GENERATED",
  "status_display": "Generated",
  "completion_date": "2024-04-20",
  "issued_date": "2024-04-20",
  "issued_date_actual": null,
  "generated_by_name": "John Smith"
}
```

## 12. Get High-Risk Enrollment Summary

Get statistics on high-risk enrollments.

```bash
curl -X GET "http://localhost:8000/api/anc/enrollments/high_risk_summary/" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

**Response (200 OK):**
```json
{
  "high_risk_active": 5,
  "average_visits_completed": 2.4
}
```

## Error Handling Examples

### 400 Bad Request - Validation Error
```bash
# Trying to complete an incomplete enrollment
curl -X POST "http://localhost:8000/api/anc/enrollments/{id}/mark_complete/" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

**Response:**
```json
{
  "detail": "2 visits are not marked as completed.",
  "incomplete_visits": 2
}
```

### 404 Not Found
```bash
curl -X GET "http://localhost:8000/api/anc/enrollments/invalid-uuid/" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

**Response:**
```json
{
  "detail": "Not found."
}
```

### 401 Unauthorized
```bash
curl -X GET "http://localhost:8000/api/anc/enrollments/" \
  -H "Authorization: Bearer invalid_token"
```

**Response:**
```json
{
  "detail": "Invalid token."
}
```

## Pagination Example

```bash
# Get second page with 10 items per page
curl -X GET "http://localhost:8000/api/anc/enrollments/?page=2&page_size=10" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

## Filtering Examples

```bash
# Multiple filters
curl -X GET "http://localhost:8000/api/anc/enrollments/?status=ACTIVE&high_risk=true&search=jane&ordering=-enrollment_date" \
  -H "Authorization: Bearer $AUTH_TOKEN"

# Filter visits by enrollment
curl -X GET "http://localhost:8000/api/anc/visits/?enrollment={enrollment_id}&status=COMPLETED" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

## Testing Locally

To test these endpoints locally, you can use:

1. **cURL** (as shown above)
2. **Postman** - Import and run requests
3. **HTTPie** - User-friendly CLI alternative
4. **curl scripting** - Automate testing

Example with HTTPie:
```bash
http GET localhost:8000/api/anc/enrollments/ \
  "Authorization: Bearer $AUTH_TOKEN" \
  status==ACTIVE high_risk:=false
```

## Common Workflows

### Complete Enrollment Workflow
1. Create enrollment
2. List visits created automatically
3. For each visit:
   - Send reminder
   - Record completion with clinical data
4. When all visits done, mark enrollment complete
5. Generate completion certificate

### Handle Missed Appointment Workflow
1. System auto-creates missed alert when date passes
2. Social worker receives email notification
3. View active alerts via API
4. Send reminder or reschedule visit
5. Record follow-up and resolve alert

---

**Ready to integrate into your system!**
