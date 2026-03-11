from rest_framework import status
from rest_framework.generics import RetrieveAPIView, UpdateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Donor
from accounts.serializers import (
    DonorDetailSerializer,
    DonorRegisterSerializer,
    DonorUpdateSerializer,
)
from accounts.utils import IsOwnerOrSystemAdmin


class DonorRegisterView(APIView):
    """
    POST /api/accounts/donors/register/
    Public — any unauthenticated visitor can register as a Donor.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = DonorRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        donor = serializer.save()
        return Response(
            DonorDetailSerializer(donor).data,
            status=status.HTTP_201_CREATED,
        )


class DonorDetailView(RetrieveAPIView):
    """
    GET /api/accounts/donors/<id>/
    Accessible by the donor themselves or a SYSTEM_ADMIN.
    """

    queryset = Donor.objects.select_related('user')
    serializer_class = DonorDetailSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrSystemAdmin]
    lookup_field = 'id'


class DonorUpdateView(UpdateAPIView):
    """
    PATCH /api/accounts/donors/<id>/
    Only the donor themselves can update their profile.
    """

    queryset = Donor.objects.select_related('user')
    serializer_class = DonorUpdateSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrSystemAdmin]
    lookup_field = 'id'
    http_method_names = ['patch', 'head', 'options']
