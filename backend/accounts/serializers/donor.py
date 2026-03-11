from django.db import transaction
from rest_framework import serializers

from accounts.models import Donor, Role, User
from .user import UserReadSerializer


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------

class DonorRegisterSerializer(serializers.Serializer):
    """
    Public registration endpoint — anyone can create a Donor account.
    Accepts flat user fields and creates both User and Donor in one transaction.
    """

    # User fields
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    phone_number = serializers.CharField(max_length=15)
    perfered_language = serializers.CharField(max_length=10, default='en')

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_phone_number(self, value):
        if User.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError("A user with this phone number already exists.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data, role=Role.DONOR)
        user.set_password(password)
        user.save()
        donor = Donor.objects.create(user=user)
        return donor

    def to_representation(self, instance):
        return DonorDetailSerializer(instance).data


# ---------------------------------------------------------------------------
# Detail (read)
# ---------------------------------------------------------------------------

class DonorDetailSerializer(serializers.ModelSerializer):
    user = UserReadSerializer(read_only=True)

    class Meta:
        model = Donor
        fields = ['id', 'user']


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------

class DonorUpdateSerializer(serializers.ModelSerializer):
    """
    Flat update for a Donor profile.
    All user-level fields are included directly; Donor has no extra fields.
    """

    username = serializers.CharField(max_length=150, required=False)
    email = serializers.EmailField(required=False)
    first_name = serializers.CharField(max_length=150, required=False)
    last_name = serializers.CharField(max_length=150, required=False)
    phone_number = serializers.CharField(max_length=15, required=False)
    perfered_language = serializers.CharField(max_length=10, required=False)

    class Meta:
        model = Donor
        fields = ['username', 'email', 'first_name', 'last_name', 'phone_number', 'perfered_language']

    def validate_username(self, value):
        qs = User.objects.filter(username=value).exclude(pk=self.instance.user.pk)
        if qs.exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate_email(self, value):
        qs = User.objects.filter(email=value).exclude(pk=self.instance.user.pk)
        if qs.exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_phone_number(self, value):
        qs = User.objects.filter(phone_number=value).exclude(pk=self.instance.user.pk)
        if qs.exists():
            raise serializers.ValidationError("A user with this phone number already exists.")
        return value

    @transaction.atomic
    def update(self, instance, validated_data):
        user = instance.user
        for attr, value in validated_data.items():
            setattr(user, attr, value)
        user.save()
        return instance

    def to_representation(self, instance):
        return DonorDetailSerializer(instance).data
