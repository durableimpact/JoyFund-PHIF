from rest_framework import viewsets, filters
from rest_framework.permissions import BasePermission, IsAuthenticated
import django_filters
from django_filters.rest_framework import DjangoFilterBackend
from django.utils.decorators import method_decorator
from drf_yasg.utils import swagger_auto_schema
from core.cache import cache_response
from accounts.models import User
from accounts.serializers.user import UnifiedUserSerializer

_TAG = "Users (Unified)"


class IsSystemAdmin(BasePermission):
    """Allow access only to users with the SYSTEM_ADMIN role."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'role', None) == 'SYSTEM_ADMIN'
        )


class UnifiedUserFilterSet(django_filters.FilterSet):
    class Meta:
        model = User
        fields = {
            'role': ['exact'],
            'is_verified': ['exact'],
        }

@method_decorator(name='list', decorator=swagger_auto_schema(tags=[_TAG]))
@method_decorator(name='retrieve', decorator=swagger_auto_schema(tags=[_TAG]))
class UnifiedUserViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Unified endpoint to retrieve all users in the system and their specific details.
    """
    queryset = User.objects.select_related(
        'donor',
        'hospitaladmin__hospital',
        'receptionist__hospital',
        'socialworker',
        'systemadmin'
    ).all().order_by('-created_at')
    serializer_class = UnifiedUserSerializer
    permission_classes = [IsAuthenticated, IsSystemAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = UnifiedUserFilterSet
    search_fields = ['first_name', 'last_name', 'email', 'phone_number']
    ordering_fields = ['created_at', 'role']

    @cache_response(group="unified_users", timeout=5 * 60)
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @cache_response(group="unified_users", timeout=10 * 60)
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
