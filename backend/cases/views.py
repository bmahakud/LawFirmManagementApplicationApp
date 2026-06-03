from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Case, CaseActivity, Hearing, CaseDraft
from .serializers import (
    CaseSerializer, CaseActivitySerializer, 
    HearingSerializer, CaseDraftSerializer
)
from audit.models import AuditLog

from firms.permissions import IsSubscriptionActive

class CaseViewSet(viewsets.ModelViewSet):
    queryset = Case.objects.all()
    serializer_class = CaseSerializer
    permission_classes = [permissions.IsAuthenticated, IsSubscriptionActive]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'case_title', 'case_number', 'petitioner_name', 
        'respondent_name', 'court_name', 'cnr_number'
    ]
    ordering_fields = ['created_at', 'next_hearing_date', 'priority']

    def get_queryset(self):
        user = self.request.user
        queryset = Case.objects.all()
        
        # ── Client users: short-circuit BEFORE firm/advocate filters ──
        if user.user_type == 'client':
            # A client user might have multiple client profiles (across different firms)
            client_profiles = user.client_profiles.all()
            if client_profiles.exists():
                return Case.objects.filter(client__in=client_profiles)
            return Case.objects.none()
        
        if user.user_type != 'platform_owner':
            if user.firm:
                # Firm-based: filter by firm
                queryset = queryset.filter(firm=user.firm)
                
                # If admin is assigned to a specific branch, filter by that branch
                if user.user_type == 'admin':
                    from accounts.models import UserFirmRole
                    membership = UserFirmRole.objects.filter(
                        user=user,
                        firm=user.firm,
                        is_active=True,
                        branch__isnull=False
                    ).first()
                    
                    if membership and membership.branch:
                        # Admin is assigned to a branch, show only that branch's cases
                        queryset = queryset.filter(branch=membership.branch)
                        
            elif user.user_type == 'advocate':
                # Solo advocate: only their own cases
                queryset = queryset.filter(solo_advocate=user)
            else:
                queryset = queryset.none()
        
        # Filter by assigned advocate (for advocates to see only their cases)
        assigned_to_me = self.request.query_params.get('assigned_to_me')
        if assigned_to_me and assigned_to_me.lower() == 'true':
            if user.user_type == 'advocate':
                queryset = queryset.filter(assigned_advocate=user)
        
        # Filter by status if provided (e.g. ?status=running)
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
            
        # Helper for Active cases (?is_active=true)
        # Filters out closed, disposed, and judgment cases
        is_active = self.request.query_params.get('is_active')
        if is_active and is_active.lower() == 'true':
            active_statuses = ['running', 'created', 'filed', 'evidence', 'hearing']
            queryset = queryset.filter(status__in=active_statuses)
            
        # Filter by category if provided (e.g. ?category=pre_litigation)
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
            
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        from rest_framework.exceptions import PermissionDenied, ValidationError
        
        # 1. Permission Check
        allowed_roles = ['advocate', 'admin', 'super_admin', 'platform_owner']
        if user.user_type not in allowed_roles:
            raise PermissionDenied("You do not have permission to create cases.")
        
        # 2. Determine if this is a solo advocate (not under any law firm)
        is_solo_advocate = (user.user_type == 'advocate' and not user.firm)
        
        if is_solo_advocate:
            # Solo advocate: case belongs to them directly, no firm required
            advocate = user
            branch = None
            client = serializer.validated_data.get('client')
            
            case = serializer.save(
                firm=None,
                branch=None,
                solo_advocate=user,
                assigned_advocate=user
            )
        else:
            # Firm-based flow: firm is required
            if not user.firm:
                raise ValidationError({"firm": "You must belong to a law firm to create cases."})
            
            # 3. Extract assignment data
            advocate = serializer.validated_data.get('assigned_advocate')
            branch = serializer.validated_data.get('branch')
            client = serializer.validated_data.get('client')
            
            # 4. Validation: Advocate must belong to the same firm
            if advocate and advocate.firm != user.firm:
                raise ValidationError({"assigned_advocate": "Assigned advocate must belong to the same law firm."})
            
            # 5. Branch Logic
            if user.user_type == 'admin':
                from accounts.models import UserFirmRole
                admin_role = UserFirmRole.objects.filter(user=user, firm=user.firm).first()
                if admin_role and admin_role.branch:
                    branch = admin_role.branch
                elif not branch:
                    pass

            case = serializer.save(firm=user.firm, branch=branch, solo_advocate=None)
        
        # 6. Auto-assign client to advocate if not already assigned
        client = case.client
        assigned_advocate = case.assigned_advocate
        if assigned_advocate and client and not client.assigned_advocate:
            client.assigned_advocate = assigned_advocate
            client.save()
        
        # 7. Log activity
        CaseActivity.objects.create(
            case=case,
            performed_by=user,
            activity_type='case_created',
            description=f"Case created by {user.get_full_name()} ({user.get_user_type_display()})"
        )

    def perform_update(self, serializer):
        old_case = self.get_object()
        old_status = old_case.status
        old_advocate = old_case.assigned_advocate
        
        case = serializer.save()
        new_status = case.status
        new_advocate = case.assigned_advocate
        
        # Auto-assign client to advocate if advocate changed and client has no advocate
        if new_advocate and new_advocate != old_advocate:
            client = case.client
            if not client.assigned_advocate:
                client.assigned_advocate = new_advocate
                client.save()
        
        if old_status != new_status:
            CaseActivity.objects.create(
                case=case,
                performed_by=self.request.user,
                activity_type='status_change',
                description=f"Status changed from {old_status} to {new_status}",
                previous_status=old_status,
                new_status=new_status
            )

