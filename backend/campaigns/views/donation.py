from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.core.cache import cache
from django.db.models import Q, Sum, Count, F
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from accounts.models import Role
from accounts.utils.cache import cache_response, invalidate_cache
from campaigns.filters import DonationFilter
from campaigns.models import Campaign, Donation, Payment
from campaigns.serializers import (
    DonationCreateSerializer,
    DonationDetailSerializer,
    DonationListSerializer,
)
from logs.services import LogService
from utils.campay import CamPayManager

_TAG = ['Donations']
CACHE_TIMEOUT = 30


class NestedDonationViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """
    ViewSet for managing donations nested under a campaign.
    - GET /api/campaigns/<campaign_id>/donations/ - List donations for a campaign
    - GET /api/campaigns/<campaign_id>/donations/<id>/ - Get a specific donation
    """
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = DonationFilter
    search_fields = ['donor_name', 'message']
    ordering_fields = ['amount', 'created_at']
    ordering = ['-created_at']

    serializer_class = DonationDetailSerializer

    @staticmethod
    def _get_list_cache_key(campaign_id):
        """Get cache key for donations list under a campaign"""
        return f'donation_list_campaign_{campaign_id}'

    @staticmethod
    def _get_detail_cache_key(donation_id):
        """Get cache key for donation detail"""
        return f'donation_detail_{donation_id}'

    @staticmethod
    def _invalidate_campaign_donations_list(campaign_id):
        """Invalidate donations list cache for a campaign"""
        cache.delete(NestedDonationViewSet._get_list_cache_key(campaign_id))

    @staticmethod
    def _invalidate_detail_cache(donation_id):
        """Invalidate specific donation detail cache"""
        cache.delete(NestedDonationViewSet._get_detail_cache_key(donation_id))

    def _get_campaign(self):
        # Handle schema generation for Swagger - return empty queryset
        if getattr(self, 'swagger_fake_view', False):
            return None
        
        queryset = Campaign.objects.select_related('donor__user').all()
        if self.request.user.is_authenticated and getattr(self.request.user, 'role', None) == Role.DONOR:
            try:
                donor = self.request.user.donor
                queryset = queryset.filter(Q(is_public=True, is_active=True) | Q(donor=donor))
            except Exception:
                queryset = queryset.filter(is_public=True, is_active=True)
        else:
            queryset = queryset.filter(is_public=True, is_active=True)
        return get_object_or_404(queryset, id=self.kwargs['campaign_pk'])

    def get_queryset(self):
        # Handle schema generation for Swagger
        if getattr(self, 'swagger_fake_view', False):
            return Donation.objects.none()
        
        campaign = self._get_campaign()
        return Donation.objects.select_related('campaign', 'donor__user').filter(
            campaign=campaign
        )

    @swagger_auto_schema(
        tags=_TAG,
        responses={200: DonationDetailSerializer(many=True)},
        operation_description='List donations for a specific campaign with filters.',
    )
    def list(self, request, *args, **kwargs):
        campaign_id = self.kwargs.get('campaign_pk')
        # Only cache unfiltered results to avoid cache conflicts with filters
        has_filters = bool(request.GET)
        
        if not has_filters:
            cache_key = self._get_list_cache_key(campaign_id)
            cached_data = cache.get(cache_key)
            if cached_data is not None:
                return Response(cached_data, status=status.HTTP_200_OK)
        
        response = super().list(request, *args, **kwargs)
        if response.status_code == 200 and not has_filters:
            cache_key = self._get_list_cache_key(campaign_id)
            cache.set(cache_key, response.data, CACHE_TIMEOUT)
        return response

    @swagger_auto_schema(
        tags=_TAG,
        responses={200: DonationDetailSerializer},
        operation_description='Retrieve a specific donation from a campaign.',
    )
    def retrieve(self, request, *args, **kwargs):
        donation_id = kwargs.get('pk')
        cache_key = self._get_detail_cache_key(donation_id)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data, status=status.HTTP_200_OK)
        
        response = super().retrieve(request, *args, **kwargs)
        if response.status_code == 200:
            cache.set(cache_key, response.data, CACHE_TIMEOUT)
        return response

    @action(detail=False, methods=['get'], url_path='chart')
    @swagger_auto_schema(
        tags=_TAG,
        manual_parameters=[
            openapi.Parameter(
                'period',
                openapi.IN_QUERY,
                description='Time period: 7d, 30d, 90d, 1y, all',
                type=openapi.TYPE_STRING,
                enum=['7d', '30d', '90d', '1y', 'all'],
                default='30d',
            ),
        ],
        operation_description='Donation chart data for a campaign, grouped by day/week/month.',
    )
    def chart(self, request, *args, **kwargs):
        from datetime import datetime, date
        from collections import OrderedDict

        campaign_id = self.kwargs.get('campaign_pk')
        period = request.query_params.get('period', '30d')

        now = timezone.now()
        period_map = {
            '7d': timedelta(days=7),
            '30d': timedelta(days=30),
            '90d': timedelta(days=90),
            '1y': timedelta(days=365),
        }

        cache_key = f'donation_chart_{campaign_id}_{period}'
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached, status=status.HTTP_200_OK)

        donations = Donation.objects.filter(
            campaign_id=campaign_id,
            status='SUCCESS',
        )

        # Determine date range and truncation
        if period == '1y':
            trunc_fn = TruncWeek
            if period in period_map:
                start_date = (now - period_map[period]).date()
            else:
                start_date = donations.order_by('created_at').values_list('created_at', flat=True).first()
                start_date = start_date.date() if start_date else now.date()
            end_date = now.date()
            # Build all weeks
            full_range = OrderedDict()
            cursor = start_date
            while cursor <= end_date:
                key = cursor.strftime('%Y-W%W')
                full_range[key] = {'date': cursor, 'total_amount': Decimal('0'), 'count': 0}
                cursor += timedelta(weeks=1)
        elif period == 'all':
            trunc_fn = TruncMonth
            first = donations.order_by('created_at').values_list('created_at', flat=True).first()
            start_date = first.date() if first else now.date()
            end_date = now.date()
            full_range = OrderedDict()
            cursor = start_date.replace(day=1)
            while cursor <= end_date:
                key = cursor.strftime('%Y-%m')
                full_range[key] = {'date': cursor, 'total_amount': Decimal('0'), 'count': 0}
                # Move to next month
                if cursor.month == 12:
                    cursor = cursor.replace(year=cursor.year + 1, month=1)
                else:
                    cursor = cursor.replace(month=cursor.month + 1)
        else:
            trunc_fn = TruncDate
            if period in period_map:
                start_date = (now - period_map[period]).date()
            else:
                start_date = now.date() - timedelta(days=30)
            end_date = now.date()
            full_range = OrderedDict()
            cursor = start_date
            while cursor <= end_date:
                key = cursor.strftime('%Y-%m-%d')
                full_range[key] = {'date': cursor, 'total_amount': Decimal('0'), 'count': 0}
                cursor += timedelta(days=1)

        if period in period_map:
            donations = donations.filter(created_at__gte=now - period_map[period])

        daily = (
            donations
            .annotate(date=trunc_fn('created_at'))
            .values('date')
            .annotate(
                total_amount=Sum('amount'),
                count=Count('id'),
            )
            .order_by('date')
        )

        # Merge DB results into the full range
        for entry in daily:
            dt = entry['date']
            if period == '1y':
                key = dt.strftime('%Y-W%W')
            elif period == 'all':
                key = dt.strftime('%Y-%m')
            else:
                key = dt.strftime('%Y-%m-%d')
            if key in full_range:
                full_range[key]['total_amount'] = entry['total_amount'] or Decimal('0')
                full_range[key]['count'] = entry['count']

        series = [
            {
                'date': v['date'].strftime('%Y-%m-%d'),
                'total_amount': str(v['total_amount']),
                'count': v['count'],
            }
            for v in full_range.values()
        ]

        totals = donations.aggregate(
            total_amount=Sum('amount'),
            total_count=Count('id'),
        )

        result = {
            'period': period,
            'series': series,
            'totals': {
                'amount': str(totals['total_amount'] or Decimal('0')),
                'count': totals['total_count'],
            },
        }

        cache.set(cache_key, result, CACHE_TIMEOUT)
        return Response(result, status=status.HTTP_200_OK)


class DonationViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """
    System-wide donations endpoint — designed for the landing page.

    - GET /api/campaigns/donations/           — List all donations (lightweight)
    - GET /api/campaigns/donations/{id}/      — Retrieve a single donation (full detail)
    - GET /api/campaigns/donations/recent/    — Donations from the last 30 minutes
    - GET /api/campaigns/donations/my-donations/ — Authenticated donor's own donations

    Filtering / search / ordering are supported on the list endpoint.
    """
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = DonationFilter
    search_fields = ['donor_name', 'message', 'campaign__title']
    ordering_fields = ['amount', 'created_at', 'campaign__title']
    ordering = ['-created_at']

    serializer_class = DonationListSerializer

    RECENT_CACHE_TIMEOUT = 60  # 1 minute — polled frequently from the landing page

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return DonationDetailSerializer
        return DonationListSerializer

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Donation.objects.none()

        return Donation.objects.select_related(
            'campaign',
            'donor__user',
        ).order_by('-created_at')

    # ------------------------------------------------------------------
    # list
    # ------------------------------------------------------------------
    @swagger_auto_schema(
        tags=_TAG,
        operation_description='List all donations in the system (lightweight, for the landing page).',
    )
    def list(self, request, *args, **kwargs):
        cache_key = self._get_list_cache_key()
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data, status=status.HTTP_200_OK)

        response = super().list(request, *args, **kwargs)
        if response.status_code == 200:
            cache.set(cache_key, response.data, CACHE_TIMEOUT)
        return response

    # ------------------------------------------------------------------
    # retrieve (full detail — payment + events)
    # ------------------------------------------------------------------
    @swagger_auto_schema(
        tags=_TAG,
        operation_description='Retrieve a single donation with full detail (payment, events).',
    )
    @cache_response(timeout=CACHE_TIMEOUT, key_prefix="donation")
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    # ------------------------------------------------------------------
    # recent — GET /api/campaigns/donations/recent/?minutes=30
    # ------------------------------------------------------------------
    @action(detail=False, methods=['get'], url_path='recent')
    @swagger_auto_schema(
        tags=_TAG,
        operation_description='Returns donations created within the last N minutes (default 30). '
                              'Use ?minutes=N to customise.',
    )
    def recent(self, request, *args, **kwargs):
        try:
            minutes = int(request.query_params.get('minutes', 30))
        except (ValueError, TypeError):
            minutes = 30

        cutoff = timezone.now() - timedelta(minutes=minutes)

        cache_key = f'donation_recent_{minutes}'
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data, status=status.HTTP_200_OK)

        queryset = self.get_queryset().filter(created_at__gte=cutoff)
        queryset = self.filter_queryset(queryset)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = DonationListSerializer(page, many=True)
            paginated = self.get_paginated_response(serializer.data)
            cache.set(cache_key, paginated.data, self.RECENT_CACHE_TIMEOUT)
            return paginated

        serializer = DonationListSerializer(queryset, many=True)
        data = serializer.data
        cache.set(cache_key, data, self.RECENT_CACHE_TIMEOUT)
        return Response(data, status=status.HTTP_200_OK)

    # ------------------------------------------------------------------
    # my-donations — GET /api/campaigns/donations/my-donations/
    # ------------------------------------------------------------------
    @action(
        detail=False,
        methods=['get'],
        permission_classes=[IsAuthenticated],
        url_path='my-donations',
    )
    @swagger_auto_schema(
        tags=_TAG,
        operation_description='Get all donations made by the authenticated donor.',
    )
    @cache_response(timeout=5 * 60, key_prefix="donation")
    def my_donations(self, request, *args, **kwargs):
        """Get all donations made by the authenticated donor"""
        try:
            donor = request.user.donor
        except Exception:
            return Response(
                {'detail': 'Requesting user does not have a Donor profile.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        LogService.info(
            request,
            'donation.view_my_donations',
            user=request.user,
            description='Donor viewed their donation history',
            metadata={'donor_id': str(donor.id)},
        )

        donations = Donation.objects.select_related(
            'campaign',
            'donor__user',
        ).filter(donor=donor).order_by('-created_at')

        queryset = self.filter_queryset(donations)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = DonationListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = DonationListSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # ------------------------------------------------------------------
    # helpers
    # ------------------------------------------------------------------
    @staticmethod
    def _get_list_cache_key():
        return 'donation_list_all'


class DonationCreateViewSet(viewsets.GenericViewSet):
    """
    ViewSet for creating donations under a campaign.
    - POST /api/campaigns/<campaign_id>/donate/ - Create a donation and initiate payment
    """
    permission_classes = [AllowAny]
    serializer_class = DonationCreateSerializer

    @swagger_auto_schema(
        tags=_TAG,
        request_body=DonationCreateSerializer,
        responses={
            201: openapi.Response(
                description='Donation created successfully with payment link',
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'payment_link': openapi.Schema(
                            type=openapi.TYPE_STRING,
                            description='CamPay payment link URL for completing the donation'
                        )
                    }
                )
            ),
            400: openapi.Response(description='Invalid input or payment service error'),
            404: openapi.Response(description='Campaign not found'),
        },
        operation_description='Create a donation for a campaign and initiate CamPay payment. Returns a payment link for the user to complete payment.',
    )
    def create(self, request, *args, **kwargs):
        """Create a donation for a campaign and initiate CamPay payment"""
        try:
            campaign_id = self.kwargs['campaign_pk']
            try:
                campaign = Campaign.objects.get(id=campaign_id)
            except Campaign.DoesNotExist:
                return Response({'error': 'Campaign not found'}, status=status.HTTP_404_NOT_FOUND)

            donor = None
            if request.user.is_authenticated and getattr(request.user, 'role', None) == Role.DONOR:
                try:
                    donor = request.user.donor
                except Exception:
                    donor = None

            serializer = self.get_serializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            validated_data = serializer.validated_data

            payment_method = validated_data['payment_method']
            phone_number = validated_data.get('phone_number', '')
            success_url = validated_data['success_url']
            failure_url = validated_data['failure_url']
            donor_name = validated_data.get('donor_name', '')
            amount = validated_data['amount']
            message = validated_data.get('message', '')
            is_anonymous = validated_data.get('is_anonymous', False)

            normalized_phone = ''
            if phone_number:
                normalized_phone = phone_number.replace('+', '').replace(' ', '').replace('-', '')
                if normalized_phone.startswith('0') and len(normalized_phone) == 10:
                    normalized_phone = normalized_phone[1:]
                if len(normalized_phone) == 9:
                    normalized_phone = f'237{normalized_phone}'

            if payment_method != 'BANK':
                if not phone_number or not (normalized_phone.startswith('237') and len(normalized_phone) == 12):
                    return Response(
                        {'error': 'Invalid Cameroon phone number format. Use 237XXXXXXXXX or local 9-digit format.'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            payment_method = payment_method.strip().upper()
            if payment_method in ['MTN_MOMO', 'MTN']:
                payment_method = 'MTN'
                campay_payment_options = "MOMO,CARD"
            elif payment_method in ['ORANGE_MONEY', 'ORANGE']:
                payment_method = 'ORANGE'
                campay_payment_options = "MOMO,CARD"
            elif payment_method in ['BANK', 'BANK_TRANSFER']:
                payment_method = 'BANK'
                campay_payment_options = "BANK"
            else:
                return Response(
                    {'error': 'Unsupported payment method. Use MTN, ORANGE, or BANK.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Create payment record
            # app_amount set equal to amount as placeholder; webhook will update it with the actual net amount
            payment = Payment.objects.create(
                payment_method=payment_method,
                phone_number=normalized_phone,
                amount=amount,
                app_amount=amount,
            )

            # Determine donor name for donation records
            donor_name = validated_data.get('donor_name', '').strip()
            donor_display_name = 'Anonymous'
            if not is_anonymous:
                if donor:
                    donor_display_name = ' '.join(
                        part for part in [donor.user.first_name, donor.user.last_name] if part
                    ).strip() or donor.user.email or 'Anonymous'
                else:
                    donor_display_name = donor_name or 'Anonymous'

            # Create donation
            donation = Donation.objects.create(
                donor=donor,
                campaign=campaign,
                donor_name=donor_display_name,
                amount=amount,
                message=message,
                is_anonymous=is_anonymous,
                payment=payment,
            )

            # Check demo mode limits
            if settings.CAMPAY_ENVIRONMENT == "DEV" and float(amount) > 25.00:
                return Response(
                    {'error': 'In demo mode, maximum amount is limited to 25.00 XAF'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Initialize CamPay payment
            campay = CamPayManager(
                app_username=settings.CAMPAY_APP_USERNAME,
                app_password=settings.CAMPAY_APP_PASSWORD,
                environment=settings.CAMPAY_ENVIRONMENT,
            )

            description = f"Donate {amount} XAF for {campaign.title}"

            try:
                payment_link = campay.create_payment_link(
                    amount=str(amount),
                    description=description,
                    external_reference=str(donation.id),
                    redirect_url=success_url,
                    failure_redirect_url=failure_url,
                    first_name=donor.user.first_name if donor else None,
                    last_name=donor.user.last_name if donor else None,
                    email=donor.user.email if donor else None,
                    phone=normalized_phone if payment_method != 'BANK' else None,
                    payment_options=campay_payment_options
                )
                
                # Invalidate all relevant caches after successful donation creation
                NestedDonationViewSet._invalidate_campaign_donations_list(campaign_id)
                # Invalidate top-level donations list (system-wide donations view)
                cache.delete("donation_list_all")
                # Invalidate recent donations caches (keyed by minutes param)
                cache.delete("donation_recent_30")
                cache.delete("donation_recent_60")
                # Invalidate campaign detail cache (since donated amount increased)
                cache.delete(f"campaign_detail_{campaign_id}")
                # Invalidate campaigns list cache
                cache.delete("campaign_list")
                
                return Response(
                    {'payment_link': payment_link['link']},
                    status=status.HTTP_201_CREATED
                )

            except Exception as campay_error:
                print(f"CamPay Error: {str(campay_error)}")
                error_message = campay_error['message'] if isinstance(campay_error, dict) and 'message' in campay_error else str(campay_error)
                return Response(
                    {'error': f"Payment service error: {error_message}", 'campay_error': True},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
