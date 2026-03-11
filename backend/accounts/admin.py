from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from accounts.models import (
    Donor,
    HospitalAdmin,
    Receptionist,
    Role,
    SocialWorker,
    SystemAdmin,
    User,
)


# ---------------------------------------------------------------------------
# User admin — auto-creates a SystemAdmin profile when role is SYSTEM_ADMIN
# ---------------------------------------------------------------------------

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'is_verified', 'is_staff')
    list_filter = ('role', 'is_verified', 'is_staff', 'is_active')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'phone_number')
    ordering = ('-date_joined',)

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Profile', {
            'fields': ('role', 'phone_number', 'is_verified', 'perfered_language'),
        }),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Profile', {
            'fields': ('role', 'phone_number', 'first_name', 'last_name', 'perfered_language'),
        }),
    )

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        # Automatically create a SystemAdmin profile when the role is SYSTEM_ADMIN
        if obj.role == Role.SYSTEM_ADMIN:
            SystemAdmin.objects.get_or_create(user=obj)


# ---------------------------------------------------------------------------
# Profile models
# ---------------------------------------------------------------------------

@admin.register(SystemAdmin)
class SystemAdminAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_username')
    search_fields = ('user__username', 'user__email')

    @admin.display(description='Username')
    def get_username(self, obj):
        return obj.user.username


@admin.register(HospitalAdmin)
class HospitalAdminAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_username', 'national_id_number', 'enrolled_by')
    search_fields = ('user__username', 'user__email', 'national_id_number')
    raw_id_fields = ('user', 'enrolled_by')

    @admin.display(description='Username')
    def get_username(self, obj):
        return obj.user.username


@admin.register(Receptionist)
class ReceptionistAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_username', 'national_id_number', 'enrolled_by', 'hospital')
    search_fields = ('user__username', 'user__email', 'national_id_number')
    raw_id_fields = ('user', 'enrolled_by', 'hospital')

    @admin.display(description='Username')
    def get_username(self, obj):
        return obj.user.username


@admin.register(SocialWorker)
class SocialWorkerAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_username', 'organization', 'region_assigned', 'is_approved', 'enrolled_by')
    list_filter = ('is_approved',)
    search_fields = ('user__username', 'user__email', 'organization', 'region_assigned')
    raw_id_fields = ('user', 'enrolled_by')

    @admin.display(description='Username')
    def get_username(self, obj):
        return obj.user.username


@admin.register(Donor)
class DonorAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_username', 'get_email')
    search_fields = ('user__username', 'user__email')
    raw_id_fields = ('user',)

    @admin.display(description='Username')
    def get_username(self, obj):
        return obj.user.username

    @admin.display(description='Email')
    def get_email(self, obj):
        return obj.user.email