class HearingViewSet(viewsets.ModelViewSet):
    queryset = Hearing.objects.all()
    serializer_class = HearingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Hearing.objects.filter(case__firm=self.request.user.firm)

class CaseDraftViewSet(viewsets.ModelViewSet):
    queryset = CaseDraft.objects.all()
    serializer_class = CaseDraftSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CaseDraft.objects.filter(case__firm=self.request.user.firm)


    # ==================== ADVOCATE CASES ENDPOINT ====================

    @action(detail=False, methods=['get'], url_path='by-advocate')
    def by_advocate(self, request):
        """
        Get all cases for a specific advocate with pagination and search.

        GET /api/cases/by-advocate/?advocate_id=<uuid>
        Optional filters: ?search=, ?status=, ?category=, ?page=, ?page_size=
        """
        from accounts.models import CustomUser
        from rest_framework.exceptions import PermissionDenied, ValidationError
        from rest_framework.pagination import PageNumberPagination

        advocate_id = request.query_params.get('advocate_id')
        if not advocate_id:
            return Response({'error': 'advocate_id is required'}, status=400)

        try:
            advocate = CustomUser.objects.get(id=advocate_id, user_type='advocate')
        except CustomUser.DoesNotExist:
            return Response({'error': 'Advocate not found'}, status=404)

        user = request.user

        # Permission: platform_owner sees all; firm users must share the same firm;
        # the advocate themselves can see their own cases
        if user.user_type != 'platform_owner':
            if user != advocate:
                if not user.firm or advocate.firm != user.firm:
                    raise PermissionDenied("You do not have access to this advocate's cases.")

        # Build queryset — covers both firm-based and solo advocate cases
        if advocate.firm:
            queryset = Case.objects.filter(firm=advocate.firm, assigned_advocate=advocate)
        else:
            queryset = Case.objects.filter(solo_advocate=advocate)

        # Search
        search = request.query_params.get('search', '').strip()
        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(case_title__icontains=search) |
                Q(case_number__icontains=search) |
                Q(petitioner_name__icontains=search) |
                Q(respondent_name__icontains=search) |
                Q(court_name__icontains=search) |
                Q(cnr_number__icontains=search)
            )

        # Filters
        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        category_filter = request.query_params.get('category')
        if category_filter:
            queryset = queryset.filter(category=category_filter)

        queryset = queryset.order_by('-created_at')

        # Paginate
        paginator = PageNumberPagination()
        page_size = request.query_params.get('page_size')
        if page_size:
            try:
                paginator.page_size = int(page_size)
            except ValueError:
                pass

        page = paginator.paginate_queryset(queryset, request)
        serializer = self.get_serializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    # ==================== E-COURTS INTEGRATION ENDPOINTS ====================
    
    @action(detail=False, methods=['post'])
    def import_from_ecourts(self, request):
        """
        Import case from E-Courts by CNR number
        
        POST /api/cases/import_from_ecourts/
        {
            "cnr_number": "DLST020314162024",
            "court_type": "district-court",  // or "high-court"
            "client_id": "client-uuid",
            "assigned_advocate_id": "advocate-uuid"
        }
        """
        from .ecourts import ECourtService
        from clients.models import Client
        from accounts.models import CustomUser
        
        cnr_number = request.data.get('cnr_number')
        court_type = request.data.get('court_type', 'district-court')
        client_id = request.data.get('client_id')
        advocate_id = request.data.get('assigned_advocate_id')
        
        if not cnr_number:
            return Response({'error': 'CNR number is required'}, status=400)
        
        # Fetch from E-Courts
        ecourt_service = ECourtService()
        ecourt_response = ecourt_service.get_case_by_cnr(cnr_number, court_type)
        
        if not ecourt_response.get('success'):
            return Response({
                'error': 'Failed to fetch case from E-Courts',
                'details': ecourt_response.get('error')
            }, status=400)
        
        # Parse data
        parsed_data = ecourt_service.parse_case_data(ecourt_response)
        
        if not parsed_data:
            return Response({'error': 'Failed to parse case data'}, status=400)
        
        # Create case in our system
        try:
            client = Client.objects.get(id=client_id) if client_id else None
            advocate = CustomUser.objects.get(id=advocate_id) if advocate_id else None
            
            case = Case.objects.create(
                firm=request.user.firm,  # None for solo advocates
                solo_advocate=request.user if not request.user.firm else None,
                client=client,
                assigned_advocate=advocate or (request.user if not request.user.firm else None),
                case_title=f"{parsed_data.get('case_type', 'Case')} - {parsed_data.get('case_number', '')}",
                case_number=parsed_data.get('case_number'),
                cnr_number=parsed_data.get('cnr_number'),
                case_type=parsed_data.get('case_type', ''),
                filing_date=parsed_data.get('filing_date'),
                court_name=parsed_data.get('court_name', ''),
                court_no=parsed_data.get('court_no', ''),
                judge_name=parsed_data.get('judge_name', ''),
                petitioner_name=parsed_data.get('petitioner_name', ''),
                respondent_name=parsed_data.get('respondent_name', ''),
                next_hearing_date=parsed_data.get('next_hearing_date'),
                status='running',
                category='court_case',
                district=parsed_data.get('district', ''),
                state=parsed_data.get('state', ''),
            )
            
            # Calendar event will be auto-created by the save() method
            
            serializer = self.get_serializer(case)
            return Response({
                'message': 'Case imported successfully from E-Courts',
                'case': serializer.data
            }, status=201)
            
        except Exception as e:
            return Response({
                'error': 'Failed to create case',
                'details': str(e)
            }, status=400)
    
    @action(detail=False, methods=['post'])
    def search_ecourts_by_party(self, request):
        """
        Search cases in E-Courts by party name
        
        POST /api/cases/search_ecourts_by_party/
        {
            "name": "Gaurav",
            "stage": "BOTH",  // BOTH, PENDING, DISPOSED
            "year": "2024",
            "district_id": "6f576666",  // optional
            "complex_id": "5f5f010a"   // optional
        }
        """
        from .ecourts import ECourtService
        
        name = request.data.get('name')
        if not name:
            return Response({'error': 'Party name is required'}, status=400)
        
        stage = request.data.get('stage', 'BOTH')
        year = request.data.get('year')
        district_id = request.data.get('district_id')
        complex_id = request.data.get('complex_id')
        
        ecourt_service = ECourtService()
        result = ecourt_service.search_district_court_by_party(
            name=name,
            stage=stage,
            year=year,
            district_id=district_id,
            complex_id=complex_id
        )
        
        if result.get('success'):
            return Response(result.get('data'))
        else:
            return Response({'error': result.get('error')}, status=400)
    
    @action(detail=False, methods=['post'])
    def search_ecourts_by_advocate(self, request):
        """
        Search cases in E-Courts by advocate name
        
        POST /api/cases/search_ecourts_by_advocate/
        {
            "name": "PRATEEK",
            "stage": "BOTH",
            "district_id": "6f576666",  // optional
            "complex_id": "5f5f010a"   // optional
        }
        """
        from .ecourts import ECourtService
        
        name = request.data.get('name')
        if not name:
            return Response({'error': 'Advocate name is required'}, status=400)
        
        stage = request.data.get('stage', 'BOTH')
        district_id = request.data.get('district_id')
        complex_id = request.data.get('complex_id')
        
        ecourt_service = ECourtService()
        result = ecourt_service.search_district_court_by_advocate_name(
            name=name,
            stage=stage,
            district_id=district_id,
            complex_id=complex_id
        )
        
        if result.get('success'):
            return Response(result.get('data'))
        else:
            return Response({'error': result.get('error')}, status=400)
    
    @action(detail=False, methods=['post'])
    def search_ecourts_by_filing_number(self, request):
        """
        Search case in E-Courts by filing number
        
        POST /api/cases/search_ecourts_by_filing_number/
        {
            "filing_number": "581",
            "filing_year": "2024",
            "district_id": "6f576666",
            "complex_id": "5f5f010a"  // optional
        }
        """
        from .ecourts import ECourtService
        
        filing_number = request.data.get('filing_number')
        filing_year = request.data.get('filing_year')
        district_id = request.data.get('district_id')
        
        if not all([filing_number, filing_year, district_id]):
            return Response({
                'error': 'filing_number, filing_year, and district_id are required'
            }, status=400)
        
        complex_id = request.data.get('complex_id')
        
        ecourt_service = ECourtService()
        result = ecourt_service.search_district_court_by_filing_number(
            filing_number=filing_number,
            filing_year=filing_year,
            district_id=district_id,
            complex_id=complex_id
        )
        
        if result.get('success'):
            return Response(result.get('data'))
        else:
            return Response({'error': result.get('error')}, status=400)
    
    @action(detail=False, methods=['post'])
    def get_cause_list(self, request):
        """
        Get daily cause list from E-Courts
        
        POST /api/cases/get_cause_list/
        {
            "date": "20-02-2024",  // DD-MM-YYYY
            "type": "CRIMINAL",    // CRIMINAL or CIVIL
            "court_id": "ff886fdc"
        }
        """
        from .ecourts import ECourtService
        
        date = request.data.get('date')
        case_type = request.data.get('type')
        court_id = request.data.get('court_id')
        
        if not all([date, case_type, court_id]):
            return Response({
                'error': 'date, type, and court_id are required'
            }, status=400)
        
        ecourt_service = ECourtService()
        result = ecourt_service.get_district_court_cause_list(
            date=date,
            case_type=case_type,
            court_id=court_id
        )
        
        if result.get('success'):
            return Response(result.get('data'))
        else:
            return Response({'error': result.get('error')}, status=400)
    
    @action(detail=True, methods=['post'])
    def sync_with_ecourts(self, request, pk=None):
        """
        Sync case with E-Courts to get latest updates
        
        POST /api/cases/{id}/sync_with_ecourts/
        """
        from .ecourts import ECourtService
        
        case = self.get_object()
        
        if not case.cnr_number:
            return Response({'error': 'Case does not have CNR number'}, status=400)
        
        # Determine court type from CNR or case data
        court_type = 'high-court' if 'HC' in case.cnr_number else 'district-court'
        
        ecourt_service = ECourtService()
        ecourt_response = ecourt_service.get_case_by_cnr(case.cnr_number, court_type)
        
        if not ecourt_response.get('success'):
            return Response({
                'error': 'Failed to sync with E-Courts',
                'details': ecourt_response.get('error')
            }, status=400)
        
        # Update case with latest data
        parsed_data = ecourt_service.parse_case_data(ecourt_response)
        
        if parsed_data:
            # Update fields
            if parsed_data.get('next_hearing_date'):
                case.next_hearing_date = parsed_data['next_hearing_date']
            if parsed_data.get('case_status'):
                case.status = parsed_data['case_status']
            if parsed_data.get('judge_name'):
                case.judge_name = parsed_data['judge_name']
            
            case.save()
            
            serializer = self.get_serializer(case)
            return Response({
                'message': 'Case synced successfully with E-Courts',
                'case': serializer.data
            })
        
        return Response({'error': 'Failed to parse E-Courts data'}, status=400)
