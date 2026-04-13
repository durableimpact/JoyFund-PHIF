"""
DRF Serializers for API endpoints.
"""

from rest_framework import serializers
from .models import ActivityLog, RequestLog, ErrorLog


class ActivityLogSerializer(serializers.ModelSerializer):
    """Serializer for ActivityLog."""

    user_email = serializers.CharField(source='user.email', read_only=True, allow_null=True)

    class Meta:
        model = ActivityLog
        fields = (
            'id',
            'user',
            'user_email',
            'actor_label',
            'action',
            'level',
            'target_type',
            'target_id',
            'target_label',
            'description',
            'metadata',
            'ip_address',
            'user_agent',
            'request_id',
            'created_at',
        )
        read_only_fields = fields


class RequestLogSerializer(serializers.ModelSerializer):
    """Serializer for RequestLog."""

    user_email = serializers.CharField(source='user.email', read_only=True, allow_null=True)

    class Meta:
        model = RequestLog
        fields = (
            'id',
            'request_id',
            'user',
            'user_email',
            'method',
            'path',
            'query_params',
            'request_body',
            'status_code',
            'response_time_ms',
            'ip_address',
            'user_agent',
            'referrer',
            'created_at',
        )
        read_only_fields = fields


class ErrorLogSerializer(serializers.ModelSerializer):
    """Serializer for ErrorLog."""

    user_email = serializers.CharField(source='user.email', read_only=True, allow_null=True)

    class Meta:
        model = ErrorLog
        fields = (
            'id',
            'request_id',
            'user',
            'user_email',
            'error_type',
            'error_message',
            'stack_trace',
            'path',
            'extra',
            'created_at',
        )
        read_only_fields = fields
