from rest_framework import status
from rest_framework.generics import RetrieveAPIView, UpdateAPIView
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


class HospitalAdminCreateView(APIView):
    """
    POST /api/accounts/hospital-admins/
    Only SYSTEM_ADMIN can create a Hospital Admin account.
    The `enrolled_by` field is automatically set to the requesting system admin.
    """

    permission_classes = [IsAuthenticated, IsSystemAdmin]

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


class HospitalAdminDetailView(RetrieveAPIView):
    """
    GET /api/accounts/hospital-admins/<id>/
    Accessible by the hospital admin themselves or a SYSTEM_ADMIN.
    """

    queryset = HospitalAdmin.objects.select_related('user', 'enrolled_by__user')
    serializer_class = HospitalAdminDetailSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrSystemAdmin]
    lookup_field = 'id'


class HospitalAdminUpdateView(UpdateAPIView):
    """
    PATCH /api/accounts/hospital-admins/<id>/
    Accessible by the hospital admin themselves or a SYSTEM_ADMIN.
    """

    queryset = HospitalAdmin.objects.select_related('user')
    serializer_class = HospitalAdminUpdateSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrSystemAdmin]
    lookup_field = 'id'
    http_method_names = ['patch', 'head', 'options']
