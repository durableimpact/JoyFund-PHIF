from django.db import models

from .base import BaseProfile, NationalIDMixin
from .hospital_admin import HospitalAdmin


class Receptionist(BaseProfile, NationalIDMixin):

    enrolled_by = models.ForeignKey(
        HospitalAdmin,
        on_delete=models.CASCADE,
        related_name='receptionists',
    )
    hospital = models.ForeignKey(
        'hospitals.Hospital',
        on_delete=models.CASCADE,
        related_name='receptionists',
        null=True,
        blank=True,
    )

    def __str__(self):
        return "Receptionist: " + self.user.username
