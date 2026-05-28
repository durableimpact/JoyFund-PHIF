from drf_yasg.utils import swagger_auto_schema
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework import status, viewsets, mixins
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action

from accounts.models import SystemAdmin
from accounts.serializers import (
    SystemAdminCreateSerializer,
    SystemAdminDetailSerializer,
    SystemAdminUpdateSerializer,
    SystemAdminDashboardSerializer,
)
from accounts.utils import IsOwnerOrSystemAdmin, IsSystemAdmin, cache_response, invalidate_cache
from accounts.filters import SystemAdminFilter

_TAG = ['System Admins']


class SystemAdminViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    """
    ViewSet for System Admin management.
    
    Endpoints:
    - POST   /api/accounts/system-admins/          - Create system admin (SYSTEM_ADMIN only)
    - GET    /api/accounts/system-admins/          - List system admins (SYSTEM_ADMIN only)
    - GET    /api/accounts/system-admins/{id}/     - Get system admin details
    - PATCH  /api/accounts/system-admins/{id}/     - Update system admin (owner or SYSTEM_ADMIN)
    """

    queryset = SystemAdmin.objects.select_related('user').all().order_by('-user__created_at')
    lookup_field = 'id'
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = SystemAdminFilter
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    ordering_fields = ['user__created_at']

    def get_permissions(self):
        if self.action in ['create', 'list']:
            return [IsAuthenticated(), IsSystemAdmin()]
        elif self.action in ['retrieve']:
            return [IsAuthenticated(), IsOwnerOrSystemAdmin()]
        elif self.action in ['update', 'partial_update']:
            return [IsAuthenticated(), IsOwnerOrSystemAdmin()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'create':
            return SystemAdminCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return SystemAdminUpdateSerializer
        return SystemAdminDetailSerializer

    @swagger_auto_schema(
        tags=_TAG,
        responses={201: SystemAdminDetailSerializer},
        operation_description="Create a new System Admin account. Only accessible by existing SYSTEM_ADMIN.",
    )
    @invalidate_cache('system_admin_list')
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        system_admin = serializer.save()
        return Response(
            SystemAdminDetailSerializer(system_admin).data,
            status=status.HTTP_201_CREATED,
        )

    @swagger_auto_schema(
        tags=_TAG,
        responses={200: SystemAdminDetailSerializer(many=True)},
        operation_description="List System Admin profiles with filtering and search support. Only SYSTEM_ADMIN can list.",
    )
    @cache_response(timeout=5 * 60, key_prefix='system_admin_list')
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=_TAG,
        responses={200: SystemAdminDetailSerializer},
        operation_description="Retrieve a System Admin profile. Accessible by the admin or another SYSTEM_ADMIN.",
    )
    @cache_response(timeout=10 * 60, key_prefix='system_admin_detail')
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=_TAG,
        request_body=SystemAdminUpdateSerializer,
        responses={200: SystemAdminDetailSerializer},
        operation_description="Partially update a System Admin profile. Accessible by the admin or another SYSTEM_ADMIN.",
    )
    @invalidate_cache('system_admin_list')
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=_TAG,
        request_body=SystemAdminUpdateSerializer,
        responses={200: SystemAdminDetailSerializer},
        operation_description="Fully update a System Admin profile. Accessible by the admin or another SYSTEM_ADMIN.",
    )
    @invalidate_cache('system_admin_list')
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
        operation_description="Get dashboard statistics for a system admin.",
        responses={200: SystemAdminDashboardSerializer()},
    )
    def dashboard(self, request, id=None):
        from accounts.models import User, Donor
        from beneficiaries.models import Beneficiary
        from campaigns.models import Donation
        from django.db.models import Sum
        from hospitals.models import Hospital
        from payments.models.account import EscrowAccount, FeeAccount
        from payments.models.transaction import Transaction
        from vouchers.models.Voucher import Voucher

        system_admin = self.get_object()

        total_users = User.objects.count()
        total_hospitals = Hospital.objects.count()
        total_donors = Donor.objects.count()
        total_beneficiaries = Beneficiary.objects.count()

        total_donations = float(Donation.objects.aggregate(total=Sum('amount'))['total'] or 0)

        total_vouchers_issued = Voucher.objects.count()
        total_vouchers_redeemed = Voucher.objects.filter(status=Voucher.Status.USED).count()

        pending_claims = Voucher.objects.filter(status=Voucher.Status.PENDING_CONFIRMATION).count()

        escrow = EscrowAccount.get_instance()
        escrow_balance = float(escrow.balance or 0)

        return Response({
            "total_users": total_users,
            "total_hospitals": total_hospitals,
            "total_donors": total_donors,
            "total_beneficiaries": total_beneficiaries,
            "total_donations": total_donations,
            "total_vouchers_issued": total_vouchers_issued,
            "total_vouchers_redeemed": total_vouchers_redeemed,
            "pending_claims": pending_claims,
            "escrow_balance": escrow_balance,
        })
