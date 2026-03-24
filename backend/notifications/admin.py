from django.contrib import admin
from notifications.models import Notification


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
