from rest_framework import serializers


class TestPushSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    body = serializers.CharField(max_length=500)
    url = serializers.URLField(required=False, allow_blank=True)
    user_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        help_text="Send to specific users by ID. Ignored if broadcast is true.",
    )
    broadcast = serializers.BooleanField(
        required=False,
        default=False,
        help_text="Send to all subscribed users.",
    )
