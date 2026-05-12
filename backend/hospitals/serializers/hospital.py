from rest_framework import serializers

from hospitals.models import Hospital


class HospitalManagerSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    user_id = serializers.UUIDField(source='user.id', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    phone_number = serializers.CharField(source='user.phone_number', read_only=True)


class HospitalListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hospital
        fields = [
            'id',
            'name',
            'city',
            'region',
            'phone_number',
            'email',
            'partnership_status',
            'is_active',
            'created_at',
        ]


class HospitalDetailSerializer(serializers.ModelSerializer):
    manager = serializers.SerializerMethodField()

    class Meta:
        model = Hospital
        fields = [
            'id',
            'name',
            'accreditation_number',
            'licence_number',
            'region',
            'city',
            'address',
            'gps_coordinates',
            'phone_number',
            'email',
            'website',
            'momo_number',
            'momo_name',
            'orange_number',
            'orange_name',
            'bank_account_number',
            'bank_account_name',
            'bank_name',
            'bank_branch',
            'partnership_status',
            'is_active',
            'created_at',
            'updated_at',
            'manager',
        ]

    def get_manager(self, obj):
        try:
            manager = obj.manager
        except Exception:
            return None
        return HospitalManagerSerializer(manager).data


class HospitalCreateUpdateSerializer(serializers.ModelSerializer):
    website = serializers.URLField(required=False, allow_blank=True)

    class Meta:
        model = Hospital
        fields = [
            'name',
            'accreditation_number',
            'licence_number',
            'region',
            'city',
            'address',
            'gps_coordinates',
            'lat',
            'lng',
            'phone_number',
            'email',
            'website',
            'momo_number',
            'momo_name',
            'orange_number',
            'orange_name',
            'bank_account_number',
            'bank_account_name',
            'bank_name',
            'bank_branch',
            'partnership_status',
            'is_active',
        ]

    def to_representation(self, instance):
        return HospitalDetailSerializer(instance).data
