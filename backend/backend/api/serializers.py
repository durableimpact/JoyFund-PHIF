from rest_framework import serializers


class PlatformStatsSerializer(serializers.Serializer):
    """
    Serializer for platform-wide statistics.
    Returns high-level metrics about the platform's impact.
    """
    lives_supported = serializers.IntegerField(
        help_text="Total number of beneficiaries with resolved health issues (actual platform impact)"
    )
    active_campaigns = serializers.IntegerField(
        help_text="Number of campaigns currently active"
    )
    total_raised = serializers.DecimalField(
        max_digits=15,
        decimal_places=2,
        help_text="Total amount of money raised through successful donations (XAF)"
    )
