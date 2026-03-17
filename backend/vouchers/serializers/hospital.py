from rest_framework import serializers


class VoucherCheckInSerializer(serializers.Serializer):
    voucher_code = serializers.CharField(max_length=12, help_text="The 6-character voucher code from the beneficiary's SMS.")


class VoucherCheckInResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    message = serializers.CharField()
    beneficiary_name = serializers.CharField(help_text="Full name of the beneficiary.")
    service = serializers.CharField(help_text="Name of the service being provided.")
    value = serializers.DecimalField(max_digits=10, decimal_places=2, help_text="Monetary value of the voucher.")


class VoucherRedeemSerializer(serializers.Serializer):
    voucher_code = serializers.CharField(max_length=12, help_text="The 6-character voucher code.")
    patient_confirmation_pin = serializers.CharField(max_length=4, help_text="The 4-digit PIN provided by the patient after care is completed.")


class VoucherRedeemResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    message = serializers.CharField()
