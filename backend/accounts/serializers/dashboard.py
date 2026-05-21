from rest_framework import serializers


class DonationContributionSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    donor_name = serializers.CharField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    message = serializers.CharField(allow_blank=True, allow_null=True)
    is_anonymous = serializers.BooleanField()
    created_at = serializers.DateTimeField()


class MatchedBeneficiarySerializer(serializers.Serializer):
    id = serializers.UUIDField()
    digital_health_id = serializers.CharField()
    full_name = serializers.CharField()
    picture = serializers.ImageField(allow_null=True)
    category = serializers.CharField()
    voucher_status = serializers.CharField(allow_null=True)


class DonorDashboardSerializer(serializers.Serializer):
    total_raised = serializers.FloatField()
    my_campaigns = serializers.IntegerField()
    contributors = serializers.IntegerField()
    lives_impacted = serializers.IntegerField()


class SocialWorkerDashboardSerializer(serializers.Serializer):
    enrolled = serializers.IntegerField()
    awaiting_match = serializers.IntegerField()
    voucher_issued = serializers.IntegerField()
    care_received = serializers.IntegerField()


class ReceptionistDashboardSerializer(serializers.Serializer):
    redeemed_vouchers = serializers.IntegerField()
    total_medical_claims = serializers.IntegerField()
    pending_claims = serializers.IntegerField()
    approved_claims = serializers.IntegerField()
    rejected_claims = serializers.IntegerField()
    uploaded_proofs = serializers.IntegerField()


class HospitalAdminDashboardSerializer(serializers.Serializer):
    redeemed_vouchers = serializers.IntegerField()
    issued_vouchers = serializers.IntegerField()
    total_claims = serializers.IntegerField()
    pending_claims = serializers.IntegerField()
    number_of_staff = serializers.IntegerField()
