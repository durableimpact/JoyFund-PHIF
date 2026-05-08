from django.apps import AppConfig


class HospitalsConfig(AppConfig):
    name = 'hospitals'

    def ready(self):
        import hospitals.signals
