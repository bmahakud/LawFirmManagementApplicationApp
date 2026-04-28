from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Sum
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from .models import TimeEntry, Expense, Invoice, Payment, TrustAccount, AdvocateInvoice
from .serializers import (
    TimeEntrySerializer, ExpenseSerializer, InvoiceSerializer,
    InvoiceListSerializer, PaymentSerializer, TrustAccountSerializer,
    AdvocateInvoiceSerializer, AdvocateInvoiceListSerializer,
    AdvocateInvoiceApprovalSerializer, AdvocateInvoicePaymentSerializer
)


class TimeEntryViewSet(viewsets.ModelViewSet):
    """
    Time entry management for billable hours
    """
    serializer_class = TimeEntrySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['description', 'user__email', 'case__case_title']
    ordering_fields = ['date', 'hours', 'amount']
    
    def get_queryset(self):
        user = self.request.user
        
        if user.user_type == 'platform_owner':
            return TimeEntry.objects.all()
        elif user.user_type in ['super_admin', 'admin']:
            return TimeEntry.objects.filter(firm=user.firm)
        elif user.user_type in ['advocate', 'paralegal']:
            # See their own entries and entries for their cases
            return TimeEntry.objects.filter(
                Q(firm=user.firm) & (
                    Q(user=user) |
                    Q(case__assigned_advocate=user) |
                    Q(case__assigned_paralegal=user)
                )
            ).distinct()
        elif user.user_type == 'client':
            # Clients see time entries for their cases
            client_profile = getattr(user, 'client_profile', None)
            if client_profile:
                return TimeEntry.objects.filter(case__client=client_profile)
        
        return TimeEntry.objects.none()
    
    def perform_create(self, serializer):
        serializer.save(firm=self.request.user.firm, user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_entries(self, request):
        """Get current user's time entries"""
        entries = self.get_queryset().filter(user=request.user)
        
        # Filter by date range
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        if start_date:
            entries = entries.filter(date__gte=start_date)
        if end_date:
            entries = entries.filter(date__lte=end_date)
        
        serializer = self.get_serializer(entries, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def unbilled(self, request):
        """Get unbilled time entries"""
        entries = self.get_queryset().filter(
            status__in=['approved', 'submitted'],
            invoice__isnull=True,
            billable=True
        )
        serializer = self.get_serializer(entries, many=True)
        return Response(serializer.data)


class ExpenseViewSet(viewsets.ModelViewSet):
    """
    Expense management for case-related costs
    """
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['description', 'expense_type', 'case__case_title']
    ordering_fields = ['date', 'amount']
    
    def get_queryset(self):
        user = self.request.user
        
        if user.user_type == 'platform_owner':
            return Expense.objects.all()
        elif user.user_type in ['super_admin', 'admin']:
            return Expense.objects.filter(firm=user.firm)
        elif user.user_type in ['advocate', 'paralegal']:
            return Expense.objects.filter(
                Q(firm=user.firm) & (
                    Q(submitted_by=user) |
                    Q(case__assigned_advocate=user) |
                    Q(case__assigned_paralegal=user)
                )
            ).distinct()
        elif user.user_type == 'client':
            client_profile = getattr(user, 'client_profile', None)
            if client_profile:
                return Expense.objects.filter(case__client=client_profile)
        
        return Expense.objects.none()
    
    def perform_create(self, serializer):
        serializer.save(firm=self.request.user.firm, submitted_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def unbilled(self, request):
        """Get unbilled expenses"""
        expenses = self.get_queryset().filter(
            status__in=['approved', 'submitted'],
            invoice__isnull=True,
            billable=True
        )
        serializer = self.get_serializer(expenses, many=True)
        return Response(serializer.data)


class InvoiceViewSet(viewsets.ModelViewSet):
    """
    Invoice management
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['invoice_number', 'client__first_name', 'client__last_name', 'case__case_title']
    ordering_fields = ['invoice_date', 'due_date', 'total_amount']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return InvoiceListSerializer
        return InvoiceSerializer
    
    def get_queryset(self):
        user = self.request.user
        queryset = Invoice.objects.all()
        
        if user.user_type == 'platform_owner':
            queryset = Invoice.objects.all()
        elif user.user_type in ['super_admin', 'admin']:
            queryset = Invoice.objects.filter(firm=user.firm)
        elif user.user_type in ['advocate', 'paralegal']:
            queryset = Invoice.objects.filter(
                Q(firm=user.firm) & (
                    Q(case__assigned_advocate=user) |
                    Q(case__assigned_paralegal=user)
                )
            ).distinct()
        elif user.user_type == 'client':
            client_profile = getattr(user, 'client_profile', None)
            if client_profile:
                queryset = Invoice.objects.filter(client=client_profile)
        else:
            queryset = Invoice.objects.none()
        
        # Filter by branch if provided
        branch_id = self.request.query_params.get('branch')
        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        # Allow passing user account ID instead of client profile ID
        # Resolve it to the correct client profile ID before validation
        data = request.data.copy()
        client_id = data.get('client')
        if client_id:
            from clients.models import Client
            from accounts.models import CustomUser
            if not Client.objects.filter(id=client_id).exists():
                # Maybe it's a user account ID — try to find the linked client profile
                try:
                    user = CustomUser.objects.get(id=client_id)
                    client_profile = getattr(user, 'client_profile', None)
                    if client_profile:
                        data['client'] = str(client_profile.id)
                    else:
                        return Response(
                            {'client': [f'No client profile found for user {client_id}. Ask admin to create a client profile first.']},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                except CustomUser.DoesNotExist:
                    pass  # Let serializer handle the invalid ID error
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        # Generate invoice number
        firm = self.request.user.firm
        last_invoice = Invoice.objects.filter(firm=firm).order_by('-created_at').first()
        
        if last_invoice and last_invoice.invoice_number:
            try:
                last_num = int(last_invoice.invoice_number.split('-')[-1])
                invoice_number = f"INV-{firm.firm_code}-{last_num + 1:05d}"
            except:
                invoice_number = f"INV-{firm.firm_code}-00001"
        else:
            invoice_number = f"INV-{firm.firm_code}-00001"
        
        # Auto-assign branch from case or user
        invoice_data = {
            'firm': firm,
            'invoice_number': invoice_number,
            'created_by': self.request.user
        }
        
        # If case is provided, get branch from case
        case = serializer.validated_data.get('case')
        if case and case.branch:
            invoice_data['branch'] = case.branch
        # Otherwise, if user has branch, use that
        elif hasattr(self.request.user, 'branch') and self.request.user.branch:
            invoice_data['branch'] = self.request.user.branch
        
        # New invoices start with zero totals; time entries/expenses are added after
        invoice_data.setdefault('total_amount', Decimal('0'))
        invoice_data.setdefault('balance_due', Decimal('0'))

        serializer.save(**invoice_data)
    
    @action(detail=True, methods=['post'])
    def calculate(self, request, pk=None):
        """Recalculate invoice totals"""
        invoice = self.get_object()
        invoice.calculate_totals()
        serializer = self.get_serializer(invoice)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        """Mark invoice as sent"""
        invoice = self.get_object()
        invoice.status = 'sent'
        invoice.sent_date = timezone.now()
        invoice.save()
        
        # TODO: Send email to client
        
        serializer = self.get_serializer(invoice)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_viewed(self, request, pk=None):
        """Mark invoice as viewed by client"""
        invoice = self.get_object()
        if not invoice.viewed_date:
            invoice.viewed_date = timezone.now()
            invoice.status = 'viewed'
            invoice.save()
        
        serializer = self.get_serializer(invoice)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get overdue invoices"""
        invoices = self.get_queryset().filter(
            due_date__lt=timezone.now().date(),
            status__in=['sent', 'viewed', 'partially_paid']
        )
        serializer = self.get_serializer(invoices, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def unpaid(self, request):
        """Get unpaid invoices"""
        invoices = self.get_queryset().filter(
            status__in=['sent', 'viewed', 'partially_paid', 'overdue']
        )
        serializer = self.get_serializer(invoices, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get invoice statistics"""
        queryset = self.get_queryset()
        
        total_invoiced = queryset.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        total_paid = queryset.aggregate(Sum('paid_amount'))['paid_amount__sum'] or 0
        total_outstanding = queryset.filter(
            status__in=['sent', 'viewed', 'partially_paid', 'overdue']
        ).aggregate(Sum('balance_due'))['balance_due__sum'] or 0
        
        overdue_count = queryset.filter(status='overdue').count()
        
        return Response({
            'total_invoiced': total_invoiced,
            'total_paid': total_paid,
            'total_outstanding': total_outstanding,
            'overdue_count': overdue_count,
            'total_invoices': queryset.count(),
            'paid_invoices': queryset.filter(status='paid').count(),
        })
    
    @action(detail=False, methods=['get'])
    def branch_stats(self, request):
        """Get branch-wise invoice statistics"""
        user = request.user
        
        # Only super_admin and admin can see branch stats
        if user.user_type not in ['platform_owner', 'super_admin', 'admin']:
            return Response({'error': 'Permission denied'}, status=403)
        
        queryset = self.get_queryset()
        
        # Get all branches for the firm
        from firms.models import Branch
        if user.user_type == 'platform_owner':
            branches = Branch.objects.all()
        else:
            branches = Branch.objects.filter(firm=user.firm, is_active=True)
        
        branch_data = []
        for branch in branches:
            branch_invoices = queryset.filter(branch=branch)
            
            total_revenue = branch_invoices.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
            total_paid = branch_invoices.aggregate(Sum('paid_amount'))['paid_amount__sum'] or 0
            total_outstanding = branch_invoices.filter(
                status__in=['sent', 'viewed', 'partially_paid', 'overdue']
            ).aggregate(Sum('balance_due'))['balance_due__sum'] or 0
            
            branch_data.append({
                'branch_id': str(branch.id),
                'branch_name': branch.branch_name,
                'branch_code': branch.branch_code,
                'city': branch.city,
                'total_invoices': branch_invoices.count(),
                'total_revenue': float(total_revenue),
                'total_paid': float(total_paid),
                'total_outstanding': float(total_outstanding),
                'paid_invoices': branch_invoices.filter(status='paid').count(),
                'overdue_invoices': branch_invoices.filter(status='overdue').count(),
            })
        
        # Add invoices without branch
        no_branch_invoices = queryset.filter(branch__isnull=True)
        if no_branch_invoices.exists():
            total_revenue = no_branch_invoices.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
            total_paid = no_branch_invoices.aggregate(Sum('paid_amount'))['paid_amount__sum'] or 0
            total_outstanding = no_branch_invoices.filter(
                status__in=['sent', 'viewed', 'partially_paid', 'overdue']
            ).aggregate(Sum('balance_due'))['balance_due__sum'] or 0
            
            branch_data.append({
                'branch_id': None,
                'branch_name': 'No Branch Assigned',
                'branch_code': 'N/A',
                'city': 'N/A',
                'total_invoices': no_branch_invoices.count(),
                'total_revenue': float(total_revenue),
                'total_paid': float(total_paid),
                'total_outstanding': float(total_outstanding),
                'paid_invoices': no_branch_invoices.filter(status='paid').count(),
                'overdue_invoices': no_branch_invoices.filter(status='overdue').count(),
            })
        
        return Response({
            'branches': branch_data,
            'total_branches': len(branch_data)
        })


class PaymentViewSet(viewsets.ModelViewSet):
    """
    Payment tracking
    """
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['transaction_id', 'invoice__invoice_number', 'client__first_name']
    ordering_fields = ['payment_date', 'amount']
    
    def get_queryset(self):
        user = self.request.user
        
        if user.user_type == 'platform_owner':
            return Payment.objects.all()
        elif user.user_type in ['super_admin', 'admin']:
            return Payment.objects.filter(firm=user.firm)
        elif user.user_type in ['advocate', 'paralegal']:
            return Payment.objects.filter(firm=user.firm)
        elif user.user_type == 'client':
            client_profile = getattr(user, 'client_profile', None)
            if client_profile:
                return Payment.objects.filter(client=client_profile)
        
        return Payment.objects.none()
    
    def perform_create(self, serializer):
        serializer.save(firm=self.request.user.firm, recorded_by=self.request.user)


class TrustAccountViewSet(viewsets.ModelViewSet):
    """
    Trust account / retainer management
    """
    serializer_class = TrustAccountSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['client__first_name', 'client__last_name', 'description']
    ordering_fields = ['transaction_date', 'amount']
    
    def get_queryset(self):
        user = self.request.user
        
        if user.user_type == 'platform_owner':
            return TrustAccount.objects.all()
        elif user.user_type in ['super_admin', 'admin']:
            return TrustAccount.objects.filter(firm=user.firm)
        elif user.user_type in ['advocate', 'paralegal']:
            return TrustAccount.objects.filter(firm=user.firm)
        elif user.user_type == 'client':
            client_profile = getattr(user, 'client_profile', None)
            if client_profile:
                return TrustAccount.objects.filter(client=client_profile)
        
        return TrustAccount.objects.none()
    
    def perform_create(self, serializer):
        client = serializer.validated_data['client']
        amount = serializer.validated_data['amount']
        transaction_type = serializer.validated_data['transaction_type']
        
        # Calculate new balance
        last_transaction = TrustAccount.objects.filter(
            client=client
        ).order_by('-transaction_date', '-created_at').first()
        
        current_balance = last_transaction.balance_after if last_transaction else Decimal('0')
        
        if transaction_type in ['deposit']:
            new_balance = current_balance + amount
        elif transaction_type in ['withdrawal', 'refund']:
            new_balance = current_balance - amount
        else:  # adjustment
            new_balance = current_balance + amount
        
        serializer.save(
            firm=self.request.user.firm,
            recorded_by=self.request.user,
            balance_after=new_balance
        )
    
    @action(detail=False, methods=['get'])
    def client_balance(self, request):
        """Get current balance for a client"""
        client_id = request.query_params.get('client_id')
        if not client_id:
            return Response({'error': 'client_id required'}, status=400)
        
        last_transaction = self.get_queryset().filter(
            client_id=client_id
        ).order_by('-transaction_date', '-created_at').first()
        
        balance = last_transaction.balance_after if last_transaction else Decimal('0')
        
        return Response({
            'client_id': client_id,
            'balance': balance,
            'last_transaction_date': last_transaction.transaction_date if last_transaction else None
        })



class AdvocateInvoiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Advocate Invoices (Advocates bill Firm for their work)
    
    Permissions:
    - Advocate: Create, view own invoices
    - Super Admin/Admin: View all, approve, reject, pay
    - Platform Owner: View all
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['invoice_number', 'advocate__email', 'advocate__first_name', 'advocate__last_name']
    ordering_fields = ['invoice_date', 'total_amount', 'status']
    ordering = ['-invoice_date']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return AdvocateInvoiceListSerializer
        return AdvocateInvoiceSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        if user.user_type == 'platform_owner':
            queryset = AdvocateInvoice.objects.all()
        elif user.user_type in ['super_admin', 'admin']:
            queryset = AdvocateInvoice.objects.filter(firm=user.firm)
        elif user.user_type == 'advocate':
            queryset = AdvocateInvoice.objects.filter(advocate=user)
        else:
            queryset = AdvocateInvoice.objects.none()
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset
    
    def perform_create(self, serializer):
        # Only advocates can create their own invoices
        if self.request.user.user_type != 'advocate':
            raise permissions.PermissionDenied('Only advocates can create advocate invoices')
        
        # Generate invoice number
        firm = self.request.user.firm
        last_invoice = AdvocateInvoice.objects.filter(firm=firm).order_by('-created_at').first()
        
        if last_invoice and last_invoice.invoice_number:
            try:
                last_num = int(last_invoice.invoice_number.split('-')[-1])
                invoice_number = f"ADV-{firm.firm_code}-{last_num + 1:05d}"
            except:
                invoice_number = f"ADV-{firm.firm_code}-00001"
        else:
            invoice_number = f"ADV-{firm.firm_code}-00001"
        
        serializer.save(
            firm=firm,
            advocate=self.request.user,
            invoice_number=invoice_number
        )
    
    def perform_update(self, serializer):
        instance = self.get_object()
        
        # Advocates can only update their own draft invoices
        if self.request.user.user_type == 'advocate':
            if instance.advocate != self.request.user:
                raise permissions.PermissionDenied('You can only update your own invoices')
            if instance.status != 'draft':
                raise permissions.PermissionDenied('Can only update draft invoices')
        
        # Admins cannot update advocate invoices
        elif self.request.user.user_type in ['super_admin', 'admin']:
            raise permissions.PermissionDenied('Admins cannot update advocate invoices. Use approve/reject/pay actions.')
        
        serializer.save()
    
    def perform_destroy(self, instance):
        # Only advocates can delete their own draft invoices
        if self.request.user.user_type != 'advocate':
            raise permissions.PermissionDenied('Only advocates can delete their invoices')
        
        if instance.advocate != self.request.user:
            raise permissions.PermissionDenied('You can only delete your own invoices')
        
        if instance.status != 'draft':
            raise permissions.PermissionDenied('Can only delete draft invoices')
        
        instance.delete()
    
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """
        Submit invoice for approval
        
        POST /api/billing/advocate-invoices/{id}/submit/
        """
        invoice = self.get_object()
        
        # Only advocate can submit their own invoice
        if request.user.user_type != 'advocate' or invoice.advocate != request.user:
            return Response({
                'error': 'You can only submit your own invoices'
            }, status=status.HTTP_403_FORBIDDEN)
        
        if invoice.status != 'draft':
            return Response({
                'error': 'Can only submit draft invoices'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if invoice has time entries
        if not invoice.time_entries.exists():
            return Response({
                'error': 'Invoice must have at least one time entry'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate totals from time entries
        invoice.calculate_totals()
        
        # Update status
        invoice.status = 'submitted'
        invoice.save()
        
        serializer = self.get_serializer(invoice)
        return Response({
            'message': 'Invoice submitted successfully',
            'invoice': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        """
        Approve or reject invoice
        
        POST /api/billing/advocate-invoices/{id}/review/
        Body: {
            "action": "approve" or "reject",
            "reason": "reason for rejection" (required if rejecting)
        }
        """
        if request.user.user_type not in ['super_admin', 'admin']:
            return Response({
                'error': 'Only super admin or admin can review invoices'
            }, status=status.HTTP_403_FORBIDDEN)
        
        invoice = self.get_object()
        
        if invoice.status != 'submitted':
            return Response({
                'error': 'Can only review submitted invoices'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate request data
        approval_serializer = AdvocateInvoiceApprovalSerializer(data=request.data)
        if not approval_serializer.is_valid():
            return Response(approval_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        action = approval_serializer.validated_data['action']
        reason = approval_serializer.validated_data.get('reason', '')
        
        if action == 'approve':
            invoice.approve(request.user)
            message = 'Invoice approved successfully'
        else:
            invoice.reject(request.user, reason)
            message = 'Invoice rejected'
        
        serializer = self.get_serializer(invoice)
        return Response({
            'message': message,
            'invoice': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def pay(self, request, pk=None):
        """
        Mark invoice as paid
        
        POST /api/billing/advocate-invoices/{id}/pay/
        Body: {
            "payment_method": "bank_transfer",
            "payment_reference": "TXN123456"
        }
        """
        if request.user.user_type not in ['super_admin', 'admin']:
            return Response({
                'error': 'Only super admin or admin can mark invoices as paid'
            }, status=status.HTTP_403_FORBIDDEN)
        
        invoice = self.get_object()
        
        if invoice.status != 'approved':
            return Response({
                'error': 'Can only pay approved invoices'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate payment data
        payment_serializer = AdvocateInvoicePaymentSerializer(data=request.data)
        if not payment_serializer.is_valid():
            return Response(payment_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        payment_data = payment_serializer.validated_data
        
        invoice.mark_as_paid(
            payment_method=payment_data['payment_method'],
            payment_reference=payment_data.get('payment_reference', '')
        )
        
        serializer = self.get_serializer(invoice)
        return Response({
            'message': 'Invoice marked as paid successfully',
            'invoice': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def my_invoices(self, request):
        """
        Get current advocate's invoices
        
        GET /api/billing/advocate-invoices/my_invoices/
        """
        if request.user.user_type != 'advocate':
            return Response({
                'error': 'Only advocates can access this endpoint'
            }, status=status.HTTP_403_FORBIDDEN)
        
        invoices = AdvocateInvoice.objects.filter(advocate=request.user)
        
        # Filter by status if provided
        status_filter = request.query_params.get('status')
        if status_filter:
            invoices = invoices.filter(status=status_filter)
        
        serializer = AdvocateInvoiceListSerializer(invoices, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pending_approval(self, request):
        """
        Get invoices pending approval
        
        GET /api/billing/advocate-invoices/pending_approval/
        """
        if request.user.user_type not in ['super_admin', 'admin']:
            return Response({
                'error': 'Only super admin or admin can access this endpoint'
            }, status=status.HTTP_403_FORBIDDEN)
        
        invoices = AdvocateInvoice.objects.filter(
            firm=request.user.firm,
            status='submitted'
        )
        
        serializer = AdvocateInvoiceListSerializer(invoices, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get advocate invoice statistics
        
        GET /api/billing/advocate-invoices/stats/
        """
        if request.user.user_type not in ['platform_owner', 'super_admin', 'admin']:
            return Response({
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        if request.user.user_type == 'platform_owner':
            queryset = AdvocateInvoice.objects.all()
        else:
            queryset = AdvocateInvoice.objects.filter(firm=request.user.firm)
        
        total_invoiced = queryset.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        total_paid = queryset.filter(status='paid').aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        
        return Response({
            'total_invoiced': total_invoiced,
            'total_paid': total_paid,
            'total_invoices': queryset.count(),
            'draft_invoices': queryset.filter(status='draft').count(),
            'submitted_invoices': queryset.filter(status='submitted').count(),
            'approved_invoices': queryset.filter(status='approved').count(),
            'rejected_invoices': queryset.filter(status='rejected').count(),
            'paid_invoices': queryset.filter(status='paid').count(),
        })



from datetime import timedelta
from django.db.models import Count, Q
from django.db.models.functions import TruncMonth


class FinanceOverviewViewSet(viewsets.ViewSet):
    """
    Finance Overview API - Provides comprehensive financial dashboard data
    Customized for different user types
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """
        Get complete finance overview dashboard
        
        GET /api/billing/finance-overview/dashboard/
        
        Returns:
        - Total Revenue
        - Net Profit
        - Pending Invoices
        - Outstanding Payouts
        - Revenue & Expenses (6 months chart)
        - Top Clients by Revenue
        - Outstanding Invoices
        - Recent Invoices
        - Recent Payouts
        """
        user = request.user
        
        # Determine user access level
        if user.user_type == 'platform_owner':
            # Platform owner sees all data
            invoices = Invoice.objects.all()
            expenses = Expense.objects.all()
            advocate_invoices = AdvocateInvoice.objects.all()
            firm = None
        elif user.user_type in ['super_admin', 'admin']:
            # Firm admins see their firm's data
            invoices = Invoice.objects.filter(firm=user.firm)
            expenses = Expense.objects.filter(firm=user.firm)
            advocate_invoices = AdvocateInvoice.objects.filter(firm=user.firm)
            firm = user.firm
        elif user.user_type == 'advocate':
            # Advocates see limited data
            invoices = Invoice.objects.filter(
                Q(case__assigned_advocate=user) | Q(case__assigned_paralegal=user)
            )
            expenses = Expense.objects.filter(submitted_by=user)
            advocate_invoices = AdvocateInvoice.objects.filter(advocate=user)
            firm = user.firm
        elif user.user_type == 'client':
            # Clients see only their data
            client_profile = getattr(user, 'client_profile', None)
            if not client_profile:
                return Response({'error': 'Client profile not found'}, status=400)
            invoices = Invoice.objects.filter(client=client_profile)
            expenses = Expense.objects.none()
            advocate_invoices = AdvocateInvoice.objects.none()
            firm = None
        else:
            return Response({'error': 'Invalid user type'}, status=403)
        
        # Calculate metrics
        from decimal import Decimal
        
        # 1. Total Revenue (from paid client invoices)
        total_revenue = invoices.filter(status='paid').aggregate(
            total=Sum('total_amount')
        )['total'] or Decimal('0')
        
        # 2. Total Expenses (case expenses + advocate payouts)
        case_expenses = expenses.filter(billable=True).aggregate(
            total=Sum('billable_amount')
        )['total'] or Decimal('0')
        
        advocate_payouts = advocate_invoices.filter(status='paid').aggregate(
            total=Sum('total_amount')
        )['total'] or Decimal('0')
        
        total_expenses = case_expenses + advocate_payouts
        
        # 3. Net Profit
        net_profit = total_revenue - total_expenses
        
        # 4. Pending Invoices (sent but not paid)
        pending_invoices_amount = invoices.filter(
            status__in=['sent', 'viewed', 'partially_paid']
        ).aggregate(total=Sum('balance_due'))['total'] or Decimal('0')
        
        pending_invoices_count = invoices.filter(
            status__in=['sent', 'viewed', 'partially_paid']
        ).count()
        
        # 5. Outstanding Payouts (approved advocate invoices not paid)
        outstanding_payouts = advocate_invoices.filter(
            status='approved'
        ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0')
        
        outstanding_payouts_count = advocate_invoices.filter(status='approved').count()
        
        # 6. Revenue & Expenses - Last 6 months
        six_months_ago = timezone.now() - timedelta(days=180)
        
        monthly_revenue = invoices.filter(
            status='paid',
            invoice_date__gte=six_months_ago
        ).annotate(
            month=TruncMonth('invoice_date')
        ).values('month').annotate(
            revenue=Sum('total_amount')
        ).order_by('month')
        
        monthly_expenses = expenses.filter(
            date__gte=six_months_ago
        ).annotate(
            month=TruncMonth('date')
        ).values('month').annotate(
            expense=Sum('billable_amount')
        ).order_by('month')
        
        # Format for chart
        revenue_chart = [
            {
                'month': item['month'].strftime('%b'),
                'revenue': float(item['revenue'])
            }
            for item in monthly_revenue
        ]
        
        expense_chart = [
            {
                'month': item['month'].strftime('%b'),
                'expense': float(item['expense'])
            }
            for item in monthly_expenses
        ]
        
        # 7. Top Clients by Revenue
        top_clients = invoices.filter(status='paid').values(
            'client__id',
            'client__first_name',
            'client__last_name',
        ).annotate(
            total_revenue=Sum('total_amount'),
            invoice_count=Count('id')
        ).order_by('-total_revenue')[:5]
        
        top_clients_data = [
            {
                'client_id': str(client['client__id']),
                'client_name': f"{client['client__first_name']} {client['client__last_name']}".strip(),
                'revenue': float(client['total_revenue']),
                'invoice_count': client['invoice_count'],
                'percentage': float((client['total_revenue'] / total_revenue * 100) if total_revenue > 0 else 0)
            }
            for client in top_clients
        ]
        
        # 8. Outstanding Invoices (overdue + due soon)
        outstanding_invoices = invoices.filter(
            status__in=['sent', 'viewed', 'partially_paid', 'overdue']
        ).order_by('due_date')[:5]
        
        outstanding_invoices_data = [
            {
                'invoice_id': str(inv.id),
                'invoice_number': inv.invoice_number,
                'client_name': inv.client.get_full_name() if hasattr(inv.client, 'get_full_name') else str(inv.client),
                'amount': float(inv.balance_due),
                'due_date': inv.due_date.isoformat(),
                'days_overdue': (timezone.now().date() - inv.due_date).days if inv.due_date < timezone.now().date() else 0,
                'status': inv.status
            }
            for inv in outstanding_invoices
        ]
        
        # 9. Recent Invoices
        recent_invoices = invoices.order_by('-invoice_date')[:5]
        
        recent_invoices_data = [
            {
                'invoice_id': str(inv.id),
                'invoice_number': inv.invoice_number,
                'client_name': inv.client.get_full_name() if hasattr(inv.client, 'get_full_name') else str(inv.client),
                'amount': float(inv.total_amount),
                'invoice_date': inv.invoice_date.isoformat(),
                'status': inv.status
            }
            for inv in recent_invoices
        ]
        
        # 10. Recent Payouts (advocate payments)
        recent_payouts = advocate_invoices.filter(
            status__in=['approved', 'paid']
        ).order_by('-invoice_date')[:5]
        
        recent_payouts_data = [
            {
                'payout_id': str(payout.id),
                'payout_number': payout.invoice_number,
                'advocate_name': payout.advocate.get_full_name(),
                'amount': float(payout.total_amount),
                'date': payout.invoice_date.isoformat(),
                'status': payout.status
            }
            for payout in recent_payouts
        ]
        
        # Calculate percentage changes (compared to previous period)
        # For simplicity, using last 30 days vs previous 30 days
        thirty_days_ago = timezone.now() - timedelta(days=30)
        sixty_days_ago = timezone.now() - timedelta(days=60)
        
        current_period_revenue = invoices.filter(
            status='paid',
            invoice_date__gte=thirty_days_ago
        ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0')
        
        previous_period_revenue = invoices.filter(
            status='paid',
            invoice_date__gte=sixty_days_ago,
            invoice_date__lt=thirty_days_ago
        ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0')
        
        revenue_change = float(
            ((current_period_revenue - previous_period_revenue) / previous_period_revenue * 100)
            if previous_period_revenue > 0 else 0
        )
        
        # Build response
        response_data = {
            'summary': {
                'total_revenue': {
                    'amount': float(total_revenue),
                    'change_percentage': revenue_change,
                    'trend': 'up' if revenue_change > 0 else 'down'
                },
                'net_profit': {
                    'amount': float(net_profit),
                    'margin_percentage': float((net_profit / total_revenue * 100) if total_revenue > 0 else 0)
                },
                'pending_invoices': {
                    'amount': float(pending_invoices_amount),
                    'count': pending_invoices_count
                },
                'outstanding_payouts': {
                    'amount': float(outstanding_payouts),
                    'count': outstanding_payouts_count
                }
            },
            'charts': {
                'revenue_expenses': {
                    'revenue': revenue_chart,
                    'expenses': expense_chart
                }
            },
            'top_clients': top_clients_data,
            'outstanding_invoices': outstanding_invoices_data,
            'recent_invoices': recent_invoices_data,
            'recent_payouts': recent_payouts_data,
            'user_type': user.user_type
        }
        
        # Add subscription info for firm admins
        if firm and user.user_type in ['super_admin', 'admin']:
            try:
                from subscriptions.models import FirmSubscription
                subscription = FirmSubscription.objects.filter(firm=firm).first()
                if subscription:
                    response_data['subscription'] = {
                        'plan_name': subscription.plan.name,
                        'plan_type': subscription.plan.plan_type,
                        'price': float(subscription.plan.price),
                        'billing_cycle': subscription.plan.billing_cycle,
                        'status': subscription.status,
                        'end_date': subscription.end_date.isoformat() if subscription.end_date else None,
                        'is_valid': subscription.is_valid
                    }
            except:
                pass
        
        return Response(response_data)
