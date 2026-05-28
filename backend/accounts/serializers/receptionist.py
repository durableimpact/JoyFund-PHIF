from django.db import transaction
from rest_framework import serializers

from accounts.models import HospitalAdmin, Receptionist, Role, User
from .user import UserReadSerializer


# ---------------------------------------------------------------------------
# Create  (only HOSPITAL_ADMIN)
# ---------------------------------------------------------------------------

class ReceptionistCreateSerializer(serializers.Serializer):
    """
    Creates a User(role=RECEPTIONIST) + Receptionist profile.
    `enrolled_by` is injected from the view (request.user.hospitaladmin).
    """

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    phone_number = serializers.CharField(max_length=15)
    

    national_id_number = serializers.CharField(max_length=500, required=False, allow_blank=True, default='')
    front_national_id_image = serializers.ImageField(required=False)
    back_national_id_image = serializers.ImageField(required=False)

    # `hospital` field is injected in __init__ to avoid a circular import at
    # module load time (hospitals app imports nothing from accounts, but DRF
    # evaluates the queryset eagerly when the class body is parsed).
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
        enrolled_by: HospitalAdmin = self.context['enrolled_by']
        password = validated_data.pop('password')

        user_fields = ['email', 'first_name', 'last_name', 'phone_number']
        user_data = {k: validated_data.pop(k) for k in user_fields if k in validated_data}

        user = User(**user_data, role=Role.RECEPTIONIST)
        user.set_password(password)
        user.save()

        receptionist = Receptionist.objects.create(
            user=user,
            enrolled_by=enrolled_by,
            **validated_data,
        )
        return receptionist

    def to_representation(self, instance):
        return ReceptionistDetailSerializer(instance).data


# ---------------------------------------------------------------------------
# Detail (read)
# ---------------------------------------------------------------------------

class ReceptionistDetailSerializer(serializers.ModelSerializer):
    user = UserReadSerializer(read_only=True)
    enrolled_by_id = serializers.UUIDField(source='enrolled_by.id', read_only=True)
    hospital_id = serializers.UUIDField(source='hospital.id', read_only=True, allow_null=True)

    class Meta:
        model = Receptionist
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

class ReceptionistUpdateSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=False)
    first_name = serializers.CharField(max_length=150, required=False)
    last_name = serializers.CharField(max_length=150, required=False)
    phone_number = serializers.CharField(max_length=15, required=False)

    class Meta:
        model = Receptionist
        fields = [
            'email', 'first_name', 'last_name',
            'phone_number',
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

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

    def to_representation(self, instance):
        return ReceptionistDetailSerializer(instance).data
