from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import AllowAny, BasePermission, IsAuthenticated
from rest_framework.response import Response

from accounts.models import Role
from campaigns.filters import CampaignFilter
from campaigns.models import Campaign
from campaigns.serializers import CampaignCreateUpdateSerializer, CampaignDetailSerializer

_TAG = ['Campaigns']


class IsDonor(BasePermission):
    message = 'Only Donors can perform this action.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == Role.DONOR
        )


class CampaignOwnerOnly(BasePermission):
    message = 'You can only manage your own campaigns.'

    def has_object_permission(self, request, view, obj):
        try:
            return obj.donor_id == request.user.donor.id
        except Exception:
            return False


class CampaignViewSet(viewsets.ModelViewSet):
    lookup_field = 'pk'
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = CampaignFilter
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'goal_amount', 'current_amount', 'end_date', 'title']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        elif self.action == 'create':
            return [IsAuthenticated(), IsDonor()]
        return [IsAuthenticated(), IsDonor(), CampaignOwnerOnly()]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CampaignCreateUpdateSerializer
        return CampaignDetailSerializer

    def get_queryset(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            try:
                donor = self.request.user.donor
                return Campaign.objects.select_related('donor__user').filter(
                    donor=donor
                ).order_by('-created_at')
            except Exception:
                return Campaign.objects.none()

        queryset = Campaign.objects.select_related('donor__user').all()
        if self.request.user.is_authenticated and getattr(self.request.user, 'role', None) == Role.DONOR:
            try:
                donor = self.request.user.donor
                return queryset.filter(Q(is_public=True, is_active=True) | Q(donor=donor))
            except Exception:
                pass
        return queryset.filter(is_public=True, is_active=True)

    @swagger_auto_schema(
        tags=_TAG,
        responses={200: CampaignDetailSerializer(many=True)},
        operation_description='Public list of campaigns with filters. Donors also see their private campaigns.',
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=_TAG,
        request_body=CampaignCreateUpdateSerializer,
        responses={201: CampaignDetailSerializer},
        operation_description='Create a campaign for the authenticated donor.',
    )
    def create(self, request, *args, **kwargs):
        try:
            donor = request.user.donor
        except Exception:
            return Response(
                {'detail': 'Requesting user does not have a Donor profile.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        campaign = serializer.save(donor=donor)
        return Response(CampaignDetailSerializer(campaign).data, status=status.HTTP_201_CREATED)

    @swagger_auto_schema(
        tags=_TAG,
        responses={200: CampaignDetailSerializer},
        operation_description='Retrieve a campaign visible to the requester. Public for everyone; donors can also retrieve their own private campaigns.',
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=_TAG,
        request_body=CampaignCreateUpdateSerializer,
        responses={200: CampaignDetailSerializer},
        operation_description='Replace a donor-owned campaign.',
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=_TAG,
        request_body=CampaignCreateUpdateSerializer,
        responses={200: CampaignDetailSerializer},
        operation_description='Partially update a donor-owned campaign.',
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=_TAG,
        responses={204: 'No Content'},
        operation_description='Delete a donor-owned campaign.',
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

    @action(
        detail=False,
        methods=['get'],
        permission_classes=[IsAuthenticated, IsDonor],
        url_path='my-campaigns',
    )
    @swagger_auto_schema(
        tags=_TAG,
        responses={200: CampaignDetailSerializer(many=True)},
        operation_description='Get all campaigns belonging to the authenticated donor.',
    )
    def my_campaigns(self, request, *args, **kwargs):
        """Get campaigns of the authenticated donor"""
        try:
            donor = request.user.donor
            campaigns = Campaign.objects.select_related('donor__user').filter(
                donor=donor
            ).order_by('-created_at')
            serializer = self.get_serializer(campaigns, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'detail': 'Requesting user does not have a Donor profile.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
