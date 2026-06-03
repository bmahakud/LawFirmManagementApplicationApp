from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.db.models import Q
from .models import Client
from .serializers import ClientSerializer, AdvocateListSerializer
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
            
            serializer.save(firm=user.firm, user_account=user_account, assigned_advocate=advocate)
            return
        
        # When advocate adds a client, auto-assign themselves
        if user.user_type == 'advocate':
            serializer.save(firm=user.firm, user_account=user_account, assigned_advocate=user)
            return
        
        serializer.save(firm=user.firm, user_account=user_account)

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
        Returns client details with their documents.
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
        
        serializer = ClientSerializer(clients, many=True)
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
            'client': ClientSerializer(client).data,
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
