from django.contrib import admin
from .models import Beneficiary, BeneficiaryDocument, HealthIssue


@admin.register(Beneficiary)
class BeneficiaryAdmin(admin.ModelAdmin):
    list_display = (
        "digital_health_id",
        "full_name",
        "gender",
        "category",
        "is_verified",
        "enrolled_by",
        "created_at",
    )
    list_filter = (
        "gender",
        "category",
        "is_verified",
        "is_active",
        "created_at",
    )
    search_fields = (
        "digital_health_id",
        "full_name",
        "phone",
        "email",
        "national_id_number",
    )
    raw_id_fields = ("enrolled_by",)
    readonly_fields = ("digital_health_id", "created_at", "updated_at")
    date_hierarchy = "created_at"

    fieldsets = (
        (
            "Basic Information",
            {
                "fields": (
                    "digital_health_id",
                    "full_name",
                    "date_of_birth",
                    "gender",
                    "picture",
                ),
            },
        ),
        (
            "Classification",
            {
                "fields": (
                    "category",
                    "number_of_previous_births",
                ),
            },
        ),
        (
            "Contact Information",
            {
                "fields": (
                    "phone",
                    "email",
                    "region",
                    "city",
                    "address",
                ),
            },
        ),
        (
            "Location",
            {
                "fields": ("lat", "lng"),
                "classes": ("collapse",),
            },
        ),
        (
            "Identification",
            {
                "fields": ("national_id_number",),
            },
        ),
        (
            "Emergency Contact",
            {
                "fields": (
                    "emergency_contact_name",
                    "emergency_contact_phone",
                    "emergency_contact_relationship",
                ),
            },
        ),
        (
            "Enrollment",
            {
                "fields": ("enrolled_by", "is_verified", "is_active"),
            },
        ),
        (
            "Timestamps",
            {
                "fields": ("created_at", "updated_at"),
                "classes": ("collapse",),
            },
        ),
    )


@admin.register(BeneficiaryDocument)
class BeneficiaryDocumentAdmin(admin.ModelAdmin):
    list_display = ("id", "get_beneficiary", "uploaded_at")
    list_filter = ("uploaded_at",)
    search_fields = (
        "beneficiary__full_name",
        "beneficiary__digital_health_id",
        "description",
    )
    raw_id_fields = ("beneficiary",)
    readonly_fields = ("uploaded_at",)

    fieldsets = (
        ("Document", {"fields": ("beneficiary", "document", "description")}),
        (
            "Timestamps",
            {
                "fields": ("uploaded_at",),
                "classes": ("collapse",),
            },
        ),
    )

    @admin.display(description="Beneficiary")
    def get_beneficiary(self, obj):
        return f"{obj.beneficiary.full_name} ({obj.beneficiary.digital_health_id})"


@admin.register(HealthIssue)
class HealthIssueAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "get_beneficiary",
        "category",
        "severity",
        "status",
        "created_at",
    )
    list_filter = ("category", "severity", "status", "created_at")
    search_fields = (
        "beneficiary__full_name",
        "description",
        "beneficiary__digital_health_id",
    )
    raw_id_fields = ("beneficiary", "social_worker", "validated_by")
    readonly_fields = ("created_at", "updated_at")
    date_hierarchy = "created_at"

    fieldsets = (
        (
            "Health Issue",
            {
                "fields": (
                    "beneficiary",
                    "category",
                    "severity",
                    "status",
                    "description",
                )
            },
        ),
        (
            "Validation",
            {"fields": ("social_worker", "validated_by", "rejection_reason")},
        ),
        (
            "Timestamps",
            {
                "fields": ("created_at", "updated_at"),
                "classes": ("collapse",),
            },
        ),
    )

    @admin.display(description="Beneficiary")
    def get_beneficiary(self, obj):
        return f"{obj.beneficiary.full_name} ({obj.beneficiary.digital_health_id})"
