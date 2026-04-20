"""
Serializers package for vouchers app - organized by concern.

This package exports all serializers to maintain a clean public API.
Serializers are organized into modules:
- assignment.py: VoucherAssignment serializers
- hospital.py: Hospital staff (check-in, redeem) serializers
- voucher.py: CareVoucher serializers
- reporting.py: Report and reconciliation serializers
"""

# Import assignment serializers
from .assignment import VoucherAssignmentSerializer

# Import hospital serializers
from .hospital import (
    VoucherCheckInSerializer,
    VoucherCheckInResponseSerializer,
    VoucherRedeemSerializer,
    VoucherRedeemResponseSerializer,
)

# Import voucher serializers
from .voucher import (
    VoucherAuditLogSerializer,
    CareVoucherDetailSerializer,
    CareVoucherListSerializer,
)

# Import reporting serializers
from .reporting import (
    CareVoucherSerializer,
    ReportDocumentSerializer,
    VoucherReportSerializer,
    VoucherReportCreateSerializer,
)

__all__ = [
    # Assignment
    'VoucherAssignmentSerializer',
    # Hospital
    'VoucherCheckInSerializer',
    'VoucherCheckInResponseSerializer',
    'VoucherRedeemSerializer',
    'VoucherRedeemResponseSerializer',
    # Voucher
    'VoucherAuditLogSerializer',
    'CareVoucherDetailSerializer',
    'CareVoucherListSerializer',
    # Reporting
    'CareVoucherSerializer',
    'ReportDocumentSerializer',
    'VoucherReportSerializer',
    'VoucherReportCreateSerializer',
]
