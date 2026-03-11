from rest_framework import serializers

from accounts.models import User


class UserReadSerializer(serializers.ModelSerializer):
    """Read-only user representation embedded inside profile detail serializers."""

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email',
            'first_name', 'last_name',
            'phone_number', 'perfered_language',
            'role', 'is_verified',
            'created_at', 'updated_at',
        ]
        read_only_fields = fields
