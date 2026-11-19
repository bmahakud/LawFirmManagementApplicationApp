from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.db.models import Q
from .models import Client, Lead
from .serializers import ClientSerializer, AdvocateListSerializer, LeadSerializer
from accounts.models import CustomUser
from documents.models import UserDocument
from documents.serializers import UserDocumentListSerializer


class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'last_name', 'email', 'phone_number']
    ordering_fields = ['created_at', 'last_name']

    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'platform_owner':
            return Client.objects.all()
        
        # If user is a client, show only their own profile
        if user.user_type == 'client':
            return Client.objects.filter(user_account=user)
        
        # For advocates: show clients in their firm OR assigned to them
        if user.user_type == 'advocate':
            return Client.objects.filter(
                Q(firm=user.firm) | Q(assigned_advocate=user)
            ).distinct()
        
        # For admin/super_admin: show clients in their firm
        return Client.objects.filter(firm=user.firm)

    def perform_create(self, serializer):
        user = self.request.user
        
        # Only admin/super_admin/advocate can register clients
        if user.user_type not in ['admin', 'super_admin', 'advocate', 'platform_owner']:
            raise PermissionDenied("Only Admins or Advocates can register clients.")
        
        # Extract client data
        email = serializer.validated_data.get('email')
        phone_number = serializer.validated_data.get('phone_number')
        first_name = serializer.validated_data.get('first_name')
        last_name = serializer.validated_data.get('last_name')
        
        # Check if a user account with this email already exists
        user_account = None
        if email:
            user_account = CustomUser.objects.filter(email=email).first()
        
        # If no user account exists, create one
        if not user_account:
            # Generate username from email or phone
            username = email.split('@')[0] if email else f"client_{phone_number}"
            
            # Ensure username is unique
            base_username = username
            counter = 1
            while CustomUser.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
            
            # Create user account
            user_account = CustomUser.objects.create(
                username=username,
                email=email or '',
                phone_number=phone_number or '',
                first_name=first_name or '',
                last_name=last_name or '',
                user_type='client',
                firm=user.firm,
                is_active=True,
                password_set=False  # User needs to set password later
            )
            # Set an unusable password initially
            user_account.set_unusable_password()
            user_account.save()
        
        client = None
        # When admin/super_admin adds a client, assigned_advocate is REQUIRED
        if user.user_type in ['admin', 'super_admin']:
            advocate_id = self.request.data.get('assigned_advocate')
            if not advocate_id:
                raise PermissionDenied("You must assign an advocate when registering a client.")
            
            # Validate the advocate belongs to the same firm
            try:
                advocate = CustomUser.objects.get(id=advocate_id, user_type='advocate', firm=user.firm)
            except CustomUser.DoesNotExist:
                raise PermissionDenied("Invalid advocate. The advocate must belong to your firm.")
            
            client = serializer.save(firm=user.firm, user_account=user_account, assigned_advocate=advocate)
        elif user.user_type == 'advocate':
            # When advocate adds a client, auto-assign themselves
            client = serializer.save(firm=user.firm, user_account=user_account, assigned_advocate=user)
        else:
            client = serializer.save(firm=user.firm, user_account=user_account)

        # Auto-generate a Lead in CRM when a client is created
        create_lead = self.request.data.get('create_lead', True)
        if str(create_lead).lower() in ['true', '1', 'yes']:
            lead_title = (
                self.request.data.get('lead_title') or
                self.request.data.get('matter_title') or
                (f"{client.first_name}'s Legal Matter" if client.first_name else "New Legal Intake")
            )
            brief_summary = self.request.data.get('brief_summary', '')
            category = self.request.data.get('lead_category') or self.request.data.get('category') or 'court_case'
            case_type = self.request.data.get('lead_case_type') or self.request.data.get('case_type') or ''
            opposing_party = self.request.data.get('lead_opposing_party') or self.request.data.get('opposing_party') or ''
            estimated_fee = self.request.data.get('lead_estimated_fee') or self.request.data.get('estimated_fee') or None
            source = self.request.data.get('lead_source') or 'walk_in'
            priority = self.request.data.get('lead_priority') or 'medium'

            Lead.objects.create(
                firm=client.firm,
                client=client,
                assigned_advocate=client.assigned_advocate,
                title=lead_title,
                category=category,
                case_type=case_type,
                opposing_party=opposing_party,
                brief_summary=brief_summary,
                estimated_fee=estimated_fee if estimated_fee != '' else None,
                source=source,
                priority=priority,
                status='new'
            )

    def perform_update(self, serializer):
        user = self.request.user
        if user.user_type not in ['admin', 'super_admin', 'advocate', 'platform_owner']:
            raise PermissionDenied("Only Admins or Advocates can update client details.")
        
        client = serializer.save()
        if client.user_account:
            ua = client.user_account
            updated = False
            if client.first_name and ua.first_name != client.first_name:
                ua.first_name = client.first_name
                updated = True
            if client.last_name and ua.last_name != client.last_name:
                ua.last_name = client.last_name
                updated = True
            if client.email and ua.email != client.email:
                if not CustomUser.objects.filter(email=client.email).exclude(id=ua.id).exists():
                    ua.email = client.email
                    updated = True
            if client.phone_number and ua.phone_number != client.phone_number:
                ua.phone_number = client.phone_number
                updated = True
            if updated:
                ua.save()

    @action(detail=False, methods=['get'], url_path='advocates', url_name='advocate-list')
    def list_advocates(self, request):
        """
        List all advocates in the user's firm (or all advocates if no firm).
        - Used by Admins when registering a client (dropdown).
        - Used by self-registered Clients to browse and choose an advocate.
        """
        user = request.user
        firm = user.firm
        
        if firm:
            # User has a firm, show advocates in that firm
            advocates = CustomUser.objects.filter(firm=firm, user_type='advocate', is_active=True)
        else:
            # User has no firm, show all advocates without a firm
            advocates = CustomUser.objects.filter(firm=None, user_type='advocate', is_active=True)
        
        serializer = AdvocateListSerializer(advocates, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='choose-advocate', url_name='choose-advocate')
    def choose_advocate(self, request):
        """
        For self-registered clients: choose an advocate from the firm.
        The client must have signed up and logged in first.
        """
        user = request.user
        
        if user.user_type != 'client':
            return Response(
                {'error': 'Only clients can choose an advocate.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        advocate_id = request.data.get('advocate_id')
        if not advocate_id:
            return Response(
                {'error': 'advocate_id is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate advocate - must be same firm OR both have no firm
        try:
            if user.firm is not None:
                # Client has a firm, advocate must be in same firm
                advocate = CustomUser.objects.get(id=advocate_id, user_type='advocate', firm=user.firm)
            else:
                # Client has no firm, just validate advocate exists
                advocate = CustomUser.objects.get(id=advocate_id, user_type='advocate')
        except CustomUser.DoesNotExist:
            return Response(
                {'error': 'Invalid advocate ID.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find or create client profile for this user
        client_profile, created = Client.objects.get_or_create(
            user_account=user,
            defaults={
                'firm': user.firm,
                'first_name': user.first_name or '',
                'last_name': user.last_name or '',
                'email': user.email,
                'phone_number': user.phone_number or '',
                'assigned_advocate': advocate
            }
        )
        
        if not created:
            client_profile.assigned_advocate = advocate
            client_profile.save()
        
        return Response({
            'message': f'You are now assigned to Adv. {advocate.get_full_name()}',
            'client': ClientSerializer(client_profile).data
        })

    @action(detail=False, methods=['get'], url_path='my-clients', url_name='my-clients')
    def my_clients(self, request):
        """
        For advocates: Get all clients assigned to them.
        Supports backend search (?search=query) and pagination (?page=1&page_size=10).
        """
        user = request.user
        
        if user.user_type != 'advocate':
            return Response(
                {'error': 'Only advocates can access this endpoint.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get all clients assigned to this advocate
        clients = Client.objects.filter(
            assigned_advocate=user
        ).select_related('user_account', 'assigned_advocate')
        
        # Filter by backend search parameter
        search = request.query_params.get('search', '').strip()
        if search:
            clients = clients.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search) |
                Q(phone_number__icontains=search) |
                Q(address__icontains=search) |
                Q(brief_summary__icontains=search)
            )
            
        clients = clients.order_by('-created_at')
        
        # Backend Pagination if requested or if page param is present
        page_param = request.query_params.get('page')
        if page_param or request.query_params.get('page_size'):
            page = self.paginate_queryset(clients)
            if page is not None:
                serializer = ClientSerializer(page, many=True, context={'request': request})
                return self.get_paginated_response(serializer.data)
                
        serializer = ClientSerializer(clients, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='documents', url_name='client-documents')
    def client_documents(self, request, pk=None):
        """
        For advocates: Get all documents for a specific client assigned to them.
        Only shows documents for clients assigned to the requesting advocate.
        
        Note: pk can be either a Client profile ID or a User account ID.
        """
        user = request.user
        
        if user.user_type != 'advocate':
            return Response(
                {'error': 'Only advocates can access this endpoint.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Try to get the client by ID
        client = None
        try:
            # Get client assigned to this advocate OR in same firm
            client = Client.objects.filter(
                Q(id=pk, assigned_advocate=user) | Q(id=pk, firm=user.firm)
            ).first()
            
            if not client:
                raise Client.DoesNotExist
        except Client.DoesNotExist:
            # Maybe pk is a user_account ID instead
            try:
                user_account = CustomUser.objects.get(id=pk, user_type='client')
                # Auto-create client profile if it doesn't exist
                client, created = Client.objects.get_or_create(
                    user_account=user_account,
                    defaults={
                        'firm': user_account.firm,
                        'first_name': user_account.first_name or '',
                        'last_name': user_account.last_name or '',
                        'email': user_account.email or '',
                        'phone_number': user_account.phone_number or '',
                    }
                )
                # Verify they're assigned to this advocate OR in same firm
                is_assigned = client.assigned_advocate == user
                same_firm = client.firm == user.firm and client.firm is not None
                
                if not is_assigned and not same_firm:
                    return Response(
                        {'error': 'Client not found or not assigned to you.'},
                        status=status.HTTP_404_NOT_FOUND
                    )
            except CustomUser.DoesNotExist:
                return Response(
                    {'error': 'Client not found or not assigned to you.'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Get all documents for this client (non-deleted by default)
        show_deleted = request.query_params.get('show_deleted', 'false').lower() == 'true'
        documents = UserDocument.objects.filter(client=client)
        
        if not show_deleted:
            documents = documents.filter(is_deleted=False)
        
        serializer = UserDocumentListSerializer(documents, many=True)
        
        return Response({
            'client': ClientSerializer(client, context={'request': request}).data,
            'documents': serializer.data,
            'total_documents': documents.count()
        })

    @action(detail=False, methods=['get'], url_path='by-user/(?P<user_id>[^/.]+)', url_name='client-by-user')
    def client_by_user(self, request, user_id=None):
        """
        Get client profile by user account ID.
        Useful when you have the user ID but need the client profile ID.
        
        GET /api/clients/by-user/{user_id}/
        """
        user = request.user
        
        try:
            client = Client.objects.get(user_account_id=user_id)
        except Client.DoesNotExist:
            return Response(
                {'error': 'Client profile not found for this user.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Permission checks
        if user.user_type == 'client':
            if client.user_account != user:
                return Response(
                    {'error': 'You can only view your own profile.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        elif user.user_type == 'advocate':
            # Advocates can see clients assigned to them OR in their firm
            is_assigned = client.assigned_advocate == user
            same_firm = client.firm == user.firm and client.firm is not None
            
            if not is_assigned and not same_firm:
                return Response(
                    {'error': 'You do not have permission to view this client.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        elif user.user_type in ['admin', 'super_admin']:
            if client.firm != user.firm:
                return Response(
                    {'error': 'This client does not belong to your firm.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        elif user.user_type != 'platform_owner':
            return Response(
                {'error': 'You do not have permission to view this client.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = ClientSerializer(client)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='cases', url_name='client-cases')
    def client_cases(self, request, pk=None):
        """
        Get all cases for a specific client.
        
        - Clients can only see their own cases
        - Advocates can see cases for clients assigned to them
        - Admins/Super Admins can see cases for any client in their firm
        - Platform owners can see all cases
        
        GET /api/clients/{client_id}/cases/
        Optional filters: ?status=, ?category=, ?search=
        
        Note: pk can be either a Client profile ID or a User account ID.
        If it's a User ID without a Client profile, one will be auto-created.
        """
        from cases.models import Case
        from cases.serializers import CaseSerializer
        
        user = request.user
        
        # Try to get the client by ID
        client = None
        try:
            client = Client.objects.get(id=pk)
        except Client.DoesNotExist:
            # Maybe pk is a user_account ID instead
            try:
                user_account = CustomUser.objects.get(id=pk, user_type='client')
                # Auto-create client profile if it doesn't exist
                client, created = Client.objects.get_or_create(
                    user_account=user_account,
                    defaults={
                        'firm': user_account.firm,
                        'first_name': user_account.first_name or '',
                        'last_name': user_account.last_name or '',
                        'email': user_account.email or '',
                        'phone_number': user_account.phone_number or '',
                    }
                )
            except CustomUser.DoesNotExist:
                return Response(
                    {
                        'error': 'Client not found.',
                        'hint': 'The provided ID does not match any client profile or user account.'
                    },
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Permission checks
        if user.user_type == 'client':
            # Clients can only see their own cases
            # Use client_profiles check since it's a ForeignKey relationship
            if not user.client_profiles.filter(id=client.id).exists():
                return Response(
                    {'error': 'You can only view your own cases.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        elif user.user_type == 'advocate':
            # Advocates can see cases for clients assigned to them OR in their firm
            # Allow access if: assigned to advocate OR (same firm and firm is not null)
            is_assigned = client.assigned_advocate == user
            same_firm = client.firm == user.firm and client.firm is not None
            
            if not is_assigned and not same_firm:
                return Response(
                    {'error': 'This client is not assigned to you or in your firm.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        elif user.user_type in ['admin', 'super_admin']:
            # Admins can see cases for clients in their firm
            if client.firm != user.firm:
                return Response(
                    {'error': 'This client does not belong to your firm.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        elif user.user_type != 'platform_owner':
            return Response(
                {'error': 'You do not have permission to view this client\'s cases.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get all cases for this client
        cases = Case.objects.filter(client=client)
        
        # Apply filters
        status_filter = request.query_params.get('status')
        if status_filter:
            cases = cases.filter(status=status_filter)
        
        category_filter = request.query_params.get('category')
        if category_filter:
            cases = cases.filter(category=category_filter)
        
        search = request.query_params.get('search', '').strip()
        if search:
            cases = cases.filter(
                Q(case_title__icontains=search) |
                Q(case_number__icontains=search) |
                Q(cnr_number__icontains=search) |
                Q(court_name__icontains=search)
            )
        
        cases = cases.order_by('-created_at')
        
        serializer = CaseSerializer(cases, many=True)
        
        return Response({
            'client': ClientSerializer(client).data,
            'cases': serializer.data,
            'total_cases': cases.count()
        })


class LeadViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Legal CRM Leads, pipeline stages, and conversion to Case Files.
    """
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'title', 'case_type', 'opposing_party', 'brief_summary',
        'prospect_name', 'prospect_phone', 'prospect_email',
        'client__first_name', 'client__last_name', 'client__phone_number', 'client__email'
    ]
    ordering_fields = ['created_at', 'status', 'priority', 'consultation_date', 'estimated_fee']

    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'platform_owner':
            qs = Lead.objects.all()
        elif user.user_type == 'client':
            qs = Lead.objects.filter(client__user_account=user)
        elif user.user_type == 'advocate':
            qs = Lead.objects.filter(
                Q(firm=user.firm) | Q(assigned_advocate=user)
            ).distinct()
        else:
            qs = Lead.objects.filter(firm=user.firm)

        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)

        client_id = self.request.query_params.get('client_id')
        if client_id:
            qs = qs.filter(client_id=client_id)

        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)

        return qs.select_related('client', 'assigned_advocate', 'converted_case')

    def perform_create(self, serializer):
        user = self.request.user
        client_id = self.request.data.get('client')
        prospect_name = (self.request.data.get('prospect_name') or '').strip()
        prospect_phone = (self.request.data.get('prospect_phone') or '').strip()
        prospect_email = (self.request.data.get('prospect_email') or '').strip()

        client = None
        firm = user.firm

        if client_id:
            try:
                client = Client.objects.get(id=client_id)
                firm = client.firm or firm
            except Client.DoesNotExist:
                raise PermissionDenied("Selected client not found.")
        elif not prospect_name and not prospect_phone:
            raise PermissionDenied("Either select an existing client or enter the prospect client name and phone number.")

        assigned_advocate = client.assigned_advocate if client else None
        if user.user_type == 'advocate':
            assigned_advocate = user

        serializer.save(
            firm=firm,
            client=client,
            prospect_name=prospect_name if not client else '',
            prospect_phone=prospect_phone if not client else '',
            prospect_email=prospect_email if not client else '',
            assigned_advocate=assigned_advocate
        )

    def perform_update(self, serializer):
        lead = self.get_object()
        if lead.status == 'converted' or lead.converted_case:
            raise PermissionDenied("Finalized leads cannot be edited because an official case file has already been opened.")
        
        prospect_name = self.request.data.get('prospect_name')
        prospect_phone = self.request.data.get('prospect_phone')
        prospect_email = self.request.data.get('prospect_email')

        # If lead is linked to an existing client, also update the client record if name/phone were edited
        if lead.client:
            client = lead.client
            if prospect_name and prospect_name.strip():
                parts = prospect_name.strip().split(' ', 1)
                client.first_name = parts[0]
                client.last_name = parts[1] if len(parts) > 1 else ''
            if prospect_phone is not None:
                client.phone_number = prospect_phone.strip()
            if prospect_email is not None:
                client.email = prospect_email.strip()
            client.save()
            serializer.save()
        else:
            update_kwargs = {}
            if prospect_name is not None:
                update_kwargs['prospect_name'] = prospect_name.strip()
            if prospect_phone is not None:
                update_kwargs['prospect_phone'] = prospect_phone.strip()
            if prospect_email is not None:
                update_kwargs['prospect_email'] = prospect_email.strip()
            serializer.save(**update_kwargs)

    @action(detail=False, methods=['get'], url_path='pipeline-stats')
    def pipeline_stats(self, request):
        qs = self.get_queryset()
        from django.db.models import Sum
        stats = {
            'total_leads': qs.count(),
            'new': qs.filter(status='new').count(),
            'contacted': qs.filter(status='contacted').count(),
            'consultation': qs.filter(status='consultation').count(),
            'assessment': qs.filter(status='assessment').count(),
            'proposal': qs.filter(status='proposal').count(),
            'converted': qs.filter(status='converted').count(),
            'lost': qs.filter(status='lost').count(),
            'total_estimated_value': float(qs.aggregate(total=Sum('estimated_fee'))['total'] or 0),
        }
        return Response(stats)

    @action(detail=True, methods=['post'], url_path='convert')
    def convert(self, request, pk=None):
        from django.db import transaction
        from django.utils import timezone
        from cases.models import Case

        lead = self.get_object()

        if lead.status == 'converted' and lead.converted_case:
            return Response(
                {
                    'error': 'This lead is already converted to an active case file.',
                    'case_id': str(lead.converted_case.id),
                    'case_title': lead.converted_case.case_title
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        data = request.data
        case_title = data.get('case_title') or lead.title
        case_type = data.get('case_type') or lead.case_type or 'General Legal Matter'
        category = data.get('category') or lead.category or 'court_case'
        billing_type = data.get('billing_type') or 'retainer'
        total_fee = data.get('total_fee') or lead.estimated_fee
        opposing_counsel = data.get('opposing_counsel') or ''
        court_name = data.get('court_name') or ''
        court_no = data.get('court_no') or ''
        judge_name = data.get('judge_name') or ''
        district = data.get('district') or ''
        state = data.get('state') or ''
        respondent_name = data.get('respondent_name') or lead.opposing_party
        petitioner_name = data.get('petitioner_name') or (lead.client.get_full_name() if lead.client else (lead.prospect_name or 'Client'))

        with transaction.atomic():
            client = lead.client
            # If lead was an unregistered prospect, automatically create official Client record!
            if not client:
                full_name = (lead.prospect_name or 'Prospective Client').strip()
                name_parts = full_name.split(' ', 1)
                first_name = name_parts[0]
                last_name = name_parts[1] if len(name_parts) > 1 else ''

                client = Client.objects.create(
                    firm=lead.firm or request.user.firm,
                    first_name=first_name,
                    last_name=last_name,
                    phone_number=lead.prospect_phone or '',
                    email=lead.prospect_email or '',
                    assigned_advocate=lead.assigned_advocate or (request.user if request.user.user_type == 'advocate' else None),
                    brief_summary=lead.brief_summary or lead.title
                )
                lead.client = client
                lead.save(update_fields=['client'])

            new_case = Case.objects.create(
                firm=lead.firm or (client.firm if client else None),
                client=client,
                assigned_advocate=lead.assigned_advocate or (request.user if request.user.user_type == 'advocate' else None),
                solo_advocate=request.user if (not lead.firm and request.user.user_type == 'advocate') else None,
                case_title=case_title,
                case_type=case_type,
                category=category,
                status='open',
                stage='initial_consultation',
                petitioner_name=petitioner_name or (client.get_full_name() if client else ''),
                respondent_name=respondent_name,
                opposing_counsel=opposing_counsel,
                court_name=court_name,
                court_no=court_no,
                judge_name=judge_name,
                district=district,
                state=state,
                description=lead.brief_summary,
                case_summary=lead.intake_notes or lead.brief_summary,
                billing_type=billing_type,
                total_fee=total_fee if total_fee != '' else None,
            )

            lead.status = 'converted'
            lead.converted_case = new_case
            lead.converted_at = timezone.now()
            lead.save()

        return Response(
            {
                'status': 'success',
                'message': 'Lead successfully finalized and converted into official Case File.',
                'case_id': str(new_case.id),
                'case_title': new_case.case_title,
                'case_number': new_case.case_number or '',
                'client_id': str(client.id) if client else None,
                'client_name': client.get_full_name() if client else lead.prospect_name
            },
            status=status.HTTP_201_CREATED
        )

