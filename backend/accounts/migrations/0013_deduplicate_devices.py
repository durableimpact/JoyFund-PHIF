from collections import defaultdict

from django.db import migrations


def deduplicate_devices(apps, schema_editor):
    """Keep only the most-recently-active device per (user, user_agent) pair."""
    UserDevice = apps.get_model("accounts", "UserDevice")

    # Fetch all devices ordered by most recent last_active first
    all_devices = list(
        UserDevice.objects.order_by("-last_active").values_list(
            "id", "user_id", "user_agent",
        )
    )

    seen = set()
    ids_to_delete = []

    for device_id, user_id, user_agent in all_devices:
        key = (user_id, user_agent)
        if key in seen:
            ids_to_delete.append(device_id)
        else:
            seen.add(key)

    if ids_to_delete:
        UserDevice.objects.filter(id__in=ids_to_delete).delete()


def reverse_deduplicate(apps, schema_editor):
    """No-op — we cannot reconstruct deleted rows."""


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0012_userdevice_access_token"),
    ]

    operations = [
        migrations.RunPython(deduplicate_devices, reverse_deduplicate),
        migrations.AlterUniqueTogether(
            name="userdevice",
            unique_together={("user", "user_agent")},
        ),
    ]
