from rest_framework import serializers
from django.conf import settings
from support.models import (
    SupportTicket,
    TicketMessage,
    TicketEvent,
    TicketStatus,
    TicketCategory,
    TicketPriority,
)


class TicketEventSerializer(serializers.ModelSerializer):
    changed_by_email = serializers.EmailField(source="changed_by.email", read_only=True)

    class Meta:
        model = TicketEvent
        exclude = ["ticket"]
        read_only_fields = ["id", "status", "changed_by", "changed_at", "notes"]


class TicketMessageSerializer(serializers.ModelSerializer):
    sender_email = serializers.EmailField(source="sender.email", read_only=True)
    sender_full_name = serializers.SerializerMethodField()

    class Meta:
        model = TicketMessage
        fields = [
            "id",
            "ticket",
            "sender",
            "sender_email",
            "sender_full_name",
            "message",
            "is_internal",
            "created_at",
        ]
        read_only_fields = ["id", "sender", "sender_email", "sender_full_name", "created_at"]

    def get_sender_full_name(self, obj):
        return obj.sender.get_full_name() or obj.sender.email


class TicketMessageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketMessage
        fields = ["message"]

    def create(self, validated_data):
        validated_data["sender"] = self.context["request"].user
        return super().create(validated_data)


class SupportTicketListSerializer(serializers.ModelSerializer):
    created_by_email = serializers.EmailField(source="created_by.email", read_only=True)
    created_by_full_name = serializers.SerializerMethodField()
    assigned_to_email = serializers.EmailField(
        source="assigned_to.email", read_only=True, default=None
    )
    assigned_to_full_name = serializers.SerializerMethodField()
    message_count = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = SupportTicket
        fields = [
            "id",
            "ticket_number",
            "subject",
            "category",
            "priority",
            "status",
            "created_by",
            "created_by_email",
            "created_by_full_name",
            "assigned_to",
            "assigned_to_email",
            "assigned_to_full_name",
            "message_count",
            "unread_count",
            "created_at",
            "updated_at",
        ]

    def get_created_by_full_name(self, obj):
        return obj.created_by.get_full_name() or obj.created_by.email

    def get_assigned_to_full_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.get_full_name() or obj.assigned_to.email
        return None

    def get_message_count(self, obj):
        return obj.messages.count()

    def get_unread_count(self, obj):
        request = self.context.get("request")
        if not request:
            return 0
        user = request.user
        if user.role == "SYSTEM_ADMIN":
            return obj.messages.filter(is_internal=False).count()
        return 0


class SupportTicketDetailSerializer(serializers.ModelSerializer):
    created_by_email = serializers.EmailField(source="created_by.email", read_only=True)
    created_by_full_name = serializers.SerializerMethodField()
    assigned_to_email = serializers.EmailField(
        source="assigned_to.email", read_only=True, default=None
    )
    assigned_to_full_name = serializers.SerializerMethodField()
    messages = TicketMessageSerializer(many=True, read_only=True)
    events = TicketEventSerializer(many=True, read_only=True)

    class Meta:
        model = SupportTicket
        fields = [
            "id",
            "ticket_number",
            "subject",
            "description",
            "category",
            "priority",
            "status",
            "created_by",
            "created_by_email",
            "created_by_full_name",
            "assigned_to",
            "assigned_to_email",
            "assigned_to_full_name",
            "resolution_notes",
            "created_at",
            "updated_at",
            "resolved_at",
            "closed_at",
            "messages",
            "events",
        ]
        read_only_fields = [
            "id",
            "ticket_number",
            "created_by",
            "created_at",
            "updated_at",
            "resolved_at",
            "closed_at",
        ]

    def get_created_by_full_name(self, obj):
        return obj.created_by.get_full_name() or obj.created_by.email

    def get_assigned_to_full_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.get_full_name() or obj.assigned_to.email
        return None


class SupportTicketCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportTicket
        fields = [
            "subject",
            "description",
            "category",
            "priority",
        ]

    def create(self, validated_data):
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)


class SupportTicketUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportTicket
        fields = ["subject", "description", "category", "priority"]
        read_only_fields = ["id", "ticket_number", "created_by", "created_at"]


class TicketAssignSerializer(serializers.Serializer):
    assigned_to = serializers.UUIDField(
        help_text="UUID of the system admin to assign the ticket to"
    )


class TicketStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=TicketStatus.choices)
    resolution_notes = serializers.CharField(required=False, allow_blank=True)

    def validate_status(self, value):
        ticket = self.context.get("ticket")
        if ticket:
            valid_transitions = {
                TicketStatus.OPEN: [TicketStatus.IN_PROGRESS, TicketStatus.CLOSED],
                TicketStatus.IN_PROGRESS: [
                    TicketStatus.WAITING_FOR_USER,
                    TicketStatus.RESOLVED,
                    TicketStatus.CLOSED,
                ],
                TicketStatus.WAITING_FOR_USER: [
                    TicketStatus.OPEN,
                    TicketStatus.IN_PROGRESS,
                    TicketStatus.CLOSED,
                ],
                TicketStatus.RESOLVED: [TicketStatus.CLOSED, TicketStatus.OPEN],
                TicketStatus.CLOSED: [TicketStatus.OPEN],
            }
            allowed = valid_transitions.get(ticket.status, [])
            if value not in allowed:
                raise serializers.ValidationError(
                    f"Cannot transition from {ticket.status} to {value}. "
                    f"Allowed transitions: {', '.join(allowed)}"
                )
        return value


class TicketCloseSerializer(serializers.Serializer):
    resolution_notes = serializers.CharField(
        required=False, allow_blank=True, help_text="Notes about how the ticket was resolved"
    )


class TicketStatsSerializer(serializers.Serializer):
    total_tickets = serializers.IntegerField()
    open_tickets = serializers.IntegerField()
    in_progress_tickets = serializers.IntegerField()
    resolved_tickets = serializers.IntegerField()
    closed_tickets = serializers.IntegerField()
    tickets_by_category = serializers.DictField()
    tickets_by_priority = serializers.DictField()
    average_resolution_time_hours = serializers.FloatField()
