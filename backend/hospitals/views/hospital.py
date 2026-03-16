from drf_yasg.utils import swagger_auto_schema
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.generics import CreateAPIView, DestroyAPIView, ListAPIView, RetrieveAPIView, UpdateAPIView
from rest_framework.permissions import BasePermission, IsAuthenticated

from accounts.models import Role
from hospitals.models import Hospital
from hospitals.serializers import HospitalCreateUpdateSerializer, HospitalDetailSerializer

_TAG = ['Hospitals']


class IsSystemOrHospitalAdmin(BasePermission):
    message = 'Only System Admins or Hospital Admins can perform this action.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in {Role.SYSTEM_ADMIN, Role.HOSPITAL_ADMIN}
        )


class HospitalListView(ListAPIView):
    queryset = Hospital.objects.select_related('manager__user').all().order_by('-created_at')
    serializer_class = HospitalDetailSerializer
    permission_classes = [IsAuthenticated, IsSystemOrHospitalAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = {
        'id': ['exact'],
        'name': ['exact', 'icontains'],
        'region': ['exact', 'icontains'],
        'city': ['exact', 'icontains'],
        'partnership_status': ['exact'],
        'is_active': ['exact'],
        'created_at': ['date', 'gte', 'lte'],
        'updated_at': ['date', 'gte', 'lte'],
        'manager__id': ['exact', 'isnull'],
        'manager__user__username': ['exact', 'icontains'],
    }
    search_fields = ['name', 'address', 'email', 'phone_number', 'accreditation_number', 'licence_number']
    ordering_fields = ['created_at', 'updated_at', 'name', 'city', 'region']

    @swagger_auto_schema(
        tags=_TAG,
        responses={200: HospitalDetailSerializer(many=True)},
        operation_description='List hospitals.',
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class HospitalRetrieveView(RetrieveAPIView):
    queryset = Hospital.objects.select_related('manager__user').all()
    serializer_class = HospitalDetailSerializer
    permission_classes = [IsAuthenticated, IsSystemOrHospitalAdmin]
    lookup_field = 'id'

    @swagger_auto_schema(
        tags=_TAG,
        responses={200: HospitalDetailSerializer},
        operation_description='Retrieve a hospital.',
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class HospitalCreateView(CreateAPIView):
    queryset = Hospital.objects.all()
    serializer_class = HospitalCreateUpdateSerializer
    permission_classes = [IsAuthenticated, IsSystemOrHospitalAdmin]

    @swagger_auto_schema(
        tags=_TAG,
        request_body=HospitalCreateUpdateSerializer,
        responses={201: HospitalDetailSerializer},
        operation_description='Create a hospital.',
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class HospitalUpdateView(UpdateAPIView):
    queryset = Hospital.objects.all()
    serializer_class = HospitalCreateUpdateSerializer
    permission_classes = [IsAuthenticated, IsSystemOrHospitalAdmin]
    lookup_field = 'id'
    http_method_names = ['put', 'patch', 'head', 'options']

    @swagger_auto_schema(
        tags=_TAG,
        request_body=HospitalCreateUpdateSerializer,
        responses={200: HospitalDetailSerializer},
        operation_description='Update a hospital.',
    )
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=_TAG,
        request_body=HospitalCreateUpdateSerializer,
        responses={200: HospitalDetailSerializer},
        operation_description='Replace a hospital.',
    )
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)


class HospitalDeleteView(DestroyAPIView):
    queryset = Hospital.objects.all()
    serializer_class = HospitalDetailSerializer
    permission_classes = [IsAuthenticated, IsSystemOrHospitalAdmin]
    lookup_field = 'id'

    @swagger_auto_schema(
        tags=_TAG,
        responses={204: 'No Content'},
        operation_description='Delete a hospital.',
    )
    def delete(self, request, *args, **kwargs):
        return super().delete(request, *args, **kwargs)
