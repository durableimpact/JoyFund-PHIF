from rest_framework import serializers

class ErrorResponseSerializer(serializers.Serializer):
    """Standard error response format for the API."""
    detail = serializers.CharField(help_text="A human-readable description of the error.")
    error_code = serializers.CharField(help_text="A unique machine-readable string identifying the error type.")
