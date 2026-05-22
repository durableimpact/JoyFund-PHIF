from django.urls import path

from accounts.views.admin_dashboard import (
    AdminOverviewView,
    AdminFinancialView,
    AdminDonationTrendsView,
    AdminUserAnalyticsView,
    AdminBeneficiaryVoucherView,
    AdminOrganizationView,
    AdminTrendsReportView,
)

app_name = "admin_dashboard"

urlpatterns = [
    path("", AdminOverviewView.as_view(), name="admin-overview"),
    path("financial/", AdminFinancialView.as_view(), name="admin-financial"),
    path("donation-trends/", AdminDonationTrendsView.as_view(), name="admin-donation-trends"),
    path("user-analytics/", AdminUserAnalyticsView.as_view(), name="admin-user-analytics"),
    path("beneficiaries-vouchers/", AdminBeneficiaryVoucherView.as_view(), name="admin-beneficiary-voucher"),
    path("organization/", AdminOrganizationView.as_view(), name="admin-organization"),
    path("trends-reports/", AdminTrendsReportView.as_view(), name="admin-trends-reports"),
]
