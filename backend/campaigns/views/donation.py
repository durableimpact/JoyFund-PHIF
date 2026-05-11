from django.conf import settings
from django.core.cache import cache
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from drf_yasg.utils import swagger_auto_schema
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from accounts.models import Role
from campaigns.filters import DonationFilter
from campaigns.models import Campaign, Donation, Payment
from campaigns.serializers import DonationCreateSerializer, DonationDetailSerializer
from logs.services import LogService
from utils.campay import CamPayManager

_TAG = ['Campaign Donations']
CACHE_TIMEOUT = 3 * 24 * 60 * 60  # 3 days


class DonationViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """
    ViewSet for managing campaign donations.
    - Public: list, retrieve, create (anonymous or authenticated)
    - Donors: my-donations
    """
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = DonationFilter
    search_fields = ['donor_name', 'message']
    ordering_fields = ['amount', 'created_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return DonationCreateSerializer
        return DonationDetailSerializer

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
        cache.delete(DonationViewSet._get_list_cache_key(campaign_id))

    @staticmethod
    def _invalidate_detail_cache(donation_id):
        """Invalidate specific donation detail cache"""
        cache.delete(DonationViewSet._get_detail_cache_key(donation_id))

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
        operation_description='List donations for a visible campaign.',
    )
    def list(self, request, *args, **kwargs):
        campaign_id = self.kwargs.get('campaign_pk')
        cache_key = self._get_list_cache_key(campaign_id)
        cached_response = cache.get(cache_key)
        if cached_response is not None:
            return cached_response
        
        response = super().list(request, *args, **kwargs)
        cache.set(cache_key, response, CACHE_TIMEOUT)
        return response

    @swagger_auto_schema(
        tags=_TAG,
        responses={200: DonationDetailSerializer},
        operation_description='Retrieve a donation under a visible campaign.',
    )
    def retrieve(self, request, *args, **kwargs):
        donation_id = kwargs.get('pk')
        cache_key = self._get_detail_cache_key(donation_id)
        cached_response = cache.get(cache_key)
        if cached_response is not None:
            return cached_response
        
        response = super().retrieve(request, *args, **kwargs)
        cache.set(cache_key, response, CACHE_TIMEOUT)
        return response

    @swagger_auto_schema(
        tags=_TAG,
        request_body=DonationCreateSerializer,
        responses={201: DonationDetailSerializer},
        operation_description='Create a donation under a visible campaign.',
    )
    def create(self, request, *args, **kwargs):
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
            serializer.is_valid(raise_exception=True)
            validated_data = serializer.validated_data

            payment_method = validated_data['payment_method']
            phone_number = validated_data['phone_number']
            success_url = validated_data['success_url']
            failure_url = validated_data['failure_url']
            donor_name = validated_data['donor_name']
            amount = validated_data['amount']
            message = validated_data['message']
            is_anonymous = validated_data['is_anonymous']

            payment = Payment.objects.create(
                payment_method=payment_method,
                phone_number=phone_number,
                amount=amount,
            )

            donor_name = "Anonymous"
            if donor and not is_anonymous:
                donor_name = f"{donor.user.last_name}".strip()
            if is_anonymous:
                donor_name = "Anonymous"

            donation = Donation.objects.create(
                donor=donor,
                campaign=campaign,
                donor_name=donor_name,
                amount=amount,
                message=message,
                is_anonymous=is_anonymous,
                payment=payment,
            )

            if settings.CAMPAY_ENVIRONMENT == "DEV" and float(amount) > 25.00:
                return Response(
                    {'error': 'In demo mode, maximum amount is limited to 25.00 XAF'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            campay = CamPayManager(
                app_username=settings.CAMPAY_APP_USERNAME,
                app_password=settings.CAMPAY_APP_PASSWORD,
                environment=settings.CAMPAY_ENVIRONMENT,
            )

            description = f"Donate {amount} for {campaign.title}"

            try:
                payment_link = campay.create_payment_link(
                    amount=str(amount),
                    description=description,
                    external_reference=donation.id,
                    redirect_url=success_url,
                    failure_redirect_url=failure_url,
                    first_name=donor.user.first_name if donor else None,
                    last_name=donor.user.last_name if donor else None,
                    email=donor.user.email if donor else None,
                    phone=phone_number.replace('+', ''),
                )
                return Response({'payment_link': payment_link['link']})

            except Exception as campay_error:
                print(f"CamPay Error: {str(campay_error)}")
                error_message = campay_error['message'] if isinstance(campay_error, dict) and 'message' in campay_error else str(campay_error)
                return Response(
                    {'error': f"Payment service error: {error_message}", 'campay_error': True},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(
        detail=False,
        methods=['get'],
        permission_classes=[IsAuthenticated],
        url_path='my-donations',
    )
    @swagger_auto_schema(
        tags=_TAG,
        responses={200: DonationDetailSerializer(many=True)},
        operation_description='Get all donations made by the authenticated donor with pagination.',
    )
    def my_donations(self, request, *args, **kwargs):
        """Get all donations made by the authenticated donor"""
        try:
            # Get the donor profile for the authenticated user
            donor = request.user.donor
        except Exception:
            return Response(
                {'detail': 'Requesting user does not have a Donor profile.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Log this action
        LogService.info(
            request,
            'donation.view_my_donations',
            user=request.user,
            description=f'Donor viewed their donation history',
            metadata={'donor_id': str(donor.id)},
        )

        # Get all donations by this donor
        donations = Donation.objects.select_related(
            'campaign__donor__user',
            'donor__user',
            'payment'
        ).filter(donor=donor).order_by('-created_at')

        # Apply pagination
        page = self.paginate_queryset(donations)
        if page is not None:
            serializer = DonationDetailSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = DonationDetailSerializer(donations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
