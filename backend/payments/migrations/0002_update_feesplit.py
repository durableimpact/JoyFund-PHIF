from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0001_initial'),
    ]

    operations = [
        # Drop the old ForeignKey and recreate as OneToOneField with the new fields.
        migrations.RemoveField(
            model_name='feesplit',
            name='transaction',
        ),
        migrations.AddField(
            model_name='feesplit',
            name='transaction',
            field=models.OneToOneField(
                help_text="The DONATION transaction this split was calculated from.",
                limit_choices_to={'type': 'DONATION'},
                on_delete=django.db.models.deletion.CASCADE,
                related_name='fee_split',
                to='payments.transaction',
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='feesplit',
            name='fee_policy',
            field=models.ForeignKey(
                help_text="The fee policy that was active when this split was calculated.",
                on_delete=django.db.models.deletion.PROTECT,
                related_name='fee_splits',
                to='payments.feepolicy',
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='feesplit',
            name='gross_amount',
            field=models.DecimalField(
                decimal_places=2,
                default=0,
                help_text='Total donation amount before any deduction (XAF).',
                max_digits=10,
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='feesplit',
            name='escrow_amount',
            field=models.DecimalField(
                decimal_places=2,
                default=0,
                help_text='Amount routed to the Escrow Account for beneficiary care (XAF).',
                max_digits=10,
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='feesplit',
            name='platform_amount',
            field=models.DecimalField(
                decimal_places=2,
                default=0,
                help_text='Amount routed to the Fee Account for platform operations (XAF).',
                max_digits=10,
            ),
            preserve_default=False,
        ),
    ]
