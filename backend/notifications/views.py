from django.core.cache import cache
from django_filters.rest_framework import DjangoFilterBackend
from drf_yasg.utils import swagger_auto_schema
from rest_framework import viewsets, mixins, status
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from notifications.models import Notification, NotificationType
from notifications.serializers import NotificationSerializer, NotificationListSerializer

_TAG = ['Notifications']
CACHE_TIMEOUT = 5 * 60  # 5 minutes


class NotificationViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """
    ViewSet for managing notifications (read-only creation).
    
    Users can:
    - List their own notifications
    - Retrieve a specific notification
    - Mark notifications as read/unread
    - Delete notifications
    
    Notifications are created by the system only.
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = {
        'notification_type': ['exact'],
        'is_read': ['exact'],
        'created_at': ['date', 'gte', 'lte'],
    }
    search_fields = ['title', 'message', 'description']
    ordering_fields = ['created_at', 'updated_at', 'is_read']
    ordering = ['-created_at']
    
    @staticmethod
    def _get_list_cache_key(user_id):
        """Get cache key for user's notification list"""
        return f'notification_list_{user_id}'
    
    @staticmethod
    def _get_detail_cache_key(notification_id):
        """Get cache key for notification detail"""
        return f'notification_detail_{notification_id}'
    
    @staticmethod
    def _get_unread_count_cache_key(user_id):
        """Get cache key for unread notification count"""
        return f'notification_unread_count_{user_id}'
    
    @staticmethod
    def _invalidate_list_cache(user_id):
        """Invalidate user's notification list cache"""
        cache.delete(NotificationViewSet._get_list_cache_key(user_id))
    
    @staticmethod
    def _invalidate_detail_cache(notification_id):
        """Invalidate notification detail cache"""
        cache.delete(NotificationViewSet._get_detail_cache_key(notification_id))
    
    @staticmethod
    def _invalidate_unread_count_cache(user_id):
        """Invalidate user's unread count cache"""
        cache.delete(NotificationViewSet._get_unread_count_cache_key(user_id))
    
    def get_queryset(self):
        """Return only notifications for the current user."""
        # Handle schema generation for Swagger
        if getattr(self, 'swagger_fake_view', False):
            return Notification.objects.none()
        
        return Notification.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        """Use different serializers for list and detail views."""
        if self.action == 'list':
            return NotificationListSerializer
        return NotificationSerializer
    
    @swagger_auto_schema(
        tags=_TAG,
        operation_description='List all notifications for the current user.',
        responses={200: NotificationListSerializer(many=True)}
    )
    def list(self, request, *args, **kwargs):
        user_id = request.user.id
        cache_key = self._get_list_cache_key(user_id)
        try:
            cached_data = cache.get(cache_key)
            if cached_data is not None:
                return Response(cached_data, status=status.HTTP_200_OK)
        except Exception:
            pass
        
        response = super().list(request, *args, **kwargs)
        try:
            cache.set(cache_key, response.data, CACHE_TIMEOUT)
        except Exception:
            pass
        return response
    
    @swagger_auto_schema(
        tags=_TAG,
        operation_description='Retrieve a specific notification.',
        responses={200: NotificationSerializer}
    )
    def retrieve(self, request, *args, **kwargs):
        notification_id = kwargs.get('pk')
        cache_key = self._get_detail_cache_key(notification_id)
        try:
            cached_data = cache.get(cache_key)
            if cached_data is not None:
                return Response(cached_data, status=status.HTTP_200_OK)
        except Exception:
            pass
        
        response = super().retrieve(request, *args, **kwargs)
        try:
            cache.set(cache_key, response.data, CACHE_TIMEOUT)
        except Exception:
            pass
        return response
    
    @swagger_auto_schema(
        tags=_TAG,
        operation_description='Mark a notification as read.',
        responses={200: NotificationSerializer}
    )
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark a notification as read."""
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        
        # Invalidate caches
        self._invalidate_list_cache(request.user.id)
        self._invalidate_detail_cache(notification.id)
        self._invalidate_unread_count_cache(request.user.id)
        
        serializer = self.get_serializer(notification)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @swagger_auto_schema(
        tags=_TAG,
        operation_description='Mark a notification as unread.',
        responses={200: NotificationSerializer}
    )
    @action(detail=True, methods=['post'])
    def mark_as_unread(self, request, pk=None):
        """Mark a notification as unread."""
        notification = self.get_object()
        notification.is_read = False
        notification.save()
        
        # Invalidate caches
        self._invalidate_list_cache(request.user.id)
        self._invalidate_detail_cache(notification.id)
        self._invalidate_unread_count_cache(request.user.id)
        
        serializer = self.get_serializer(notification)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @swagger_auto_schema(
        tags=_TAG,
        operation_description='Mark all notifications as read.',
        responses={200: 'All notifications marked as read'}
    )
    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """Mark all notifications as read for the current user."""
        count = Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        
        # Invalidate all caches
        self._invalidate_list_cache(request.user.id)
        self._invalidate_unread_count_cache(request.user.id)
        
        return Response({'message': f'{count} notifications marked as read'}, status=status.HTTP_200_OK)
    
    @swagger_auto_schema(
        tags=_TAG,
        operation_description='Get unread notification count.',
        responses={200: 'Unread notification count'}
    )
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get the count of unread notifications."""
        user_id = request.user.id
        cache_key = self._get_unread_count_cache_key(user_id)
        cached_count = cache.get(cache_key)
        
        if cached_count is not None:
            return Response({'unread_count': cached_count}, status=status.HTTP_200_OK)
        
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        cache.set(cache_key, count, CACHE_TIMEOUT)
        return Response({'unread_count': count}, status=status.HTTP_200_OK)
    
    @swagger_auto_schema(
        tags=_TAG,
        operation_description='Get notifications by type.',
        responses={200: NotificationListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """Get notifications filtered by type."""
        notification_type = request.query_params.get('type')
        if not notification_type:
            return Response(
                {'error': 'type query parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if notification_type not in [choice[0] for choice in NotificationType.choices]:
            return Response(
                {'error': f'Invalid notification type: {notification_type}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        notifications = self.get_queryset().filter(notification_type=notification_type)
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @swagger_auto_schema(
        tags=_TAG,
        operation_description='Delete a notification.',
        responses={204: 'Notification deleted'}
    )
    @action(detail=True, methods=['delete'])
    def delete_notification(self, request, pk=None):
        """Delete a notification."""
        notification = self.get_object()
        user_id = notification.user.id
        notification_id = notification.id
        notification.delete()
        
        # Invalidate caches
        self._invalidate_list_cache(user_id)
        self._invalidate_detail_cache(notification_id)
        self._invalidate_unread_count_cache(user_id)
        
        return Response(status=status.HTTP_204_NO_CONTENT)

