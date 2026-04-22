from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta
from .models import CalendarEvent
from .serializers import CalendarEventSerializer, CalendarEventListSerializer


class CalendarEventViewSet(viewsets.ModelViewSet):
    """
    Calendar events for different user types:
    - Platform Owner: All events across all firms
    - Super Admin: All events in their firm
    - Admin: Events in their branch or firm
    - Advocate: Events they created or are assigned to
    - Paralegal: Events they are assigned to
    - Client: Events related to their cases
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return CalendarEventListSerializer
        return CalendarEventSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        # Platform Owner sees all events
        if user.user_type == 'platform_owner':
            return CalendarEvent.objects.all()
        
        # Super Admin sees all events in their firm
        elif user.user_type == 'super_admin':
            if user.firm:
                return CalendarEvent.objects.filter(firm=user.firm)
            return CalendarEvent.objects.none()
        
        # Admin sees events in their firm (or branch if assigned)
        elif user.user_type == 'admin':
            if user.firm:
                queryset = CalendarEvent.objects.filter(firm=user.firm)
                # TODO: Filter by branch if admin is assigned to specific branch
                return queryset
            return CalendarEvent.objects.none()
        
        # Advocate sees events they created or are assigned to
        elif user.user_type == 'advocate':
            if user.firm:
                return CalendarEvent.objects.filter(
                    Q(firm=user.firm) & (
                        Q(created_by=user) |
                        Q(assigned_to=user) |
                        Q(case__assigned_advocate=user)
                    )
                ).distinct()
            return CalendarEvent.objects.none()
        
        # Paralegal sees events they are assigned to
        elif user.user_type == 'paralegal':
            if user.firm:
                return CalendarEvent.objects.filter(
                    Q(firm=user.firm) & (
                        Q(assigned_to=user) |
                        Q(case__assigned_paralegal=user)
                    )
                ).distinct()
            return CalendarEvent.objects.none()
        
        # Client sees events related to their cases
        elif user.user_type == 'client':
            client_profile = getattr(user, 'client_profile', None)
            if client_profile:
                return CalendarEvent.objects.filter(
                    Q(client=client_profile) |
                    Q(case__client=client_profile)
                ).distinct()
            return CalendarEvent.objects.none()
        
        return CalendarEvent.objects.none()
    
    def perform_create(self, serializer):
        user = self.request.user
        firm = user.firm
        
        if not firm:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You must be associated with a firm to create events')
        
        serializer.save(created_by=user, firm=firm)
    
    @action(detail=False, methods=['get'])
    def month_view(self, request):
        """Get events for a specific month"""
        year = request.query_params.get('year', timezone.now().year)
        month = request.query_params.get('month', timezone.now().month)
        
        try:
            year = int(year)
            month = int(month)
        except ValueError:
            return Response({'error': 'Invalid year or month'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get first and last day of month
        from calendar import monthrange
        first_day = timezone.datetime(year, month, 1)
        last_day_num = monthrange(year, month)[1]
        last_day = timezone.datetime(year, month, last_day_num, 23, 59, 59)
        
        # Make timezone aware
        first_day = timezone.make_aware(first_day)
        last_day = timezone.make_aware(last_day)
        
        events = self.get_queryset().filter(
            start_datetime__gte=first_day,
            start_datetime__lte=last_day
        )
        
        # Search
        search = request.query_params.get('search')
        if search:
            events = events.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(location__icontains=search) |
                Q(case__case_title__icontains=search)
            )
        
        # Filter by event type
        event_type = request.query_params.get('event_type')
        if event_type:
            events = events.filter(event_type=event_type)
        
        # Filter by status
        event_status = request.query_params.get('status')
        if event_status:
            events = events.filter(status=event_status)
        
        serializer = self.get_serializer(events, many=True)
        return Response({
            'year': year,
            'month': month,
            'events': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def week_view(self, request):
        """Get events for current week"""
        today = timezone.now()
        start_of_week = today - timedelta(days=today.weekday())
        end_of_week = start_of_week + timedelta(days=6, hours=23, minutes=59, seconds=59)
        
        events = self.get_queryset().filter(
            start_datetime__gte=start_of_week,
            start_datetime__lte=end_of_week
        )
        
        serializer = self.get_serializer(events, many=True)
        return Response({
            'start_date': start_of_week,
            'end_date': end_of_week,
            'events': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def day_view(self, request):
        """Get events for a specific day"""
        date_str = request.query_params.get('date')
        
        if date_str:
            try:
                from datetime import datetime
                date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            date = timezone.now().date()
        
        start_of_day = timezone.make_aware(timezone.datetime.combine(date, timezone.datetime.min.time()))
        end_of_day = timezone.make_aware(timezone.datetime.combine(date, timezone.datetime.max.time()))
        
        events = self.get_queryset().filter(
            start_datetime__gte=start_of_day,
            start_datetime__lte=end_of_day
        )
        
        serializer = self.get_serializer(events, many=True)
        return Response({
            'date': date,
            'events': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming events (next 30 days)"""
        now = timezone.now()
        end_date = now + timedelta(days=30)
        
        events = self.get_queryset().filter(
            start_datetime__gte=now,
            start_datetime__lte=end_date,
            status='scheduled'
        ).order_by('start_datetime')
        
        # Pagination
        paginator = PageNumberPagination()
        paginator.page_size = 20
        result_page = paginator.paginate_queryset(events, request)
        serializer = self.get_serializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """Get today's events"""
        today = timezone.now().date()
        start_of_day = timezone.make_aware(timezone.datetime.combine(today, timezone.datetime.min.time()))
        end_of_day = timezone.make_aware(timezone.datetime.combine(today, timezone.datetime.max.time()))
        
        events = self.get_queryset().filter(
            start_datetime__gte=start_of_day,
            start_datetime__lte=end_of_day
        ).order_by('start_datetime')
        
        serializer = self.get_serializer(events, many=True)
        return Response({
            'date': today,
            'count': events.count(),
            'events': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def mark_completed(self, request, pk=None):
        """Mark event as completed"""
        event = self.get_object()
        event.status = 'completed'
        event.save()
        
        serializer = self.get_serializer(event)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel an event"""
        event = self.get_object()
        event.status = 'cancelled'
        event.save()
        
        serializer = self.get_serializer(event)
        return Response(serializer.data)
