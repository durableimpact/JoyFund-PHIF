# Disbursement Tracking System Documentation

## Overview

The Disbursement Tracking System records payments made **outside** the JoyFund system to partner hospitals. This approach ensures security—the system doesn't process payments directly, eliminating the risk of hackers gaining access to withdraw money.

**How it works:**
1. Your operations team makes a payment to a hospital via bank transfer, mobile money (MTN/Orange), cash, or other method
2. They create a Disbursement record in JoyFund to document the payment
3. The system automatically creates a corresponding Transaction record
4. Full audit trail is maintained for reconciliation

**Key Features:**
- **Record Manual Disbursements** - Create records of payments already made to hospitals
- **Defaults to COMPLETED** - Since disbursements record payments that have already been made
- **Automatic Transactions** - Linked Transaction automatically created with SUCCESSFUL status
- **Payment Method Support** - Track MOMO, Bank Transfer, Cash, or Other payment methods
- **External References** - Link to external payment system IDs for reconciliation
- **Error Tracking** - Mark as failed if a recorded payment actually failed (for corrections)

## Data Model

### Disbursement Model

The `Disbursement` model stores information about payments to hospitals:

```python
class Disbursement(models.Model):
    # Hospital receiving the payment
    hospital = ForeignKey('hospitals.Hospital')
    
    # Payment amount in XAF
    amount = DecimalField(max_digits=12, decimal_places=2)
    currency = CharField(default='XAF')
    
    # Payment method
    payment_method = CharField(
        choices=['MOMO', 'BANK_TRANSFER', 'CASH', 'OTHER']
    )
    
    # Recipient details
    recipient_phone = CharField()  # For MOMO payments
    recipient_account = CharField()  # For bank/other payments
    
    # Status tracking
    status = CharField(
        choices=['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED']
    )
    
    # External system references
    external_reference = CharField()  # e.g., Campay transaction ID
    gateway_transaction_id = CharField()  # Payment gateway ID
    
    # Link to internal transaction
    transaction = OneToOneField('Transaction', null=True, blank=True)
    
    # Additional information
    notes = TextField()
    error_message = TextField()  # For failed disbursements
    metadata = JSONField()  # Any additional structured data
    
    # Timestamps
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)
    disbursed_at = DateTimeField()  # When actually sent to hospital
    created_by = ForeignKey('accounts.User')
```

## API Endpoints

### Base URL
```
/api/payments/disbursements/
```

### Available Endpoints

#### 1. **List Disbursements**
```
GET /api/payments/disbursements/
```

**Filters:**
- `status` - Filter by status (PENDING, COMPLETED, FAILED, CANCELLED)
- `payment_method` - Filter by payment method
- `hospital` - Filter by hospital ID

**Search:**
- Search by `external_reference`, `gateway_transaction_id`, or `hospital__name`

**Ordering:**
- `amount`, `status`, `created_at`, `disbursed_at`

**Example Request:**
```bash
GET /api/payments/disbursements/?status=COMPLETED&hospital=<hospital-id>
```

#### 2. **Create Disbursement Record**
```
POST /api/payments/disbursements/
```

**Required Fields:**
- `hospital` - Hospital ID receiving the payment
- `amount` - Payment amount in XAF
- `payment_method` - Payment method used

**Optional Fields:**
- `recipient_phone` - Phone number for MOMO transfers
- `recipient_account` - Account number for bank transfers
- `external_reference` - External system reference (e.g., Campay TX ID)
- `gateway_transaction_id` - Payment gateway transaction ID
- `notes` - Additional notes
- `metadata` - Structured metadata
- `disbursed_at` - When the disbursement was made

**Automatic Actions:**
- ✓ A corresponding Transaction record is automatically created
- ✓ Transaction type is set to 'DISBURSEMENT'
- ✓ Transaction direction is set to 'OUT' (money leaving)
- ✓ Transaction status starts as 'PENDING'
- ✓ Disbursement and Transaction are linked via OneToOneField
- ✓ All operations are wrapped in an atomic transaction

**Example Request:**
```bash
curl -X POST /api/payments/disbursements/ \
  -H "Content-Type: application/json" \
  -d {
    "hospital": "550e8400-e29b-41d4-a716-446655440000",
    "amount": "50000.00",
    "payment_method": "MOMO",
    "recipient_phone": "237123456789",
    "external_reference": "CAMPAY-TXN-12345",
    "disbursed_at": "2026-05-22T10:30:00Z",
    "notes": "Payment for completed services"
  }
```

