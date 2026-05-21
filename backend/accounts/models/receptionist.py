from django.db import models

from .base import BaseProfile, NationalIDMixin
from .hospital_admin import HospitalAdmin
from django.core.exceptions import ValidationError


class Receptionist(BaseProfile, NationalIDMixin):

    enrolled_by = models.ForeignKey(
        HospitalAdmin,
        on_delete=models.CASCADE,
        related_name='receptionists',
    )
    is_active = models.BooleanField(default=True)
    hospital = models.ForeignKey(
        'hospitals.Hospital',
        on_delete=models.CASCADE,
        related_name='receptionists',
        null=True,
        blank=True,
    )

    def clean(self):

        if (
            self.enrolled_by
            and self.hospital
            and self.enrolled_by.hospital != self.hospital
        ):
            raise ValidationError(
                "Receptionist must belong to admin's hospital."
            )

    def __str__(self):
        return "Receptionist: " + self.user.email
