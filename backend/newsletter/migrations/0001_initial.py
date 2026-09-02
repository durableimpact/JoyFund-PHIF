# Generated migration for the newsletter Subscriber model.

import uuid

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Subscriber",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "email",
                    models.EmailField(
                        help_text="Subscriber email address",
                        max_length=254,
                        unique=True,
                    ),
                ),
                (
                    "is_active",
                    models.BooleanField(
                        default=True,
                        help_text="Whether the subscriber is still subscribed",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="subscriber",
            index=models.Index(fields=["email"], name="newsletter__email_idx"),
        ),
        migrations.AddIndex(
            model_name="subscriber",
            index=models.Index(
                fields=["-created_at"], name="newsletter__created_idx"
            ),
        ),
    ]
