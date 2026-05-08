from rest_framework import serializers
from notifications.models import Notification


class NotificationListSerializer(serializers.ModelSerializer):
    """Serializer for listing notifications with basic info."""
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id',
            'user_email',
            'title',
            'message',
            'notification_type',
            'is_read',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'user_email']


class NotificationSerializer(serializers.ModelSerializer):
    """Full serializer for notification detail view."""
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_id = serializers.CharField(source='user.id', read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id',
            'user_id',
            'user_email',
            'title',
            'message',
            'description',
            'notification_type',
            'is_read',
            'action_url',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'user_id', 'user_email']
    
    def create(self, validated_data):
        """Create a notification for the authenticated user."""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
