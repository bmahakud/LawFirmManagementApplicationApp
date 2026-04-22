from django.db import models
import uuid
from django.utils import timezone


class CalendarEvent(models.Model):
    """Calendar events for hearings, meetings, deadlines, and tasks"""
    
    EVENT_TYPE_CHOICES = [
        ('hearing', 'Court Hearing'),
        ('meeting', 'Meeting'),
        ('deadline', 'Deadline'),
        ('task', 'Task'),
        ('consultation', 'Client Consultation'),
        ('filing', 'Document Filing'),
        ('other', 'Other'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('rescheduled', 'Rescheduled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Basic Info
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    event_type = models.CharField(max_length=20, choices=EVENT_TYPE_CHOICES, default='other')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    
    # Date & Time
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    all_day = models.BooleanField(default=False)
    
    # Location
    location = models.CharField(max_length=255, blank=True)
    court_name = models.CharField(max_length=255, blank=True)
    
    # Associations
    firm = models.ForeignKey('firms.Firm', on_delete=models.CASCADE, related_name='calendar_events')
    case = models.ForeignKey('cases.Case', on_delete=models.CASCADE, null=True, blank=True, related_name='calendar_events')
    client = models.ForeignKey('clients.Client', on_delete=models.SET_NULL, null=True, blank=True, related_name='calendar_events')
    
    # Participants
    created_by = models.ForeignKey('accounts.CustomUser', on_delete=models.SET_NULL, null=True, related_name='created_events')
    assigned_to = models.ManyToManyField('accounts.CustomUser', related_name='assigned_events', blank=True)
    
    # Reminders
    reminder_sent = models.BooleanField(default=False)
    reminder_time = models.DateTimeField(null=True, blank=True)
    
    # Notes
    notes = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['start_datetime']
        indexes = [
            models.Index(fields=['firm', 'start_datetime']),
            models.Index(fields=['event_type', 'status']),
            models.Index(fields=['start_datetime', 'end_datetime']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.start_datetime.strftime('%Y-%m-%d %H:%M')}"
    
    @property
    def is_upcoming(self):
        return self.start_datetime > timezone.now() and self.status == 'scheduled'
    
    @property
    def is_past(self):
        return self.end_datetime < timezone.now()
    
    @property
    def is_today(self):
        today = timezone.now().date()
        return self.start_datetime.date() == today
