from rest_framework import serializers

from ..models import FeePolicy


class FeePolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = FeePolicy
        fields = [
            'id', 'name', 'description',
            'platform_fee_percentage', 'escrow_fee_percentage',
            'is_active', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, attrs):
        platform = attrs.get('platform_fee_percentage', getattr(self.instance, 'platform_fee_percentage', None))
        escrow = attrs.get('escrow_fee_percentage', getattr(self.instance, 'escrow_fee_percentage', None))
        if platform is not None and escrow is not None and platform + escrow != 100:
            raise serializers.ValidationError("platform_fee_percentage and escrow_fee_percentage must sum to 100.")

        # Warn the caller that activating this policy will deactivate the current one.
        is_active = attrs.get('is_active', getattr(self.instance, 'is_active', False))
        if is_active:
            current_pk = self.instance.pk if self.instance else None
            conflicting = FeePolicy.objects.filter(is_active=True).exclude(pk=current_pk).first()
            if conflicting:
                attrs['_deactivates'] = conflicting.name  # carried through to the view if needed

        return attrs
