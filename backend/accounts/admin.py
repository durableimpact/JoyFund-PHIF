from django import forms
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import UserChangeForm, UserCreationForm
from django.utils import timezone
from django.db import transaction

from accounts.models import (
    Donor,
    HospitalAdmin,
    Receptionist,
    Role,
    SocialWorker,
    SystemAdmin,
    User,
    PasswordResetToken,
    EmailVerificationToken,
    UserDevice,
)

# ---------------------------------------------------------------------------
# User admin — auto-creates a SystemAdmin profile when role is SYSTEM_ADMIN
# ---------------------------------------------------------------------------


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = (
        "email",
        "first_name",
        "last_name",
        "role",
        "is_verified",
        "is_staff",
    )
    list_filter = ("role", "is_verified", "is_staff", "is_active")
    search_fields = ("email", "first_name", "last_name", "phone_number")
    ordering = ("-created_at",)

    fieldsets = (
        (
            None,
            {
                "fields": ("email", "password"),
            },
        ),
        (
            "Personal info",
            {
                "fields": (
                    "first_name",
                    "last_name",
                    "phone_number",
                    
                ),
            },
        ),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                ),
            },
        ),
        (
            "Profile",
            {
                "fields": ("role", "is_verified"),
            },
        ),
        (
            "Important dates",
            {
                "fields": ("last_login", "created_at", "updated_at"),
            },
        ),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "password1", "password2"),
            },
        ),
        (
            "Personal info",
            {
                "fields": (
                    "first_name",
                    "last_name",
                    "phone_number",
                    
                ),
            },
        ),
        (
            "Profile",
            {
                "fields": ("role", "is_verified"),
            },
        ),
    )

    readonly_fields = ("created_at", "updated_at", "last_login")

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        # Automatically create a SystemAdmin profile when the role is SYSTEM_ADMIN
        if obj.role == Role.SYSTEM_ADMIN:
            SystemAdmin.objects.get_or_create(user=obj)


# ---------------------------------------------------------------------------
# Custom ModelForms for Profile Models (with User fields)
# ---------------------------------------------------------------------------


class BaseProfileForm(forms.ModelForm):
    """Base form that includes User fields for inline user creation/editing."""

    email = forms.EmailField(label="User Email", required=True)
    first_name = forms.CharField(label="First Name", max_length=150, required=True)
    last_name = forms.CharField(label="Last Name", max_length=150, required=True)
    phone_number = forms.CharField(label="Phone Number", required=True)
    
    is_verified = forms.BooleanField(label="Verified", required=False)
    is_active = forms.BooleanField(label="Active", required=False, initial=True)

    class Meta:
        fields = []  # Override in subclasses

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Populate user fields if editing an existing profile with a user
        if self.instance.pk:
            try:
                user = self.instance.user
                self.fields["email"].initial = user.email
                self.fields["first_name"].initial = user.first_name
                self.fields["last_name"].initial = user.last_name
                self.fields["phone_number"].initial = user.phone_number
                self.fields["is_verified"].initial = user.is_verified
                self.fields["is_active"].initial = user.is_active
            except Exception:
                # Profile exists but no user linked yet - form fields will be empty
                pass

    def clean_email(self):
        email = self.cleaned_data.get("email")
        if email:
            # Check if email is taken by another user (not the current one being edited)
            if self.instance.pk:
                try:
                    user_id = self.instance.user.id
                    existing = User.objects.filter(email=email).exclude(id=user_id)
                except Exception:
                    # No user linked yet, check if email exists at all
                    existing = User.objects.filter(email=email)
            else:
                existing = User.objects.filter(email=email)

            if existing.exists():
                raise forms.ValidationError("This email is already in use.")
        return email

    @transaction.atomic
    def save(self, commit=True):
        profile = super().save(commit=False)

        # Handle user creation or update
        if profile.pk:
            try:
                user = profile.user
            except Exception:
                # Profile exists but no user yet - create a new one
                user = User()
        else:
            # Creating new profile - create a new user
            user = User()

        # Update user fields with defaults to handle None from get()
        user.email = self.cleaned_data.get("email", "")
        user.first_name = self.cleaned_data.get("first_name", "")
        user.last_name = self.cleaned_data.get("last_name", "")
        user.phone_number = self.cleaned_data.get("phone_number", "")
        user.is_verified = self.cleaned_data.get("is_verified", False)
        user.is_active = self.cleaned_data.get("is_active", True)

        if commit:
            user.save()
            profile.user = user
            profile.save()
            self.save_m2m()

        return profile


