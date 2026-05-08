from django.db import models

from .base import BaseProfile, NationalIDMixin
from .system_admin import SystemAdmin


class HospitalAdmin(BaseProfile, NationalIDMixin):

    hospital = models.OneToOneField(
        'hospitals.Hospital',
        on_delete=models.SET_NULL,
        related_name='manager',
        null=True,
        blank=True,
    )

    enrolled_by = models.ForeignKey(
        SystemAdmin,
        on_delete=models.CASCADE,
        related_name='hospital_admins',
    )

    def __str__(self):
        return "Hospital Admin: " + self.user.email
