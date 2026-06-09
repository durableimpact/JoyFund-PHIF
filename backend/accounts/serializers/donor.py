from django.db import transaction
from rest_framework import serializers

from accounts.models import Donor, Role, User
from campaigns.models import Campaign, Donation
from .user import UserReadSerializer, UserMinimalSerializer


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------

class DonorRegisterSerializer(serializers.Serializer):
    """
    Public registration endpoint — anyone can create a Donor account.
    Accepts flat user fields and creates both User and Donor in one transaction.
    """

    # User fields
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    phone_number = serializers.CharField(max_length=15)
    website = serializers.CharField(required=False, allow_blank=True, write_only=True)
    

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_phone_number(self, value):
        if User.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError("A user with this phone number already exists.")
        return value

    def validate(self, attrs):
        # Honeypot: bots often fill hidden fields; legitimate users should leave it empty.
        if attrs.get('website'):
            raise serializers.ValidationError({"detail": "Invalid registration request."})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        validated_data.pop('website', None)
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


class CampaignMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Campaign
        fields = [
            'id',
            'title',
            'slug',
            'goal_amount',
            'current_amount',
            'status',
            'is_public',
            'start_date',
            'end_date',
            'created_at',
        ]


class DonationMinimalSerializer(serializers.ModelSerializer):
    campaign_id = serializers.UUIDField(source='campaign.id', read_only=True)
    campaign_title = serializers.CharField(source='campaign.title', read_only=True)
    campaign_slug = serializers.CharField(source='campaign.slug', read_only=True)

    class Meta:
        model = Donation
        fields = [
            'id',
            'campaign_id',
            'campaign_title',
            'campaign_slug',
            'donor_name',
            'amount',
            'status',
            'message',
            'is_anonymous',
            'created_at',
        ]


class DonorMinimalSerializer(serializers.ModelSerializer):
    user = UserMinimalSerializer(read_only=True)

    class Meta:
        model = Donor
        fields = ['id', 'user']


class DonorPublicSummarySerializer(serializers.Serializer):
    donor = DonorMinimalSerializer(read_only=True)
    campaign_count = serializers.IntegerField(read_only=True)
    donations_count = serializers.IntegerField(read_only=True)
    donations_total_amount = serializers.FloatField(read_only=True)
    campaigns = CampaignMinimalSerializer(many=True, read_only=True)
    donations = DonationMinimalSerializer(many=True, read_only=True)


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------

class DonorUpdateSerializer(serializers.ModelSerializer):
    """
    Flat update for a Donor profile.
    All user-level fields are included directly; Donor has no extra fields.
    """

    email = serializers.EmailField(required=False)
    first_name = serializers.CharField(max_length=150, required=False)
    last_name = serializers.CharField(max_length=150, required=False)
    phone_number = serializers.CharField(max_length=15, required=False)

    class Meta:
        model = Donor
        fields = ['email', 'first_name', 'last_name', 'phone_number']

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
