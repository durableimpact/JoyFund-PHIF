from django.urls import path
from rest_framework.routers import SimpleRouter

from accounts.views import (
    DonorDetailView,
    DonorListView,
    DonorRegisterView,
    DonorUpdateView,
    DonorInfoView,
    HospitalAdminViewSet,
    HospitalAdminInfoView,
    ReceptionistViewSet,
    ReceptionistInfoView,
    SocialWorkerViewSet,
    SocialWorkerInfoView,
    SystemAdminInfoView,
    VerifyEmailView,
    ResendVerificationView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    PasswordChangeView,
)

app_name = 'accounts'

# Router for Hospital Admin ViewSet
router = SimpleRouter()
router.register(r'hospital-admins', HospitalAdminViewSet, basename='hospital-admin')
router.register(r'social-workers', SocialWorkerViewSet, basename='social-worker')
router.register(r'receptionists', ReceptionistViewSet, basename='receptionist')

urlpatterns = [
    # -----------------------------------------------------------------------
    # Email Verification
    # -----------------------------------------------------------------------
    path('verify-email/', VerifyEmailView.as_view(), name='verify-email'),
    path('resend-verification/', ResendVerificationView.as_view(), name='resend-verification'),

    # -----------------------------------------------------------------------
    # Password Reset & Change
    # -----------------------------------------------------------------------
    path('password/reset/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password/reset-confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('password/change/', PasswordChangeView.as_view(), name='password-change'),

    # -----------------------------------------------------------------------
    # User Info (get authenticated user info after login)
    # -----------------------------------------------------------------------
    path('donor/info/', DonorInfoView.as_view(), name='donor-info'),
    path('hospital-admin/info/', HospitalAdminInfoView.as_view(), name='hospital-admin-info'),
    path('receptionist/info/', ReceptionistInfoView.as_view(), name='receptionist-info'),
    path('social-worker/info/', SocialWorkerInfoView.as_view(), name='social-worker-info'),
    path('system-admin/info/', SystemAdminInfoView.as_view(), name='system-admin-info'),

    # -----------------------------------------------------------------------
    # Donors  (public registration)
    # -----------------------------------------------------------------------
    path('donors/', DonorListView.as_view(), name='donor-list'),
    path('donors/register/', DonorRegisterView.as_view(), name='donor-register'),
    path('donors/<uuid:id>/', DonorDetailView.as_view(), name='donor-detail'),
    path('donors/<uuid:id>/update/', DonorUpdateView.as_view(), name='donor-update'),

    # -----------------------------------------------------------------------
    # ViewSet Router URLs (Hospital Admins, Social Workers, Receptionists)
    # -----------------------------------------------------------------------
] + router.urls
