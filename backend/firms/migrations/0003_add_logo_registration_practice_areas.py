# Generated manually on 2026-04-15

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("firms", "0002_branch"),
    ]

    operations = [
        migrations.AddField(
            model_name="firm",
            name="logo",
            field=models.ImageField(blank=True, null=True, upload_to="firm_logos/"),
        ),
        migrations.AddField(
            model_name="firm",
            name="registration_number",
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name="firm",
            name="practice_areas",
            field=models.JSONField(blank=True, default=list),
        ),
    ]
