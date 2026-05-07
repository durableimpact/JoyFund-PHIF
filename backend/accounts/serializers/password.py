from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from accounts.models import User


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer for requesting a password reset (forgot password)."""
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        """Validate that the email exists in the system."""
        if not User.objects.filter(email=value).exists():
            # For security, we don't reveal if email exists or not
            # This prevents email enumeration attacks
            pass
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for confirming password reset with token."""
    token = serializers.CharField(required=True, min_length=32)
    new_password = serializers.CharField(write_only=True, required=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, required=True)

    def validate_new_password(self, value):
        """Validate password against Django's password validators."""
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value

    def validate(self, data):
        """Validate that passwords match."""
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return data


class PasswordChangeSerializer(serializers.Serializer):
    """Serializer for changing password for authenticated users."""
    old_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(write_only=True, required=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, required=True)

    def validate_new_password(self, value):
        """Validate password against Django's password validators."""
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value

    def validate(self, data):
        """Validate that new passwords match and are different from old password."""
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        
        if data['old_password'] == data['new_password']:
            raise serializers.ValidationError({'new_password': 'New password must be different from the old password.'})
        
        return data

    def validate_old_password(self, value):
        """Validate that the old password is correct for the current user."""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Old password is incorrect.')
        return value
