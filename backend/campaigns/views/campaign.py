import hashlib

from accounts.models import Role
from django.core.cache import cache
from django.db.models import Count, DecimalField, ExpressionWrapper, F, Q, Sum, Value
from django.db.models.functions import Coalesce, TruncDate, TruncWeek, TruncMonth
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
            .filter(is_public=True, is_active=True, total_net_raised_calc__gt=0)
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
        manual_parameters=[
            openapi.Parameter(
                "period", openapi.IN_QUERY,
                description="Grouping period: day, week, month",
                type=openapi.TYPE_STRING, enum=["day", "week", "month"],
            ),
            openapi.Parameter(
                "start_date", openapi.IN_QUERY,
                description="Start date (YYYY-MM-DD). Defaults to campaign creation date.",
                type=openapi.TYPE_STRING,
            ),
            openapi.Parameter(
                "end_date", openapi.IN_QUERY,
                description="End date (YYYY-MM-DD). Defaults to today.",
                type=openapi.TYPE_STRING,
            ),
            openapi.Parameter(
                "source", openapi.IN_QUERY,
                description="Filter by source: push, social, google, email, direct, other",
                type=openapi.TYPE_STRING,
            ),
        ],
        responses={200: "Campaign analytics"},
        operation_description="Get campaign view analytics with daily/weekly/monthly breakdown. Owner or system admin only.",
    )
    def analytics(self, request, pk=None):
        from datetime import datetime, timedelta
        from collections import OrderedDict

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

        # Parse params
        period = request.query_params.get("period", "day")
        if period not in ("day", "week", "month"):
            period = "day"

        source_filter = request.query_params.get("source")
        valid_sources = [c[0] for c in CampaignView.Source.choices]
        if source_filter and source_filter not in valid_sources:
            source_filter = None

        # Date range: default to campaign creation → today
        today = timezone.now().date()
        try:
            start_date = datetime.strptime(
                request.query_params.get("start_date", ""), "%Y-%m-%d"
            ).date()
        except (ValueError, TypeError):
            start_date = campaign.created_at.date() if campaign.created_at else today

        try:
            end_date = datetime.strptime(
                request.query_params.get("end_date", ""), "%Y-%m-%d"
            ).date()
        except (ValueError, TypeError):
            end_date = today

        # Ensure start <= end
        if start_date > end_date:
            start_date, end_date = end_date, start_date

        # Build the base queryset
        qs = CampaignView.objects.filter(
            campaign=campaign,
            created_at__date__gte=start_date,
            created_at__date__lte=end_date,
        )
        if source_filter:
            qs = qs.filter(source=source_filter)

        # ── Build period labels (every day/week/month, even if empty) ──
        period_labels = []
        if period == "day":
            current = start_date
            while current <= end_date:
                period_labels.append(current.isoformat())
                current += timedelta(days=1)
        elif period == "week":
            # Align to start of week (Monday)
            current = start_date - timedelta(days=start_date.weekday())
            end_aligned = end_date + timedelta(days=(6 - end_date.weekday()))
            while current <= end_aligned:
                label = f"{current.isoformat()}"
                period_labels.append(label)
                current += timedelta(weeks=1)
        elif period == "month":
            current = start_date.replace(day=1)
            while current <= end_date:
                label = current.strftime("%Y-%m")
                if label not in period_labels:
                    period_labels.append(label)
                if current.month == 12:
                    current = current.replace(year=current.year + 1, month=1)
                else:
                    current = current.replace(month=current.month + 1)

        # ── Truncate created_at to the period bucket ──
        if period == "day":
            trunc_expr = TruncDate("created_at")
        elif period == "week":
            trunc_expr = TruncWeek("created_at")
        else:
            trunc_expr = TruncMonth("created_at")

        # ── Aggregate views per period ──
        view_data = (
            qs.annotate(period=trunc_expr)
            .values("period")
            .annotate(
                total=Count("id"),
                unique=Count("visitor_hash", distinct=True),
            )
            .order_by("period")
        )

        # Map DB results into a dict keyed by period label
        view_map = {}
        for row in view_data:
            p = row["period"]
            if period == "day":
                key = p.isoformat() if hasattr(p, "isoformat") else str(p)
            elif period == "week":
                key = p.isoformat() if hasattr(p, "isoformat") else str(p)
            else:
                key = p.strftime("%Y-%m") if hasattr(p, "strftime") else str(p)
            view_map[key] = {"total": row["total"], "unique": row["unique"]}

        # ── Aggregate per source per period ──
        source_period_data = (
            qs.annotate(period=trunc_expr)
            .values("period", "source")
            .annotate(
                total=Count("id"),
                unique=Count("visitor_hash", distinct=True),
            )
            .order_by("period", "source")
        )

        source_period_map = {}
        for row in source_period_data:
            p = row["period"]
            if period == "day":
                key = p.isoformat() if hasattr(p, "isoformat") else str(p)
            elif period == "week":
                key = p.isoformat() if hasattr(p, "isoformat") else str(p)
            else:
                key = p.strftime("%Y-%m") if hasattr(p, "strftime") else str(p)

            src = row["source"]
            if key not in source_period_map:
                source_period_map[key] = {}
            source_period_map[key][src] = {"total": row["total"], "unique": row["unique"]}

        # ── Fill gaps: every period gets 0s where no data exists ──
        timeline = []
        for label in period_labels:
            view_stats = view_map.get(label, {"total": 0, "unique": 0})
            sources_breakdown = {}
            for src_key in [c[0] for c in CampaignView.Source.choices]:
                sources_breakdown[src_key] = source_period_map.get(label, {}).get(
                    src_key, {"total": 0, "unique": 0}
                )
            timeline.append({
                "period": label,
                "total": view_stats["total"],
                "unique": view_stats["unique"],
                "sources": sources_breakdown,
            })

        # ── Overall totals ──
        total_views = qs.count()
        unique_views = qs.values("visitor_hash").distinct().count()

        # ── Overall source breakdown ──
        source_totals = (
            qs.values("source")
            .annotate(
                total=Count("id"),
                unique=Count("visitor_hash", distinct=True),
            )
            .order_by("-unique")
        )
        sources = {
            item["source"]: {"total": item["total"], "unique": item["unique"]}
            for item in source_totals
        }

        return Response({
            "campaign_id": str(campaign.id),
            "total_views": total_views,
            "unique_views": unique_views,
            "sources": sources,
            "period": period,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "timeline": timeline,
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
