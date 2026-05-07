from rest_framework import serializers

from hospitals.models import Services


class ServiceDetailSerializer(serializers.ModelSerializer):
    hospital_id = serializers.UUIDField(source='hospital.id', read_only=True)

    class Meta:
        model = Services
        fields = [
            'id',
            'hospital_id',
            'name',
            'category',
            'price',
            'is_available',
            'description',
            'created_at',
            'updated_at',
        ]


class ServiceCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Services
        fields = [
            'name',
            'category',
            'price',
            'is_available',
            'description',
        ]

    def to_representation(self, instance):
        return ServiceDetailSerializer(instance).data
