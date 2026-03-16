from drf_yasg.utils import swagger_auto_schema
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework import status
from rest_framework.generics import ListAPIView, RetrieveAPIView, UpdateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Donor
from accounts.serializers import (
    DonorDetailSerializer,
    DonorRegisterSerializer,
    DonorUpdateSerializer,
)
from accounts.utils import IsOwnerOrSystemAdmin, IsSystemAdmin

_TAG = ['Donors']


class DonorRegisterView(APIView):
    """
    POST /api/accounts/donors/register/
    Public — any unauthenticated visitor can register as a Donor.
    """

    permission_classes = [AllowAny]

    @swagger_auto_schema(
        tags=_TAG,
        request_body=DonorRegisterSerializer,
        responses={201: DonorDetailSerializer},
        operation_description="Register a new Donor account. Open to everyone.",
    )
    def post(self, request):
        serializer = DonorRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        donor = serializer.save()
        return Response(
            DonorDetailSerializer(donor).data,
            status=status.HTTP_201_CREATED,
        )


class DonorListView(ListAPIView):
    """
    GET /api/accounts/donors/
    Accessible only by SYSTEM_ADMIN.
    """

    queryset = Donor.objects.select_related('user').all().order_by('-user__date_joined')
    serializer_class = DonorDetailSerializer
    permission_classes = [IsAuthenticated, IsSystemAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = {
        'id': ['exact'],
        'user__username': ['exact', 'icontains'],
        'user__email': ['exact', 'icontains'],
        'user__phone_number': ['exact', 'icontains'],
        'user__is_verified': ['exact'],
        'user__is_active': ['exact'],
        'user__perfered_language': ['exact'],
        'user__created_at': ['date', 'gte', 'lte'],
    }
    search_fields = ['user__username', 'user__first_name', 'user__last_name', 'user__email', 'user__phone_number']
    ordering_fields = ['user__date_joined', 'user__created_at', 'user__username']

    @swagger_auto_schema(
        tags=_TAG,
        responses={200: DonorDetailSerializer(many=True)},
        operation_description="List Donor profiles. Accessible only by SYSTEM_ADMIN.",
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class DonorDetailView(RetrieveAPIView):
    """
    GET /api/accounts/donors/<id>/
    Accessible by the donor themselves or a SYSTEM_ADMIN.
    """

    queryset = Donor.objects.select_related('user')
    serializer_class = DonorDetailSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrSystemAdmin]
    lookup_field = 'id'

    @swagger_auto_schema(
        tags=_TAG,
        responses={200: DonorDetailSerializer},
        operation_description="Retrieve a Donor profile. Accessible by the donor or a SYSTEM_ADMIN.",
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class DonorUpdateView(UpdateAPIView):
    """
    PATCH /api/accounts/donors/<id>/update/
    Only the donor themselves can update their profile.
    """

    queryset = Donor.objects.select_related('user')
    serializer_class = DonorUpdateSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrSystemAdmin]
    lookup_field = 'id'
    http_method_names = ['patch', 'head', 'options']

    @swagger_auto_schema(
        tags=_TAG,
        request_body=DonorUpdateSerializer,
        responses={200: DonorDetailSerializer},
        operation_description="Partially update a Donor profile. Only accessible by the donor or a SYSTEM_ADMIN.",
    )
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)
