from drf_yasg.utils import swagger_auto_schema
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework import status
from rest_framework.generics import DestroyAPIView, ListAPIView, RetrieveAPIView, UpdateAPIView
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Role
from beneficiaries.models import Beneficiary
from beneficiaries.serializers import (
    BeneficiaryCreateSerializer,
    BeneficiaryDetailSerializer,
    BeneficiaryUpdateSerializer,
)

_TAG = ['Beneficiaries']


class IsSocialWorker(BasePermission):
    message = 'Only Social Workers can perform this action.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == Role.SOCIAL_WORKER
        )


class IsBeneficiaryEnrolledByRequester(BasePermission):
    message = 'You can only manage beneficiaries enrolled by your account.'

    def has_object_permission(self, request, view, obj):
        try:
            return obj.enrolled_by_id == request.user.socialworker.id
        except Exception:
            return False


class BeneficiaryCreateView(APIView):
    permission_classes = [IsAuthenticated, IsSocialWorker]

    @swagger_auto_schema(
        tags=_TAG,
        request_body=BeneficiaryCreateSerializer,
        responses={201: BeneficiaryDetailSerializer},
        operation_description='Create a beneficiary profile. Only accessible by SOCIAL_WORKER.',
    )
    def post(self, request):
        try:
            enrolled_by = request.user.socialworker
        except Exception:
            return Response(
                {'detail': 'Requesting user does not have a SocialWorker profile.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = BeneficiaryCreateSerializer(
            data=request.data,
            context={'enrolled_by': enrolled_by},
        )
        serializer.is_valid(raise_exception=True)
        beneficiary = serializer.save()
        return Response(BeneficiaryDetailSerializer(beneficiary).data, status=status.HTTP_201_CREATED)


class BeneficiaryListView(ListAPIView):
    serializer_class = BeneficiaryDetailSerializer
    permission_classes = [IsAuthenticated, IsSocialWorker]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = {
        'id': ['exact'],
        'full_name': ['exact', 'icontains'],
        'phone': ['exact', 'icontains'],
        'email': ['exact', 'icontains', 'isnull'],
        'national_id_number': ['exact', 'icontains'],
        'date_of_birth': ['exact', 'gte', 'lte'],
        'gender': ['exact'],
        'category': ['exact'],
        'region': ['exact', 'icontains'],
        'city': ['exact', 'icontains'],
        'enrolled_by_id': ['exact'],
        'is_active': ['exact'],
        'expected_delivery_date': ['exact', 'gte', 'lte'],
        'created_at': ['date', 'gte', 'lte'],
        'updated_at': ['date', 'gte', 'lte'],
    }
    search_fields = ['full_name', 'phone', 'email', 'national_id_number', 'emergency_contact_name']
    ordering_fields = ['created_at', 'updated_at', 'full_name', 'city', 'region']

    def get_queryset(self):
        return Beneficiary.objects.select_related('enrolled_by__user').filter(
            enrolled_by__user=self.request.user
        ).order_by('-created_at')

    @swagger_auto_schema(
        tags=_TAG,
        responses={200: BeneficiaryDetailSerializer(many=True)},
        operation_description='List beneficiaries enrolled by the authenticated SOCIAL_WORKER.',
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class BeneficiaryRetrieveView(RetrieveAPIView):
    queryset = Beneficiary.objects.select_related('enrolled_by__user')
    serializer_class = BeneficiaryDetailSerializer
    permission_classes = [IsAuthenticated, IsSocialWorker, IsBeneficiaryEnrolledByRequester]
    lookup_field = 'id'

    @swagger_auto_schema(
        tags=_TAG,
        responses={200: BeneficiaryDetailSerializer},
        operation_description='Retrieve beneficiary details. Only accessible by the enrolling SOCIAL_WORKER.',
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class BeneficiaryUpdateView(UpdateAPIView):
    queryset = Beneficiary.objects.select_related('enrolled_by__user')
    serializer_class = BeneficiaryUpdateSerializer
    permission_classes = [IsAuthenticated, IsSocialWorker, IsBeneficiaryEnrolledByRequester]
    lookup_field = 'id'
    http_method_names = ['patch', 'head', 'options']

    @swagger_auto_schema(
        tags=_TAG,
        request_body=BeneficiaryUpdateSerializer,
        responses={200: BeneficiaryDetailSerializer},
        operation_description='Update beneficiary info. Only accessible by the enrolling SOCIAL_WORKER.',
    )
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)


class BeneficiaryDeleteView(DestroyAPIView):
    queryset = Beneficiary.objects.select_related('enrolled_by__user')
    serializer_class = BeneficiaryDetailSerializer
    permission_classes = [IsAuthenticated, IsSocialWorker, IsBeneficiaryEnrolledByRequester]
    lookup_field = 'id'
    http_method_names = ['delete', 'head', 'options']

    @swagger_auto_schema(
        tags=_TAG,
        responses={204: 'No Content'},
        operation_description='Delete a beneficiary. Only accessible by the enrolling SOCIAL_WORKER.',
    )
    def delete(self, request, *args, **kwargs):
        return super().delete(request, *args, **kwargs)
