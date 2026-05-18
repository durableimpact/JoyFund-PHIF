from rest_framework import serializers
from vouchers.models.Voucher import Voucher, VoucherEvent

class VoucherEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = VoucherEvent
        exclude = ['voucher']

class VoucherMinimalSerializer(serializers.ModelSerializer):
    hospital = serializers.CharField(source="hospital.name", read_only=True)
    beneficiary_name = serializers.CharField(source="beneficiary.full_name", read_only=True)
    events = VoucherEventSerializer(many=True, read_only=True)

    class Meta:
        model = Voucher
        fields = [
            "id",
            "hospital",
            "beneficiary_name",
            "voucher_code",
            "events",
            "status",
            "created_at",
            "redeemed_at"
        ]
