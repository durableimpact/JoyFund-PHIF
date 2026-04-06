import uuid

from django.contrib.auth import get_user_model
from accounts.models import Role


User = get_user_model()


def _generate_placeholder_phone_number() -> str:
    while True:
        candidate = str(uuid.uuid4().int)[:15]
        if not User.objects.filter(phone_number=candidate).exists():
            return candidate


def create_user_with_placeholder_phone(strategy, details, backend, user=None, *args, **kwargs):
    if user:
        return {'user': user}

    email = (details.get('email') or '').strip().lower()
    if email:
        existing = User.objects.filter(email__iexact=email).first()
        if existing:
            return {'user': existing, 'is_new': False}

    user = User.objects.create_user(
        email=email or f"social-{uuid.uuid4().hex[:12]}@joyfund.local",
        first_name=details.get('first_name', ''),
        last_name=details.get('last_name', ''),
        role=Role.DONOR,
        phone_number=_generate_placeholder_phone_number(),
    )

    return {'user': user, 'is_new': True}
