from drf_yasg.utils import swagger_auto_schema
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.generics import CreateAPIView, DestroyAPIView, ListAPIView, RetrieveAPIView, UpdateAPIView
from rest_framework.permissions import BasePermission, IsAuthenticated
from django.shortcuts import get_object_or_404

from accounts.models import Role
from hospitals.models import Hospital, Services
from hospitals.serializers import ServiceCreateUpdateSerializer, ServiceDetailSerializer

_TAG = ['Services']


class IsSystemOrHospitalAdmin(BasePermission):
    message = 'Only System Admins or Hospital Admins can perform this action.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in {Role.SYSTEM_ADMIN, Role.HOSPITAL_ADMIN}
        )


class ServiceListView(ListAPIView):
    serializer_class = ServiceDetailSerializer
    permission_classes = [IsAuthenticated, IsSystemOrHospitalAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = {
        'id': ['exact'],
        'name': ['exact', 'icontains'],
        'category': ['exact', 'icontains'],
        'is_available': ['exact'],
        'price': ['exact', 'gte', 'lte'],
        'created_at': ['date', 'gte', 'lte'],
        'updated_at': ['date', 'gte', 'lte'],
    }
    search_fields = ['name', 'category', 'description']
    ordering_fields = ['created_at', 'updated_at', 'price', 'name', 'category']

    def get_queryset(self):
        return Services.objects.select_related('hospital').filter(
            hospital_id=self.kwargs['hospital_id']
        ).order_by('-created_at')

    @swagger_auto_schema(
        tags=_TAG,
        responses={200: ServiceDetailSerializer(many=True)},
        operation_description='List services under a hospital.',
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class ServiceRetrieveView(RetrieveAPIView):
    serializer_class = ServiceDetailSerializer
    permission_classes = [IsAuthenticated, IsSystemOrHospitalAdmin]
    lookup_field = 'id'

    def get_queryset(self):
        return Services.objects.select_related('hospital').filter(
            hospital_id=self.kwargs['hospital_id']
        )

    @swagger_auto_schema(
        tags=_TAG,
        responses={200: ServiceDetailSerializer},
        operation_description='Retrieve a service under a hospital.',
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class ServiceCreateView(CreateAPIView):
    queryset = Services.objects.all()
    serializer_class = ServiceCreateUpdateSerializer
    permission_classes = [IsAuthenticated, IsSystemOrHospitalAdmin]

    def perform_create(self, serializer):
        hospital = get_object_or_404(Hospital, id=self.kwargs['hospital_id'])
        serializer.save(hospital=hospital)

    @swagger_auto_schema(
        tags=_TAG,
        request_body=ServiceCreateUpdateSerializer,
        responses={201: ServiceDetailSerializer},
        operation_description='Create a service under a hospital.',
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class ServiceUpdateView(UpdateAPIView):
    serializer_class = ServiceCreateUpdateSerializer
    permission_classes = [IsAuthenticated, IsSystemOrHospitalAdmin]
    lookup_field = 'id'
    http_method_names = ['put', 'patch', 'head', 'options']

    def get_queryset(self):
        return Services.objects.filter(hospital_id=self.kwargs['hospital_id'])

    def perform_update(self, serializer):
        hospital = get_object_or_404(Hospital, id=self.kwargs['hospital_id'])
        serializer.save(hospital=hospital)

    @swagger_auto_schema(
        tags=_TAG,
        request_body=ServiceCreateUpdateSerializer,
        responses={200: ServiceDetailSerializer},
        operation_description='Update a service under a hospital.',
    )
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=_TAG,
        request_body=ServiceCreateUpdateSerializer,
        responses={200: ServiceDetailSerializer},
        operation_description='Replace a service under a hospital.',
    )
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)


class ServiceDeleteView(DestroyAPIView):
    serializer_class = ServiceDetailSerializer
    permission_classes = [IsAuthenticated, IsSystemOrHospitalAdmin]
    lookup_field = 'id'

    def get_queryset(self):
        return Services.objects.filter(hospital_id=self.kwargs['hospital_id'])

    @swagger_auto_schema(
        tags=_TAG,
        responses={204: 'No Content'},
        operation_description='Delete a service under a hospital.',
    )
    def delete(self, request, *args, **kwargs):
        return super().delete(request, *args, **kwargs)
