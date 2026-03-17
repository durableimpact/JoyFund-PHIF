from rest_framework import serializers

from ..models import Account, EscrowAccount, FeeAccount


class AccountSerializer(serializers.ModelSerializer):
    account_type = serializers.SerializerMethodField(help_text="Concrete account type (e.g. EscrowAccount, FeeAccount).")

    class Meta:
        model = Account
        fields = ['id', 'name', 'account_type', 'balance', 'created_at', 'updated_at']
        read_only_fields = fields

    def get_account_type(self, obj):
        return obj.__class__.__name__



class EscrowAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = EscrowAccount
        fields = ['id', 'name', 'balance', 'created_at', 'updated_at']
        read_only_fields = fields


class FeeAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeeAccount
        fields = ['id', 'name', 'balance', 'created_at', 'updated_at']
        read_only_fields = fields
