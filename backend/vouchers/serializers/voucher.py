from rest_framework import serializers
from vouchers.models.Voucher import Voucher
from beneficiaries.serializers.beneficiary import BeneficiaryDetailSerializer
from beneficiaries.serializers.health_issue import HealthIssueSerializer
from hospitals.serializers.hospital import HospitalListSerializer
from .voucher_funding import VoucherFundingSerializer
from .voucher_base import VoucherEventSerializer, VoucherMinimalSerializer

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


class VoucherListSerializer(serializers.ModelSerializer):
    beneficiary_name = serializers.CharField(
        source="beneficiary.full_name", read_only=True
    )
    hospital_name = serializers.CharField(source="hospital.name", read_only=True)

    class Meta:
        model = Voucher
        fields = [
            "id",
            "voucher_code",
            "beneficiary",
            "beneficiary_name",
            "hospital",
            "hospital_name",
            "status",
            "expiry_date",
            "created_at",
        ]


class VoucherDetailSerializer(serializers.ModelSerializer):
    beneficiary = BeneficiaryDetailSerializer(read_only=True)
    health_issue = HealthIssueSerializer(read_only=True)
    hospital = HospitalListSerializer(read_only=True)
    events = VoucherEventSerializer(many=True, read_only=True)
    funding_records = VoucherFundingSerializer(many=True, read_only=True)

    class Meta:
        model = Voucher
        fields = "__all__"