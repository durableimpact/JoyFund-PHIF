from django.db.models import Q, Sum, F, DecimalField, Value, ExpressionWrapper
from django.db.models.functions import Coalesce
from django.core.cache import cache
from django_filters.rest_framework import DjangoFilterBackend
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework import status, viewsets
from rest_framework.generics import ListAPIView
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import AllowAny, BasePermission, IsAuthenticated
from rest_framework.response import Response

from accounts.models import Role
from campaigns.filters import CampaignFilter
from campaigns.models import Campaign
from campaigns.serializers import (
    CampaignCreateUpdateSerializer,
    CampaignDetailSerializer,
    CampaignBalanceSerializer,
)

_TAG = ["Campaigns"]
CACHE_TIMEOUT = 3 * 24 * 60 * 60  # 3 days


class IsDonor(BasePermission):
    message = "Only Donors can perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == Role.DONOR
        )


class CampaignOwnerOnly(BasePermission):
    message = "You can only manage your own campaigns."

    def has_object_permission(self, request, view, obj):
        try:
            return obj.donor_id == request.user.donor.id
        except Exception:
            return False


class IsSystemAdmin(BasePermission):
    message = "Only System Administrators can perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == Role.SYSTEM_ADMIN
        )


class CampaignViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing campaigns.
    - Public: list, retrieve (only active/public)
    - Donors: create, update, delete (own campaigns), my-campaigns
    """
    lookup_field = "pk"
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = CampaignFilter
    search_fields = ["title", "description"]
    ordering_fields = [
        "created_at",
        "goal_amount",
        "current_amount",
        "end_date",
        "title",
    ]
    ordering = ["-created_at"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        elif self.action == "create":
            return [IsAuthenticated(), IsDonor()]
        return [IsAuthenticated(), IsDonor(), CampaignOwnerOnly()]

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return CampaignCreateUpdateSerializer
        return CampaignDetailSerializer

    def get_queryset(self):
        # Handle schema generation for Swagger
        if getattr(self, "swagger_fake_view", False):
            return Campaign.objects.none()

        if self.action in ["update", "partial_update", "destroy"]:
            try:
                donor = self.request.user.donor
                return (
                    Campaign.objects.select_related("donor__user")
                    .filter(donor=donor)
                    .order_by("-created_at")
                )
            except Exception:
                return Campaign.objects.none()

        queryset = Campaign.objects.select_related("donor__user").all()
        if (
            self.request.user.is_authenticated
            and getattr(self.request.user, "role", None) == Role.DONOR
        ):
            try:
                donor = self.request.user.donor
                return queryset.filter(
                    Q(is_public=True, is_active=True) | Q(donor=donor)
                )
            except Exception:
                pass
        return queryset.filter(is_public=True, is_active=True)

    @swagger_auto_schema(
        tags=_TAG,
        responses={200: CampaignDetailSerializer(many=True)},
        operation_description="Public list of campaigns with filters. Donors also see their private campaigns.",
    )
    def list(self, request, *args, **kwargs):
        cache_key = 'campaign_list'
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data, status=status.HTTP_200_OK)

        response = super().list(request, *args, **kwargs)
        if response.status_code == 200:
            cache.set(cache_key, response.data, CACHE_TIMEOUT)
        return response

    @swagger_auto_schema(
        tags=_TAG,
        request_body=CampaignCreateUpdateSerializer,
        responses={201: CampaignDetailSerializer},
        operation_description="Create a campaign for the authenticated donor.",
    )
    def create(self, request, *args, **kwargs):
        try:
            donor = request.user.donor
        except Exception:
            return Response(
                {"detail": "Requesting user does not have a Donor profile."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        campaign = serializer.save(donor=donor)
        cache.delete('campaign_list')
        return Response(
            CampaignDetailSerializer(campaign).data, status=status.HTTP_201_CREATED
        )

    @swagger_auto_schema(
        tags=_TAG,
        responses={200: CampaignDetailSerializer},
        operation_description="Retrieve a campaign visible to the requester. Public for everyone; donors can also retrieve their own private campaigns.",
    )
    def retrieve(self, request, *args, **kwargs):
        campaign_id = kwargs.get("pk")
        cache_key = f"campaign_detail_{campaign_id}"
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data, status=status.HTTP_200_OK)

        response = super().retrieve(request, *args, **kwargs)
        if response.status_code == 200:
            cache.set(cache_key, response.data, CACHE_TIMEOUT)
        return response

    @swagger_auto_schema(
        tags=_TAG,
        request_body=CampaignCreateUpdateSerializer,
        responses={200: CampaignDetailSerializer},
        operation_description="Replace a donor-owned campaign.",
    )
    def update(self, request, *args, **kwargs):
        campaign_id = kwargs.get("pk")
        response = super().update(request, *args, **kwargs)
        cache.delete(f"campaign_detail_{campaign_id}")
        cache.delete('campaign_list')
        return response

    @swagger_auto_schema(
        tags=_TAG,
        request_body=CampaignCreateUpdateSerializer,
        responses={200: CampaignDetailSerializer},
        operation_description="Partially update a donor-owned campaign.",
    )
    def partial_update(self, request, *args, **kwargs):
        campaign_id = kwargs.get("pk")
        response = super().partial_update(request, *args, **kwargs)
        cache.delete(f"campaign_detail_{campaign_id}")
        cache.delete('campaign_list')
        return response

    @swagger_auto_schema(
        tags=_TAG,
        responses={204: "No Content"},
        operation_description="Delete a donor-owned campaign.",
    )
    def destroy(self, request, *args, **kwargs):
        campaign_id = kwargs.get("pk")
        response = super().destroy(request, *args, **kwargs)
        cache.delete('campaign_list')
        cache.delete(f"campaign_detail_{campaign_id}")
        return response

    @action(
        detail=False,
        methods=["get"],
        permission_classes=[IsAuthenticated, IsDonor],
        url_path="my-campaigns",
    )
    @swagger_auto_schema(
        tags=_TAG,
        responses={200: CampaignDetailSerializer(many=True)},
        operation_description="Get all campaigns belonging to the authenticated donor.",
    )
    def my_campaigns(self, request, *args, **kwargs):
        """Get campaigns of the authenticated donor"""
        try:
            donor = request.user.donor
            campaigns = (
                Campaign.objects.select_related("donor__user")
                .filter(donor=donor)
                .order_by("-created_at")
            )
            serializer = self.get_serializer(campaigns, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"detail": "Requesting user does not have a Donor profile."},
                status=status.HTTP_400_BAD_REQUEST,
            )


class CampaignAvailableBalanceListView(ListAPIView):
    """
    List active campaigns with their calculated available balances.
    Used by System Admins to find funding sources for vouchers.
    """

    permission_classes = [IsSystemAdmin]
    serializer_class = CampaignBalanceSerializer

    @swagger_auto_schema(
        tags=_TAG,
        manual_parameters=[
            openapi.Parameter(
                "min_amount",
                openapi.IN_QUERY,
                description="Filter campaigns with available balance >= this amount",
                type=openapi.TYPE_NUMBER,
                
            )
        ],
        operation_description="Returns a list of active campaigns and their currently available balance for allocation.",
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        min_amount = self.request.query_params.get("min_amount")
        try:
            threshold = Decimal(str(min_amount)) if min_amount else Decimal("0")
        except Exception:
            threshold = Decimal("0")

        return (
            Campaign.objects.annotate(
                available_balance=ExpressionWrapper(
                    Coalesce(
                        Sum(
                            "donations__net_amount",
                            filter=Q(donations__status="SUCCESS"),
                        ),
                        Value(0),
                    )
                    - F("total_disbursed")
                    - F("currently_allocated"),
                    output_field=DecimalField(max_digits=12, decimal_places=2),
                )
            )
            .filter(available_balance__gte=threshold, is_active=True)
            .order_by("-created_at")
        )
