from django.conf import settings
from django.db import transaction
from django.template.loader import render_to_string
from rest_framework import serializers

from accounts.models import Role, SocialWorker, SystemAdmin, User
from accounts.tasks.send_mail import send_async_email
from .user import UserReadSerializer

# ---------------------------------------------------------------------------
# Create  (only SYSTEM_ADMIN)
# ---------------------------------------------------------------------------


class SocialWorkerCreateSerializer(serializers.Serializer):
    """
    Creates a User(role=SOCIAL_WORKER) + SocialWorker profile.
    `enrolled_by` is injected from the view (request.user.systemadmin).
    """

    email = serializers.EmailField()
    password = serializers.CharField(
        write_only=True, min_length=8, style={"input_type": "password"}
    )
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    phone_number = serializers.CharField(max_length=15)

    national_id_number = serializers.CharField(max_length=500)
    front_national_id_image = serializers.ImageField()
    back_national_id_image = serializers.ImageField()

    organization = serializers.CharField(max_length=255)
    region_assigned = serializers.CharField(max_length=255)

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
        enrolled_by: SystemAdmin = self.context["enrolled_by"]
        password = validated_data.pop("password")

        user_fields = [
            "email",
            "first_name",
            "last_name",
            "phone_number",
            
        ]
        user_data = {
            k: validated_data.pop(k) for k in user_fields if k in validated_data
        }

        user = User(**user_data, role=Role.SOCIAL_WORKER)
        user.set_password(password)
        user.is_verified = True
        user.save()

        social_worker = SocialWorker.objects.create(
            user=user,
            enrolled_by=enrolled_by,
            **validated_data,
        )

        # Send welcome email with credentials
        context = {
            'first_name': user.first_name,
            'email': user.email,
            'password': password,
            'app_name': 'JoyFund',
            'login_url': getattr(settings, 'FRONTEND_URL', 'https://joy-fund.com'),
        }
        html_message = render_to_string('emails/welcome_credentials.html', context)
        send_async_email.delay(
            subject='Welcome to JoyFund – Your Account Credentials',
            recipient_email=user.email,
            html_message=html_message,
        )

        return social_worker

    def to_representation(self, instance):
        return SocialWorkerDetailSerializer(instance).data


# ---------------------------------------------------------------------------
# Detail (read)
# ---------------------------------------------------------------------------


class SocialWorkerMinimalSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="user.get_full_name", read_only=True)
    profile_picture = serializers.ImageField(
        source="user.profile_picture", read_only=True
    )

    class Meta:
        model = SocialWorker
        fields = ["id", "full_name", "organization", "profile_picture"]


class SystemAdminMinimalSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="user.get_full_name", read_only=True)
    profile_picture = serializers.ImageField(
        source="user.profile_picture", read_only=True
    )

    class Meta:
        model = SystemAdmin
        fields = ["id", "full_name", "profile_picture"]


class SocialWorkerDetailSerializer(serializers.ModelSerializer):
    user = UserReadSerializer(read_only=True)
    enrolled_by_id = serializers.UUIDField(source="enrolled_by.id", read_only=True)

    class Meta:
        model = SocialWorker
        fields = [
            "id",
            "user",
            "national_id_number",
            "front_national_id_image",
            "back_national_id_image",
            "organization",
            "region_assigned",
            "is_approved",
            "enrolled_by_id",
        ]


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------


class SocialWorkerUpdateSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=False)
    first_name = serializers.CharField(max_length=150, required=False)
    last_name = serializers.CharField(max_length=150, required=False)
    phone_number = serializers.CharField(max_length=15, required=False)

    class Meta:
        model = SocialWorker
        fields = [
            "email",
            "first_name",
            "last_name",
            "phone_number",
            
            "national_id_number",
            "front_national_id_image",
            "back_national_id_image",
            "organization",
            "region_assigned",
            "is_approved",
        ]
        extra_kwargs = {
            "national_id_number": {"required": False},
            "front_national_id_image": {"required": False},
            "back_national_id_image": {"required": False},
            "organization": {"required": False},
            "region_assigned": {"required": False},
            "is_approved": {"required": False},
        }

    USER_FIELDS = {
        "email",
        "first_name",
        "last_name",
        "phone_number",
        
    }

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

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

    def to_representation(self, instance):
        return SocialWorkerDetailSerializer(instance).data
