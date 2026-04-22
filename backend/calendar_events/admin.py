from django.contrib import admin
from .models import CalendarEvent


@admin.register(CalendarEvent)
class CalendarEventAdmin(admin.ModelAdmin):
    list_display = ['title', 'event_type', 'start_datetime', 'status', 'firm', 'created_by']
    list_filter = ['event_type', 'status', 'priority', 'firm']
    search_fields = ['title', 'description', 'location']
    date_hierarchy = 'start_datetime'
    filter_horizontal = ['assigned_to']
