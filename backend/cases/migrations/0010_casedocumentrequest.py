# Generated migration for CaseDocumentRequest model

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('cases', '0009_make_firm_nullable_add_solo_advocate'),
        ('documents', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='CaseDocumentRequest',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('document_type', models.CharField(help_text='Type of document requested (e.g., aadhar, pan, fir, etc.)', max_length=50)),
                ('document_title', models.CharField(help_text='Title/name of the requested document', max_length=255)),
                ('description', models.TextField(blank=True, help_text='Description of what document is needed and why')),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('uploaded', 'Uploaded'), ('verified', 'Verified'), ('rejected', 'Rejected')], default='pending', max_length=20)),
                ('priority', models.CharField(choices=[('high', 'High'), ('medium', 'Medium'), ('low', 'Low')], default='medium', max_length=10)),
                ('due_date', models.DateField(blank=True, help_text='Deadline for document submission', null=True)),
                ('uploaded_at', models.DateTimeField(blank=True, null=True)),
                ('advocate_notes', models.TextField(blank=True, help_text='Internal notes from advocate')),
                ('client_notes', models.TextField(blank=True, help_text='Notes from client when uploading')),
                ('rejection_reason', models.TextField(blank=True, help_text='Reason if document is rejected')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('case', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='document_requests', to='cases.case')),
                ('requested_by', models.ForeignKey(help_text='Advocate who requested this document', on_delete=django.db.models.deletion.CASCADE, related_name='document_requests_created', to=settings.AUTH_USER_MODEL)),
                ('uploaded_document', models.ForeignKey(blank=True, help_text='Document uploaded by client to fulfill this request', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='fulfills_request', to='documents.userdocument')),
            ],
            options={
                'ordering': ['-priority', '-created_at'],
                'indexes': [
                    models.Index(fields=['case', 'status'], name='cases_cased_case_id_b8c9e5_idx'),
                    models.Index(fields=['status', 'due_date'], name='cases_cased_status_f3a2d1_idx'),
                ],
            },
        ),
    ]
