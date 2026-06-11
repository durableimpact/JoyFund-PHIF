from rest_framework import serializers

from accounts.models import UserDevice


class DeviceSerializer(serializers.ModelSerializer):
    is_current = serializers.SerializerMethodField()

    class Meta:
        model = UserDevice
        fields = [
            "id",
            "device_name",
            "device_type",
            "browser",
            "os",
            "ip_address",
            "last_active",
            "is_current",
            "is_trusted",
            "is_blocked",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "device_name",
            "device_type",
            "browser",
            "os",
            "ip_address",
            "last_active",
            "created_at",
        ]

    def get_is_current(self, obj):
        request = self.context.get("request")
        if request:
            return obj.ip_address == request.META.get("REMOTE_ADDR")
        return False
