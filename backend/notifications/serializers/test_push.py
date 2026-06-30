from rest_framework import serializers


class PushActionSerializer(serializers.Serializer):
    action = serializers.CharField(max_length=50)
    title = serializers.CharField(max_length=100)


class TestPushSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    body = serializers.CharField(max_length=500)
    url = serializers.URLField(required=False, allow_blank=True)
    image = serializers.URLField(
        required=False,
        allow_blank=True,
        help_text="Optional image URL to display in the push notification.",
    )
    actions = PushActionSerializer(
        many=True,
        required=False,
        help_text="Optional list of action buttons [{action, title}].",
    )
    user_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        help_text="Send to specific users by ID. Ignored if broadcast or roles is set.",
    )
    roles = serializers.ListField(
        child=serializers.ChoiceField(choices=["SYSTEM_ADMIN", "HOSPITAL_ADMIN", "RECEPTIONIST", "SOCIAL_WORKER", "DONOR"]),
        required=False,
        help_text="Send to all users with these roles. Ignored if broadcast is true.",
    )
    broadcast = serializers.BooleanField(
        required=False,
        default=False,
        help_text="Send to all subscribed users.",
    )
