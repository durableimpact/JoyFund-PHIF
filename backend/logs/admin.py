"""
Django Admin configuration for logging models.
"""

from django.contrib import admin
from .models import ActivityLog, RequestLog, ErrorLog


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    """Admin interface for ActivityLog."""

    list_display = (
        'actor_label',
        'action',
        'level',
        'target_type',
        'target_label',
        'ip_address',
        'created_at',
    )
    list_filter = ('level', 'action', 'user', 'created_at')
    search_fields = ('actor_label', 'action', 'description', 'target_label', 'user__email')
    readonly_fields = (
        'id',
        'user',
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
    date_hierarchy = 'created_at'

    def has_add_permission(self, request):
        """Disallow adding logs via admin."""
        return False

    def has_change_permission(self, request, obj=None):
        """Disallow changing logs via admin."""
        return False

    def has_delete_permission(self, request, obj=None):
        """Allow deleting logs (e.g., for cleanup)."""
        return request.user.is_superuser


@admin.register(RequestLog)
class RequestLogAdmin(admin.ModelAdmin):
    """Admin interface for RequestLog."""

    list_display = (
        'method',
        'path',
        'action',
        'status_code',
        'response_time_ms',
        'user',
        'ip_address',
        'created_at',
    )
    list_filter = ('method', 'status_code', 'user', 'created_at', 'view_name')
    search_fields = ('path', 'ip_address', 'user__email', 'action', 'view_name')
    readonly_fields = (
        'id',
        'request_id',
        'user',
        'method',
        'path',
        'view_name',
        'action',
        'query_params',
        'request_body',
        'status_code',
        'response_time_ms',
        'ip_address',
        'user_agent',
        'referrer',
        'created_at',
    )
    date_hierarchy = 'created_at'

    def has_add_permission(self, request):
        """Disallow adding logs via admin."""
        return False

    def has_change_permission(self, request, obj=None):
        """Disallow changing logs via admin."""
        return False

    def has_delete_permission(self, request, obj=None):
        """Allow deleting logs (e.g., for cleanup)."""
        return request.user.is_superuser


@admin.register(ErrorLog)
class ErrorLogAdmin(admin.ModelAdmin):
    """Admin interface for ErrorLog."""

    list_display = (
        'error_type',
        'error_message_short',
        'user',
        'path',
        'created_at',
    )
    list_filter = ('error_type', 'user', 'created_at')
    search_fields = ('error_type', 'error_message', 'stack_trace', 'path', 'user__email')
    readonly_fields = (
        'id',
        'request_id',
        'user',
        'error_type',
        'error_message',
        'stack_trace',
        'path',
        'extra',
        'created_at',
    )
    date_hierarchy = 'created_at'

    def error_message_short(self, obj):
        """Display truncated error message."""
        return obj.error_message[:75]

    error_message_short.short_description = 'Error Message'

    def has_add_permission(self, request):
        """Disallow adding logs via admin."""
        return False

    def has_change_permission(self, request, obj=None):
        """Disallow changing logs via admin."""
        return False

    def has_delete_permission(self, request, obj=None):
        """Allow deleting logs (e.g., for cleanup)."""
        return request.user.is_superuser
