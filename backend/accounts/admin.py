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
    list_display = ('email', 'first_name', 'last_name', 'role', 'is_verified', 'is_staff')
    list_filter = ('role', 'is_verified', 'is_staff', 'is_active')
    search_fields = ('email', 'first_name', 'last_name', 'phone_number')
    ordering = ('-created_at',)

    fieldsets = (
        (None, {
            'fields': ('email', 'password'),
        }),
        ('Personal info', {
            'fields': ('first_name', 'last_name', 'phone_number', 'perfered_language'),
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        ('Profile', {
            'fields': ('role', 'is_verified'),
        }),
        ('Important dates', {
            'fields': ('last_login', 'created_at', 'updated_at'),
        }),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2'),
        }),
        ('Personal info', {
            'fields': ('first_name', 'last_name', 'phone_number', 'perfered_language'),
        }),
        ('Profile', {
            'fields': ('role', 'is_verified'),
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at', 'last_login')

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
    list_display = ('id', 'get_email')
    search_fields = ('user__email',)

    @admin.display(description='Email')
    def get_email(self, obj):
        return obj.user.email


@admin.register(HospitalAdmin)
class HospitalAdminAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_email', 'national_id_number', 'enrolled_by')
    search_fields = ('user__email', 'national_id_number')
    raw_id_fields = ('user', 'enrolled_by')

    @admin.display(description='Email')
    def get_email(self, obj):
        return obj.user.email


@admin.register(Receptionist)
class ReceptionistAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_email', 'national_id_number', 'enrolled_by', 'hospital')
    search_fields = ('user__email', 'national_id_number')
    raw_id_fields = ('user', 'enrolled_by', 'hospital')

    @admin.display(description='Email')
    def get_email(self, obj):
        return obj.user.email


@admin.register(SocialWorker)
class SocialWorkerAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_email', 'organization', 'region_assigned', 'is_approved', 'enrolled_by')
    list_filter = ('is_approved',)
    search_fields = ('user__email', 'organization', 'region_assigned')
    raw_id_fields = ('user', 'enrolled_by')

    @admin.display(description='Email')
    def get_email(self, obj):
        return obj.user.email


@admin.register(Donor)
class DonorAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_email')
    search_fields = ('user__email',)
    raw_id_fields = ('user',)

    @admin.display(description='Email')
    def get_email(self, obj):
        return obj.user.email

