from django.db import transaction
from rest_framework import serializers

from accounts.models import HospitalAdmin, Role, SystemAdmin, User
from .user import UserReadSerializer


# ---------------------------------------------------------------------------
# Helper mixin — national-ID input fields
# ---------------------------------------------------------------------------

class NationalIDInputMixin:
    national_id_number = serializers.CharField(max_length=500)
    front_national_id_image = serializers.ImageField()
    back_national_id_image = serializers.ImageField()


# ---------------------------------------------------------------------------
# Create  (only SYSTEM_ADMIN)
# ---------------------------------------------------------------------------

class HospitalAdminCreateSerializer(NationalIDInputMixin, serializers.Serializer):
    """
    Creates a User(role=HOSPITAL_ADMIN) + HospitalAdmin profile.
    `enrolled_by` is injected from the view (request.user.systemadmin).
    """

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    phone_number = serializers.CharField(max_length=15)
    perfered_language = serializers.CharField(max_length=10, default='en')

    national_id_number = serializers.CharField(max_length=500)
    front_national_id_image = serializers.ImageField()
    back_national_id_image = serializers.ImageField()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        from hospitals.models import Hospital
        self.fields['hospital'] = serializers.PrimaryKeyRelatedField(
            queryset=Hospital.objects.all(),
            required=False,
            allow_null=True,
        )

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
        enrolled_by: SystemAdmin = self.context['enrolled_by']
        password = validated_data.pop('password')

        user_fields = ['email', 'first_name', 'last_name', 'phone_number', 'perfered_language']
        user_data = {k: validated_data.pop(k) for k in user_fields if k in validated_data}

        user = User(**user_data, role=Role.HOSPITAL_ADMIN)
        user.set_password(password)
        user.save()

        hospital_admin = HospitalAdmin.objects.create(
            user=user,
            enrolled_by=enrolled_by,
            **validated_data,
        )
        return hospital_admin

    def to_representation(self, instance):
        return HospitalAdminDetailSerializer(instance).data


# ---------------------------------------------------------------------------
# Detail (read)
# ---------------------------------------------------------------------------

class HospitalAdminDetailSerializer(serializers.ModelSerializer):
    user = UserReadSerializer(read_only=True)
    enrolled_by_id = serializers.UUIDField(source='enrolled_by.id', read_only=True)
    hospital_id = serializers.UUIDField(source='hospital.id', read_only=True, allow_null=True)

    class Meta:
        model = HospitalAdmin
        fields = [
            'id', 'user',
            'national_id_number',
            'front_national_id_image',
            'back_national_id_image',
            'enrolled_by_id',
            'hospital_id',
        ]


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------

class HospitalAdminUpdateSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=False)
    first_name = serializers.CharField(max_length=150, required=False)
    last_name = serializers.CharField(max_length=150, required=False)
    phone_number = serializers.CharField(max_length=15, required=False)
    perfered_language = serializers.CharField(max_length=10, required=False)

    class Meta:
        model = HospitalAdmin
        fields = [
            'email', 'first_name', 'last_name',
            'phone_number', 'perfered_language',
            'national_id_number',
            'front_national_id_image',
            'back_national_id_image',
            'hospital',
        ]
        extra_kwargs = {
            'national_id_number': {'required': False},
            'front_national_id_image': {'required': False},
            'back_national_id_image': {'required': False},
            'hospital': {'required': False},
        }

    USER_FIELDS = {'email', 'first_name', 'last_name', 'phone_number', 'perfered_language'}

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
        return HospitalAdminDetailSerializer(instance).data
