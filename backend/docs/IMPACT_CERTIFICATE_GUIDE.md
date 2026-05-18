# Impact Certificate Generation Guide

## Overview

The JoyFund platform automatically generates professional PDF **Impact Certificates** when campaigns successfully reach their fundraising goals. These certificates document the community's collective impact and recognize the donors who made it possible.

## Features

### Automatic Generation
- **Trigger**: When a campaign's total raised amount reaches or exceeds its goal amount
- **Timing**: Automatically generated via Django signals when donations are processed
- **Idempotent**: Once generated, won't regenerate unless explicitly forced
- **Error Handling**: Failures are logged without stopping the campaign workflow

### Certificate Contents

Each certificate includes:
- **Campaign Information**: Title, description, goal, and amount raised
- **Impact Metrics**: 
  - Total amount raised (in XAF)
  - Goal amount
  - Achievement percentage
  - Number of contributors
- **Community Recognition**: Acknowledgment of all donors who contributed
- **Impact Statement**: Custom message about community impact
- **Certificate ID**: Unique identifier for verification
- **Generation Date**: When the certificate was created
- **Professional Design**: Branded header/footer with JoyFund colors

---

## How It Works

### 1. Automatic Flow (After Goal Reached)

```
Donation Created with Status=SUCCESS
    ↓
Campaign.current_amount updated via signal
    ↓
Campaign.goal_reached = True
    ↓
Campaign post_save signal triggered
    ↓
campaign.generate_impact_certificate() called
    ↓
PDF generated from HTML template
    ↓
ContentFile saved to campaign.certificate_file
    ↓
campaign.certificate_generated = True
```

### 2. Manual Generation (Via Management Command)

```bash
# Generate for all campaigns at goal
python manage.py generate_certificates

# Generate for specific campaign
python manage.py generate_certificates <campaign_id>

# Regenerate even if already exists
python manage.py generate_certificates --force
```

### 3. Programmatic Generation (In Code)

```python
from campaigns.models import Campaign

campaign = Campaign.objects.get(id='...')

# Check if goal reached
if campaign.goal_reached:
    # Generate certificate
    success = campaign.generate_impact_certificate()
    if success:
        print(f"Certificate saved to: {campaign.certificate_file.name}")
```

---

## Technical Implementation

### Models

#### Campaign Model
**New Properties & Methods**:

```python
@property
def goal_reached(self):
    """Check if campaign has reached its goal amount."""
    return self.total_net_raised >= self.goal_amount

def generate_impact_certificate(self):
    """
    Generate and save impact certificate PDF if campaign goal is reached.
    Returns: True if certificate generated/updated, False otherwise
    """
```

**New Fields** (if not already present):
- `certificate_file`: FileField to store PDF
- `certificate_generated`: BooleanField to track generation status

### Signals

**campaigns/signals.py - Campaign post_save**:
```python
@receiver(post_save, sender=Campaign)
def invalidate_campaign_caches_on_save(sender, instance, created, **kwargs):
    # ... cache invalidation ...
    
    # Generate impact certificate if goal is reached
    if instance.goal_reached and not instance.certificate_generated:
        instance.generate_impact_certificate()
```

### PDF Generation

**utils/pdf_generator.py**:
```python
def create_impact_certificate(campaign):
    """
    Generates a PDF Impact Certificate with:
    - Campaign details and metrics
    - Donor list and contribution amounts
    - Impact statement
    - Professional formatting with JoyFund branding
    
    Returns: (filename, ContentFile) or (None, None) on failure
    """
```

### Template

**campaigns/templates/campaigns/impact_certificate.html**:
- Responsive HTML/CSS design for PDF rendering
- Variables available in context:
  - `campaign`: Campaign instance with all fields
  - `total_raised`: Sum of successful donations
  - `goal_amount`: Campaign goal
  - `progress_percentage`: Achievement percentage (0-100+)
  - `total_donors`: Count of unique donors
  - `generation_date`: Human-readable date
  - `donors`: QuerySet of Donation objects

---

## Usage Examples

### Example 1: Check Certificate Status

```python
from campaigns.models import Campaign

campaign = Campaign.objects.get(title="Emergency Clinic Renovation")

# Check if goal reached
print(f"Goal reached: {campaign.goal_reached}")
print(f"Progress: {campaign.progress_percentage:.1f}%")
print(f"Amount raised: {campaign.total_net_raised} XAF / {campaign.goal_amount} XAF")

# Check certificate status
if campaign.certificate_generated:
    print(f"Certificate: {campaign.certificate_file.url}")
else:
    print("No certificate yet")
```

### Example 2: Manual Certificate Generation

```bash
# Generate for a specific campaign
python manage.py generate_certificates a1b2c3d4-e5f6-7890-abcd-ef1234567890

# Generate for all campaigns that reached their goal
python manage.py generate_certificates

# Regenerate an existing certificate
python manage.py generate_certificates a1b2c3d4-e5f6-7890-abcd-ef1234567890 --force
```

### Example 3: API Endpoint to Retrieve Certificate

```python
from django.http import FileResponse
from campaigns.models import Campaign

def download_certificate(request, campaign_id):
    campaign = Campaign.objects.get(id=campaign_id)
    
    if not campaign.certificate_file:
        return JsonResponse({'error': 'No certificate available'}, status=404)
    
    return FileResponse(
        campaign.certificate_file.open('rb'),
        filename=f"{campaign.slug}_impact_certificate.pdf",
        content_type='application/pdf'
    )
```

---

## Testing

### Run Unit Tests

```bash
python manage.py test campaigns.tests.test_impact_certificate -v 2
```

