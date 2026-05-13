from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models_service import ServiceAttempt
from .serializers_service import ServiceAttemptSerializer, ServiceAttemptListSerializer
from .models import Case
from firms.permissions import IsSubscriptionActive


class ServiceAttemptViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing service attempts.
    
    Endpoints:
    - GET /api/service-attempts/ - List all service attempts
    - POST /api/service-attempts/ - Create new service attempt
    - GET /api/service-attempts/{id}/ - Get specific service attempt
    - PATCH /api/service-attempts/{id}/ - Update service attempt
    - DELETE /api/service-attempts/{id}/ - Delete service attempt
    - GET /api/service-attempts/by-case/?case_id=<uuid> - Get all attempts for a case
    - GET /api/service-attempts/pending/ - Get all pending service attempts
    """
    
    queryset = ServiceAttempt.objects.all()
    serializer_class = ServiceAttemptSerializer
    permission_classes = [permissions.IsAuthenticated, IsSubscriptionActive]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['served_to', 'served_by', 'address', 'remarks']
    ordering_fields = ['service_date', 'created_at', 'status']
    
    def get_queryset(self):
        """Filter service attempts based on user permissions"""
        user = self.request.user
        queryset = ServiceAttempt.objects.select_related('case', 'created_by')
        
        # Platform owner sees all
        if user.user_type == 'platform_owner':
            return queryset
        
        # Firm-based users
        if user.firm:
            queryset = queryset.filter(case__firm=user.firm)
            
            # Branch-specific admin
            if user.user_type == 'admin':
                from accounts.models import UserFirmRole
                membership = UserFirmRole.objects.filter(
                    user=user,
                    firm=user.firm,
                    is_active=True,
                    branch__isnull=False
                ).first()
                
                if membership and membership.branch:
                    queryset = queryset.filter(case__branch=membership.branch)
        
        # Solo advocate
        elif user.user_type == 'advocate':
            queryset = queryset.filter(case__solo_advocate=user)
        
        # Client - see only their case's service attempts
        elif user.user_type == 'client':
            if hasattr(user, 'client_profile') and user.client_profile:
                queryset = queryset.filter(case__client=user.client_profile)
            else:
                queryset = queryset.none()
        
        else:
            queryset = queryset.none()
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by service type
        service_type = self.request.query_params.get('service_type')
        if service_type:
            queryset = queryset.filter(service_type=service_type)
        
        return queryset
    
    def get_serializer_class(self):
        """Use lightweight serializer for list view"""
        if self.action == 'list':
            return ServiceAttemptListSerializer
        return ServiceAttemptSerializer
    
    def perform_create(self, serializer):
        """Set created_by to current user"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'], url_path='by-case')
    def by_case(self, request):
        """
        Get all service attempts for a specific case.
        
        GET /api/service-attempts/by-case/?case_id=<uuid>
        """
        case_id = request.query_params.get('case_id')
        
        if not case_id:
            return Response(
                {'error': 'case_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            case = Case.objects.get(id=case_id)
        except Case.DoesNotExist:
            return Response(
                {'error': 'Case not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Permission check
        user = request.user
        if user.user_type != 'platform_owner':
            if user.firm:
                if case.firm != user.firm:
                    return Response(
                        {'error': 'You do not have permission to view this case'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            elif user.user_type == 'advocate':
                if case.solo_advocate != user:
                    return Response(
                        {'error': 'You do not have permission to view this case'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            elif user.user_type == 'client':
                if not (hasattr(user, 'client_profile') and case.client == user.client_profile):
                    return Response(
                        {'error': 'You do not have permission to view this case'},
                        status=status.HTTP_403_FORBIDDEN
                    )
        
        # Get service attempts
        attempts = ServiceAttempt.objects.filter(case=case).order_by('-service_date')
        serializer = ServiceAttemptSerializer(attempts, many=True)
        
        return Response({
            'case_id': str(case.id),
            'case_number': case.case_number,
            'case_title': case.case_title,
            'total_attempts': attempts.count(),
            'service_attempts': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """
        Get all pending service attempts (status=pending or next_attempt_date is today/past).
        
        GET /api/service-attempts/pending/
        """
        from django.utils import timezone
        today = timezone.now().date()
        
        queryset = self.get_queryset()
        
        # Pending status OR next attempt date is due
        pending_attempts = queryset.filter(
            Q(status='pending') |
            Q(status__in=['unserved', 'returned'], next_attempt_date__lte=today)
        ).order_by('next_attempt_date', 'service_date')
        
        serializer = ServiceAttemptSerializer(pending_attempts, many=True)
        
        return Response({
            'count': pending_attempts.count(),
            'pending_attempts': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """
        Get service attempt statistics.
        
        GET /api/service-attempts/statistics/
        """
        queryset = self.get_queryset()
        
        total = queryset.count()
        served = queryset.filter(status='served').count()
        pending = queryset.filter(status='pending').count()
        unserved = queryset.filter(status__in=['unserved', 'returned', 'refused']).count()
        
        # Success rate
        success_rate = (served / total * 100) if total > 0 else 0
        
        # By service method
        by_method = {}
        for method_code, method_label in ServiceAttempt.SERVICE_METHOD_CHOICES:
            count = queryset.filter(service_method=method_code).count()
            if count > 0:
                by_method[method_label] = count
        
        # By service type
        by_type = {}
        for type_code, type_label in ServiceAttempt.SERVICE_TYPE_CHOICES:
            count = queryset.filter(service_type=type_code).count()
            if count > 0:
                by_type[type_label] = count
        
        return Response({
            'total_attempts': total,
            'served': served,
            'pending': pending,
            'unserved': unserved,
            'success_rate': round(success_rate, 2),
            'by_service_method': by_method,
            'by_service_type': by_type
        })
