from django.contrib import admin
from notifications.models import Notification, PushSubscription


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'notification_type', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read', 'created_at']
    search_fields = ['title', 'message', 'user__email']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Notification Info', {
            'fields': ('id', 'user', 'title', 'notification_type')
        }),
        ('Content', {
            'fields': ('message', 'description')
        }),
        ('Status', {
            'fields': ('is_read',)
        }),
        ('Action', {
            'fields': ('action_url',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    ordering = ['-created_at']
    
    def has_add_permission(self, request):
        """Allow adding notifications only through API or signals."""
        return True
    
    def has_delete_permission(self, request, obj=None):
        """Allow deleting notifications."""
        return True


@admin.register(PushSubscription)
class PushSubscriptionAdmin(admin.ModelAdmin):
    list_display = ["user", "endpoint", "user_agent", "created_at", "updated_at"]
    list_filter = ["created_at", "updated_at"]
    search_fields = ["user__email", "endpoint", "user_agent"]
    readonly_fields = ["id", "created_at", "updated_at"]
    raw_id_fields = ["user"]

    fieldsets = (
        ("User", {
            "fields": ("user",),
        }),
        ("Subscription", {
            "fields": ("endpoint", "p256dh_key", "auth_key"),
        }),
        ("Client Info", {
            "fields": ("user_agent",),
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )
