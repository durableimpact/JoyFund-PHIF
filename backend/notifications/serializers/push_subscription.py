from rest_framework import serializers
from notifications.models import PushSubscription


class PushSubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PushSubscription
        fields = ["id", "endpoint", "p256dh_key", "auth_key", "user_agent", "created_at"]
        read_only_fields = ["id", "created_at"]


class PushSubscriptionRegisterSerializer(serializers.Serializer):
    endpoint = serializers.URLField(max_length=500)
    p256dh_key = serializers.CharField(max_length=256)
    auth_key = serializers.CharField(max_length=64)
    user_agent = serializers.CharField(required=False, default="", allow_blank=True)
