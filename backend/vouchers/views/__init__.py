"""
Views package for vouchers app - organized by concern.

This package exports all views and viewsets to maintain a clean public API.
Views are organized into modules:
- admin.py: Admin and system admin views
- hospital.py: Hospital staff views
- reporting.py: Hospital admin reporting viewsets
"""

# Import all views from admin module
from .admin import (
    VoucherAssignmentListView,
    ApproveVoucherAssignmentView,
    FlagVoucherAssignmentView,
    CareVoucherListView,
    CareVoucherDetailView,
)

# Import all views from hospital module
from .hospital import (
    VoucherCheckInView,
    VoucherRedeemView,
)

# Import reporting viewsets  
from .reporting import (
    HospitalVoucherViewSet,
    VoucherReportViewSet,
)

__all__ = [
    # Admin views
    'VoucherAssignmentListView',
    'ApproveVoucherAssignmentView',
    'FlagVoucherAssignmentView',
    'CareVoucherListView',
    'CareVoucherDetailView',
    # Hospital views
    'VoucherCheckInView',
    'VoucherRedeemView',
    # Reporting viewsets
    'HospitalVoucherViewSet',
    'VoucherReportViewSet',
]


