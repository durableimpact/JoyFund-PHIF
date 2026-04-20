"""
Views for hospital admin reporting and voucher reconciliation.
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.http import HttpResponse
from django.db.models import Count, Sum
from datetime import datetime, timedelta
import csv
import io

try:
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib import colors
    HAS_REPORTLAB = True
except ImportError:
    HAS_REPORTLAB = False

try:
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Alignment
    HAS_OPENPYXL = True
except ImportError:
    HAS_OPENPYXL = False

from ..models import CareVoucher, VoucherReport, ReportDocument
from ..serializers.reporting import (
    CareVoucherSerializer,
    VoucherReportSerializer,
    VoucherReportCreateSerializer,
)


class IsHospitalAdmin(IsAuthenticated):
    """
    Permission to check if user is a hospital admin.
    """

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        
        # Check if user is a hospital admin
        from accounts.models import HospitalAdmin
        return HospitalAdmin.objects.filter(user=request.user).exists()


class HospitalVoucherViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for hospital admins to view and filter their vouchers.
    
    Allows filtering by:
    - date_from, date_to: Date range filter
    - status: Voucher status (PENDING_APPROVAL, AVAILABLE, REDEEMED, etc.)
    
    Supports export to CSV and Excel.
    """
    serializer_class = CareVoucherSerializer
    permission_classes = [IsHospitalAdmin]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'created_at']
    ordering_fields = ['created_at', 'value', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        """Return vouchers for the authenticated hospital admin's hospital."""
        if getattr(self, 'swagger_fake_view', False):
            from vouchers.models import CareVoucher
            return CareVoucher.objects.none()
            
        from accounts.models import HospitalAdmin
        
        # Get hospital from admin profile
        try:
            hospital_admin = HospitalAdmin.objects.get(user=self.request.user)
            queryset = CareVoucher.objects.filter(hospital=hospital_admin.hospital)
        except HospitalAdmin.DoesNotExist:
            queryset = CareVoucher.objects.none()

        # Apply date range filtering
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')

        if date_from:
            try:
                date_from = datetime.fromisoformat(date_from).date()
                queryset = queryset.filter(created_at__date__gte=date_from)
            except (ValueError, TypeError):
                pass

        if date_to:
            try:
                date_to = datetime.fromisoformat(date_to).date()
                queryset = queryset.filter(created_at__date__lte=date_to)
            except (ValueError, TypeError):
                pass

        return queryset.select_related('beneficiary', 'hospital', 'service')

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """Export filtered vouchers to CSV."""
        vouchers = self.get_queryset()

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="vouchers_export.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'Voucher Code',
            'Beneficiary Initials',
            'Amount (XAF)',
            'Status',
            'Created Date',
            'Redeemed Date',
            'Expiry Date',
        ])

        for voucher in vouchers:
            first_init = voucher.beneficiary.first_name[0] if voucher.beneficiary.first_name else '?'
            last_init = voucher.beneficiary.last_name[0] if voucher.beneficiary.last_name else '?'
            
            writer.writerow([
                voucher.voucher_code,
                f"{first_init}{last_init}",
                float(voucher.value),
                voucher.get_status_display(),
                voucher.created_at.strftime('%Y-%m-%d'),
                voucher.redeemed_at.strftime('%Y-%m-%d') if voucher.redeemed_at else '',
                voucher.expiry_date.strftime('%Y-%m-%d') if voucher.expiry_date else '',
            ])

        return response

    @action(detail=False, methods=['get'])
    def export_excel(self, request):
        """Export filtered vouchers to Excel."""
        if not HAS_OPENPYXL:
            return Response(
                {'error': 'Excel export not available. Install openpyxl.'},
                status=status.HTTP_501_NOT_IMPLEMENTED
            )

        vouchers = self.get_queryset()

        wb = Workbook()
        ws = wb.active
        ws.title = "Vouchers"

        # Header row
        headers = [
            'Voucher Code',
            'Beneficiary Initials',
            'Amount (XAF)',
            'Status',
            'Created Date',
            'Redeemed Date',
            'Expiry Date',
        ]
        ws.append(headers)

        # Format header
        header_fill = PatternFill(start_color='4472C4', end_color='4472C4', fill_type='solid')
        header_font = Font(bold=True, color='FFFFFF')
        for cell in ws[1]:
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal='center')

        # Data rows
        for voucher in vouchers:
            first_init = voucher.beneficiary.first_name[0] if voucher.beneficiary.first_name else '?'
            last_init = voucher.beneficiary.last_name[0] if voucher.beneficiary.last_name else '?'
            
            ws.append([
                voucher.voucher_code,
                f"{first_init}{last_init}",
                float(voucher.value),
                voucher.get_status_display(),
                voucher.created_at.strftime('%Y-%m-%d'),
                voucher.redeemed_at.strftime('%Y-%m-%d') if voucher.redeemed_at else '',
                voucher.expiry_date.strftime('%Y-%m-%d') if voucher.expiry_date else '',
            ])

        # Auto-adjust column widths
        ws.column_dimensions['A'].width = 15
        ws.column_dimensions['B'].width = 12
        ws.column_dimensions['C'].width = 15
        ws.column_dimensions['D'].width = 20
        ws.column_dimensions['E'].width = 15
        ws.column_dimensions['F'].width = 15
        ws.column_dimensions['G'].width = 15

        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="vouchers_export.xlsx"'
        wb.save(response)

        return response

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get summary statistics for the date range."""
        vouchers = self.get_queryset()

        redeemed = vouchers.filter(status=CareVoucher.Status.REDEEMED).aggregate(
            count=Count('id'),
            total=Sum('value')
        )
        pending = vouchers.exclude(status=CareVoucher.Status.REDEEMED).aggregate(
            count=Count('id'),
            total=Sum('value')
        )

        return Response({
            'total_vouchers': vouchers.count(),
            'redeemed': {
                'count': redeemed['count'] or 0,
                'total_amount': float(redeemed['total']) if redeemed['total'] else 0,
            },
            'pending': {
                'count': pending['count'] or 0,
                'total_amount': float(pending['total']) if pending['total'] else 0,
            },
        })


class VoucherReportViewSet(viewsets.ModelViewSet):
    """
    ViewSet for hospital admins to manage monthly reconciliation reports.
    
    - List: View all their monthly reports
    - Create: Generate a new monthly report
    - Retrieve: View report details
    - Submit: Mark report as submitted for audit
    - Upload documents: Add proof documents to report
    """
    permission_classes = [IsHospitalAdmin]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'report_month']
    ordering_fields = ['report_month', 'created_at']
    ordering = ['-report_month']

    def get_queryset(self):
        """Return reports for the authenticated hospital admin's hospital."""
        
        # Bypass for drf-yasg schema generation 
        if getattr(self, 'swagger_fake_view', False):
            from vouchers.models import VoucherReport
            return VoucherReport.objects.none()
            
        from accounts.models import HospitalAdmin
        
        try:
            hospital_admin = HospitalAdmin.objects.get(user=self.request.user)
            return VoucherReport.objects.filter(
                hospital=hospital_admin.hospital
            ).prefetch_related('documents')
        except HospitalAdmin.DoesNotExist:
            return VoucherReport.objects.none()

    def get_serializer_class(self):
        if self.action == 'create':
            return VoucherReportCreateSerializer
        return VoucherReportSerializer

    def create(self, request, *args, **kwargs):
        """
        Create a new monthly report.
        Auto-calculates statistics from vouchers.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        report = serializer.save()
        
        # Calculate statistics
        self._calculate_report_statistics(report)

        return Response(
            VoucherReportSerializer(report).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """
        Submit report for audit.
        Changes status from DRAFT to SUBMITTED.
        """
        report = self.get_object()

        if report.status != VoucherReport.Status.DRAFT:
            return Response(
                {'error': f'Cannot submit report with status: {report.get_status_display()}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        report.status = VoucherReport.Status.SUBMITTED
        report.submitted_at = timezone.now()
        report.save()

        return Response(
            VoucherReportSerializer(report).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def upload_document(self, request, pk=None):
        """
        Upload a proof document (invoice, bank statement, receipt, etc.)
        to the report.
        """
        report = self.get_object()
        
        if report.status == VoucherReport.Status.APPROVED:
            return Response(
                {'error': 'Cannot add documents to approved reports'},
                status=status.HTTP_400_BAD_REQUEST
            )

        file = request.FILES.get('file')
        document_type = request.data.get('document_type', 'OTHER')
        description = request.data.get('description', '')

        if not file:
            return Response(
                {'error': 'File is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            document = ReportDocument.objects.create(
                report=report,
                file=file,
                document_type=document_type,
                description=description,
            )

            from ..serializers.reporting import ReportDocumentSerializer
            return Response(
                ReportDocumentSerializer(document).data,
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['get'])
    def export_pdf(self, request, pk=None):
        """
        Export report as PDF.
        Includes summary statistics and document list.
        """
        if not HAS_REPORTLAB:
            return Response(
                {'error': 'PDF export not available. Install reportlab.'},
                status=status.HTTP_501_NOT_IMPLEMENTED
            )

        report = self.get_object()
        buffer = io.BytesIO()

        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()

        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            textColor=colors.HexColor('#003366'),
            spaceAfter=30,
            alignment=1,
        )
        elements.append(Paragraph(
            f"Monthly Reconciliation Report<br/>{report.hospital.name}",
            title_style
        ))
        elements.append(Spacer(1, 0.2*inch))

        # Report period
        elements.append(Paragraph(
            f"<b>Report Period:</b> {report.report_month.strftime('%B %Y')}",
            styles['Normal']
        ))
        elements.append(Paragraph(
            f"<b>Status:</b> {report.get_status_display()}",
            styles['Normal']
        ))
        elements.append(Spacer(1, 0.3*inch))

        # Statistics table
        stats_data = [
            ['Metric', 'Value'],
            ['Total Vouchers Redeemed', str(report.total_vouchers_redeemed)],
            ['Total Services Provided', str(report.total_services_provided)],
            ['Total Amount Received (XAF)', f"{report.total_amount_received:,.2f}"],
            ['Total Pending Vouchers', str(report.total_pending_vouchers)],
            ['Total Pending Amount (XAF)', f"{report.total_pending_amount:,.2f}"],
        ]

        stats_table = Table(stats_data)
        stats_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#003366')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 14),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))

        elements.append(stats_table)
        elements.append(Spacer(1, 0.3*inch))

        # Notes
        if report.notes:
            elements.append(Paragraph("<b>Notes:</b>", styles['Heading3']))
            elements.append(Paragraph(report.notes, styles['Normal']))

        # Build PDF
        doc.build(elements)
        buffer.seek(0)

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="report_{report.report_month.strftime("%Y-%m")}.pdf"'
        response.write(buffer.getvalue())

        return response

    def _calculate_report_statistics(self, report):
        """
        Calculate and update report statistics based on vouchers for the report month.
        """
        from django.db.models import Count, Sum
        
        # Get first and last day of report month
        first_day = report.report_month
        last_day = (first_day + timedelta(days=32)).replace(day=1) - timedelta(days=1)

        # Filter vouchers for this hospital and month
        vouchers = CareVoucher.objects.filter(
            hospital=report.hospital,
            created_at__date__gte=first_day,
            created_at__date__lte=last_day,
        )

        # Calculate redeemed
        redeemed = vouchers.filter(
            status=CareVoucher.Status.REDEEMED
        ).aggregate(
            count=Count('id'),
            total=Sum('value')
        )

        # Calculate pending (not redeemed, not expired)
        pending = vouchers.exclude(
            status__in=[
                CareVoucher.Status.REDEEMED,
                CareVoucher.Status.EXPIRED,
            ]
        ).aggregate(
            count=Count('id'),
            total=Sum('value')
        )

        # Update report
        report.total_vouchers_redeemed = redeemed['count'] or 0
        report.total_amount_received = redeemed['total'] or 0
        report.total_services_provided = vouchers.filter(
            status=CareVoucher.Status.REDEEMED
        ).values('service').distinct().count()
        report.total_pending_vouchers = pending['count'] or 0
        report.total_pending_amount = pending['total'] or 0

        report.save()
