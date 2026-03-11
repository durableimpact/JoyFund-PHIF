from rest_framework import status
from rest_framework.generics import RetrieveAPIView, UpdateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Receptionist
from accounts.serializers import (
    ReceptionistCreateSerializer,
    ReceptionistDetailSerializer,
    ReceptionistUpdateSerializer,
)
from accounts.utils import IsHospitalAdmin, IsOwnerOrHospitalAdmin


class ReceptionistCreateView(APIView):
    """
    POST /api/accounts/receptionists/
    Only HOSPITAL_ADMIN can create a Receptionist account.
    The `enrolled_by` field is automatically set to the requesting hospital admin.
    """

    permission_classes = [IsAuthenticated, IsHospitalAdmin]

    def post(self, request):
        try:
            enrolled_by = request.user.hospitaladmin
        except Exception:
            return Response(
                {'detail': 'Requesting user does not have a HospitalAdmin profile.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ReceptionistCreateSerializer(
            data=request.data,
            context={'enrolled_by': enrolled_by},
        )
        serializer.is_valid(raise_exception=True)
        receptionist = serializer.save()
        return Response(
            ReceptionistDetailSerializer(receptionist).data,
            status=status.HTTP_201_CREATED,
        )


class ReceptionistDetailView(RetrieveAPIView):
    """
    GET /api/accounts/receptionists/<id>/
    Accessible by the receptionist themselves, their enrolling hospital admin,
    or a SYSTEM_ADMIN.
    """

    queryset = Receptionist.objects.select_related('user', 'enrolled_by__user', 'hospital')
    serializer_class = ReceptionistDetailSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrHospitalAdmin]
    lookup_field = 'id'


class ReceptionistUpdateView(UpdateAPIView):
    """
    PATCH /api/accounts/receptionists/<id>/
    Accessible by the receptionist themselves, their enrolling hospital admin,
    or a SYSTEM_ADMIN.
    """

    queryset = Receptionist.objects.select_related('user')
    serializer_class = ReceptionistUpdateSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrHospitalAdmin]
    lookup_field = 'id'
    http_method_names = ['patch', 'head', 'options']
