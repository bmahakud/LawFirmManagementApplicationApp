import uuid
from django.db import models
from django.utils import timezone


class CaseDraftVersion(models.Model):
    """
    Google Docs-style version control snapshots for Case Drafts and Master Filing Packs.
    Stores workspace annotations, page counts, change summaries, and PDF snapshots.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(
        'cases.Case',
        on_delete=models.CASCADE,
        related_name='draft_versions',
        help_text="Case this draft version belongs to"
    )
    document = models.ForeignKey(
        'documents.UserDocument',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='draft_versions',
        help_text="Master document or file this snapshot was created from"
    )
    document_identifier = models.CharField(
        max_length=255,
        blank=True,
        default='',
        db_index=True,
        help_text="Unique identifier of the specific file or court form (e.g. doc-master-xxx, doc-case-xxx, doc-form-xxx)"
    )
    version_number = models.PositiveIntegerField(default=1)
    version_name = models.CharField(max_length=255, default='Auto-saved Draft')
    created_by = models.ForeignKey(
        'accounts.CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_draft_versions'
    )
    page_count = models.PositiveIntegerField(default=1)
    annotation_count = models.PositiveIntegerField(default=0)
    summary = models.TextField(blank=True, default='')
    snapshot_data = models.JSONField(
        default=dict,
        blank=True,
        help_text="Serialized JSON of mobile-store workspace state (highlights, ink, notes, bookmarks)"
    )
    pdf_file = models.FileField(
        upload_to='draft_versions/%Y/%m/%d/',
        null=True,
        blank=True,
        help_text="Optional PDF snapshot binary"
    )
    is_named = models.BooleanField(
        default=False,
        help_text="True if manually named by the advocate as a key milestone"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Case Draft Version'
        verbose_name_plural = 'Case Draft Versions'

    def __str__(self):
        return f"Case {self.case_id} - v{self.version_number}: {self.version_name} ({self.created_at.strftime('%Y-%m-%d %H:%M')})"
