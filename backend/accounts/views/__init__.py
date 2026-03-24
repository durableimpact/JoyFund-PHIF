from .donor import DonorRegisterView, DonorListView, DonorDetailView, DonorUpdateView
from .hospital_admin import HospitalAdminCreateView, HospitalAdminListView, HospitalAdminDetailView, HospitalAdminUpdateView
from .receptionist import ReceptionistCreateView, ReceptionistListView, ReceptionistDetailView, ReceptionistUpdateView
from .social_worker import SocialWorkerCreateView, SocialWorkerListView, SocialWorkerDetailView, SocialWorkerUpdateView
from .info import (
    DonorInfoView,
    HospitalAdminInfoView,
    ReceptionistInfoView,
    SocialWorkerInfoView,
    SystemAdminInfoView,
)

__all__ = [
    'DonorRegisterView',
    'DonorListView',
    'DonorDetailView',
    'DonorUpdateView',
    'HospitalAdminCreateView',
    'HospitalAdminListView',
    'HospitalAdminDetailView',
    'HospitalAdminUpdateView',
    'ReceptionistCreateView',
    'ReceptionistListView',
    'ReceptionistDetailView',
    'ReceptionistUpdateView',
    'SocialWorkerCreateView',
    'SocialWorkerListView',
    'SocialWorkerDetailView',
    'SocialWorkerUpdateView',
    'DonorInfoView',
    'HospitalAdminInfoView',
    'ReceptionistInfoView',
    'SocialWorkerInfoView',
    'SystemAdminInfoView',
]
