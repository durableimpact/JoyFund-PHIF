import django_filters
from accounts.models import Donor, HospitalAdmin, Receptionist, SocialWorker, SystemAdmin

class DonorFilter(django_filters.FilterSet):
    class Meta:
        model = Donor
        fields = {
            'id': ['exact'],
            'user__email': ['exact', 'icontains'],
            'user__phone_number': ['exact', 'icontains'],
            'user__is_verified': ['exact'],
            'user__is_active': ['exact'],
            'user__created_at': ['date', 'gte', 'lte'],
        }

class HospitalAdminFilter(django_filters.FilterSet):
    class Meta:
        model = HospitalAdmin
        fields = {
            'id': ['exact'],
            'hospital_id': ['exact', 'isnull'],
            'enrolled_by_id': ['exact'],
            'national_id_number': ['exact', 'icontains'],
            'user__email': ['exact', 'icontains'],
            'user__phone_number': ['exact', 'icontains'],
            'user__is_verified': ['exact'],
            'user__is_active': ['exact'],
            'user__created_at': ['date', 'gte', 'lte'],
        }

class ReceptionistFilter(django_filters.FilterSet):
    class Meta:
        model = Receptionist
        fields = {
            'id': ['exact'],
            'hospital_id': ['exact', 'isnull'],
            'enrolled_by_id': ['exact'],
            'national_id_number': ['exact', 'icontains'],
            'user__email': ['exact', 'icontains'],
            'user__phone_number': ['exact', 'icontains'],
            'user__is_verified': ['exact'],
            'user__is_active': ['exact'],
            'user__created_at': ['date', 'gte', 'lte'],
        }

class SocialWorkerFilter(django_filters.FilterSet):
    class Meta:
        model = SocialWorker
        fields = {
            'id': ['exact'],
            'organization': ['exact', 'icontains'],
            'region_assigned': ['exact', 'icontains'],
            'is_approved': ['exact'],
            'enrolled_by_id': ['exact'],
            'national_id_number': ['exact', 'icontains'],
            'user__email': ['exact', 'icontains'],
            'user__phone_number': ['exact', 'icontains'],
            'user__is_verified': ['exact'],
            'user__is_active': ['exact'],
            'user__created_at': ['date', 'gte', 'lte'],
        }


class SystemAdminFilter(django_filters.FilterSet):
    class Meta:
        model = SystemAdmin
        fields = {
            'id': ['exact'],
            'user__email': ['exact', 'icontains'],
            'user__phone_number': ['exact', 'icontains'],
            'user__is_verified': ['exact'],
            'user__is_active': ['exact'],
            'user__created_at': ['date', 'gte', 'lte'],
        }
