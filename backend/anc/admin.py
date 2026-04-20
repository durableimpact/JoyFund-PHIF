"""
Django admin configuration for ANC tracking models.
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import ANCEnrollment, ANCVisit, MissedAppointmentAlert, ANCCompletionCertificate


@admin.register(ANCEnrollment)
class ANCEnrollmentAdmin(admin.ModelAdmin):
    list_display = [
        'beneficiary_name',
        'status_badge',
        'enrollment_date',
        'expected_delivery_date',
        'visits_progress',
        'high_risk_badge',
    ]
    list_filter = ['status', 'high_risk', 'enrollment_date']
    search_fields = ['beneficiary__full_name', 'beneficiary__digital_health_id']
    readonly_fields = ['enrollment_date', 'created_at', 'updated_at', 'completion_percentage']
    fieldsets = (
        ('Beneficiary Information', {
            'fields': ('beneficiary', 'social_worker')
        }),
        ('Pregnancy Details', {
            'fields': (
                'gestational_age_at_enrollment',
                'expected_delivery_date',
                'delivery_date',
                'high_risk',
            )
        }),
        ('Program Status', {
            'fields': (
                'status',
                'enrollment_date',
                'completion_date',
                'completion_percentage',
                'notes',
            )
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def beneficiary_name(self, obj):
        return f"{obj.beneficiary.full_name} ({obj.beneficiary.digital_health_id})"
    beneficiary_name.short_description = 'Beneficiary'
    
    def status_badge(self, obj):
        colors = {
            ANCEnrollment.Status.ACTIVE: '#28a745',
            ANCEnrollment.Status.COMPLETED: '#007bff',
            ANCEnrollment.Status.DROPPED_OUT: '#dc3545',
            ANCEnrollment.Status.DELIVERED: '#6c757d',
        }
        color = colors.get(obj.status, '#808080')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 5px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_status_display(),
        )
    status_badge.short_description = 'Status'
    
    def visits_progress(self, obj):
        completed = obj.visits_completed
        total = 4
        percentage = obj.completion_percentage
        
        if percentage < 50:
            color = '#dc3545'  # Red
        elif percentage < 75:
            color = '#ffc107'  # Yellow
        else:
            color = '#28a745'  # Green
        
        return format_html(
            '<div style="width: 100px;"><span style="background-color: {}; color: white; padding: 5px;">{}/{} visits ({}%)</span></div>',
            color,
            completed,
            total,
            percentage,
        )
    visits_progress.short_description = 'Visit Progress'
    
    def high_risk_badge(self, obj):
        if obj.high_risk:
            return format_html(
                '<span style="background-color: #dc3545; color: white; padding: 5px 10px; border-radius: 3px;">HIGH RISK</span>'
            )
        return '—'
    high_risk_badge.short_description = 'Risk Level'


@admin.register(ANCVisit)
class ANCVisitAdmin(admin.ModelAdmin):
    list_display = [
        'beneficiary_name',
        'visit_number_display',
        'status_badge',
        'scheduled_date',
        'actual_date',
        'overdue_badge',
    ]
    list_filter = ['status', 'visit_number', 'scheduled_date']
    search_fields = ['enrollment__beneficiary__full_name']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Visit Information', {
            'fields': ('enrollment', 'visit_number', 'status')
        }),
        ('Scheduling', {
            'fields': ('scheduled_date', 'actual_date')
        }),
        ('Clinical Data', {
            'fields': (
                'weight_kg',
                'blood_pressure',
                'hemoglobin_level',
                'clinical_notes',
                'complications_noted',
            )
        }),
        ('Referral', {
            'fields': (
                'referred_to_hospital',
                'referral_reason',
            )
        }),
        ('Tracking', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def beneficiary_name(self, obj):
        return obj.enrollment.beneficiary.full_name
    beneficiary_name.short_description = 'Beneficiary'
    
    def visit_number_display(self, obj):
        return obj.get_visit_number_display()
    visit_number_display.short_description = 'Visit'
    
    def status_badge(self, obj):
        colors = {
            ANCVisit.Status.SCHEDULED: '#007bff',
            ANCVisit.Status.COMPLETED: '#28a745',
            ANCVisit.Status.MISSED: '#dc3545',
            ANCVisit.Status.RESCHEDULED: '#ffc107',
            ANCVisit.Status.CANCELLED: '#6c757d',
        }
        color = colors.get(obj.status, '#808080')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 5px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_status_display(),
        )
    status_badge.short_description = 'Status'
    
    def overdue_badge(self, obj):
        from datetime import datetime
        if obj.status in [ANCVisit.Status.COMPLETED, ANCVisit.Status.CANCELLED]:
            return '—'
        
        today = datetime.today().date()
        if obj.scheduled_date < today:
            return format_html(
                '<span style="background-color: #dc3545; color: white; padding: 5px 10px; border-radius: 3px;">OVERDUE</span>'
            )
        return '✓'
    overdue_badge.short_description = 'Status'


@admin.register(MissedAppointmentAlert)
class MissedAppointmentAlertAdmin(admin.ModelAdmin):
    list_display = [
        'beneficiary_name',
        'visit_number',
        'status_badge',
        'missed_date',
        'resolved_date',
    ]
    list_filter = ['status', 'missed_date']
    search_fields = ['enrollment__beneficiary__full_name']
    readonly_fields = ['missed_date', 'created_at', 'updated_at']
    fieldsets = (
        ('Alert Information', {
            'fields': ('enrollment', 'visit', 'status')
        }),
        ('Timeline', {
            'fields': (
                'missed_date',
                'alert_sent_at',
                'follow_up_date',
                'resolved_date',
            )
        }),
        ('Follow-up', {
            'fields': (
                'follow_up_notes',
                'rescheduled_visit',
            )
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def beneficiary_name(self, obj):
        return obj.enrollment.beneficiary.full_name
    beneficiary_name.short_description = 'Beneficiary'
    
    def visit_number(self, obj):
        return obj.visit.visit_number
    visit_number.short_description = 'Visit #'
    
    def status_badge(self, obj):
        colors = {
            MissedAppointmentAlert.AlertStatus.ACTIVE: '#dc3545',
            MissedAppointmentAlert.AlertStatus.RESOLVED: '#28a745',
            MissedAppointmentAlert.AlertStatus.DISMISSED: '#6c757d',
        }
        color = colors.get(obj.status, '#808080')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 5px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_status_display(),
        )
    status_badge.short_description = 'Status'


@admin.register(ANCCompletionCertificate)
class ANCCompletionCertificateAdmin(admin.ModelAdmin):
    list_display = [
        'certificate_number',
        'beneficiary_name',
        'status_badge',
        'issued_date',
        'issued_date_actual',
    ]
    list_filter = ['status', 'issued_date']
    search_fields = ['certificate_number', 'enrollment__beneficiary__full_name']
    readonly_fields = ['certificate_number', 'issued_date', 'created_at', 'updated_at']
    fieldsets = (
        ('Certificate Information', {
            'fields': ('certificate_number', 'enrollment', 'status')
        }),
        ('Timeline', {
            'fields': (
                'completion_date',
                'issued_date',
                'issued_date_actual',
            )
        }),
        ('People', {
            'fields': (
                'generated_by',
                'issued_by',
            )
        }),
        ('Document', {
            'fields': ('certificate_file',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def beneficiary_name(self, obj):
        return obj.enrollment.beneficiary.full_name
    beneficiary_name.short_description = 'Beneficiary'
    
    def status_badge(self, obj):
        colors = {
            ANCCompletionCertificate.CertificateStatus.PENDING: '#ffc107',
            ANCCompletionCertificate.CertificateStatus.GENERATED: '#007bff',
            ANCCompletionCertificate.CertificateStatus.PRINTED: '#28a745',
            ANCCompletionCertificate.CertificateStatus.ISSUED: '#6f42c1',
        }
        color = colors.get(obj.status, '#808080')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 5px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_status_display(),
        )
    status_badge.short_description = 'Status'
