from rest_framework import serializers

from ..models import WebhookEvent


class WebhookEventSerializer(serializers.ModelSerializer):
    gateway = serializers.StringRelatedField()

    class Meta:
        model = WebhookEvent
        fields = ['id', 'gateway', 'event_type', 'payload', 'received_at']
        read_only_fields = fields
