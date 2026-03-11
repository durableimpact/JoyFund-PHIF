from rest_framework import status
from rest_framework.generics import RetrieveAPIView, UpdateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import SocialWorker
from accounts.serializers import (
    SocialWorkerCreateSerializer,
    SocialWorkerDetailSerializer,
    SocialWorkerUpdateSerializer,
)
from accounts.utils import IsOwnerOrSystemAdmin, IsSystemAdmin


class SocialWorkerCreateView(APIView):
    """
    POST /api/accounts/social-workers/
    Only SYSTEM_ADMIN can create a Social Worker account.
    The `enrolled_by` field is automatically set to the requesting system admin.
    """

    permission_classes = [IsAuthenticated, IsSystemAdmin]

    def post(self, request):
        try:
            enrolled_by = request.user.systemadmin
        except Exception:
            return Response(
                {'detail': 'Requesting user does not have a SystemAdmin profile.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = SocialWorkerCreateSerializer(
            data=request.data,
            context={'enrolled_by': enrolled_by},
        )
        serializer.is_valid(raise_exception=True)
        social_worker = serializer.save()
        return Response(
            SocialWorkerDetailSerializer(social_worker).data,
            status=status.HTTP_201_CREATED,
        )


class SocialWorkerDetailView(RetrieveAPIView):
    """
    GET /api/accounts/social-workers/<id>/
    Accessible by the social worker themselves or a SYSTEM_ADMIN.
    """

    queryset = SocialWorker.objects.select_related('user', 'enrolled_by__user')
    serializer_class = SocialWorkerDetailSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrSystemAdmin]
    lookup_field = 'id'


class SocialWorkerUpdateView(UpdateAPIView):
    """
    PATCH /api/accounts/social-workers/<id>/
    Accessible by the social worker themselves or a SYSTEM_ADMIN.
    """

    queryset = SocialWorker.objects.select_related('user')
    serializer_class = SocialWorkerUpdateSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrSystemAdmin]
    lookup_field = 'id'
    http_method_names = ['patch', 'head', 'options']
