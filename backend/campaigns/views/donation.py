from django.db.models import Q
from django.shortcuts import get_object_or_404
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.generics import CreateAPIView, ListAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.models import Role
from campaigns.models import Campaign, Donation
from campaigns.serializers import DonationCreateSerializer, DonationDetailSerializer

_TAG = ['Campaign Donations']


class CampaignVisibilityMixin:
    def get_visible_campaign_queryset(self):
        queryset = Campaign.objects.select_related('donor__user').all()
        if self.request.user.is_authenticated and getattr(self.request.user, 'role', None) == Role.DONOR:
            try:
                donor = self.request.user.donor
                return queryset.filter(Q(is_public=True, is_active=True) | Q(donor=donor))
            except Exception:
                pass
        return queryset.filter(is_public=True, is_active=True)

    def get_campaign(self):
        return get_object_or_404(self.get_visible_campaign_queryset(), id=self.kwargs['campaign_id'])


class DonationListView(CampaignVisibilityMixin, ListAPIView):
    serializer_class = DonationDetailSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        campaign = self.get_campaign()
        queryset = Donation.objects.select_related('campaign', 'donor__user').filter(campaign=campaign).order_by('-created_at')

        status_value = self.request.query_params.get('status')
        if status_value:
            queryset = queryset.filter(status=status_value)

        min_amount = self.request.query_params.get('min_amount')
        if min_amount:
            queryset = queryset.filter(amount__gte=min_amount)

        max_amount = self.request.query_params.get('max_amount')
        if max_amount:
            queryset = queryset.filter(amount__lte=max_amount)

        donor_name = self.request.query_params.get('donor_name')
        if donor_name:
            queryset = queryset.filter(donor_name__icontains=donor_name)

        return queryset

    @swagger_auto_schema(
        tags=_TAG,
        responses={200: DonationDetailSerializer(many=True)},
        operation_description='List donations for a visible campaign.',
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class DonationRetrieveView(CampaignVisibilityMixin, RetrieveAPIView):
    serializer_class = DonationDetailSerializer
    permission_classes = [AllowAny]
    lookup_field = 'id'

    def get_queryset(self):
        campaign = self.get_campaign()
        return Donation.objects.select_related('campaign', 'donor__user').filter(campaign=campaign)

    @swagger_auto_schema(
        tags=_TAG,
        responses={200: DonationDetailSerializer},
        operation_description='Retrieve a donation under a visible campaign.',
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class DonationCreateView(CampaignVisibilityMixin, CreateAPIView):
    serializer_class = DonationCreateSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        campaign = self.get_campaign()

        donor = None
        if request.user.is_authenticated and getattr(request.user, 'role', None) == Role.DONOR:
            try:
                donor = request.user.donor
            except Exception:
                donor = None

        serializer = self.get_serializer(
            data=request.data,
            context={'campaign': campaign, 'donor': donor},
        )
        serializer.is_valid(raise_exception=True)
        donation = serializer.save()
        return Response(DonationDetailSerializer(donation).data, status=status.HTTP_201_CREATED)

    @swagger_auto_schema(
        tags=_TAG,
        request_body=DonationCreateSerializer,
        responses={201: DonationDetailSerializer},
        operation_description='Create a donation under a visible campaign.',
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)
