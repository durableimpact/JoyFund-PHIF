from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils.decorators import method_decorator
from drf_yasg.utils import swagger_auto_schema
from core.cache import cache_response
from accounts.models import User
from accounts.serializers.user import UnifiedUserSerializer

_TAG = "Users (Unified)"

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
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['role', 'is_verified']
    search_fields = ['first_name', 'last_name', 'email', 'phone_number']
    ordering_fields = ['created_at', 'role']

    @cache_response(group="unified_users", timeout=5 * 60)
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @cache_response(group="unified_users", timeout=10 * 60)
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
