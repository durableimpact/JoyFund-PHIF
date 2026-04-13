from django.core.cache import cache
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import Role
from accounts.serializers import (
    DonorInfoSerializer,
    HospitalAdminInfoSerializer,
    ReceptionistInfoSerializer,
    SocialWorkerInfoSerializer,
    SystemAdminInfoSerializer,
)
from accounts.utils import IsSystemAdmin


_TAG = ['User Info']
CACHE_TIMEOUT = 10 * 60  # 10 minutes


class DonorInfoView(RetrieveAPIView):
    """GET /api/accounts/donor/info/ - Only DONOR can access"""
    serializer_class = DonorInfoSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def check_permissions(self, request):
        super().check_permissions(request)
        if request.user.role != Role.DONOR:
            self.permission_denied(request, message='Only DONOR can access this endpoint.')

    @staticmethod
    def _get_cache_key(user_id):
        """Get cache key for donor info"""
        return f'donor_info_{user_id}'

    @swagger_auto_schema(
        tags=_TAG,
        operation_summary='Get donor user information',
        operation_description='Returns the authenticated donor user\'s information with their profile.',
        responses={
            200: openapi.Response(
                description='Successfully retrieved donor info',
                schema=DonorInfoSerializer,
            ),
            401: 'Unauthorized - Authentication required',
            403: 'Forbidden - Only DONOR can access this endpoint',
        },
    )
    def get(self, request, *args, **kwargs):
        cache_key = self._get_cache_key(request.user.id)
        cached_response = cache.get(cache_key)
        if cached_response is not None:
            return cached_response
        
        response = super().get(request, *args, **kwargs)
        cache.set(cache_key, response, CACHE_TIMEOUT)
        return response


class HospitalAdminInfoView(RetrieveAPIView):
    """GET /api/accounts/hospital-admin/info/ - Only HOSPITAL_ADMIN can access"""
    serializer_class = HospitalAdminInfoSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def check_permissions(self, request):
        super().check_permissions(request)
        if request.user.role != Role.HOSPITAL_ADMIN:
            self.permission_denied(request, message='Only HOSPITAL_ADMIN can access this endpoint.')

    @staticmethod
    def _get_cache_key(user_id):
        """Get cache key for hospital admin info"""
        return f'hospital_admin_info_{user_id}'

    @swagger_auto_schema(
        tags=_TAG,
        operation_summary='Get hospital admin user information',
        operation_description='Returns the authenticated hospital admin\'s information including their profile and hospital details.',
        responses={
            200: openapi.Response(
                description='Successfully retrieved hospital admin info',
                schema=HospitalAdminInfoSerializer,
            ),
            401: 'Unauthorized - Authentication required',
            403: 'Forbidden - Only HOSPITAL_ADMIN can access this endpoint',
        },
    )
    def get(self, request, *args, **kwargs):
        cache_key = self._get_cache_key(request.user.id)
        cached_response = cache.get(cache_key)
        if cached_response is not None:
            return cached_response
        
        response = super().get(request, *args, **kwargs)
        cache.set(cache_key, response, CACHE_TIMEOUT)
        return response


class ReceptionistInfoView(RetrieveAPIView):
    """GET /api/accounts/receptionist/info/ - Only RECEPTIONIST can access"""
    serializer_class = ReceptionistInfoSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def check_permissions(self, request):
        super().check_permissions(request)
        if request.user.role != Role.RECEPTIONIST:
            self.permission_denied(request, message='Only RECEPTIONIST can access this endpoint.')

    @staticmethod
    def _get_cache_key(user_id):
        """Get cache key for receptionist info"""
        return f'receptionist_info_{user_id}'

    @swagger_auto_schema(
        tags=_TAG,
        operation_summary='Get receptionist user information',
        operation_description='Returns the authenticated receptionist\'s information including their profile and hospital details.',
        responses={
            200: openapi.Response(
                description='Successfully retrieved receptionist info',
                schema=ReceptionistInfoSerializer,
            ),
            401: 'Unauthorized - Authentication required',
            403: 'Forbidden - Only RECEPTIONIST can access this endpoint',
        },
    )
    def get(self, request, *args, **kwargs):
        cache_key = self._get_cache_key(request.user.id)
        cached_response = cache.get(cache_key)
        if cached_response is not None:
            return cached_response
        
        response = super().get(request, *args, **kwargs)
        cache.set(cache_key, response, CACHE_TIMEOUT)
        return response


class SocialWorkerInfoView(RetrieveAPIView):
    """GET /api/accounts/social-worker/info/ - Only SOCIAL_WORKER can access"""
    serializer_class = SocialWorkerInfoSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def check_permissions(self, request):
        super().check_permissions(request)
        if request.user.role != Role.SOCIAL_WORKER:
            self.permission_denied(request, message='Only SOCIAL_WORKER can access this endpoint.')

    @staticmethod
    def _get_cache_key(user_id):
        """Get cache key for social worker info"""
        return f'social_worker_info_{user_id}'

    @swagger_auto_schema(
        tags=_TAG,
        operation_summary='Get social worker user information',
        operation_description='Returns the authenticated social worker\'s information including their profile, organization and assigned region.',
        responses={
            200: openapi.Response(
                description='Successfully retrieved social worker info',
                schema=SocialWorkerInfoSerializer,
            ),
            401: 'Unauthorized - Authentication required',
            403: 'Forbidden - Only SOCIAL_WORKER can access this endpoint',
        },
    )
    def get(self, request, *args, **kwargs):
        cache_key = self._get_cache_key(request.user.id)
        cached_response = cache.get(cache_key)
        if cached_response is not None:
            return cached_response
        
        response = super().get(request, *args, **kwargs)
        cache.set(cache_key, response, CACHE_TIMEOUT)
        return response


class SystemAdminInfoView(RetrieveAPIView):
    """GET /api/accounts/system-admin/info/ - Only SYSTEM_ADMIN can access"""
    serializer_class = SystemAdminInfoSerializer
    permission_classes = [IsAuthenticated, IsSystemAdmin]

    def get_object(self):
        return self.request.user

    @staticmethod
    def _get_cache_key(user_id):
        """Get cache key for system admin info"""
        return f'system_admin_info_{user_id}'

    @swagger_auto_schema(
        tags=_TAG,
        operation_summary='Get system admin user information',
        operation_description='Returns the authenticated system admin\'s information.',
        responses={
            200: openapi.Response(
                description='Successfully retrieved system admin info',
                schema=SystemAdminInfoSerializer,
            ),
            401: 'Unauthorized - Authentication required',
            403: 'Forbidden - Only SYSTEM_ADMIN can access this endpoint',
        },
    )
    def get(self, request, *args, **kwargs):
        cache_key = self._get_cache_key(request.user.id)
        cached_response = cache.get(cache_key)
        if cached_response is not None:
            return cached_response
        
        response = super().get(request, *args, **kwargs)
        cache.set(cache_key, response, CACHE_TIMEOUT)
        return response
