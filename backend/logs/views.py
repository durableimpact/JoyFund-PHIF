"""
DRF Views for log endpoints.
"""

from datetime import datetime, timedelta
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Count, Q, Avg
from .models import ActivityLog, RequestLog, ErrorLog
from .serializers import ActivityLogSerializer, RequestLogSerializer, ErrorLogSerializer


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for querying ActivityLog entries.
    Only accessible to admin users.
    """

    queryset = ActivityLog.objects.all()
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['level', 'action']
    search_fields = ['description', 'actor_label', 'action']
    ordering_fields = ['created_at', 'level', 'action']
    ordering = ['-created_at']
    pagination_class = None  # Will use default pagination from settings

    def get_queryset(self):
        """Filter by date range and user_id if provided."""
        queryset = super().get_queryset()

        # Filter by from_date
        from_date_str = self.request.query_params.get('from_date')
        if from_date_str:
            try:
                from_date = datetime.fromisoformat(from_date_str)
                queryset = queryset.filter(created_at__gte=from_date)
            except (ValueError, TypeError):
                pass

        # Filter by to_date
        to_date_str = self.request.query_params.get('to_date')
        if to_date_str:
            try:
                to_date = datetime.fromisoformat(to_date_str)
                queryset = queryset.filter(created_at__lte=to_date)
            except (ValueError, TypeError):
                pass

        # Filter by user_id
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)

        return queryset


class RequestLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for querying RequestLog entries.
    Only accessible to admin users.
    """

    queryset = RequestLog.objects.all()
    serializer_class = RequestLogSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['method', 'status_code']
    search_fields = ['path', 'ip_address']
    ordering_fields = ['created_at', 'response_time_ms', 'status_code']
    ordering = ['-created_at']
    pagination_class = None  # Will use default pagination from settings

    def get_queryset(self):
        """Filter by date range and user_id if provided."""
        queryset = super().get_queryset()

        # Filter by from_date
        from_date_str = self.request.query_params.get('from_date')
        if from_date_str:
            try:
                from_date = datetime.fromisoformat(from_date_str)
                queryset = queryset.filter(created_at__gte=from_date)
            except (ValueError, TypeError):
                pass

        # Filter by to_date
        to_date_str = self.request.query_params.get('to_date')
        if to_date_str:
            try:
                to_date = datetime.fromisoformat(to_date_str)
                queryset = queryset.filter(created_at__lte=to_date)
            except (ValueError, TypeError):
                pass

        # Filter by user_id
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)

        # Filter by path pattern
        path = self.request.query_params.get('path')
        if path:
            queryset = queryset.filter(path__icontains=path)

        return queryset


class ErrorLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for querying ErrorLog entries.
    Only accessible to admin users.
    """

    queryset = ErrorLog.objects.all()
    serializer_class = ErrorLogSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['error_type']
    search_fields = ['error_type', 'error_message', 'stack_trace']
    ordering_fields = ['created_at', 'error_type']
    ordering = ['-created_at']
    pagination_class = None  # Will use default pagination from settings

    def get_queryset(self):
        """Filter by date range."""
        queryset = super().get_queryset()

        # Filter by from_date
        from_date_str = self.request.query_params.get('from_date')
        if from_date_str:
            try:
                from_date = datetime.fromisoformat(from_date_str)
                queryset = queryset.filter(created_at__gte=from_date)
            except (ValueError, TypeError):
                pass

        # Filter by to_date
        to_date_str = self.request.query_params.get('to_date')
        if to_date_str:
            try:
                to_date = datetime.fromisoformat(to_date_str)
                queryset = queryset.filter(created_at__lte=to_date)
            except (ValueError, TypeError):
                pass

        return queryset


class LogStatsView(viewsets.ViewSet):
    """
    ViewSet providing aggregated log statistics.
    Only accessible to admin users.
    """

    permission_classes = [IsAdminUser]

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        GET /api/logs/stats/

        Returns aggregated statistics for the last 30 days.
        """
        # Calculate date range (last 30 days)
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)
        seven_days_ago = now - timedelta(days=7)

        # Get stats for RequestLog
        requests = RequestLog.objects.filter(created_at__gte=thirty_days_ago)
        total_requests = requests.count()
        error_requests = requests.filter(status_code__gte=500).count()
        error_rate = (error_requests / total_requests * 100) if total_requests > 0 else 0

        # Calculate average response time
        avg_response_time = requests.aggregate(avg=Avg('response_time_ms'))['avg'] or 0

        # Get top actions
        top_actions = ActivityLog.objects.filter(
            created_at__gte=thirty_days_ago
        ).values('action').annotate(count=Count('action')).order_by('-count')[:10]

        # Get errors by type
        errors_by_type = ErrorLog.objects.filter(
            created_at__gte=thirty_days_ago
        ).values('error_type').annotate(count=Count('error_type')).order_by('-count')[:10]

        # Get requests by status code
        requests_by_status = requests.values('status_code').annotate(
            count=Count('status_code')
        ).order_by('-count')[:10]

        # Count active users in last 7 days
        active_users = ActivityLog.objects.filter(
            created_at__gte=seven_days_ago,
            user__isnull=False,
        ).values('user').distinct().count()

        return Response({
            'total_requests': total_requests,
            'error_rate_percent': round(error_rate, 2),
            'avg_response_time_ms': round(avg_response_time, 2),
            'top_actions': list(top_actions),
            'errors_by_type': list(errors_by_type),
            'requests_by_status': list(requests_by_status),
            'active_users_last_7_days': active_users,
        })
