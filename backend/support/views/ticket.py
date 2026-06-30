from rest_framework.generics import (
    ListAPIView,
    RetrieveAPIView,
    CreateAPIView,
    UpdateAPIView,
    ListCreateAPIView,
)
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Count, Q, Avg, F
from django.db.models.functions import Extract

from support.models import SupportTicket, TicketMessage, TicketEvent, TicketStatus, TicketCategory, TicketPriority
from support.serializers.ticket import (
    SupportTicketListSerializer,
    SupportTicketDetailSerializer,
    SupportTicketCreateSerializer,
    SupportTicketUpdateSerializer,
    TicketMessageSerializer,
    TicketMessageCreateSerializer,
    TicketEventSerializer,
    TicketAssignSerializer,
    TicketStatusSerializer,
    TicketCloseSerializer,
    TicketStatsSerializer,
)


class IsSystemAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "SYSTEM_ADMIN"
        )


class IsAuthenticatedUser(IsAuthenticated):
    pass


class SupportTicketListView(ListAPIView):
    permission_classes = [IsSystemAdmin]
    serializer_class = SupportTicketListSerializer

    def get_queryset(self):
        queryset = SupportTicket.objects.select_related(
            "created_by", "assigned_to"
        ).all()

        status_filter = self.request.query_params.get("status")
        category_filter = self.request.query_params.get("category")
        priority_filter = self.request.query_params.get("priority")
        assigned_to_filter = self.request.query_params.get("assigned_to")
        search = self.request.query_params.get("search")

        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if category_filter:
            queryset = queryset.filter(category=category_filter)
        if priority_filter:
            queryset = queryset.filter(priority=priority_filter)
        if assigned_to_filter:
            if assigned_to_filter == "unassigned":
                queryset = queryset.filter(assigned_to__isnull=True)
            else:
                queryset = queryset.filter(assigned_to_id=assigned_to_filter)
        if search:
            queryset = queryset.filter(
                Q(subject__icontains=search) | Q(ticket_number__icontains=search)
            )

        return queryset


