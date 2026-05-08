from django.core.cache import cache
from drf_yasg.utils import swagger_auto_schema
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework import status
from rest_framework.generics import ListAPIView, RetrieveAPIView, UpdateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import SocialWorker
from accounts.serializers import (
    SocialWorkerCreateSerializer,
    SocialWorkerDetailSerializer,
    SocialWorkerUpdateSerializer,
)
from accounts.utils import IsOwnerOrSystemAdmin, IsSystemAdmin

_TAG = ['Social Workers']
CACHE_TIMEOUT = 5 * 60  # 5 minutes


class SocialWorkerCreateView(APIView):
    """
    POST /api/accounts/social-workers/
    Only SYSTEM_ADMIN can create a Social Worker account.
    The `enrolled_by` field is automatically set to the requesting system admin.
    """

    permission_classes = [IsAuthenticated, IsSystemAdmin]

    @staticmethod
    def _invalidate_list_cache():
        """Invalidate social worker list cache"""
        cache.delete('social_worker_list')

    @swagger_auto_schema(
        tags=_TAG,
        request_body=SocialWorkerCreateSerializer,
        responses={201: SocialWorkerDetailSerializer},
        operation_description="Create a new Social Worker account. Only accessible by SYSTEM_ADMIN.",
    )
    def post(self, request):
        try:
            enrolled_by = request.user.systemadmin
        except Exception:
            return Response(
                {'detail': 'Requesting user does not have a SystemAdmin profile.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = SocialWorkerCreateSerializer(
            data=request.data,
            context={'enrolled_by': enrolled_by},
        )
        serializer.is_valid(raise_exception=True)
        social_worker = serializer.save()
        self._invalidate_list_cache()
        return Response(
            SocialWorkerDetailSerializer(social_worker).data,
            status=status.HTTP_201_CREATED,
        )


class SocialWorkerListView(ListAPIView):
    """
    GET /api/accounts/social-workers/list/
    Accessible only by SYSTEM_ADMIN.
    """

    queryset = SocialWorker.objects.select_related('user', 'enrolled_by__user').all().order_by('-user__date_joined')
    serializer_class = SocialWorkerDetailSerializer
    permission_classes = [IsAuthenticated, IsSystemAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = {
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
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'organization', 'region_assigned']
    ordering_fields = ['user__created_at']

    @staticmethod
    def _get_cache_key():
        """Get cache key for social worker list"""
        return 'social_worker_list'

    @swagger_auto_schema(
        tags=_TAG,
        responses={200: SocialWorkerDetailSerializer(many=True)},
        operation_description="List Social Worker profiles. Accessible only by SYSTEM_ADMIN.",
    )
    def get(self, request, *args, **kwargs):
        cache_key = self._get_cache_key()
        cached_response = cache.get(cache_key)
        if cached_response is not None:
            return cached_response
        
        response = super().get(request, *args, **kwargs)
        cache.set(cache_key, response, CACHE_TIMEOUT)
        return response


class SocialWorkerDetailView(RetrieveAPIView):
    """
    GET /api/accounts/social-workers/<id>/
    Accessible by the social worker themselves or a SYSTEM_ADMIN.
    """

    queryset = SocialWorker.objects.select_related('user', 'enrolled_by__user')
    serializer_class = SocialWorkerDetailSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrSystemAdmin]
    lookup_field = 'id'

    @staticmethod
    def _get_list_cache_key():
        """Get cache key for social worker list"""
        return 'social_worker_list'

    @staticmethod
    def _get_detail_cache_key(social_worker_id):
        """Get cache key for social worker detail"""
        return f'social_worker_detail_{social_worker_id}'

    @swagger_auto_schema(
        tags=_TAG,
        responses={200: SocialWorkerDetailSerializer},
        operation_description="Retrieve a Social Worker profile. Accessible by the social worker or a SYSTEM_ADMIN.",
    )
    def get(self, request, *args, **kwargs):
        social_worker_id = kwargs.get('id')
        cache_key = self._get_detail_cache_key(social_worker_id)
        cached_response = cache.get(cache_key)
        if cached_response is not None:
            return cached_response
        
        response = super().get(request, *args, **kwargs)
        cache.set(cache_key, response, CACHE_TIMEOUT)
        return response


class SocialWorkerUpdateView(UpdateAPIView):
    """
    PATCH /api/accounts/social-workers/<id>/
    Accessible by the social worker themselves or a SYSTEM_ADMIN.
    """

    queryset = SocialWorker.objects.select_related('user')
    serializer_class = SocialWorkerUpdateSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrSystemAdmin]
    lookup_field = 'id'
    http_method_names = ['patch', 'head', 'options']

    @staticmethod
    def _invalidate_list_cache():
        """Invalidate social worker list cache"""
        cache.delete('social_worker_list')

    @staticmethod
    def _invalidate_detail_cache(social_worker_id):
        """Invalidate social worker detail cache"""
        cache.delete(f'social_worker_detail_{social_worker_id}')

    @swagger_auto_schema(
        tags=_TAG,
        request_body=SocialWorkerUpdateSerializer,
        responses={200: SocialWorkerDetailSerializer},
        operation_description="Partially update a Social Worker profile. Accessible by the social worker or a SYSTEM_ADMIN.",
    )
    def patch(self, request, *args, **kwargs):
        social_worker_id = kwargs.get('id')
        response = super().patch(request, *args, **kwargs)
        self._invalidate_list_cache()
        self._invalidate_detail_cache(social_worker_id)
        return response
