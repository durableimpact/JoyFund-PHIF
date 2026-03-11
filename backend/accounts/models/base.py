import re
import uuid

from django.db import models


class _NationalIDUpload:
    """
    Deconstructable callable for national-ID image upload paths.
    Django's migration serializer requires upload_to to be a named,
    importable object — closures are not serializable.
    """

    def __init__(self, side: str):
        self.side = side

    def __call__(self, instance, filename):
        # e.g. HospitalAdmin → hospital_admins/national_id/front/<filename>
        model_name = re.sub(r'(?<!^)(?=[A-Z])', '_', instance.__class__.__name__).lower()
        return f'{model_name}s/national_id/{self.side}/{filename}'

    def deconstruct(self):
        return ('accounts.models.base._NationalIDUpload', [self.side], {})


def _national_id_upload(side: str) -> '_NationalIDUpload':
    """Convenience wrapper — keeps the original call-site syntax unchanged."""
    return _NationalIDUpload(side)


class BaseProfile(models.Model):
    """UUID primary key + one-to-one User link shared by all profile types."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='%(class)s',
    )

    class Meta:
        abstract = True


class NationalIDMixin(models.Model):
    """National-ID fields shared by staff profiles."""

    national_id_number = models.CharField(max_length=500)
    front_national_id_image = models.ImageField(upload_to=_national_id_upload('front'))
    back_national_id_image = models.ImageField(upload_to=_national_id_upload('back'))

    class Meta:
        abstract = True
