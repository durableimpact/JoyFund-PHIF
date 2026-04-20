"""
URL routing for ANC tracking system endpoints.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ANCEnrollmentViewSet,
    ANCVisitViewSet,
    MissedAppointmentAlertViewSet,
    ANCCompletionCertificateViewSet,
)

# Create router and register viewsets
router = DefaultRouter()
router.register(r'enrollments', ANCEnrollmentViewSet, basename='anc-enrollment')
router.register(r'visits', ANCVisitViewSet, basename='anc-visit')
router.register(r'missed-appointments', MissedAppointmentAlertViewSet, basename='anc-missed-alert')
router.register(r'certificates', ANCCompletionCertificateViewSet, basename='anc-certificate')

urlpatterns = [
    path('', include(router.urls)),
]
