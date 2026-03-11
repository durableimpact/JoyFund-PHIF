from django.db import models

from .base import BaseProfile, NationalIDMixin
from .system_admin import SystemAdmin


class SocialWorker(BaseProfile, NationalIDMixin):

    is_approved = models.BooleanField(default=False)
    organization = models.CharField(max_length=255)
    region_assigned = models.CharField(max_length=255)

    enrolled_by = models.ForeignKey(
        SystemAdmin,
        on_delete=models.CASCADE,
        related_name='social_workers',
    )

    def __str__(self):
        return "Social Worker: " + self.user.username
