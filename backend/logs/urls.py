"""
URL configuration for logs endpoints.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ActivityLogViewSet, RequestLogViewSet, ErrorLogViewSet, LogStatsView

# Create a router for the viewsets
router = DefaultRouter()
router.register(r'activity', ActivityLogViewSet, basename='activity-log')
router.register(r'requests', RequestLogViewSet, basename='request-log')
router.register(r'errors', ErrorLogViewSet, basename='error-log')
router.register(r'stats', LogStatsView, basename='log-stats')

app_name = 'logs'

urlpatterns = [
    path('', include(router.urls)),
]