class SupportTicketDetailView(RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = SupportTicketDetailSerializer
    lookup_field = "pk"

    def get_queryset(self):
        user = self.request.user
        if user.role == "SYSTEM_ADMIN":
            return SupportTicket.objects.select_related(
                "created_by", "assigned_to"
            ).prefetch_related("messages__sender", "events__changed_by")
        return SupportTicket.objects.select_related(
            "created_by", "assigned_to"
        ).prefetch_related("messages__sender").filter(created_by=user)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        data = serializer.data

        if request.user.role != "SYSTEM_ADMIN":
            data["messages"] = [
                msg for msg in data.get("messages", []) if not msg.get("is_internal")
            ]

        return Response(data)


class SupportTicketCreateView(CreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = SupportTicketCreateSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"detail": serializer.errors, "error_code": "VALIDATION_ERROR"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        ticket = serializer.save()
        TicketEvent.objects.create(
            ticket=ticket,
            status=ticket.status,
            notes="Ticket created.",
            changed_by=request.user,
        )
        return Response(
            SupportTicketDetailSerializer(ticket).data,
            status=status.HTTP_201_CREATED,
        )


class SupportTicketUpdateView(UpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = SupportTicketUpdateSerializer
    lookup_field = "pk"

    def get_queryset(self):
        user = self.request.user
        if user.role == "SYSTEM_ADMIN":
            return SupportTicket.objects.all()
        return SupportTicket.objects.filter(created_by=user, status__in=[TicketStatus.OPEN, TicketStatus.WAITING_FOR_USER])

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if not serializer.is_valid():
            return Response(
                {"detail": serializer.errors, "error_code": "VALIDATION_ERROR"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        ticket = serializer.save()
        TicketEvent.objects.create(
            ticket=ticket,
            status=ticket.status,
            notes="Ticket updated.",
            changed_by=request.user,
        )
        return Response(SupportTicketDetailSerializer(ticket).data)


class SupportTicketAssignView(APIView):
    permission_classes = [IsSystemAdmin]

    def post(self, request, pk):
        try:
            ticket = SupportTicket.objects.get(pk=pk)
        except SupportTicket.DoesNotExist:
            return Response(
                {"detail": "Ticket not found.", "error_code": "TICKET_NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = TicketAssignSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"detail": serializer.errors, "error_code": "VALIDATION_ERROR"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from accounts.models import User

        try:
            assigned_user = User.objects.get(
                id=serializer.validated_data["assigned_to"], role="SYSTEM_ADMIN"
            )
        except User.DoesNotExist:
            return Response(
                {"detail": "System admin not found.", "error_code": "ADMIN_NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )

        old_status = ticket.status
        ticket.assigned_to = assigned_user
        if ticket.status == TicketStatus.OPEN:
            ticket.status = TicketStatus.IN_PROGRESS
        ticket.save(update_fields=["assigned_to", "status", "updated_at"])

        TicketEvent.objects.create(
            ticket=ticket,
            status=ticket.status,
            notes=f"Ticket assigned to {assigned_user.email}.",
            changed_by=request.user,
        )

        return Response(
            SupportTicketDetailSerializer(ticket).data,
            status=status.HTTP_200_OK,
        )


class SupportTicketStatusView(APIView):
    permission_classes = [IsSystemAdmin]

    def patch(self, request, pk):
        try:
            ticket = SupportTicket.objects.get(pk=pk)
        except SupportTicket.DoesNotExist:
            return Response(
                {"detail": "Ticket not found.", "error_code": "TICKET_NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = TicketStatusSerializer(
            data=request.data, context={"ticket": ticket}
        )
        if not serializer.is_valid():
            return Response(
                {"detail": serializer.errors, "error_code": "VALIDATION_ERROR"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        old_status = ticket.status
        new_status = serializer.validated_data["status"]
        resolution_notes = serializer.validated_data.get("resolution_notes", "")

        ticket.status = new_status
        if new_status == TicketStatus.RESOLVED:
            ticket.resolved_at = timezone.now()
            if resolution_notes:
                ticket.resolution_notes = resolution_notes
        elif new_status == TicketStatus.CLOSED:
            ticket.closed_at = timezone.now()
            if resolution_notes:
                ticket.resolution_notes = resolution_notes
        ticket.save()

        TicketEvent.objects.create(
            ticket=ticket,
            status=new_status,
            notes=f"Status changed from {old_status} to {new_status}. {resolution_notes}".strip(),
            changed_by=request.user,
        )

        return Response(
            SupportTicketDetailSerializer(ticket).data,
            status=status.HTTP_200_OK,
        )


class SupportTicketCloseView(APIView):
    permission_classes = [IsSystemAdmin]

    def post(self, request, pk):
        try:
            ticket = SupportTicket.objects.get(pk=pk)
        except SupportTicket.DoesNotExist:
            return Response(
                {"detail": "Ticket not found.", "error_code": "TICKET_NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = TicketCloseSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"detail": serializer.errors, "error_code": "VALIDATION_ERROR"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        old_status = ticket.status
        ticket.status = TicketStatus.CLOSED
        ticket.closed_at = timezone.now()
        resolution_notes = serializer.validated_data.get("resolution_notes", "")
        if resolution_notes:
            ticket.resolution_notes = resolution_notes
        ticket.save()

        TicketEvent.objects.create(
            ticket=ticket,
            status=TicketStatus.CLOSED,
            notes=f"Ticket closed. {resolution_notes}".strip(),
            changed_by=request.user,
        )

        return Response(
            SupportTicketDetailSerializer(ticket).data,
            status=status.HTTP_200_OK,
        )


class SupportTicketEventsView(ListAPIView):
    permission_classes = [IsSystemAdmin]
    serializer_class = TicketEventSerializer

    def get_queryset(self):
        ticket_id = self.kwargs.get("pk")
        return TicketEvent.objects.filter(ticket_id=ticket_id).select_related(
            "changed_by"
        )


class MyTicketsListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = SupportTicketListSerializer

    def get_queryset(self):
        return SupportTicket.objects.filter(
            created_by=self.request.user
        ).select_related("created_by", "assigned_to")


class TicketMessageListCreateView(ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TicketMessageSerializer

    def get_queryset(self):
        ticket_id = self.kwargs.get("pk")
        user = self.request.user

        ticket = SupportTicket.objects.get(pk=ticket_id)
        if user.role == "SYSTEM_ADMIN" or ticket.created_by == user:
            return TicketMessage.objects.filter(ticket_id=ticket_id).select_related(
                "sender"
            )
        return TicketMessage.objects.none()

    def get_serializer_class(self):
        if self.request.method == "POST":
            return TicketMessageCreateSerializer
        return TicketMessageSerializer

    def create(self, request, *args, **kwargs):
        ticket_id = self.kwargs.get("pk")
        try:
            ticket = SupportTicket.objects.get(pk=ticket_id)
        except SupportTicket.DoesNotExist:
            return Response(
                {"detail": "Ticket not found.", "error_code": "TICKET_NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )

        user = request.user
        if user.role != "SYSTEM_ADMIN" and ticket.created_by != user:
            return Response(
                {"detail": "You do not have permission to message on this ticket."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = TicketMessageCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"detail": serializer.errors, "error_code": "VALIDATION_ERROR"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        is_internal = False
        if user.role == "SYSTEM_ADMIN":
            is_internal = request.data.get("is_internal", False)

        message = serializer.save(
            ticket=ticket, sender=user, is_internal=is_internal
        )

        if user.role == "SYSTEM_ADMIN" and not ticket.assigned_to:
            ticket.assigned_to = user
            ticket.save(update_fields=["assigned_to", "updated_at"])
            TicketEvent.objects.create(
                ticket=ticket,
                status=ticket.status,
                notes=f"Auto-assigned to {user.email} after replying.",
                changed_by=user,
            )

        if ticket.status == TicketStatus.OPEN and user.role == "SYSTEM_ADMIN":
            ticket.status = TicketStatus.IN_PROGRESS
            ticket.save(update_fields=["status", "updated_at"])
        elif ticket.status == TicketStatus.WAITING_FOR_USER and user.role != "SYSTEM_ADMIN":
            ticket.status = TicketStatus.IN_PROGRESS
            ticket.save(update_fields=["status", "updated_at"])

        return Response(
            TicketMessageSerializer(message).data,
            status=status.HTTP_201_CREATED,
        )


class TicketStatsView(APIView):
    permission_classes = [IsSystemAdmin]

    def get(self, request):
        from django.utils import timezone
        from datetime import timedelta

        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)

        tickets = SupportTicket.objects.all()

        total = tickets.count()
        open_count = tickets.filter(status=TicketStatus.OPEN).count()
        in_progress = tickets.filter(status=TicketStatus.IN_PROGRESS).count()
        waiting = tickets.filter(status=TicketStatus.WAITING_FOR_USER).count()
        resolved = tickets.filter(status=TicketStatus.RESOLVED).count()
        closed = tickets.filter(status=TicketStatus.CLOSED).count()

        by_category = dict(
            tickets.values_list("category").annotate(count=Count("id")).values_list("category", "count")
        )
        by_priority = dict(
            tickets.values_list("priority").annotate(count=Count("id")).values_list("priority", "count")
        )

        resolved_tickets = tickets.filter(
            resolved_at__isnull=False, created_at__gte=thirty_days_ago
        )
        avg_resolution = 0
        if resolved_tickets.exists():
            avg_resolution = resolved_tickets.annotate(
                resolution_hours=Extract(
                    timezone.now() - F("created_at"), "epoch"
                ) / 3600
            ).aggregate(avg=Avg("resolution_hours"))["avg"] or 0

        return Response({
            "total_tickets": total,
            "open_tickets": open_count + waiting,
            "in_progress_tickets": in_progress,
            "resolved_tickets": resolved,
            "closed_tickets": closed,
            "tickets_by_category": by_category,
            "tickets_by_priority": by_priority,
            "average_resolution_time_hours": round(avg_resolution, 1),
        })


class TicketCategoriesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response([
            {"value": choice[0], "label": choice[1]}
            for choice in TicketCategory.choices
        ])


class SystemAdminListView(APIView):
    permission_classes = [IsSystemAdmin]

    def get(self, request):
        from accounts.models import User
        admins = User.objects.filter(role="SYSTEM_ADMIN", is_active=True).values(
            "id", "email", "first_name", "last_name"
        )
        return Response(list(admins))
