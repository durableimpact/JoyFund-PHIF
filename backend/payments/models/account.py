import uuid
from django.db import models
from django.core.exceptions import ValidationError
from polymorphic.models import PolymorphicModel

class Account(PolymorphicModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, blank=True)
    balance = models.DecimalField(
        max_digits=12, decimal_places=2, default=0)  # In XAF

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['name']),
        ]

class SingletonAccountMixin:
    """
    Enforces a single-row constraint on any Account subclass that mixes this in.

    Usage:
        instance = EscrowAccount.get_instance()   # creates if missing, returns existing otherwise
    """

    @classmethod
    def get_instance(cls):
        """Return the sole instance, creating it if it does not yet exist."""
        obj, _ = cls.objects.get_or_create(
            pk=cls._singleton_pk(),
        )
        return obj

    @classmethod
    def _singleton_pk(cls):
        """
        Return a stable, deterministic UUID derived from the class name so the
        singleton row always has the same PK — safe to call before the row exists.
        """
        import uuid as _uuid
        return _uuid.uuid5(_uuid.NAMESPACE_DNS, f'singleton.{cls.__name__}')

    def save(self, *args, **kwargs):
        """Prevent creating a second row and default name to class name."""
        if self._state.adding:
            # New object — check whether one already exists
            if self.__class__.objects.exists():
                raise ValidationError(
                    f"Only one {self.__class__.__name__} instance is allowed. "
                    "Use .get_instance() to retrieve or create it."
                )
            # Pin the PK to the deterministic singleton UUID on first creation
            self.pk = self.__class__._singleton_pk()
        # Set name to class name only when it hasn't been given a value yet
        if not self.name:
            self.name = self.__class__.__name__
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError(
            f"{self.__class__.__name__} is a singleton and cannot be deleted."
        )

class EscrowAccount(SingletonAccountMixin, Account):
    def __str__(self):
        return f"{self.name} - Balance: {self.balance} XAF"

class FeeAccount(SingletonAccountMixin, Account):
    def __str__(self):
        return f"{self.name} - Balance: {self.balance} XAF"
