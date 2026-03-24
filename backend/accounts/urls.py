from django.urls import path

from accounts.views import (
    DonorDetailView,
    DonorListView,
    DonorRegisterView,
    DonorUpdateView,
    HospitalAdminCreateView,
    HospitalAdminDetailView,
    HospitalAdminListView,
    HospitalAdminUpdateView,
    ReceptionistCreateView,
    ReceptionistDetailView,
    ReceptionistListView,
    ReceptionistUpdateView,
    SocialWorkerCreateView,
    SocialWorkerDetailView,
    SocialWorkerListView,
    SocialWorkerUpdateView,
    UserInfoView,
)

app_name = 'accounts'

urlpatterns = [
    # -----------------------------------------------------------------------
    # User Info  (get current user info after login)
    # -----------------------------------------------------------------------
    path('info/', UserInfoView.as_view(), name='user-info'),

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
