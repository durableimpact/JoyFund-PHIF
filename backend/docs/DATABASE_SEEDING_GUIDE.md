# Database Seeding Guide

This guide explains how to use the seeding system to populate your database with test data for development and testing.

## Quick Start

### Seed All Data
```bash
python manage.py seed_data --full
```

This creates a complete, realistic data flow:
- **Users** (admins, donors, social workers, hospital staff)
- **Hospitals** with services
- **Beneficiaries** with health issues
- **Campaigns** with donations
- **Vouchers** funded by campaigns

### Seed Specific Data Types

```bash
# Seed only users (all roles)
python manage.py seed_data --users

# Seed only hospitals with services and staff
python manage.py seed_data --hospitals

# Seed only beneficiaries and their health issues
python manage.py seed_data --beneficiaries

# Seed campaigns with donations and vouchers
python manage.py seed_data --campaigns
```

### Clear Previous Test Data

```bash
# Clear test data before reseeding (keeps beneficiaries to avoid unique constraint issues)
python manage.py seed_data --clear --full
```

## Data Created

### Users & Accounts
When seeding users, the system creates:

| Role | Count | Email Pattern | Password |
|------|-------|---|---|
| System Admin | 1 | `admin@joyfund.com` | `password` |
| Hospital Admins | 3 | `admin-{hospital_id}@joyfund.com` | `password` |
| Receptionists | 3 | `receptionist-{hospital_id}@joyfund.com` | `password` |
| Social Workers | 2 | `socialworker{n}@example.com` | `password` |
| Donors | 4 | `donor{n}@example.com` | `password` |

### Hospitals
Creates 3 hospitals with services:
- **General Regional Hospital** (Douala, Littoral)
- **Central Hospital** (Yaoundé, Centre)
- **Northern Health Centre** (Garoua, North)

Each hospital is assigned:
- 4-6 random medical services with prices
- Hospital Admin
- Receptionist
- Services: General Medicine, Surgery, Cardiology, etc.

### Beneficiaries
For each social worker:
- 3-5 beneficiaries (mothers/patients)
- Each with 1-2 health issues
- Auto-generated digital health ID
- Random demographics

### Campaigns & Donations
For each campaign:
- Goal amount: 100,000 - 500,000 XAF
- 3-8 donations from random donors
- Automatic platform fee calculation (5%)
- Net amount update to campaign

### Vouchers
For each beneficiary's health issue:
- Linked voucher created for a random hospital
- Amount: committed via VoucherFunding
- Status: AVAILABLE
- Funded by the campaign

## Using the Seeding Factories

For programmatic use in tests or scripts, use the factory classes from `accounts.utils.seed_factories`:

```python
from decimal import Decimal
from accounts.utils.seed_factories import (
    UserFactory,
    HospitalFactory,
    BeneficiaryFactory,
    CampaignFactory,
)

# Create a donor
donor, created = UserFactory.create_donor(
    email='custom@example.com',
    first_name='Jane',
    last_name='Donor'
)

# Create a hospital
hospital, created = HospitalFactory.create_hospital(
    name='My Hospital',
    email='hospital@example.com',
    region='Littoral',
    city='Douala',
    services=['Surgery', 'Cardiology']
)

# Create a beneficiary
beneficiary, created = BeneficiaryFactory.create_beneficiary(
    full_name='Mary Smith',
    social_worker=social_worker_instance
)

# Create a health issue
health_issue, created = BeneficiaryFactory.create_health_issue(
    beneficiary=beneficiary,
    issue_category='MATERNAL',
    social_worker=social_worker_instance
)

# Create a campaign
campaign, created = CampaignFactory.create_campaign(
    title='Help Mary Recover',
    donor=donor,
    beneficiary=beneficiary,
    goal_amount=Decimal(200000)
)

# Add donations
donation, created = CampaignFactory.create_donation(
    campaign=campaign,
    donor=donor,
    amount=Decimal(50000)
)

# Create and fund a voucher
voucher, created = CampaignFactory.create_voucher(
    beneficiary=beneficiary,
    health_issue=health_issue,
    hospital=hospital
)

voucher_funding, created = CampaignFactory.fund_voucher(
    voucher=voucher,
    campaign=campaign,
    committed_amount=Decimal(100000)
)
```

## Advanced: Custom Seeding

### In Tests (conftest.py)

