from django.apps import AppConfig


class AncConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'anc'
    verbose_name = 'Antenatal Care Tracking'

    def ready(self):
        import anc.signals