### Manual Testing Steps

1. **Set up test data**:
   ```bash
   python manage.py seed_data --clear --full
   ```

2. **Check campaigns**:
   ```python
   from campaigns.models import Campaign
   campaigns = Campaign.objects.filter(current_amount__gte=Decimal('5000'))
   for c in campaigns:
       print(f"{c.title}: {c.total_net_raised}/{c.goal_amount} - Goal reached: {c.goal_reached}")
   ```

3. **Trigger certificate generation**:
   ```bash
   python manage.py generate_certificates --force
   ```

4. **Verify certificate files**:
   ```bash
   ls -la media/certificates/
   ```

### End-to-End Test (Django Shell)

```python
from django.utils.timezone import now
from decimal import Decimal
from campaigns.models import Campaign
from accounts.models import User, Donor, Role
from payments.models import Payment

# Create test campaign
campaign = Campaign.objects.create(
    title="Test Campaign",
    description="Test",
    goal_amount=Decimal('10000.00'),
)

# Check initial state
print(f"Goal reached: {campaign.goal_reached}")  # False

# Simulate goal achievement
campaign.current_amount = Decimal('10000.00')
campaign.save()

# Check if certificate was generated
campaign.refresh_from_db()
print(f"Certificate generated: {campaign.certificate_generated}")
if campaign.certificate_file:
    print(f"Certificate path: {campaign.certificate_file.name}")
```

---

## Troubleshooting

### Certificate Not Generating

**Symptom**: Campaign reaches goal but `certificate_generated` stays False

**Solutions**:
1. Check that WeasyPrint is installed:
   ```bash
   pip install weasyprint
   ```

2. Check template exists:
   ```bash
   ls campaigns/templates/campaigns/impact_certificate.html
   ```

3. Check logs for errors:
   ```bash
   tail -f logs/debug.log | grep -i certificate
   ```

4. Manually trigger generation:
   ```bash
   python manage.py generate_certificates --force
   ```

### PDF Generation Fails

**Symptom**: Certificate management command runs but no PDF created

**Possible Causes**:
- WeasyPrint dependencies missing (requires system fonts)
- Template rendering error (missing context variables)
- File permissions on media directory

**Fix**:
```bash
# Install system dependencies for WeasyPrint
apt-get install python3-dev python3-cffi libcairo2 libpango-1.0-0 libpango-cairo-1.0-0 libgdk-pixbuf2.0-0 libffi-dev

# Reinstall Python dependencies
pip install --upgrade weasyprint

# Check file permissions
chmod 755 media/ && chmod 755 media/campaigns/
```

### Missing Template Variables

**Symptom**: PDF renders but shows "{{ variable_name }}" instead of values

**Solution**: Check that all variables are passed in context in `create_impact_certificate()`:
- `campaign`
- `total_raised`
- `goal_amount`
- `progress_percentage`
- `total_donors`
- `generation_date`
- `donors`

---

## Configuration

### Settings.py

Add or verify these settings:

```python
# Media files configuration
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Logging for certificates
LOGGING = {
    'version': 1,
    'loggers': {
        'utils.pdf_generator': {
            'level': 'INFO',
            'handlers': ['console', 'file'],
        },
    },
}
```

### URLs.py (Optional - for downloading certificates)

```python
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # ... your patterns ...
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

---

## FAQ

**Q: Can I customize the certificate design?**
A: Yes! Edit `campaigns/templates/campaigns/impact_certificate.html`. The template uses Django template syntax and CSS styling. Changes apply to all future certificates.

**Q: How do I add the certificate to an API response?**
A: Add a `certificate_url` field in your serializer:
```python
class CampaignSerializer(serializers.ModelSerializer):
    certificate_url = serializers.SerializerMethodField()
    
    def get_certificate_url(self, obj):
        if obj.certificate_file:
            return obj.certificate_file.url
        return None
```

**Q: Can I send the certificate via email?**
A: Yes! Use the certificate file in your email task:
```python
from django.core.mail import EmailMessage

email = EmailMessage(
    subject=f"Impact Certificate - {campaign.title}",
    body="Your campaign impact certificate is attached.",
    from_email="noreply@joyfund.org",
    to=[donor.user.email],
)
email.attach_file(campaign.certificate_file.path)
email.send()
```

**Q: What if the goal gets exceeded?**
A: The certificate still generates - it shows 100%+ progress and acknowledges the additional impact.

**Q: Can I have multilingual certificates?**
A: Yes! Use Django's translation framework:
```python
# In template
{% load i18n %}
<h1>{% trans "Certificate of Impact" %}</h1>
```

---

## Performance Considerations

- **Lazy Generation**: Certificates generate only when needed (goal reached)
- **No Blocking**: PDF generation doesn't block API responses (could be moved to Celery)
- **Caching**: Campaign caches invalidate when updated
- **Storage**: PDFs stored in media directory (consider cloud storage for production)

### Production Recommendations

1. Use Celery for PDF generation:
   ```python
   @shared_task
   def generate_certificate_async(campaign_id):
       campaign = Campaign.objects.get(id=campaign_id)
       campaign.generate_impact_certificate()
   ```

2. Store PDFs in S3/Cloud Storage instead of media directory

3. Add PDF generation to monitoring/alerting

---

## Support & Maintenance

For issues or questions:
1. Check the logs in `logs/debug.log`
2. Run tests to verify setup: `python manage.py test campaigns.tests.test_impact_certificate`
3. Test manually with management command: `python manage.py generate_certificates --force`

---

**Last Updated**: 2025 | JoyFund Development Team
