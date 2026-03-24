from drf_yasg.utils import swagger_auto_schema
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework import status
from rest_framework.generics import ListAPIView, RetrieveAPIView, UpdateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import HospitalAdmin
from accounts.serializers import (
    HospitalAdminCreateSerializer,
    HospitalAdminDetailSerializer,
    HospitalAdminUpdateSerializer,
)
from accounts.utils import IsOwnerOrSystemAdmin, IsSystemAdmin

_TAG = ['Hospital Admins']


class HospitalAdminCreateView(APIView):
    """
    POST /api/accounts/hospital-admins/
    Only SYSTEM_ADMIN can create a Hospital Admin account.
    The `enrolled_by` field is automatically set to the requesting system admin.
    """

    permission_classes = [IsAuthenticated, IsSystemAdmin]

    @swagger_auto_schema(
        tags=_TAG,
        request_body=HospitalAdminCreateSerializer,
        responses={201: HospitalAdminDetailSerializer},
        operation_description="Create a new Hospital Admin account. Only accessible by SYSTEM_ADMIN.",
    )
    def post(self, request):
        # The requesting user must have a SystemAdmin profile
        try:
            enrolled_by = request.user.systemadmin
        except HospitalAdmin.DoesNotExist:
            return Response(
                {'detail': 'Requesting user does not have a SystemAdmin profile.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = HospitalAdminCreateSerializer(
            data=request.data,
            context={'enrolled_by': enrolled_by},
        )
        serializer.is_valid(raise_exception=True)
        hospital_admin = serializer.save()
        return Response(
            HospitalAdminDetailSerializer(hospital_admin).data,
            status=status.HTTP_201_CREATED,
        )


class HospitalAdminListView(ListAPIView):
    """
    GET /api/accounts/hospital-admins/list/
    Accessible only by SYSTEM_ADMIN.
    """

    queryset = HospitalAdmin.objects.select_related('user', 'enrolled_by__user', 'hospital').all().order_by('-user__date_joined')
    serializer_class = HospitalAdminDetailSerializer
    permission_classes = [IsAuthenticated, IsSystemAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = {
        'id': ['exact'],
        'hospital_id': ['exact', 'isnull'],
        'enrolled_by_id': ['exact'],
        'national_id_number': ['exact', 'icontains'],
        'user__email': ['exact', 'icontains'],
        'user__phone_number': ['exact', 'icontains'],
        'user__is_verified': ['exact'],
        'user__is_active': ['exact'],
        'user__created_at': ['date', 'gte', 'lte'],
    }
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'national_id_number']
    ordering_fields = ['user__created_at']

    @swagger_auto_schema(
        tags=_TAG,
        responses={200: HospitalAdminDetailSerializer(many=True)},
        operation_description="List Hospital Admin profiles. Accessible only by SYSTEM_ADMIN.",
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class HospitalAdminDetailView(RetrieveAPIView):
    """
    GET /api/accounts/hospital-admins/<id>/
    Accessible by the hospital admin themselves or a SYSTEM_ADMIN.
    """

    queryset = HospitalAdmin.objects.select_related('user', 'enrolled_by__user')
    serializer_class = HospitalAdminDetailSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrSystemAdmin]
    lookup_field = 'id'

    @swagger_auto_schema(
        tags=_TAG,
        responses={200: HospitalAdminDetailSerializer},
        operation_description="Retrieve a Hospital Admin profile. Accessible by the hospital admin or a SYSTEM_ADMIN.",
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class HospitalAdminUpdateView(UpdateAPIView):
    """
    PATCH /api/accounts/hospital-admins/<id>/update/
    Accessible by the hospital admin themselves or a SYSTEM_ADMIN.
    """

    queryset = HospitalAdmin.objects.select_related('user')
    serializer_class = HospitalAdminUpdateSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrSystemAdmin]
    lookup_field = 'id'
    http_method_names = ['patch', 'head', 'options']

    @swagger_auto_schema(
        tags=_TAG,
        request_body=HospitalAdminUpdateSerializer,
        responses={200: HospitalAdminDetailSerializer},
        operation_description="Partially update a Hospital Admin profile. Accessible by the hospital admin or a SYSTEM_ADMIN.",
    )
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)
