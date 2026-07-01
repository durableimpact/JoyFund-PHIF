import logging
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache
from core.cache import invalidate_group

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# MODEL → CACHE GROUP(S) MAPPING
# When a model instance is created / updated / deleted (including through the
# Django admin), every cache group listed here is invalidated.  This catches
# views that use ``CacheInvalidationMixin`` or ``@cache_response(group=...)``
# from ``core.cache``.
# ---------------------------------------------------------------------------
MODEL_CACHE_GROUPS = {
    # -- accounts -----------------------------------------------------------
    'accounts.User': ['unified_users'],
    'accounts.HospitalAdmin': ['hospital_admins'],
    'accounts.SocialWorker': ['social_workers'],
    'accounts.Receptionist': ['receptionists'],
    'accounts.SystemAdmin': ['system_admins'],
    # -- campaigns ----------------------------------------------------------
    'campaigns.Campaign': ['campaigns', 'platform_stats', 'campaign_leaderboard'],
    'campaigns.Donation': ['campaigns', 'platform_stats', 'campaign_leaderboard'],
    # -- hospitals ----------------------------------------------------------
    'hospitals.Hospital': ['hospitals'],
    'hospitals.Services': ['services'],
    'hospitals.MedicalClaim': ['medical_claims'],
    # -- vouchers -----------------------------------------------------------
    'vouchers.Voucher': ['vouchers'],
    # -- payments -----------------------------------------------------------
    'payments.PaymentGateway': ['payment_gateways'],
    'payments.FeePolicy': ['fee_policies'],
    'payments.Disbursement': ['disbursements'],
    # -- notifications ------------------------------------------------------
    'notifications.Notification': ['notifications'],
    # -- logs ---------------------------------------------------------------
    'logs.ActivityLog': ['activity_logs'],
    'logs.RequestLog': ['request_logs'],
    'logs.ErrorLog': ['error_logs'],
    # -- beneficiaries ------------------------------------------------------
    'beneficiaries.Beneficiary': ['platform_stats'],
    'beneficiaries.HealthIssue': ['platform_stats'],
}

# ---------------------------------------------------------------------------
# MODEL → DIRECT CACHE KEYS
# Some views perform manual ``cache.set`` / ``cache.get`` with plain string
# keys that are NOT registered with a CacheGroup.  Those keys are listed here
# so they can be explicitly deleted when the corresponding model changes.
#
# Format:  {model_label: ([static_keys], dynamic_key_func | None)}
#   static_keys      – list of keys that are always deleted.
#   dynamic_key_func – callable(instance) -> [key, …] for instance-specific
#                      keys (e.g. ``transaction_detail_{id}``).
# ---------------------------------------------------------------------------
MODEL_DIRECT_CACHE_KEYS = {
    'payments.Transaction': (
        ['transaction_list'],
        lambda inst: [f'transaction_detail_{inst.id}'],
    ),
    'payments.FeeSplit': (
        ['fee_split_list'],
        lambda inst: [f'fee_split_detail_{inst.id}'],
    ),
    'payments.Account': (['account_list'], None),
    'payments.EscrowAccount': (['escrow_account_detail'], None),
    'payments.FeeAccount': (['fee_account_detail'], None),
}

# ---------------------------------------------------------------------------
# MODEL → KEY PREFIXES  (accounts.utils.cache  @cache_response)
# Views decorated with ``@cache_response(key_prefix=...)`` store responses
# under keys matching ``view_cache:{prefix}:{md5_hash}``.  Pattern-based
# deletion requires Redis; on other backends we fall back to deleting the
# base key.
# ---------------------------------------------------------------------------
MODEL_KEY_PREFIXES = {
    'accounts.Donor': ['donor_list', 'donor_detail'],
    'campaigns.Donation': ['donation'],
}


def _model_label(sender):
    return f"{sender._meta.app_label}.{sender.__name__}"


def _invalidate_key_prefixes(prefixes):
    for prefix in prefixes:
        pattern = f"view_cache:{prefix}:*"
        try:
            cache.delete_pattern(pattern)
        except AttributeError:
            cache.delete(f"view_cache:{prefix}")


@receiver(post_save)
@receiver(post_delete)
def invalidate_cache_on_model_change(sender, instance, **kwargs):
    """Global cache invalidation signal for every model change.

    Fires on **every** ``post_save`` / ``post_delete`` regardless of origin
    (API, admin, shell, …).  Harmlessly double-invalidates when the API view
    already calls ``_invalidate_cache()`` via ``CacheInvalidationMixin``.
    """
    label = _model_label(sender)

    # 1. Invalidate CacheGroups (core.cache / CacheInvalidationMixin)
    groups = MODEL_CACHE_GROUPS.get(label, [])
    for group in groups:
        logger.debug("Cache invalidation: model=%s, group=%s", label, group)
        invalidate_group(group)

    # 2. Delete direct cache keys (manual cache.set)
    entry = MODEL_DIRECT_CACHE_KEYS.get(label)
    if entry:
        static_keys, dynamic_func = entry
        keys = list(static_keys)
        if dynamic_func:
            try:
                keys.extend(dynamic_func(instance))
            except Exception:
                pass
        logger.debug("Cache invalidation: model=%s, direct_keys=%s", label, keys)
        cache.delete_many(keys)

    # 3. Invalidate accounts.utils.cache key-prefix entries
    prefixes = MODEL_KEY_PREFIXES.get(label)
    if prefixes:
        logger.debug("Cache invalidation: model=%s, key_prefixes=%s", label, prefixes)
        _invalidate_key_prefixes(prefixes)
