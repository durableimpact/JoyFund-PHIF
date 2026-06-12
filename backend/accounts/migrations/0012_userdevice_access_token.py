from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("oauth2_provider", "0013_alter_application_authorization_grant_type_device"),
        ("accounts", "0011_userdevice"),
    ]

    operations = [
        migrations.AddField(
            model_name="userdevice",
            name="access_token",
            field=models.ForeignKey(
                blank=True,
                help_text="The access token associated with this device session",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to="oauth2_provider.accesstoken",
            ),
        ),
    ]
