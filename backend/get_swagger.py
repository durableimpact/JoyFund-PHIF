import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()
from django.test import RequestFactory
from backend.urls import schema_view
request = RequestFactory().get('/swagger/?format=openapi')
try:
    response = schema_view.without_ui(cache_timeout=0)(request)
except Exception as e:
    import traceback
    traceback.print_exc()
