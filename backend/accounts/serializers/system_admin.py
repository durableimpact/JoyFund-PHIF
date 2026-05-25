from django.db import transaction
from rest_framework import serializers

from accounts.models import SystemAdmin, Role, User
from .user import UserReadSerializer


class SystemAdminCreateSerializer(serializers.Serializer):
    """Creates a User(role=SYSTEM_ADMIN) + SystemAdmin profile."""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    phone_number = serializers.CharField(max_length=15)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already registered.")
        return value

    def validate_phone_number(self, value):
        if User.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError("Phone number already registered.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        password = validated_data.pop('password')

        user = User(**validated_data, role=Role.SYSTEM_ADMIN)
        user.set_password(password)
        user.save()

        system_admin = SystemAdmin.objects.create(user=user)
        return system_admin

    def to_representation(self, instance):
        return SystemAdminDetailSerializer(instance).data


class SystemAdminDetailSerializer(serializers.ModelSerializer):
    user = UserReadSerializer(read_only=True)

    class Meta:
        model = SystemAdmin
        fields = ['id', 'user']


class SystemAdminUpdateSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=False)
    first_name = serializers.CharField(max_length=150, required=False)
    last_name = serializers.CharField(max_length=150, required=False)
    phone_number = serializers.CharField(max_length=15, required=False)

    class Meta:
        model = SystemAdmin
        fields = ['email', 'first_name', 'last_name', 'phone_number']

    USER_FIELDS = {'email', 'first_name', 'last_name', 'phone_number'}

    def validate_email(self, value):
        qs = User.objects.filter(email=value).exclude(pk=self.instance.user.pk)
        if qs.exists():
            raise serializers.ValidationError("Email already registered.")
        return value

    def validate_phone_number(self, value):
        qs = User.objects.filter(phone_number=value).exclude(pk=self.instance.user.pk)
        if qs.exists():
            raise serializers.ValidationError("Phone number already registered.")
        return value

    @transaction.atomic
    def update(self, instance, validated_data):
        user = instance.user
        for field in list(self.USER_FIELDS):
            if field in validated_data:
                setattr(user, field, validated_data.pop(field))
        user.save()
        instance.save()
        return instance

    def to_representation(self, instance):
        return SystemAdminDetailSerializer(instance).data
