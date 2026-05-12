from django.contrib import admin
from .models import (
    Hospital,
    Services,
    MedicalClaim,
    ClaimItem,
    MedicalClaimProof,
    VoucherTopUpRequest,
)


@admin.register(Hospital)
class HospitalAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "email",
        "phone_number",
        "city",
        "partnership_status",
        "created_at",
    )
    list_filter = ("partnership_status", "created_at")
    search_fields = ("name", "email", "phone_number", "city", "address")
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        ("Basic Information", {"fields": ("name", "email", "phone_number", "address")}),
        ("Location", {"fields": ("city", "region", "lat", "lng", "gps_coordinates")}),
        (
            "Contact & Payment",
            {
                "fields": (
                    "website",
                    "momo_number",
                    "momo_name",
                    "orange_number",
                    "orange_name",
                    "bank_account_number",
                    "bank_account_name",
                    "bank_name",
                    "bank_branch",
                )
            },
        ),
        (
            "Accreditation",
            {
                "fields": (
                    "accreditation_number",
                    "licence_number",
                    "partnership_status",
                    "is_active",
                )
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

    list_per_page = 25
    ordering = ("-created_at",)


@admin.register(Services)
class ServicesAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "hospital",
        "category",
        "price",
        "is_available",
        "created_at",
    )
    list_filter = ("category", "hospital", "created_at")
    search_fields = ("name", "description", "hospital__name")
    raw_id_fields = ("hospital",)
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        (
            "Service Information",
            {"fields": ("hospital", "name", "category", "price", "description")},
        ),
        ("Status", {"fields": ("is_available",)}),
        (
            "Timestamps",
            {
                "fields": ("created_at", "updated_at"),
                "classes": ("collapse",),
            },
        ),
    )

    list_per_page = 25
    ordering = ("-created_at",)


class ClaimItemInline(admin.TabularInline):
    model = ClaimItem
    extra = 1
    fields = ("name", "amount")
    readonly_fields = ("amount",)


class MedicalClaimProofInline(admin.TabularInline):
    model = MedicalClaimProof
    extra = 0
    fields = ("document_type", "file", "verification_status")
    readonly_fields = ("verification_status",)


@admin.register(MedicalClaim)
class MedicalClaimAdmin(admin.ModelAdmin):
    list_display = ("id", "get_hospital", "total_cost", "claim_status", "submitted_at")
    list_filter = ("claim_status", "hospital", "submitted_at")
    search_fields = ("service_description", "hospital__name", "voucher__voucher_code")
    raw_id_fields = ("voucher", "hospital", "submitted_by", "reviewed_by")
    readonly_fields = ("submitted_at", "reviewed_at", "service_completed_at")
    inlines = [ClaimItemInline, MedicalClaimProofInline]

    fieldsets = (
        (
            "Claim Information",
            {"fields": ("voucher", "hospital", "service_description", "total_cost")},
        ),
        ("Status", {"fields": ("claim_status", "rejection_reason")}),
        (
            "Submission & Review",
            {
                "fields": (
                    "submitted_at",
                    "submitted_by",
                    "reviewed_at",
                    "reviewed_by",
                    "service_completed_at",
                )
            },
        ),
    )

    list_per_page = 25
    ordering = ("-submitted_at",)

    @admin.display(description="Hospital")
    def get_hospital(self, obj):
        return obj.hospital.name


@admin.register(ClaimItem)
class ClaimItemAdmin(admin.ModelAdmin):
    list_display = ("get_medical_claim", "name", "amount")
    list_filter = ("medical_claim__hospital", "medical_claim__submitted_at")
    search_fields = ("medical_claim__service_description", "name")
    raw_id_fields = ("medical_claim",)

    fieldsets = (("Item Information", {"fields": ("medical_claim", "name", "amount")}),)

    list_per_page = 25
    ordering = ("-medical_claim__submitted_at",)

    @admin.display(description="Medical Claim")
    def get_medical_claim(self, obj):
        return f"Claim #{obj.medical_claim.id}"


@admin.register(MedicalClaimProof)
class MedicalClaimProofAdmin(admin.ModelAdmin):
    list_display = ("get_claim", "document_type", "verification_status", "uploaded_at")
    list_filter = ("document_type", "verification_status", "uploaded_at")
    search_fields = ("medical_claim__service_description", "document_type")
    raw_id_fields = ("medical_claim", "uploaded_by", "verified_by")
    readonly_fields = ("uploaded_at", "updated_at", "verified_at")

    fieldsets = (
        (
            "Document Information",
            {"fields": ("medical_claim", "document_type", "file")},
        ),
        ("Upload", {"fields": ("uploaded_by", "uploaded_at")}),
        (
            "Verification",
            {
                "fields": (
                    "verification_status",
                    "verified_by",
                    "verified_at",
                    "rejection_reason",
                )
            },
        ),
        (
            "Timestamps",
            {
                "fields": ("updated_at",),
                "classes": ("collapse",),
            },
        ),
    )

    list_per_page = 25
    ordering = ("-uploaded_at",)

    @admin.display(description="Claim")
    def get_claim(self, obj):
        return f"Claim #{obj.medical_claim.id}"


@admin.register(VoucherTopUpRequest)
class VoucherTopUpRequestAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "get_medical_claim",
        "requested_amount",
        "status",
        "created_at",
    )
    list_filter = ("status", "created_at")
    search_fields = ("medical_claim__service_description", "reason")
    raw_id_fields = ("medical_claim", "created_by", "reviewed_by")
    readonly_fields = ("created_at", "reviewed_at")

    fieldsets = (
        (
            "Request Information",
            {"fields": ("medical_claim", "requested_amount", "reason")},
        ),
        (
            "Status & Review",
            {"fields": ("status", "review_notes", "created_by", "reviewed_by")},
        ),
        (
            "Timestamps",
            {
                "fields": ("created_at", "reviewed_at"),
                "classes": ("collapse",),
            },
        ),
    )

    list_per_page = 25
    ordering = ("-created_at",)

    @admin.display(description="Medical Claim")
    def get_medical_claim(self, obj):
        return f"Claim #{obj.medical_claim.id}"
