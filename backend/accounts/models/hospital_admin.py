from django.db import models

from .base import BaseProfile, NationalIDMixin
from .system_admin import SystemAdmin


class HospitalAdmin(BaseProfile, NationalIDMixin):

    hospital = models.ForeignKey(
        'hospitals.Hospital',
        on_delete=models.SET_NULL,
        related_name='admins',
        null=True,
        blank=True,
    )

    is_active = models.BooleanField(default=True)
    enrolled_by = models.ForeignKey(
        SystemAdmin,
        on_delete=models.CASCADE,
        related_name='hospital_admins',
    )

    def __str__(self):
        return "Hospital Admin: " + self.user.email
