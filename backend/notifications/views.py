from django_filters.rest_framework import DjangoFilterBackend
from drf_yasg.utils import swagger_auto_schema
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from notifications.models import Notification, NotificationType
from notifications.serializers import NotificationSerializer, NotificationListSerializer

_TAG = ['Notifications']


class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing notifications.
    
    Users can:
    - List their own notifications
    - Retrieve a specific notification
    - Mark notifications as read/unread
    - Delete notifications
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
    
    def get_queryset(self):
        """Return only notifications for the current user."""
        return Notification.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        """Use different serializers for list and detail views."""
        if self.action == 'list':
            return NotificationListSerializer
        return NotificationSerializer
    
    def perform_create(self, serializer):
        """Set the user to the current authenticated user."""
        serializer.save(user=self.request.user)
    
    @swagger_auto_schema(
        tags=_TAG,
        operation_description='List all notifications for the current user.',
        responses={200: NotificationListSerializer(many=True)}
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @swagger_auto_schema(
        tags=_TAG,
        operation_description='Retrieve a specific notification.',
        responses={200: NotificationSerializer}
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
    
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
        return Response({'message': f'{count} notifications marked as read'}, status=status.HTTP_200_OK)
    
    @swagger_auto_schema(
        tags=_TAG,
        operation_description='Get unread notification count.',
        responses={200: 'Unread notification count'}
    )
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get the count of unread notifications."""
        count = Notification.objects.filter(user=request.user, is_read=False).count()
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
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

