from django import forms
from django.contrib import admin
from django.http import HttpResponseRedirect
from django.urls import reverse

from accounts.models import Role, User
from notifications.models import Notification, PushSubscription


class NotificationAdminForm(forms.ModelForm):
    target_roles = forms.MultipleChoiceField(
        choices=Role.choices,
        required=False,
        help_text="Leave empty to send to all active users. Ignored if a specific user is selected.",
        widget=forms.CheckboxSelectMultiple,
    )
    send_to_all = forms.BooleanField(
        required=False,
        initial=False,
        help_text="Send this notification to all active users (ignores user and role selection).",
    )

    class Meta:
        model = Notification
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["user"].required = False

    def clean(self):
        cleaned = super().clean()
        user = cleaned.get("user")
        send_to_all = cleaned.get("send_to_all")
        target_roles = cleaned.get("target_roles")

        if not user and not send_to_all and not target_roles:
            raise forms.ValidationError(
                "Select a recipient: pick a specific user, select target roles, or check 'Send to all'."
            )
        return cleaned


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    form = NotificationAdminForm
    list_display = ["title", "user", "notification_type", "is_read", "created_at"]
    list_filter = ["notification_type", "is_read", "created_at"]
    search_fields = ["title", "message", "user__email"]
    readonly_fields = ["id", "created_at", "updated_at"]

    fieldsets = (
        ("Notification Info", {
            "fields": ("id", "user", "title", "notification_type"),
        }),
        ("Content", {
            "fields": ("message", "description"),
        }),
        ("Status", {
            "fields": ("is_read",),
        }),
        ("Action", {
            "fields": ("action_url",),
        }),
        ("Broadcast", {
            "fields": ("target_roles", "send_to_all"),
            "description": "Leave user empty and select roles to broadcast. Or check 'Send to all'.",
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )

    ordering = ["-created_at"]

    def save_model(self, request, obj, form, change):
        if change:
            super().save_model(request, obj, form, change)
            return

        user = form.cleaned_data.get("user")
        send_to_all = form.cleaned_data.get("send_to_all", False)
        target_roles = form.cleaned_data.get("target_roles", [])

        if user:
            obj.user = user
            super().save_model(request, obj, form, change)
            return

        users = User.objects.filter(is_active=True)

        if send_to_all:
            pass
        elif target_roles:
            users = users.filter(role__in=target_roles)
        else:
            self.message_user(request, "Select a user, roles, or check 'Send to all'.", level="ERROR")
            return

        created_count = 0
        for target_user in users:
            Notification.objects.create(
                user=target_user,
                title=obj.title,
                message=obj.message,
                description=obj.description,
                notification_type=obj.notification_type,
                action_url=obj.action_url,
            )
            created_count += 1

        self.message_user(
            request,
            f"Notification sent to {created_count} user(s).",
        )

    def response_add(self, request, obj, post_url_continue=None):
        if obj.pk is None:
            return HttpResponseRedirect(reverse("admin:notifications_notification_changelist"))
        return super().response_add(request, obj, post_url_continue=post_url_continue)


@admin.register(PushSubscription)
class PushSubscriptionAdmin(admin.ModelAdmin):
    list_display = ["user", "short_endpoint", "user_agent", "created_at", "updated_at"]
    list_filter = ["created_at", "updated_at"]
    search_fields = ["user__email", "endpoint", "user_agent"]
    readonly_fields = ["id", "user", "endpoint", "p256dh_key", "auth_key", "user_agent", "created_at", "updated_at"]
    raw_id_fields = []

    actions = ["send_test_push"]

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

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    @admin.display(description="Endpoint")
    def short_endpoint(self, obj):
        return obj.endpoint[:60] + "..." if len(obj.endpoint) > 60 else obj.endpoint

    @admin.action(description="Send test push to selected subscriptions")
    def send_test_push(self, request, queryset):
        from notifications.webpush import send_push_notification

        sent = 0
        failed = 0
        for sub in queryset:
            try:
                ok = send_push_notification(
                    sub,
                    title="Test Push",
                    body="This is a test notification from the admin.",
                    tag="admin-test",
                )
                if ok:
                    sent += 1
                else:
                    failed += 1
            except Exception:
                failed += 1

        self.message_user(
            request,
            f"Test push sent to {sent} subscription(s). {failed} failed." if failed
            else f"Test push sent to {sent} subscription(s).",
        )
