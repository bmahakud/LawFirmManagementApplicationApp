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
        List all advocates in the user's firm.
        - Used by Admins when registering a client (dropdown).
        - Used by self-registered Clients to browse and choose an advocate.
        """
        user = request.user
        firm = user.firm
        
        if not firm:
            return Response(
                {'error': 'You are not associated with any firm.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        advocates = CustomUser.objects.filter(firm=firm, user_type='advocate', is_active=True)
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
        
        # Validate advocate
        try:
            advocate = CustomUser.objects.get(id=advocate_id, user_type='advocate', firm=user.firm)
        except CustomUser.DoesNotExist:
            return Response(
                {'error': 'Invalid advocate. The advocate must belong to your firm.'},
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
            assigned_advocate=user,
            firm=user.firm
        ).select_related('user_account', 'assigned_advocate')
        
        serializer = ClientSerializer(clients, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='documents', url_name='client-documents')
    def client_documents(self, request, pk=None):
        """
        For advocates: Get all documents for a specific client assigned to them.
        Only shows documents for clients assigned to the requesting advocate.
        """
        user = request.user
        
        if user.user_type != 'advocate':
            return Response(
                {'error': 'Only advocates can access this endpoint.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get the client and verify they're assigned to this advocate
        try:
            client = Client.objects.get(
                id=pk,
                assigned_advocate=user,
                firm=user.firm
            )
        except Client.DoesNotExist:
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
