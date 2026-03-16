from django.urls import path

from hospitals.views import (
    HospitalCreateView,
    HospitalDeleteView,
    HospitalListView,
    HospitalRetrieveView,
    HospitalUpdateView,
    ServiceCreateView,
    ServiceDeleteView,
    ServiceListView,
    ServiceRetrieveView,
    ServiceUpdateView,
)

app_name = 'hospitals'

urlpatterns = [
    path('', HospitalListView.as_view(), name='hospital-list'),
    path('create/', HospitalCreateView.as_view(), name='hospital-create'),
    path('<uuid:id>/', HospitalRetrieveView.as_view(), name='hospital-retrieve'),
    path('<uuid:id>/update/', HospitalUpdateView.as_view(), name='hospital-update'),
    path('<uuid:id>/delete/', HospitalDeleteView.as_view(), name='hospital-delete'),
    path('<uuid:hospital_id>/services/', ServiceListView.as_view(), name='service-list'),
    path('<uuid:hospital_id>/services/create/', ServiceCreateView.as_view(), name='service-create'),
    path('<uuid:hospital_id>/services/<uuid:id>/', ServiceRetrieveView.as_view(), name='service-retrieve'),
    path('<uuid:hospital_id>/services/<uuid:id>/update/', ServiceUpdateView.as_view(), name='service-update'),
    path('<uuid:hospital_id>/services/<uuid:id>/delete/', ServiceDeleteView.as_view(), name='service-delete'),
]
