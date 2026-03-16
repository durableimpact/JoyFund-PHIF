from rest_framework import serializers

from beneficiaries.models import Beneficiary


class BeneficiaryDetailSerializer(serializers.ModelSerializer):
    enrolled_by_id = serializers.UUIDField(source='enrolled_by.id', read_only=True)

    class Meta:
        model = Beneficiary
        fields = [
            'id',
            'full_name',
            'date_of_birth',
            'gender',
            'category',
            'phone',
            'email',
            'region',
            'city',
            'address',
            'national_id_number',
            'emergency_contact_name',
            'emergency_contact_phone',
            'emergency_contact_relationship',
            'chronic_conditions',
            'expected_delivery_date',
            'is_active',
            'created_at',
            'updated_at',
            'enrolled_by_id',
        ]


class BeneficiaryCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Beneficiary
        exclude = ['enrolled_by', 'created_at', 'updated_at']

    def create(self, validated_data):
        enrolled_by = self.context['enrolled_by']
        return Beneficiary.objects.create(enrolled_by=enrolled_by, **validated_data)

    def to_representation(self, instance):
        return BeneficiaryDetailSerializer(instance).data


class BeneficiaryUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Beneficiary
        exclude = ['enrolled_by', 'created_at', 'updated_at']

    def to_representation(self, instance):
        return BeneficiaryDetailSerializer(instance).data
