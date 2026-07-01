import hashlib

from accounts.models import Role
from django.core.cache import cache
from django.db.models import Count, DecimalField, ExpressionWrapper, F, Q, Sum, Value
from django.db.models.functions import Coalesce
from django.utils import timezone
from datetime import timedelta
from django_filters.rest_framework import DjangoFilterBackend
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny, BasePermission, IsAuthenticated
from rest_framework.response import Response

from campaigns.filters import CampaignFilter
from campaigns.models import Campaign, CampaignView
from campaigns.serializers import (
    CampaignBalanceSerializer,
    CampaignCreateUpdateSerializer,
    CampaignDetailSerializer,
    CampaignListSerializer,
)

_TAG = ["Campaigns"]


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


from core.mixins import CacheInvalidationMixin


class CampaignViewSet(CacheInvalidationMixin, viewsets.ModelViewSet):
    cache_group = "campaigns"
    cache_timeout = 60
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
        if self.action in ["list", "retrieve", "leaderboard", "track_view"]:
            return [AllowAny()]
        elif self.action == "create":
            return [IsAuthenticated(), IsDonor()]
        elif self.action == "analytics":
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsDonor(), CampaignOwnerOnly()]

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return CampaignCreateUpdateSerializer
        elif self.action in ["list", "my_campaigns"]:
            return CampaignListSerializer
        return CampaignDetailSerializer

    @swagger_auto_schema(tags=_TAG)
    def list(self, request, *args, **kwargs):
        def _list(request, *args, **kwargs):
            queryset = self.filter_queryset(self.get_queryset()).annotate(
                total_net_raised_calc=Coalesce(
                    Sum(
                        "donations__net_amount",
                        filter=Q(donations__status="SUCCESS"),
                    ),
                    Value(
                        0, output_field=DecimalField(max_digits=12, decimal_places=2)
                    ),
                ),
                total_number_of_successfull_donations_calc=Coalesce(
                    Count("donations", filter=Q(donations__status="SUCCESS")),
                    Value(0),
                ),
            )
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)

        return self._cached_action(_list, request, *args, **kwargs)

    @swagger_auto_schema(tags=_TAG)
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @swagger_auto_schema(tags=_TAG)
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @swagger_auto_schema(tags=_TAG)
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @swagger_auto_schema(tags=_TAG)
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

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

        return Campaign.objects.select_related("donor__user").all()

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
        self._invalidate_cache()
        return Response(
            CampaignDetailSerializer(campaign).data, status=status.HTTP_201_CREATED
        )

    @action(
        detail=False,
        methods=["get"],
        permission_classes=[AllowAny],
        url_path="leaderboard",
    )
    @swagger_auto_schema(
        tags=_TAG,
        responses={200: CampaignDetailSerializer(many=True)},
        operation_description="Get public campaigns sorted by total net raised (leaderboard).",
    )
    def leaderboard(self, request, *args, **kwargs):
        """
        Get campaigns sorted by total net raised.Campaign
        """
        queryset = (
            Campaign.objects.select_related("donor__user")
            .annotate(
                total_net_raised_calc=Coalesce(
                    Sum(
                        "donations__net_amount",
                        filter=Q(donations__status="SUCCESS"),
                    ),
                    Value(
                        0, output_field=DecimalField(max_digits=12, decimal_places=2)
                    ),
                )
            )
            .filter(is_public=True, is_active=True)
            .order_by("-total_net_raised_calc")
        )

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

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


    @action(
        detail=True,
        methods=["get"],
        url_path="certificate",
    )
    @swagger_auto_schema(
        tags=_TAG,
        operation_description="Download the impact certificate PDF for this campaign.",
    )
    def download_certificate(self, request, pk=None):
        """Download the impact certificate PDF for the campaign owner."""
        campaign = self.get_object()
        if not campaign.certificate_file:
            return Response(
                {"detail": "No certificate available for this campaign."},
                status=status.HTTP_404_NOT_FOUND,
            )
        from django.http import FileResponse
        return FileResponse(
            campaign.certificate_file.open("rb"),
            as_attachment=True,
            filename=f"{campaign.slug}_impact_certificate.pdf",
            content_type="application/pdf",
        )

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[AllowAny],
        url_path="track-view",
    )
    @swagger_auto_schema(
        tags=_TAG,
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=["source"],
            properties={
                "source": openapi.Schema(
                    type=openapi.TYPE_STRING,
                    enum=["push", "social", "google", "email", "direct", "other"],
                    description="Traffic source",
                ),
                "referrer": openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description="Raw HTTP referer (optional)",
                ),
            },
        ),
        responses={200: "View tracked"},
        operation_description="Track a campaign page view with source attribution. Idempotent per visitor per 24h.",
    )
    def track_view(self, request, pk=None):
        campaign = self.get_object()
        source = request.data.get("source", "direct")
        referrer = request.data.get("referrer", "")

        # Validate source
        valid_sources = [c[0] for c in CampaignView.Source.choices]
        if source not in valid_sources:
            source = "other"

        # Compute visitor hash from IP + user-agent
        from accounts.middleware import _get_client_ip
        ip = _get_client_ip(request)
        ua = request.META.get("HTTP_USER_AGENT", "")
        visitor_hash = hashlib.sha256(f"{ip}:{ua}".encode()).hexdigest()

        # Always store the view (full history)
        CampaignView.objects.create(
            campaign=campaign,
            source=source,
            visitor_hash=visitor_hash,
            referrer=referrer,
        )

        # Count unique views (distinct visitor_hash in last 24h)
        one_day_ago = timezone.now() - timedelta(hours=24)
        qs = CampaignView.objects.filter(
            campaign=campaign,
            created_at__gte=one_day_ago,
        )
        total_views = qs.count()
        unique_views = qs.values("visitor_hash").distinct().count()

        return Response({
            "total_views": total_views,
            "unique_views": unique_views,
        })

    @action(
        detail=True,
        methods=["get"],
        permission_classes=[IsAuthenticated],
        url_path="analytics",
    )
    @swagger_auto_schema(
        tags=_TAG,
        responses={200: "Campaign analytics"},
        operation_description="Get campaign view analytics (owner or system admin only).",
    )
    def analytics(self, request, pk=None):
        campaign = self.get_object()

        # Only owner or system admin can view analytics
        is_owner = False
        try:
            is_owner = campaign.donor_id == request.user.donor.id
        except Exception:
            pass
        is_admin = request.user.role == Role.SYSTEM_ADMIN
        if not is_owner and not is_admin:
            return Response(
                {"detail": "You do not have permission to view analytics."},
                status=status.HTTP_403_FORBIDDEN,
            )

        one_day_ago = timezone.now() - timedelta(hours=24)
        qs = CampaignView.objects.filter(
            campaign=campaign,
            created_at__gte=one_day_ago,
        )

        total_views = qs.count()
        unique_views = qs.values("visitor_hash").distinct().count()

        # Source breakdown (unique per source)
        source_data = (
            qs.values("source")
            .annotate(
                total=Count("id"),
                unique=Count("visitor_hash", distinct=True),
            )
            .order_by("-unique")
        )

        sources = {item["source"]: {"total": item["total"], "unique": item["unique"]} for item in source_data}

        return Response({
            "total_views": total_views,
            "unique_views": unique_views,
            "sources": sources,
        })


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