**Example Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "hospital": "550e8400-e29b-41d4-a716-446655440001",
  "hospital_name": "Hospital XYZ",
  "amount": "50000.00",
  "currency": "XAF",
  "payment_method": "MOMO",
  "status": "PENDING",
  "status_display": "Pending",
  "external_reference": "CAMPAY-TXN-12345",
  "transaction_id": "660f9500-f30c-52e5-b827-557766551111",
  "created_at": "2026-05-22T10:00:00Z",
  "disbursed_at": "2026-05-22T10:30:00Z",
  "created_by": "550e8400-e29b-41d4-a716-446655440002"
}
```

#### 4. **Update Disbursement**
```
PATCH /api/payments/disbursements/<id>/
```

**Updatable Fields:**
- `status` - Update status (PENDING, COMPLETED, FAILED, CANCELLED)
- `recipient_phone` - Update recipient details
- `recipient_account`
- `external_reference` - Update external reference
- `gateway_transaction_id`
- `notes` - Add or update notes
- `error_message` - Record error details
- `metadata`
- `disbursed_at`

#### 5. **Mark as Completed**
```
POST /api/payments/disbursements/<id>/mark_completed/
```

Automatically:
- Updates status to COMPLETED

**Request Body:**
```json
{
  "notes": "Payment confirmed with Campay"
}
```

#### 6. **Mark as Failed**
```
POST /api/payments/disbursements/<id>/mark_failed/
```

Automatically:
- Updates status to FAILED
- Records error message

**Request Body:**
```json
{
  "error_message": "Insufficient funds",
  "notes": "Retry scheduled for tomorrow"
}
```

#### 7. **Get Disbursements by Hospital**
```
GET /api/payments/disbursements/by_hospital/?hospital_id=<id>
```

Returns all disbursements for a specific hospital.

#### 8. **Get Statistics**
```
GET /api/payments/disbursements/statistics/
```

Returns aggregated statistics:
- Total amount disbursed
- Total amount pending
- Total amount failed
- Breakdown by status
- Breakdown by payment method

**Example Response:**
```json
{
  "total_disbursed": "500000.00",
  "total_pending": "100000.00",
  "total_failed": "25000.00",
  "by_status": {
    "COMPLETED": [10, "500000.00"],
    "PENDING": [2, "100000.00"],
    "FAILED": [1, "25000.00"]
  },
  "by_payment_method": {
    "MOMO": [8, "400000.00"],
    "BANK_TRANSFER": [3, "200000.00"],
    "CASH": [2, "25000.00"]
  },
  "total_count": 13
}
```

## Permissions

### System Admins
- Full CRUD access to all disbursements
- Can create, view, update, and delete disbursement records
- Can update status and mark as completed/failed
- Can manage disbursements for any hospital

## Workflow Examples

### Example 1: Record a Completed MOMO Disbursement

1. **Create the disbursement record:**
```bash
POST /api/payments/disbursements/
{
  "hospital": "hospital-uuid",
  "amount": "50000.00",
  "payment_method": "MOMO",
  "recipient_phone": "237123456789",
  "external_reference": "CAMPAY-2026-05-22-001",
  "disbursed_at": "2026-05-22T10:30:00Z",
  "notes": "Payment for completed services - May 2026"
}
```

2. **Link to transaction (optional):**
```bash
PATCH /api/payments/disbursements/<disbursement-id>/
{
  "transaction": "transaction-uuid"
}
```

3. **Mark as completed:**
```bash
POST /api/payments/disbursements/<disbursement-id>/mark_completed/
{
  "notes": "Confirmed with hospital - funds received"
}
```

### Example 2: Handle a Failed Disbursement

1. **Create initial record as PENDING:**
```bash
POST /api/payments/disbursements/
{
  "hospital": "hospital-uuid",
  "amount": "75000.00",
  "payment_method": "MOMO",
  "recipient_phone": "237987654321",
  "status": "PENDING"
}
```

2. **When failure occurs, mark as failed:**
```bash
POST /api/payments/disbursements/<disbursement-id>/mark_failed/
{
  "error_message": "Recipient account not registered with MoMo",
  "notes": "Need to verify hospital's MoMo details"
}
```

3. **Update with corrected details and retry:**
```bash
PATCH /api/payments/disbursements/<disbursement-id>/
{
  "recipient_phone": "237123654789",
  "status": "PENDING",
  "notes": "Corrected phone number - ready to retry"
}
```

## Django Admin Integration

The Disbursement system is fully integrated with Django Admin:

### Disbursement Admin
- **List View:** Shows hospital, amount, payment method, status, and dates
- **Search:** By hospital name, external reference, gateway transaction ID
- **Filters:** By status, payment method, currency, and date
- **Fields:** Organized into logical groups:
  - Hospital & Amount
  - Payment Details
  - Status & References
  - Additional Information
  - Metadata

## Automatic Transaction Creation

When you create a Disbursement record, the system automatically creates a linked Transaction record for complete financial tracking:

### What Happens on Creation:
1. **Disbursement Created** - Record is saved with status = COMPLETED (default)
2. **Transaction Created** - A corresponding DISBURSEMENT transaction is automatically created
3. **Records Linked** - The transaction is automatically linked to the disbursement via OneToOneField
4. **Atomic Operation** - Both are created together or both fail (no partial writes)

### Transaction Details:
The automatically created transaction will have:
```
type:                 'DISBURSEMENT'
direction:            'OUT' (money leaving the system)
amount:               (from disbursement)
currency:             (from disbursement, defaults to 'XAF')
status:               'SUCCESSFUL' (since payment already made)
gateway_transaction_id: (from disbursement if provided)
metadata:             {
                        disbursement_id: <disbursement ID>,
                        hospital_id: <hospital ID>,
                        payment_method: <payment method>,
                        external_reference: <external ref if any>,
                        ...(any custom metadata from disbursement)
                      }
