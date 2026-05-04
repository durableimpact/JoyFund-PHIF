from rest_framework import serializers
from vouchers.models.Voucher import Voucher
from beneficiaries.serializers.beneficiary import BeneficiaryDetailSerializer


class VoucherCheckSerializer(serializers.ModelSerializer):
    beneficiary = BeneficiaryDetailSerializer(read_only=True)
    is_valid = serializers.SerializerMethodField()

    class Meta:
        model = Voucher
        fields = [
            "voucher_code",
            "status",
            "expiry_date",
            "beneficiary",
            "is_valid",
            "created_at",
        ]
        read_only_fields = fields

    def get_is_valid(self, obj):
        return obj.status == Voucher.Status.ACTIVE
