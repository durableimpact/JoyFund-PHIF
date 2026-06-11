from django.apps import AppConfig


class BeneficiariesConfig(AppConfig):
    name = "beneficiaries"

    def ready(self):
        import beneficiaries.signals  # noqa: F401
