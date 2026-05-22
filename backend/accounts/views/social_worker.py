import logging
from drf_yasg.utils import swagger_auto_schema
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework import status, viewsets, mixins
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action

from accounts.models import SocialWorker
from accounts.serializers import (
    SocialWorkerCreateSerializer,
    SocialWorkerDetailSerializer,
    SocialWorkerUpdateSerializer,
    SocialWorkerDashboardSerializer,
)
from accounts.utils import IsOwnerOrSystemAdmin, IsSystemAdmin, cache_response, invalidate_cache, make_cache_key
from accounts.filters import SocialWorkerFilter
from beneficiaries.models import Beneficiary, HealthIssue
from vouchers.models.Voucher import Voucher

logger = logging.getLogger(__name__)

_TAG = ['Social Workers']

class SocialWorkerViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    """
    ViewSet for Social Worker management.
    
    Endpoints:
    - POST   /api/accounts/social-workers/          - Create social worker (SYSTEM_ADMIN only)
    - GET    /api/accounts/social-workers/          - List social workers (SYSTEM_ADMIN only)
    - GET    /api/accounts/social-workers/{id}/     - Get social worker details
    - PATCH  /api/accounts/social-workers/{id}/     - Update social worker
    """

    queryset = SocialWorker.objects.select_related('user', 'enrolled_by__user').all().order_by('-user__created_at')
    lookup_field = 'id'
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = SocialWorkerFilter
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'organization', 'region_assigned']
    ordering_fields = ['user__created_at']

    def get_permissions(self):
        """Set permissions based on action."""
        if self.action in ['create', 'list']:
            return [IsAuthenticated(), IsSystemAdmin()]
        elif self.action in ['retrieve', 'update', 'partial_update']:
            return [IsAuthenticated(), IsOwnerOrSystemAdmin()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return SocialWorkerCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return SocialWorkerUpdateSerializer
        return SocialWorkerDetailSerializer

    @swagger_auto_schema(
        tags=_TAG,
        responses={201: SocialWorkerDetailSerializer},
        operation_description="Create a new Social Worker account. Only accessible by SYSTEM_ADMIN.",
    )
    @invalidate_cache(make_cache_key('social_worker_list'))
    def create(self, request, *args, **kwargs):
        try:
            enrolled_by = request.user.systemadmin
        except Exception as e:
            logger.error(f"Error getting systemadmin profile: {e}", exc_info=True)
            return Response(
                {'detail': 'Requesting user does not have a SystemAdmin profile.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            serializer = self.get_serializer(
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

    @swagger_auto_schema(
        tags=_TAG,
        responses={200: SocialWorkerDetailSerializer(many=True)},
        operation_description="List Social Worker profiles with filtering and search support. Accessible only by SYSTEM_ADMIN.",
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=_TAG,
        responses={200: SocialWorkerDetailSerializer},
        operation_description="Retrieve a Social Worker profile. Accessible by the social worker or a SYSTEM_ADMIN.",
    )
    @cache_response(timeout=10 * 60)
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=_TAG,
        request_body=SocialWorkerUpdateSerializer,
        responses={200: SocialWorkerDetailSerializer},
        operation_description="Partially update a Social Worker profile. Accessible by the social worker or a SYSTEM_ADMIN.",
    )
    @invalidate_cache(make_cache_key('social_worker_list'))
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=_TAG,
        request_body=SocialWorkerUpdateSerializer,
        responses={200: SocialWorkerDetailSerializer},
        operation_description="Fully update a Social Worker profile. Accessible by the social worker or a SYSTEM_ADMIN.",
    )
    @invalidate_cache(make_cache_key('social_worker_list'))
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @action(
        detail=True,
        methods=["get"],
        permission_classes=[IsAuthenticated, IsOwnerOrSystemAdmin],
        url_path="dashboard",
    )
    @swagger_auto_schema(
        tags=["Dashboard"],
        operation_description="Get dashboard statistics for a social worker.",
        responses={200: SocialWorkerDashboardSerializer()},
    )
    def dashboard(self, request, id=None):
        social_worker = self.get_object()

        enrolled = Beneficiary.objects.filter(enrolled_by=social_worker).count()

        reported_health_issue_ids = HealthIssue.objects.filter(
            social_worker=social_worker
        ).values_list('id', flat=True)

        awaiting_match = HealthIssue.objects.filter(
            social_worker=social_worker,
        ).exclude(
            status__in=['ASSIGNED', 'IN_TREATMENT', 'RESOLVED'],
        ).exclude(
            id__in=Voucher.objects.filter(
                health_issue__isnull=False
            ).values_list('health_issue_id', flat=True),
        ).count()

        voucher_issued = Voucher.objects.filter(
            beneficiary__enrolled_by=social_worker,
        ).count()

        care_received = HealthIssue.objects.filter(
            social_worker=social_worker,
            status='RESOLVED',
        ).count()

        return Response({
            "enrolled": enrolled,
            "awaiting_match": awaiting_match,
            "voucher_issued": voucher_issued,
            "care_received": care_received,
        })
