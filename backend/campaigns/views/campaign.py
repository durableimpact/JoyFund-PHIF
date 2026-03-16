from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.generics import CreateAPIView, DestroyAPIView, ListAPIView, RetrieveAPIView, UpdateAPIView
from rest_framework.permissions import AllowAny, BasePermission, IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q

from accounts.models import Role
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


class CampaignVisibilityAndFilterMixin:
    def get_base_queryset(self):
        return Campaign.objects.select_related('donor__user', 'account').all()

    def get_visible_queryset(self):
        queryset = self.get_base_queryset()
        if self.request.user.is_authenticated and getattr(self.request.user, 'role', None) == Role.DONOR:
            try:
                donor = self.request.user.donor
                return queryset.filter(Q(is_public=True, is_active=True) | Q(donor=donor))
            except Exception:
                pass
        return queryset.filter(is_public=True, is_active=True)

    def apply_filters(self, queryset):
        params = self.request.query_params

        search = params.get('search')
        if search:
            queryset = queryset.filter(Q(title__icontains=search) | Q(description__icontains=search))

        status_value = params.get('status')
        if status_value:
            queryset = queryset.filter(status=status_value)

        event_type = params.get('event_type')
        if event_type:
            queryset = queryset.filter(event_type=event_type)

        donor_id = params.get('donor_id')
        if donor_id:
            queryset = queryset.filter(donor_id=donor_id)

        is_public = params.get('is_public')
        if is_public is not None:
            is_public_bool = is_public.lower() == 'true'
            queryset = queryset.filter(is_public=is_public_bool)

        is_active = params.get('is_active')
        if is_active is not None:
            is_active_bool = is_active.lower() == 'true'
            queryset = queryset.filter(is_active=is_active_bool)

        min_goal = params.get('min_goal_amount')
        if min_goal:
            queryset = queryset.filter(goal_amount__gte=min_goal)

        max_goal = params.get('max_goal_amount')
        if max_goal:
            queryset = queryset.filter(goal_amount__lte=max_goal)

        created_from = params.get('created_from')
        if created_from:
            queryset = queryset.filter(created_at__date__gte=created_from)

        created_to = params.get('created_to')
        if created_to:
            queryset = queryset.filter(created_at__date__lte=created_to)

        return queryset


class CampaignListView(CampaignVisibilityAndFilterMixin, ListAPIView):
    serializer_class = CampaignDetailSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = self.get_visible_queryset()
        queryset = self.apply_filters(queryset)
        ordering = self.request.query_params.get('ordering', '-created_at')
        allowed_ordering = {
            'created_at',
            '-created_at',
            'goal_amount',
            '-goal_amount',
            'current_amount',
            '-current_amount',
            'end_date',
            '-end_date',
            'title',
            '-title',
        }
        if ordering not in allowed_ordering:
            ordering = '-created_at'
        return queryset.order_by(ordering)

    @swagger_auto_schema(
        tags=_TAG,
        responses={200: CampaignDetailSerializer(many=True)},
        operation_description='Public list of campaigns with filters. Donors also see their private campaigns.',
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class CampaignCreateView(CreateAPIView):
    serializer_class = CampaignCreateUpdateSerializer
    permission_classes = [IsAuthenticated, IsDonor]

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
        request_body=CampaignCreateUpdateSerializer,
        responses={201: CampaignDetailSerializer},
        operation_description='Create a campaign for the authenticated donor.',
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class CampaignRetrieveView(CampaignVisibilityAndFilterMixin, RetrieveAPIView):
    serializer_class = CampaignDetailSerializer
    permission_classes = [AllowAny]
    lookup_field = 'id'

    def get_queryset(self):
        return self.get_visible_queryset()

    @swagger_auto_schema(
        tags=_TAG,
        responses={200: CampaignDetailSerializer},
        operation_description='Retrieve a campaign visible to the requester. Public for everyone; donors can also retrieve their own private campaigns.',
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class DonorCampaignQuerysetMixin:
    def get_donor(self):
        return self.request.user.donor

    def get_queryset(self):
        return Campaign.objects.select_related('donor__user', 'account').filter(
            donor=self.get_donor()
        ).order_by('-created_at')


class CampaignUpdateView(DonorCampaignQuerysetMixin, UpdateAPIView):
    serializer_class = CampaignCreateUpdateSerializer
    permission_classes = [IsAuthenticated, IsDonor, CampaignOwnerOnly]
    lookup_field = 'id'
    http_method_names = ['patch', 'put', 'head', 'options']

    @swagger_auto_schema(
        tags=_TAG,
        request_body=CampaignCreateUpdateSerializer,
        responses={200: CampaignDetailSerializer},
        operation_description='Partially update a donor-owned campaign.',
    )
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=_TAG,
        request_body=CampaignCreateUpdateSerializer,
        responses={200: CampaignDetailSerializer},
        operation_description='Replace a donor-owned campaign.',
    )
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)


class CampaignDeleteView(DonorCampaignQuerysetMixin, DestroyAPIView):
    serializer_class = CampaignDetailSerializer
    permission_classes = [IsAuthenticated, IsDonor, CampaignOwnerOnly]
    lookup_field = 'id'

    @swagger_auto_schema(
        tags=_TAG,
        responses={204: 'No Content'},
        operation_description='Delete a donor-owned campaign.',
    )
    def delete(self, request, *args, **kwargs):
        return super().delete(request, *args, **kwargs)
