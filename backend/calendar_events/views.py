from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta
from .models import CalendarEvent
from .serializers import CalendarEventSerializer, CalendarEventListSerializer, PlatformOwnerEventSerializer
from firms.models import Firm
from accounts.models import CustomUser


class CalendarEventViewSet(viewsets.ModelViewSet):
    """
    Calendar events for different user types:
    - Platform Owner: Full access — all firms, specific firm, specific advocate, specific client
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
        if self.request.user.user_type == 'platform_owner':
            return PlatformOwnerEventSerializer
        return CalendarEventSerializer

    def get_queryset(self):
        user = self.request.user

        # Platform Owner sees all events with optional filters
        if user.user_type == 'platform_owner':
            qs = CalendarEvent.objects.all()
            firm_id = self.request.query_params.get('firm_id')
            advocate_id = self.request.query_params.get('advocate_id')
            client_id = self.request.query_params.get('client_id')
            if firm_id:
                qs = qs.filter(firm_id=firm_id)
            if advocate_id:
                qs = qs.filter(assigned_to__id=advocate_id)
            if client_id:
                qs = qs.filter(client_id=client_id)
            return qs.distinct()

        elif user.user_type in ('super_admin', 'admin', 'advocate', 'paralegal'):
            if user.firm:
                return CalendarEvent.objects.filter(
                    Q(firm=user.firm) & (Q(created_by=user) | Q(assigned_to=user))
                ).distinct()
            # Solo advocate/paralegal with no firm — see only their own events
            return CalendarEvent.objects.filter(
                Q(created_by=user) | Q(assigned_to=user)
            ).distinct()

        elif user.user_type == 'client':
            client_profiles = user.client_profiles.all()
            if client_profiles.exists():
                # Client sees events assigned to them OR linked to their client profiles
                return CalendarEvent.objects.filter(
                    Q(assigned_to=user) | Q(client__in=client_profiles)
                ).distinct()
            return CalendarEvent.objects.none()

        return CalendarEvent.objects.none()

    def perform_create(self, serializer):
        user = self.request.user

        # Clients cannot create events
        if user.user_type == 'client':
            raise PermissionDenied('Clients cannot create calendar events.')

        if user.user_type == 'platform_owner':
            firm = serializer.validated_data.get('firm')
            if not firm:
                raise ValidationError({'firm': 'Platform owner must specify a firm when creating an event.'})
            serializer.save(created_by=user)
            return

        firm = user.firm
        # Solo advocates (no firm) are allowed — firm will be null on the event
        serializer.save(created_by=user, firm=firm)

    # ------------------------------------------------------------------ #
    #  Platform-owner-only actions                                         #
    # ------------------------------------------------------------------ #

    @action(detail=False, methods=['post'], url_path='broadcast')
    def broadcast(self, request):
        """
        Platform owner only.
        Creates the same event across ALL active firms (or a filtered subset).

        POST /api/calendar/events/broadcast/
        Body: standard event fields (no firm needed — applied to all firms)
        Optional query param: ?firm_ids=uuid1,uuid2  to target specific firms only
        """
        if request.user.user_type != 'platform_owner':
            raise PermissionDenied('Only platform owners can broadcast events.')

        firm_ids_param = request.query_params.get('firm_ids')
        if firm_ids_param:
            firm_ids = [fid.strip() for fid in firm_ids_param.split(',')]
            firms = Firm.objects.filter(id__in=firm_ids, is_active=True)
        else:
            firms = Firm.objects.filter(is_active=True)

        if not firms.exists():
            return Response({'error': 'No active firms found.'}, status=status.HTTP_400_BAD_REQUEST)

        created_events = []
        errors = []

        for firm in firms:
            serializer = PlatformOwnerEventSerializer(data=request.data)
            if serializer.is_valid():
                event = serializer.save(created_by=request.user, firm=firm)
                created_events.append({'firm': firm.firm_name, 'event_id': str(event.id)})
            else:
                errors.append({'firm': firm.firm_name, 'errors': serializer.errors})

        return Response({
            'created_count': len(created_events),
            'created': created_events,
            'errors': errors
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='by-firm/(?P<firm_id>[^/.]+)')
    def by_firm(self, request, firm_id=None):
        """
        Platform owner only.
        GET /api/calendar/events/by-firm/{firm_id}/
        Returns all events for a specific firm.
        """
        if request.user.user_type != 'platform_owner':
            raise PermissionDenied('Only platform owners can access this endpoint.')

        try:
            firm = Firm.objects.get(id=firm_id)
        except Firm.DoesNotExist:
            return Response({'error': 'Firm not found.'}, status=status.HTTP_404_NOT_FOUND)

        events = CalendarEvent.objects.filter(firm=firm)
        serializer = CalendarEventListSerializer(events, many=True)
        return Response({'firm': firm.firm_name, 'count': events.count(), 'events': serializer.data})

    @action(detail=False, methods=['get'], url_path='by-advocate/(?P<advocate_id>[^/.]+)')
    def by_advocate(self, request, advocate_id=None):
        """
        Platform owner only.
        GET /api/calendar/events/by-advocate/{advocate_id}/
        Returns all events assigned to or created by a specific advocate.
        """
        if request.user.user_type != 'platform_owner':
            raise PermissionDenied('Only platform owners can access this endpoint.')

        try:
            advocate = CustomUser.objects.get(id=advocate_id, user_type='advocate')
        except CustomUser.DoesNotExist:
            return Response({'error': 'Advocate not found.'}, status=status.HTTP_404_NOT_FOUND)

        events = CalendarEvent.objects.filter(
            Q(assigned_to=advocate) | Q(created_by=advocate)
        ).distinct()
        serializer = CalendarEventListSerializer(events, many=True)
        return Response({
            'advocate': advocate.get_full_name(),
            'count': events.count(),
            'events': serializer.data
        })

    @action(detail=False, methods=['get'], url_path='by-client/(?P<client_id>[^/.]+)')
    def by_client(self, request, client_id=None):
        """
        Platform owner only.
        GET /api/calendar/events/by-client/{client_id}/
        Returns all events linked to a specific client.
        """
        if request.user.user_type != 'platform_owner':
            raise PermissionDenied('Only platform owners can access this endpoint.')

        events = CalendarEvent.objects.filter(client_id=client_id)
        if not events.exists():
            return Response({'error': 'No events found for this client.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = CalendarEventListSerializer(events, many=True)
        return Response({'count': events.count(), 'events': serializer.data})
    
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
