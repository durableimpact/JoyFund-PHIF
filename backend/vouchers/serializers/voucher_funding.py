from vouchers.models import VoucherFunding, VoucherFundingEvent
from .voucher_base import VoucherMinimalSerializer
from rest_framework import serializers


class VoucherFundingEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = VoucherFundingEvent
        exclude = ['voucher_funding']

class VoucherFundingSerializer(serializers.ModelSerializer):
    events = VoucherFundingEventSerializer(many=True, read_only=True)

    class Meta:
        model = VoucherFunding
        exclude = ["voucher"]

class VoucherFundingDetailSerializer(serializers.ModelSerializer):
    events = VoucherFundingEventSerializer(many=True, read_only=True)
    voucher = VoucherMinimalSerializer(read_only=True)
    class Meta:
        model = VoucherFunding
        fields = "__all__"