```

### Status Synchronization:
When you update a disbursement's status (rare cases only):
- **mark_completed()** → Update disbursement status to COMPLETED, transaction status to SUCCESSFUL
- **mark_failed()** → Update disbursement status to FAILED, transaction status to FAILED (error details saved in metadata)

### Example Workflow:
```bash
# 1. Create disbursement - automatically COMPLETED with SUCCESSFUL transaction
POST /api/payments/disbursements/
{
  "hospital": "hospital-uuid",
  "amount": "50000.00",
  "payment_method": "MOMO",
  "recipient_phone": "+237123456789",
  "external_reference": "CAMPAY-2026-05-22-001"
}
# Response includes: id, status='COMPLETED', transaction_id

# 2. Transaction is auto-created
GET /api/payments/transactions/<transaction-id>/
# Transaction status is 'SUCCESSFUL', direction is 'OUT'

# 3. If payment actually failed, mark as failed (rare case)
POST /api/payments/disbursements/<disbursement-id>/mark_failed/
{
  "error_message": "Payment rejected by recipient"
}
# Now both disbursement and transaction are marked as FAILED
```

## Best Practices

1. **Don't Manually Link** - Transactions are created automatically; you don't need to create them separately
2. **Always Record External References** - Always include external payment system reference (e.g., Campay transaction ID, bank reference)
3. **Record Immediately** - Create the disbursement record right after the payment is made externally for accurate audit trail
4. **Document Corrections** - If a payment fails after recording, use mark_failed with error details for troubleshooting
5. **Use Timestamps** - Set `disbursed_at` to match when the payment actually left your account
6. **Recipient Details** - Always fill in `recipient_phone` (for MOMO) or `recipient_account` (for bank transfers)
7. **Metadata for Context** - Store additional context (e.g., invoice numbers, campaign IDs) in metadata for reporting
8. **Status Stays COMPLETED** - Disbursements default to COMPLETED because they represent payments already made; only mark as FAILED if there was an issue

## Database Schema

```
Disbursement
├── id (UUID, PK)
├── hospital_id (FK to Hospital)
├── transaction_id (FK to Transaction, nullable)
├── amount (Decimal)
├── currency (String)
├── payment_method (Choice)
├── recipient_phone (String, nullable)
├── recipient_account (String, nullable)
├── status (Choice)
├── external_reference (String, unique, nullable)
├── gateway_transaction_id (String, nullable)
├── notes (Text, nullable)
├── error_message (Text, nullable)
├── metadata (JSON, nullable)
├── created_by_id (FK to User)
├── created_at (DateTime)
├── updated_at (DateTime)
└── disbursed_at (DateTime, nullable)
```

## Indexes

For optimal query performance, the following indexes are created:

- `(hospital, -created_at)` - Quick hospital disbursement lookup
- `(status)` - Status filtering
- `(external_reference)` - External reference lookup
- `(created_at)` - Date range queries

## Future Enhancements

- Automated disbursement retry logic
- Webhook notifications for status changes
- Batch disbursement operations
- Reconciliation reports
- Export to accounting systems
