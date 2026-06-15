from django.db import models
from django.db.models import F, Sum
import uuid
from utils.models import BaseEvent
from decimal import Decimal
from accounts.models import Donor
from django.utils.text import slugify


class Campaign(models.Model):

    class EventType(models.TextChoices):
        BIRTHDAY = 'BIRTHDAY', 'Birthday'
        WEDDING = 'WEDDING', 'Wedding'
        PROMOTION = 'PROMOTION', 'Job Promotion'
        GRADUATION = 'GRADUATION', 'Graduation'
        MEMORIAL = 'MEMORIAL', 'Memorial'

    class CampaignStatus(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        ACTIVE = 'ACTIVE', 'Active'
        INACTIVE = 'INACTIVE', 'Inactive'
        FUNDED = 'FUNDED', 'Funded'
        CLOSED = 'CLOSED', 'Closed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    donor = models.ForeignKey(
        Donor, on_delete=models.CASCADE, related_name='my_campaigns'
    )

    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, null=True, blank=True, db_index=True)
    description = models.TextField()
    cover_image = models.ImageField(upload_to='campaigns/', null=True, blank=True)

    event_type = models.CharField(
        max_length=20,
        choices=EventType.choices
    )
    goal_amount = models.DecimalField(max_digits=12, decimal_places=2)
    current_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField()
    is_public = models.BooleanField(default=True)

    status = models.CharField(
        max_length=20,
        choices=CampaignStatus.choices,
        default=CampaignStatus.DRAFT
    )

    certificate_generated = models.BooleanField(
        default=False,
        help_text="True if an Impact Certificate PDF has been generated for this completed campaign."
    )

    certificate_file = models.FileField(
        upload_to='certificates/',
        null=True,
        blank=True,
        help_text="The generated PDF Impact Certificate."
    )

    currently_allocated = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text="Funds currently locked in active/issued vouchers"
    )

    total_disbursed = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text="Total funds actually paid to partner hospitals"
    )

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['donor', 'created_at']),
            models.Index(fields=['created_at']),
        ]

        constraints = [
            models.CheckConstraint(
                condition=models.Q(currently_allocated__gte=0),
                name='currently_allocated_non_negative'
            ),
            models.CheckConstraint(
                condition=models.Q(total_disbursed__gte=0),
                name='total_disbursed_non_negative'
            ),
        ]

    @property
    def total_net_raised(self):
        result = self.donations.filter(status='SUCCESS').aggregate(
            total=Sum(F('net_amount') - F('platform_fee_amount'))
        )['total']
        return result or Decimal('0')

    @property
    def available_balance(self):
        net = self.total_net_raised
        return max(Decimal('0'), net - self.total_disbursed - self.currently_allocated)

    @property
    def progress_percentage(self):
        if self.goal_amount and self.goal_amount > 0:
            current = self.current_amount or 0
            return (current / self.goal_amount) * 100
        return 0
    
    @property
    def goal_reached(self):
        """Check if campaign has reached its goal amount."""
        if not self.goal_amount:
            return False
        return self.total_net_raised >= self.goal_amount
    
    def generate_impact_certificate(self, force=False):
        """
        Generate and save impact certificate PDF if campaign goal is reached.
        Returns: True if certificate generated/updated, False otherwise
        """
        if not self.goal_reached:
            return False
        
        if self.certificate_generated and self.certificate_file and not force:
            return False  # Already generated
        
        try:
            from utils.pdf_generator import create_impact_certificate
            
            filename, pdf_file = create_impact_certificate(self)
            
            if pdf_file:
                # Save the PDF file
                self.certificate_file.save(filename, pdf_file, save=True)
                self.certificate_generated = True
                self.save(update_fields=['certificate_generated', 'certificate_file'])
                return True
            return False
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error generating certificate for campaign {self.id}: {str(e)}")
            return False

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._initial_status = self.status
        self._initial_certificate_generated = self.certificate_generated

    def save(self, *args, **kwargs):
        # Generate slug on creation if not provided
        if self._state.adding and not self.slug:
            base_slug = slugify(self.title)
            slug = base_slug
            counter = 1
            # Ensure slug uniqueness
            while Campaign.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug

        is_new = self._state.adding
        super().save(*args, **kwargs)

        if is_new or self.status != self._initial_status:
            if is_new:
                notes = f"Campaign status initially set to {self.status}"
            else:
                notes = f"Campaign status changed from {self._initial_status} to {self.status}"
            self.events.create(
                status=self.status,
                notes=notes
            )
            self._initial_status = self.status

        if self.certificate_generated != self._initial_certificate_generated:
            self._initial_certificate_generated = self.certificate_generated

    def __str__(self):
        return self.title


class CampaignEvent(BaseEvent):
    """
    Tracks all the status changes that happen on a Campaign
    """
    campaign = models.ForeignKey(
        Campaign, 
        on_delete=models.CASCADE, 
        related_name="events"
    )