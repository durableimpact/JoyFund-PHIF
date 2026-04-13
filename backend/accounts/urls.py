from django.urls import path

from accounts.views import (
    DonorDetailView,
    DonorListView,
    DonorRegisterView,
    DonorUpdateView,
    DonorInfoView,
    HospitalAdminCreateView,
    HospitalAdminDetailView,
    HospitalAdminListView,
    HospitalAdminUpdateView,
    HospitalAdminInfoView,
    ReceptionistCreateView,
    ReceptionistDetailView,
    ReceptionistListView,
    ReceptionistUpdateView,
    ReceptionistInfoView,
    SocialWorkerCreateView,
    SocialWorkerDetailView,
    SocialWorkerListView,
    SocialWorkerUpdateView,
    SocialWorkerInfoView,
    SystemAdminInfoView,
    VerifyEmailView,
    ResendVerificationView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    PasswordChangeView,
)

app_name = 'accounts'

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
    # Hospital Admins  (created by SYSTEM_ADMIN)
    # -----------------------------------------------------------------------
    path('hospital-admins/list/', HospitalAdminListView.as_view(), name='hospital-admin-list'),
    path('hospital-admins/', HospitalAdminCreateView.as_view(), name='hospital-admin-create'),
    path('hospital-admins/<uuid:id>/', HospitalAdminDetailView.as_view(), name='hospital-admin-detail'),
    path('hospital-admins/<uuid:id>/update/', HospitalAdminUpdateView.as_view(), name='hospital-admin-update'),

    # -----------------------------------------------------------------------
    # Receptionists  (created by HOSPITAL_ADMIN)
    # -----------------------------------------------------------------------
    path('receptionists/list/', ReceptionistListView.as_view(), name='receptionist-list'),
    path('receptionists/', ReceptionistCreateView.as_view(), name='receptionist-create'),
    path('receptionists/<uuid:id>/', ReceptionistDetailView.as_view(), name='receptionist-detail'),
    path('receptionists/<uuid:id>/update/', ReceptionistUpdateView.as_view(), name='receptionist-update'),

    # -----------------------------------------------------------------------
    # Social Workers  (created by SYSTEM_ADMIN)
    # -----------------------------------------------------------------------
    path('social-workers/list/', SocialWorkerListView.as_view(), name='social-worker-list'),
    path('social-workers/', SocialWorkerCreateView.as_view(), name='social-worker-create'),
    path('social-workers/<uuid:id>/', SocialWorkerDetailView.as_view(), name='social-worker-detail'),
    path('social-workers/<uuid:id>/update/', SocialWorkerUpdateView.as_view(), name='social-worker-update'),
]
