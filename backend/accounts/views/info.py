from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import IsAuthenticated

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
        return super().get(request, *args, **kwargs)


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
        return super().get(request, *args, **kwargs)


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
        return super().get(request, *args, **kwargs)


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
        return super().get(request, *args, **kwargs)


class SystemAdminInfoView(RetrieveAPIView):
    """GET /api/accounts/system-admin/info/ - Only SYSTEM_ADMIN can access"""
    serializer_class = SystemAdminInfoSerializer
    permission_classes = [IsAuthenticated, IsSystemAdmin]

    def get_object(self):
        return self.request.user

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
        return super().get(request, *args, **kwargs)
