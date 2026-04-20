from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.db.models import Count, Sum
from .models import (
    VoucherAssignment,
    CareVoucher,
    UpgradeRequest,
    VoucherAuditLog,
    HospitalPayout,
    VoucherReport,
    ReportDocument,
)


@admin.register(VoucherReport)
class VoucherReportAdmin(admin.ModelAdmin):
    list_display = [
        'get_hospital_name',
        'report_month',
        'status_badge',
        'total_vouchers_redeemed',
        'total_amount_received',
        'submitted_at',
    ]
    list_filter = ['status', 'report_month', 'hospital']
    search_fields = ['hospital__name', 'notes']
    readonly_fields = [
        'id',
        'hospital',
        'generated_by',
        'total_vouchers_redeemed',
        'total_services_provided',
        'total_amount_received',
        'total_pending_vouchers',
        'total_pending_amount',
        'created_at',
        'updated_at',
    ]
    fieldsets = (
        ('Report Information', {
            'fields': ('hospital', 'report_month', 'generated_by')
        }),
        ('Statistics', {
            'fields': (
                'total_vouchers_redeemed',
                'total_services_provided',
                'total_amount_received',
                'total_pending_vouchers',
                'total_pending_amount',
            )
        }),
        ('Status & Audit', {
            'fields': ('status', 'notes', 'submitted_at', 'approved_by', 'approved_at', 'rejection_reason')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    ordering = ['-report_month']

    def get_hospital_name(self, obj):
        return obj.hospital.name
    get_hospital_name.short_description = 'Hospital'

    def status_badge(self, obj):
        """Display status with color coding."""
        colors = {
            VoucherReport.Status.DRAFT: '#FFC107',
            VoucherReport.Status.SUBMITTED: '#2196F3',
            VoucherReport.Status.APPROVED: '#4CAF50',
            VoucherReport.Status.REJECTED: '#F44336',
        }
        color = colors.get(obj.status, '#9E9E9E')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 9px; border-radius: 3px; font-weight: bold;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'

    def has_add_permission(self, request):
        # Reports are created via API by hospital admins
        return False


@admin.register(ReportDocument)
class ReportDocumentAdmin(admin.ModelAdmin):
    list_display = ['report', 'document_type', 'uploaded_at', 'file_link']
    list_filter = ['document_type', 'uploaded_at', 'report__hospital']
    search_fields = ['report__hospital__name', 'description']
    readonly_fields = ['id', 'report', 'uploaded_at']
    ordering = ['-uploaded_at']

    def file_link(self, obj):
        """Display link to file."""
        if obj.file:
            return format_html(
                '<a href="{}" target="_blank">View Document</a>',
                obj.file.url
            )
        return '-'
    file_link.short_description = 'File'

    def has_add_permission(self, request):
        # Documents are uploaded via API by hospital admins
        return False
