import logging
from drf_yasg.utils import swagger_auto_schema
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework import status
from rest_framework.generics import ListAPIView, RetrieveAPIView, UpdateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import SocialWorker, Role, SystemAdmin
from accounts.serializers import (
    SocialWorkerCreateSerializer,
    SocialWorkerDetailSerializer,
    SocialWorkerUpdateSerializer,
)
from accounts.utils import IsOwnerOrSystemAdmin, IsSystemAdmin, cache_response, invalidate_cache, make_cache_key

logger = logging.getLogger(__name__)

_TAG = ['Social Workers']


class SocialWorkerCreateView(APIView):
    """
    POST /api/accounts/social-workers/
    Only SYSTEM_ADMIN can create a Social Worker account.
    The `enrolled_by` field is automatically set to the requesting system admin.
    """

    permission_classes = [IsAuthenticated, IsSystemAdmin]

    @swagger_auto_schema(
        tags=_TAG,
        request_body=SocialWorkerCreateSerializer,
        responses={201: SocialWorkerDetailSerializer},
        operation_description="Create a new Social Worker account. Only accessible by SYSTEM_ADMIN.",
    )
    @invalidate_cache(make_cache_key('social_worker_list'))
    def post(self, request):
        try:
            enrolled_by = request.user.systemadmin
        except Exception as e:
            logger.error(f"Error getting systemadmin profile: {e}", exc_info=True)
            return Response(
                {'detail': 'Requesting user does not have a SystemAdmin profile.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            serializer = SocialWorkerCreateSerializer(
                data=request.data,
                context={'enrolled_by': enrolled_by},
            )
            serializer.is_valid(raise_exception=True)
            social_worker = serializer.save()
            return Response(
                SocialWorkerDetailSerializer(social_worker).data,
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            logger.error(f"Error creating social worker: {type(e).__name__}: {e}", exc_info=True)
            return Response(
                {'error': f"Failed to create social worker: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class SocialWorkerListView(ListAPIView):
    """
    GET /api/accounts/social-workers/
    Accessible only by SYSTEM_ADMIN.
    
    Supports filtering, searching, and ordering via query parameters:
    - ?search=john (searches email, first_name, last_name, organization)
    - ?is_approved=true
    - ?region_assigned=Center
    - ?ordering=-created_at
    """

    queryset = SocialWorker.objects.select_related('user', 'enrolled_by__user').all().order_by('-user__created_at')
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

    @swagger_auto_schema(
        tags=_TAG,
        responses={200: SocialWorkerDetailSerializer(many=True)},
        operation_description="List Social Worker profiles with filtering and search support. Accessible only by SYSTEM_ADMIN.",
    )
    def get(self, request, *args, **kwargs):
        """List all social workers with filtering and search support."""
        return super().get(request, *args, **kwargs)


class SocialWorkerDetailView(RetrieveAPIView):
    """
    GET /api/accounts/social-workers/<id>/
    Accessible by the social worker themselves or a SYSTEM_ADMIN.
    """

    queryset = SocialWorker.objects.select_related('user', 'enrolled_by__user')
    serializer_class = SocialWorkerDetailSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrSystemAdmin]
    lookup_field = 'id'

    @swagger_auto_schema(
        tags=_TAG,
        responses={200: SocialWorkerDetailSerializer},
        operation_description="Retrieve a Social Worker profile. Accessible by the social worker or a SYSTEM_ADMIN.",
    )
    @cache_response(timeout=10 * 60)
    def get(self, request, *args, **kwargs):
        """Cache key includes the social worker ID."""
        return super().get(request, *args, **kwargs)


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

    @swagger_auto_schema(
        tags=_TAG,
        request_body=SocialWorkerUpdateSerializer,
        responses={200: SocialWorkerDetailSerializer},
        operation_description="Partially update a Social Worker profile. Accessible by the social worker or a SYSTEM_ADMIN.",
    )
    @invalidate_cache(make_cache_key('social_worker_list'))
    def patch(self, request, *args, **kwargs):
        """Invalidates the social worker list cache when a profile is updated."""
        return super().patch(request, *args, **kwargs)
