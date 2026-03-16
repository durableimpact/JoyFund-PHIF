from django.urls import path

from beneficiaries.views import (
    BeneficiaryCreateView,
    BeneficiaryDeleteView,
    BeneficiaryListView,
    BeneficiaryRetrieveView,
    BeneficiaryUpdateView,
)

app_name = 'beneficiaries'

urlpatterns = [
    path('', BeneficiaryListView.as_view(), name='beneficiary-list'),
    path('create/', BeneficiaryCreateView.as_view(), name='beneficiary-create'),
    path('<uuid:id>/', BeneficiaryRetrieveView.as_view(), name='beneficiary-retrieve'),
    path('<uuid:id>/update/', BeneficiaryUpdateView.as_view(), name='beneficiary-update'),
    path('<uuid:id>/delete/', BeneficiaryDeleteView.as_view(), name='beneficiary-delete'),
]