```python
import pytest
from decimal import Decimal
from accounts.utils.seed_factories import UserFactory, HospitalFactory

@pytest.fixture
def test_donor():
    donor, _ = UserFactory.create_donor(
        email='test-donor@test.com',
        first_name='Test',
        last_name='Donor'
    )
    return donor

@pytest.fixture
def test_hospital():
    hospital, _ = HospitalFactory.create_hospital(
        name='Test Hospital',
        email='test-hospital@test.com',
        region='Littoral',
        city='Douala',
        services=['Surgery', 'Cardiology']
    )
    return hospital
```

### Custom Management Command

Create a new management command that uses the factories:

```python
# apps/myapp/management/commands/seed_custom_data.py
from django.core.management.base import BaseCommand
from decimal import Decimal
from accounts.utils.seed_factories import (
    UserFactory,
    HospitalFactory,
    BeneficiaryFactory,
    CampaignFactory,
)

class Command(BaseCommand):
    def handle(self, *args, **options):
        # Your custom seeding logic using factories
        donor, _ = UserFactory.create_donor('custom@example.com')
        hospital, _ = HospitalFactory.create_hospital(
            name='My Hospital',
            email='custom@example.com',
            region='Littoral',
            city='Douala'
        )
        # ... more seeding
        self.stdout.write(self.style.SUCCESS('Custom seed complete!'))
```

## Database Cleanup

To delete only test/seeded data while preserving production data:

```bash
python manage.py seed_data --clear
```

This carefully deletes:
- Campaigns and donations
- Vouchers and funding records
- Health issues
- Test users (donors, social workers, hospital admins, receptionists)

Note: Beneficiaries are preserved to avoid unique constraint violations on digital_health_id auto-generation.

## Important Notes

### Passwords
- Default password for all test users: `password`
- **Change these in production immediately**
- Never commit real passwords to the codebase

### Idempotency
- Seeding uses `get_or_create()` for most entities
- Safe to run multiple times without duplicates
- Check stdout to see what was created vs. skipped

### Relationships
- Seeding is ordered: Users → Hospitals → Beneficiaries → Campaigns → Vouchers
- Running out-of-order may fail with "does not exist" errors
- Use `--full` flag for correct sequential order

### Beneficiary Handling
- Beneficiaries use auto-generated digital_health_id
- IDs are NOT deleted when beneficiaries are, causing unique constraint issues
- Solution: Either keep beneficiaries (default), or manually reset sequences if needed

### Database State
- Seeding works with existing data
- Won't overwrite existing records with matching unique fields
- Use `--clear` to reset test data before reseeding

## Troubleshooting

### "System admin must exist"
```bash
python manage.py init_users  # Run this first, then seed_data
# OR
python manage.py seed_data --users  # Creates all default users
```

### "No such table" errors
```bash
python manage.py migrate  # Apply all migrations first
```

### "Beneficiaries already exist" message
This is normal on repeated runs. It prevents duplicate digital_health_id constraint violations. To force reseed:
```bash
python manage.py seed_data --clear --full
```

### duplicate key value violates unique constraint errors
These can occur if beneficiaries from previous runs still exist and their IDs conflict. Options:
1. Just run the command again - idempotency handling will skip duplicates
2. Use `--clear` flag to remove test data first
3. Manually truncate the beneficiaries table if needed

### Performance Issues
- Large datasets slow down imports
- Consider seeding specific data types instead of `--full`
- Use factories in code for fine-grained control
- Remove verbose output with higher verbosity level: `--verbosity=0`

## Models Involved

The seeding system works with these models:
- **Accounts**: User, SystemAdmin, HospitalAdmin, SocialWorker, Donor, Receptionist
- **Hospitals**: Hospital, Services
- **Beneficiaries**: Beneficiary, HealthIssue
- **Campaigns**: Campaign, Donation
- **Vouchers**: Voucher, VoucherFunding
- **Payments**: Transaction (populated via Donation/Campaign)

## Environment Variables

No special environment variables required. The system uses your current Django settings (database connection, etc.).

## Related Documentation
- See [LOCAL_DEVELOPMENT.md](../LOCAL_DEVELOPMENT.md) for complete setup
- See [DOCKER_SETUP_COMPLETE.md](../DOCKER_SETUP_COMPLETE.md) for containerized seeding
- Models documentation in each app's `models/` directory

