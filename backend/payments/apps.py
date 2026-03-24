from django.apps import AppConfig


class PaymentsConfig(AppConfig):
    name = 'payments'

    def ready(self):
        from django.db.models.signals import post_migrate
        from .signals import create_campay_gateway, create_default_fee_policy, create_transactions_on_successful_donation  # noqa: F401 — registers post_save signal

        post_migrate.connect(create_default_fee_policy, sender=self)
        post_migrate.connect(create_campay_gateway, sender=self)
