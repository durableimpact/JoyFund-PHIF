"""Tests for payments models."""

import pytest
from decimal import Decimal
from django.core.exceptions import ValidationError
from payments.models import Account, EscrowAccount, FeeAccount, FeePolicy
from campaigns.models import Campaign


@pytest.mark.django_db
@pytest.mark.model
class TestAccountModel:
    """Test Account model."""

    def test_create_account(self):
        """Test creating an account."""
        account = Account.objects.create(
            name='Test Account',
            balance=Decimal('1000.00')
        )
        
        assert account.name == 'Test Account'
        assert account.balance == Decimal('1000.00')
        assert account.id is not None

    def test_account_default_balance_is_zero(self):
        """Test that default balance is zero."""
        account = Account.objects.create(name='Test')
        assert account.balance == 0

    def test_account_timestamps(self):
        """Test that timestamps are set."""
        account = Account.objects.create(name='Test')
        assert account.created_at is not None
        assert account.updated_at is not None

    def test_account_balance_can_be_negative(self):
        """Test that account balance can be negative (debt)."""
        account = Account.objects.create(
            name='Negative Balance',
            balance=Decimal('-500.00')
        )
        
        assert account.balance == Decimal('-500.00')

    def test_account_balance_accepts_decimal_amounts(self):
        """Test that balance accepts decimal amounts."""
        account = Account.objects.create(
            name='Test',
            balance=Decimal('1234.56')
        )
        
        assert account.balance == Decimal('1234.56')


@pytest.mark.django_db
@pytest.mark.model
class TestEscrowAccount:
    """Test EscrowAccount singleton."""

    def test_get_escrow_account_instance_creates_if_missing(self):
        """Test that get_instance creates account if missing."""
        # Ensure none exist
        EscrowAccount.objects.all().delete()
        
        account = EscrowAccount.get_instance()
        assert account is not None
        assert account.name == 'EscrowAccount'

    def test_get_escrow_account_returns_same_instance(self):
        """Test that get_instance always returns same instance."""
        EscrowAccount.objects.all().delete()
        
        instance1 = EscrowAccount.get_instance()
        instance2 = EscrowAccount.get_instance()
        
        assert instance1.id == instance2.id
        assert instance1.pk == instance2.pk

    def test_cannot_create_second_escrow_account(self):
        """Test that creating second escrow account raises error."""
        EscrowAccount.objects.all().delete()
        account1 = EscrowAccount.get_instance()
        
        with pytest.raises(ValidationError):
            EscrowAccount.objects.create(
                name='Second Escrow',
                balance=Decimal('1000.00')
            )

    def test_cannot_delete_escrow_account(self):
        """Test that escrow account cannot be deleted."""
        account = EscrowAccount.get_instance()
        
        with pytest.raises(ValidationError):
            account.delete()

    def test_escrow_account_string_representation(self):
        """Test escrow account string representation."""
        account = EscrowAccount.get_instance()
        account.balance = Decimal('5000.00')
        account.save()
        
        assert 'EscrowAccount' in str(account)
        assert 'Balance' in str(account)
        assert '5000' in str(account)


@pytest.mark.django_db
@pytest.mark.model
class TestFeeAccount:
    """Test FeeAccount singleton."""

    def test_get_fee_account_instance(self):
        """Test getting fee account instance."""
        FeeAccount.objects.all().delete()
        
        account = FeeAccount.get_instance()
        assert account.name == 'FeeAccount'

    def test_fee_account_singleton_constraint(self):
        """Test that only one fee account can exist."""
        FeeAccount.objects.all().delete()
        account1 = FeeAccount.get_instance()
        
        with pytest.raises(ValidationError):
            FeeAccount.objects.create(name='Another Fee')

    def test_cannot_delete_fee_account(self):
        """Test that fee account cannot be deleted."""
        account = FeeAccount.get_instance()
        
        with pytest.raises(ValidationError):
            account.delete()


@pytest.mark.django_db
@pytest.mark.model
class TestFeePolicy:
    """Test FeePolicy model."""

    def test_create_fee_policy(self):
        """Test creating a fee policy."""
        policy = FeePolicy.objects.create(
            name='Standard Fee',
            platform_fee_percentage=Decimal('50.00'),
            escrow_fee_percentage=Decimal('50.00')
        )
        
        assert policy.name == 'Standard Fee'
        assert policy.platform_fee_percentage == Decimal('50.00')
        assert policy.escrow_fee_percentage == Decimal('50.00')
        assert policy.is_active is True

    def test_fee_policy_must_sum_to_100_percent(self):
        """Test that fees must sum to 100%."""
        with pytest.raises(ValidationError):
            policy = FeePolicy.objects.create(
                name='Invalid Fee',
                platform_fee_percentage=Decimal('60.00'),
                escrow_fee_percentage=Decimal('30.00')
            )
            policy.full_clean()

    def test_fee_policy_can_be_inactive(self):
        """Test that fee policy can be marked inactive."""
        policy = FeePolicy.objects.create(
            name='Old Fee',
            platform_fee_percentage=Decimal('50.00'),
            escrow_fee_percentage=Decimal('50.00'),
            is_active=False
        )
        
        assert policy.is_active is False

    def test_fee_policy_timestamps(self):
        """Test that policy has timestamps."""
        policy = FeePolicy.objects.create(
            name='Test Policy',
            platform_fee_percentage=Decimal('50.00'),
            escrow_fee_percentage=Decimal('50.00')
        )
        
        assert policy.created_at is not None
        assert policy.updated_at is not None

    def test_fee_policy_with_uneven_split(self):
        """Test fee policy with uneven fee split."""
        policy = FeePolicy.objects.create(
            name='Uneven Split',
            platform_fee_percentage=Decimal('60.00'),
            escrow_fee_percentage=Decimal('40.00')
        )
        
        total = policy.platform_fee_percentage + policy.escrow_fee_percentage
        assert total == Decimal('100.00')

    def test_query_active_policies(self):
        """Test querying active policies."""
        FeePolicy.objects.create(
            name='Active Policy 1',
            platform_fee_percentage=Decimal('50.00'),
            escrow_fee_percentage=Decimal('50.00'),
            is_active=True
        )
        
        FeePolicy.objects.create(
            name='Inactive Policy',
            platform_fee_percentage=Decimal('40.00'),
            escrow_fee_percentage=Decimal('60.00'),
            is_active=False
        )
        
        active_policies = FeePolicy.objects.filter(is_active=True)
        assert active_policies.count() >= 1
