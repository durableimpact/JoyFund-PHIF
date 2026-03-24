from drf_yasg.utils import swagger_auto_schema
from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import IsAuthenticated

from accounts.serializers import UserInfoSerializer


_TAG = ['User Info']


class UserInfoView(RetrieveAPIView):
    """
    GET /api/accounts/info/
    Returns the current logged-in user's information with their profile and hospital (if applicable).
    
    For HOSPITAL_ADMIN and RECEPTIONIST:
    - Returns user data + hospital object
    
    For other roles (DONOR, SOCIAL_WORKER, SYSTEM_ADMIN):
    - Returns user data + their profile
    """
    serializer_class = UserInfoSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        """Return the current authenticated user."""
        return self.request.user

    @swagger_auto_schema(
        tags=_TAG,
        responses={200: UserInfoSerializer},
        operation_description='Get current user info with associated profile and hospital (if applicable).',
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