class DonorForm(BaseProfileForm):
    class Meta:
        model = Donor
        fields = []  # User fields are handled by BaseProfileForm


class ReceptionistForm(BaseProfileForm):
    national_id_number = forms.CharField(label="National ID Number", required=False)

    class Meta:
        model = Receptionist
        fields = ["hospital", "enrolled_by", "national_id_number"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance.pk:
            try:
                self.fields["national_id_number"].initial = (
                    self.instance.national_id_number
                )
            except Exception:
                pass

    def save(self, commit=True):
        instance = super().save(commit=False)
        instance.national_id_number = self.cleaned_data.get("national_id_number", "")
        if commit:
            instance.save()
        return instance


class SocialWorkerForm(BaseProfileForm):
    national_id_number = forms.CharField(label="National ID Number", required=False)

    class Meta:
        model = SocialWorker
        fields = [
            "organization",
            "region_assigned",
            "is_approved",
            "enrolled_by",
            "national_id_number",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance.pk:
            try:
                self.fields["national_id_number"].initial = (
                    self.instance.national_id_number
                )
            except Exception:
                pass

    def save(self, commit=True):
        instance = super().save(commit=False)
        instance.national_id_number = self.cleaned_data.get("national_id_number", "")
        if commit:
            instance.save()
        return instance


class SystemAdminForm(BaseProfileForm):
    class Meta:
        model = SystemAdmin
        fields = []


class HospitalAdminForm(BaseProfileForm):
    national_id_number = forms.CharField(label="National ID Number", required=False)

    class Meta:
        model = HospitalAdmin
        fields = ["hospital", "national_id_number", "enrolled_by"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance.pk:
            try:
                self.fields["national_id_number"].initial = (
                    self.instance.national_id_number
                )
            except Exception:
                pass

    def save(self, commit=True):
        instance = super().save(commit=False)
        instance.national_id_number = self.cleaned_data.get("national_id_number", "")
        if commit:
            instance.save()
        return instance


# ---------------------------------------------------------------------------
# Profile models
# ---------------------------------------------------------------------------


@admin.register(SystemAdmin)
class SystemAdminAdmin(admin.ModelAdmin):
    form = SystemAdminForm
    list_display = ("id", "get_email")
    search_fields = ("user__email",)
    fieldsets = (
        (
            "User Information",
            {
                "fields": (
                    "email",
                    "first_name",
                    "last_name",
                    "phone_number",
                    
                ),
            },
        ),
        (
            "Account Status",
            {
                "fields": ("is_active", "is_verified"),
            },
        ),
    )

    @admin.display(description="Email")
    def get_email(self, obj):
        return obj.user.email


@admin.register(HospitalAdmin)
class HospitalAdminAdmin(admin.ModelAdmin):
    form = HospitalAdminForm
    list_display = ("id", "get_email", "national_id_number", "enrolled_by")
    search_fields = ("user__email", "national_id_number")
    raw_id_fields = ("enrolled_by",)
    fieldsets = (
        (
            "User Information",
            {
                "fields": (
                    "email",
                    "first_name",
                    "last_name",
                    "phone_number",
                    
                ),
            },
        ),
        (
            "Hospital Assignment",
            {
                "fields": ("hospital", "enrolled_by"),
            },
        ),
        (
            "Verification",
            {
                "fields": ("national_id_number", "is_verified", "is_active"),
            },
        ),
    )

    @admin.display(description="Email")
    def get_email(self, obj):
        return obj.user.email


@admin.register(Receptionist)
class ReceptionistAdmin(admin.ModelAdmin):
    form = ReceptionistForm
    list_display = ("id", "get_email", "national_id_number", "enrolled_by", "hospital")
    search_fields = ("user__email", "national_id_number")
    raw_id_fields = ("enrolled_by", "hospital")
    fieldsets = (
        (
            "User Information",
            {
                "fields": (
                    "email",
                    "first_name",
                    "last_name",
                    "phone_number",
                    
                ),
            },
        ),
        (
            "Hospital Assignment",
            {
                "fields": ("hospital", "enrolled_by"),
            },
        ),
        (
            "Verification",
            {
                "fields": ("national_id_number", "is_verified", "is_active"),
            },
        ),
    )

    @admin.display(description="Email")
    def get_email(self, obj):
        return obj.user.email


@admin.register(SocialWorker)
class SocialWorkerAdmin(admin.ModelAdmin):
    form = SocialWorkerForm
    list_display = (
        "id",
        "get_email",
        "organization",
        "region_assigned",
        "is_approved",
        "enrolled_by",
    )
    list_filter = ("is_approved",)
    search_fields = ("user__email", "organization", "region_assigned")
    raw_id_fields = ("enrolled_by",)
    fieldsets = (
        (
            "User Information",
            {
                "fields": (
                    "email",
                    "first_name",
                    "last_name",
                    "phone_number",
                    
                ),
            },
        ),
        (
            "Organization Details",
            {
                "fields": ("organization", "region_assigned", "enrolled_by"),
            },
        ),
        (
            "Status",
            {
                "fields": (
                    "is_approved",
                    "national_id_number",
                    "is_verified",
                    "is_active",
                ),
            },
        ),
    )

    @admin.display(description="Email")
    def get_email(self, obj):
        return obj.user.email


@admin.register(Donor)
class DonorAdmin(admin.ModelAdmin):
    form = DonorForm
    list_display = ("id", "get_email")
    search_fields = ("user__email",)
    fieldsets = (
        (
            "User Information",
            {
                "fields": (
                    "email",
                    "first_name",
                    "last_name",
                    "phone_number",
                    
                ),
            },
        ),
        (
            "Account Status",
            {
                "fields": ("is_verified", "is_active"),
            },
        ),
    )

    @admin.display(description="Email")
    def get_email(self, obj):
        return obj.user.email


# ---------------------------------------------------------------------------
# Token Management
# ---------------------------------------------------------------------------


@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "get_email",
        "code",
        "created_at",
        "expires_at",
        "is_used",
        "is_valid",
    )
    list_filter = ("is_used", "created_at", "expires_at")
    search_fields = ("user__email", "code")
    readonly_fields = ("id", "code", "created_at", "expires_at")
    raw_id_fields = ("user",)
    ordering = ("-created_at",)

    @admin.display(description="Email")
    def get_email(self, obj):
        return obj.user.email

    @admin.display(description="Valid", boolean=True)
    def is_valid(self, obj):
        return obj.is_valid


@admin.register(EmailVerificationToken)
class EmailVerificationTokenAdmin(admin.ModelAdmin):
    list_display = ("id", "get_email", "code", "created_at", "expires_at", "is_valid")
    list_filter = ("created_at", "expires_at")
    search_fields = ("user__email", "code")
    readonly_fields = ("id", "code", "created_at", "expires_at")
    raw_id_fields = ("user",)
    ordering = ("-created_at",)

    @admin.display(description="Email")
    def get_email(self, obj):
        return obj.user.email


# ---------------------------------------------------------------------------
# Device Management
# ---------------------------------------------------------------------------


@admin.register(UserDevice)
class UserDeviceAdmin(admin.ModelAdmin):
    list_display = (
        "device_name",
        "get_email",
        "device_type",
        "browser",
        "os",
        "ip_address",
        "last_active",
        "is_blocked",
        "is_trusted",
    )
    list_filter = ("device_type", "is_blocked", "is_trusted", "last_active", "created_at")
    search_fields = ("device_name", "user__email", "ip_address", "browser", "os")
    readonly_fields = (
        "id",
        "user",
        "device_name",
        "device_type",
        "browser",
        "os",
        "ip_address",
        "user_agent",
        "last_active",
        "created_at",
    )
    raw_id_fields = ("user",)
    ordering = ("-last_active",)
    date_hierarchy = "last_active"

    fieldsets = (
        (
            "Device Info",
            {
                "fields": (
                    "device_name",
                    "device_type",
                    "browser",
                    "os",
                ),
            },
        ),
        (
            "Network",
            {
                "fields": ("ip_address", "user_agent"),
            },
        ),
        (
            "User",
            {
                "fields": ("user",),
            },
        ),
        (
            "Status",
            {
                "fields": ("is_blocked", "is_trusted"),
            },
        ),
        (
            "Timestamps",
            {
                "fields": ("last_active", "created_at"),
            },
        ),
    )

    actions = ["block_selected", "unblock_selected"]

    @admin.display(description="User")
    def get_email(self, obj):
        return obj.user.email

    @admin.action(description="Block selected devices")
    def block_selected(self, request, queryset):
        updated = queryset.update(is_blocked=True, is_trusted=False)
        self.message_user(request, f"{updated} device(s) blocked.")

    @admin.action(description="Unblock selected devices")
    def unblock_selected(self, request, queryset):
        updated = queryset.update(is_blocked=False)
        self.message_user(request, f"{updated} device(s) unblocked.")
