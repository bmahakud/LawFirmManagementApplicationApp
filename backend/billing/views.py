from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
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
            queryset = TimeEntry.objects.filter(firm=user.firm)
            
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
                    # Admin is assigned to a branch, show only that branch's time entries
                    queryset = queryset.filter(case__branch=membership.branch)
                    
            return queryset
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
            client_profiles = user.client_profiles.all()
            if client_profiles.exists():
                return TimeEntry.objects.filter(case__client__in=client_profiles)
        
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
            queryset = Expense.objects.filter(firm=user.firm)
            
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
                    # Admin is assigned to a branch, show only that branch's expenses
                    queryset = queryset.filter(case__branch=membership.branch)
                    
            return queryset
        elif user.user_type in ['advocate', 'paralegal']:
            return Expense.objects.filter(
                Q(firm=user.firm) & (
                    Q(submitted_by=user) |
                    Q(case__assigned_advocate=user) |
                    Q(case__assigned_paralegal=user)
                )
            ).distinct()
        elif user.user_type == 'client':
            client_profiles = user.client_profiles.all()
            if client_profiles.exists():
                return Expense.objects.filter(case__client__in=client_profiles)
        
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
        
        if user.user_type == 'platform_owner':
            queryset = Invoice.objects.all()
        elif user.user_type in ['super_admin', 'admin']:
            queryset = Invoice.objects.filter(firm=user.firm)
            
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
                    # Admin is assigned to a branch, show only that branch's invoices
                    queryset = queryset.filter(branch=membership.branch)
                    
        elif user.user_type in ['advocate', 'paralegal']:
            queryset = Invoice.objects.filter(
                Q(firm=user.firm) & (
                    Q(case__assigned_advocate=user) |
                    Q(case__assigned_paralegal=user)
                )
            ).distinct()
        elif user.user_type == 'client':
            client_profiles = user.client_profiles.all()
            if client_profiles.exists():
                queryset = Invoice.objects.filter(client__in=client_profiles)
            else:
                queryset = Invoice.objects.none()
        else:
            queryset = Invoice.objects.none()
        
        # Filter by branch if provided
        branch_id = self.request.query_params.get('branch')
        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    def perform_create(self, serializer):
        user = self.request.user
        firm = user.firm

        # Platform owner has no firm — derive it from the client being invoiced (may be None for solo clients)
        if user.user_type == 'platform_owner':
            client = serializer.validated_data.get('client')
            if not client:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'client': 'Client is required.'})
            firm = client.firm  # None is fine for solo clients

        if not firm and user.user_type != 'platform_owner':
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'detail': 'User is not associated with a firm.'})

        # Check if admin is assigned to a branch and validate case belongs to that branch
        if user.user_type == 'admin':
            from accounts.models import UserFirmRole
            membership = UserFirmRole.objects.filter(
                user=user,
                firm=firm,
                is_active=True,
                branch__isnull=False
            ).first()
            
            if membership and membership.branch:
                # Admin is assigned to a branch
                case = serializer.validated_data.get('case')
                if case and case.branch != membership.branch:
                    from rest_framework.exceptions import ValidationError
                    raise ValidationError({
                        'case': f'You can only create invoices for cases in your branch ({membership.branch.branch_name}).'
                    })

        # Use provided invoice_number or auto-generate
        invoice_number = self.request.data.get('invoice_number', '').strip()
        if not invoice_number:
            if firm:
                last_invoice = Invoice.objects.filter(firm=firm).order_by('-created_at').first()
                if last_invoice and last_invoice.invoice_number:
                    try:
                        last_num = int(last_invoice.invoice_number.split('-')[-1])
                        invoice_number = f"INV-{firm.firm_code}-{last_num + 1:05d}"
                    except Exception:
                        invoice_number = f"INV-{firm.firm_code}-00001"
                else:
                    invoice_number = f"INV-{firm.firm_code}-00001"
            else:
                # Solo client — no firm code available, use timestamp-based number
                from django.utils import timezone as tz
                seq = Invoice.objects.count() + 1
                invoice_number = f"INV-SOLO-{seq:05d}"

        # Check uniqueness
        if Invoice.objects.filter(invoice_number=invoice_number).exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'invoice_number': f'Invoice number "{invoice_number}" already exists.'})

        invoice_data = {
            'firm': firm,
            'invoice_number': invoice_number,
            'created_by': self.request.user
        }

        case = serializer.validated_data.get('case')
        if case and case.branch:
            invoice_data['branch'] = case.branch
        elif hasattr(self.request.user, 'branch') and self.request.user.branch:
            invoice_data['branch'] = self.request.user.branch

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
    
    @action(detail=False, methods=['post'])
    def generate_from_case(self, request):
        """
        Generate invoice with automatic advocate and time entries from case
        
        POST /api/billing/invoices/generate_from_case/
        {
            "case_id": "uuid",
            "include_unbilled_time_entries": true,
            "include_unbilled_expenses": true
        }
        
        Returns invoice data pre-populated with:
        - Advocate from case
        - Unbilled time entries for that case
        - Unbilled expenses for that case
        - Calculated totals
        """
        case_id = request.data.get('case_id')
        if not case_id:
            return Response({'error': 'case_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        from cases.models import Case
        try:
            case = Case.objects.get(id=case_id)
        except Case.DoesNotExist:
            return Response({'error': 'Case not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check permissions
        user = request.user
        if user.user_type not in ['super_admin', 'admin', 'advocate']:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        if user.user_type in ['super_admin', 'admin'] and case.firm != user.firm:
            return Response({'error': 'Case not in your firm'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get advocate from case
        advocate = case.assigned_advocate
        if not advocate:
            return Response({'error': 'No advocate assigned to this case'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get unbilled time entries
        include_time = request.data.get('include_unbilled_time_entries', True)
        include_expenses = request.data.get('include_unbilled_expenses', True)
        
        time_entries = []
        time_total = Decimal('0')
        if include_time:
            unbilled_time = TimeEntry.objects.filter(
                case=case,
                invoice__isnull=True,
                billable=True,
                status='approved'
            ).select_related('user')
            
            for entry in unbilled_time:
                time_entries.append({
                    'id': str(entry.id),
                    'date': entry.date.isoformat(),
                    'user': entry.user.get_full_name() or entry.user.email,
                    'description': entry.description,
                    'hours': float(entry.hours),
                    'rate': float(entry.hourly_rate),
                    'amount': float(entry.amount)
                })
                time_total += entry.amount
        
        # Get unbilled expenses
        expenses = []
        expense_total = Decimal('0')
        if include_expenses:
            unbilled_expenses = Expense.objects.filter(
                case=case,
                invoice__isnull=True,
                billable=True,
                status='approved'
            ).select_related('submitted_by')
            
            for expense in unbilled_expenses:
                expenses.append({
                    'id': str(expense.id),
                    'date': expense.date.isoformat(),
                    'submitted_by': expense.submitted_by.get_full_name() or expense.submitted_by.email,
                    'expense_type': expense.expense_type,
                    'description': expense.description,
                    'amount': float(expense.billable_amount)
                })
                expense_total += expense.billable_amount
        
        # Calculate totals
        subtotal = time_total + expense_total
        tax_percentage = Decimal('18')  # Default GST
        tax_amount = (subtotal * tax_percentage) / Decimal('100')
        total_amount = subtotal + tax_amount
        
        # Generate invoice description
        description = f"Legal services for case: {case.case_title}\n"
        description += f"Case Number: {case.case_number}\n"
        description += f"Advocate: {advocate.get_full_name() or advocate.email}\n"
        if time_entries:
            description += f"Time Entries: {len(time_entries)} entries, {sum(e['hours'] for e in time_entries):.2f} hours\n"
        if expenses:
            description += f"Expenses: {len(expenses)} items\n"
        
        return Response({
            'case': {
                'id': str(case.id),
                'case_title': case.case_title,
                'case_number': case.case_number
            },
            'client': {
                'id': str(case.client.id),
                'name': case.client.get_full_name(),
                'email': case.client.email
            },
            'advocate': {
                'id': str(advocate.id),
                'name': advocate.get_full_name() or advocate.email,
                'email': advocate.email
            },
            'time_entries': time_entries,
            'expenses': expenses,
            'suggested_invoice': {
                'case_id': str(case.id),
                'client_id': str(case.client.id),
                'notes': description,
                'subtotal': float(subtotal),
                'tax_percentage': float(tax_percentage),
                'tax_amount': float(tax_amount),
                'total_amount': float(total_amount),
                'balance_due': float(total_amount),
                'due_date': (timezone.now() + timedelta(days=30)).date().isoformat()
            }
        })
    
    @action(detail=False, methods=['get'])
    def my_invoices(self, request):
        """
        Get client invoices where the current advocate is assigned.
        Used by advocates to see invoices the platform owner/firm created for their clients.
        GET /api/billing/invoices/my_invoices/
        """
        user = request.user
        if user.user_type != 'advocate':
            return Response({'error': 'Only advocates can access this endpoint'}, status=status.HTTP_403_FORBIDDEN)

        invoices = Invoice.objects.filter(
            Q(case__assigned_advocate=user) |
            Q(created_by=user)
        ).distinct()

        status_filter = request.query_params.get('status')
        if status_filter:
            invoices = invoices.filter(status=status_filter)

        serializer = InvoiceListSerializer(invoices, many=True)
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
            client_profiles = user.client_profiles.all()
            if client_profiles.exists():
                return Payment.objects.filter(client__in=client_profiles)
        
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
            client_profiles = user.client_profiles.all()
            if client_profiles.exists():
                return TrustAccount.objects.filter(client__in=client_profiles)
        
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
            # Platform owner sees all advocate invoices (including drafts they created)
            queryset = AdvocateInvoice.objects.all()
        elif user.user_type in ['super_admin', 'admin']:
            queryset = AdvocateInvoice.objects.filter(firm=user.firm)
        elif user.user_type == 'advocate':
            # Advocates only see invoices that have been sent to them (not drafts)
            queryset = AdvocateInvoice.objects.filter(
                advocate=user
            ).exclude(status='draft')
        else:
            queryset = AdvocateInvoice.objects.none()
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset
    
    def perform_create(self, serializer):
        user = self.request.user

        # Platform owner can create invoices for any advocate (including solo advocates)
        if user.user_type == 'platform_owner':
            from accounts.models import CustomUser
            advocate_id = self.request.data.get('advocate')
            if not advocate_id:
                raise PermissionDenied('advocate field is required when platform_owner creates an advocate invoice')
            try:
                advocate = CustomUser.objects.get(id=advocate_id, user_type='advocate')
            except CustomUser.DoesNotExist:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'advocate': 'Advocate not found'})
            firm = advocate.firm  # None is fine for solo advocates
            invoice_number = self.request.data.get('invoice_number', '').strip()
            if not invoice_number:
                seq = AdvocateInvoice.objects.count() + 1
                invoice_number = f"ADV-{seq:05d}"
            if AdvocateInvoice.objects.filter(invoice_number=invoice_number).exists():
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'invoice_number': f'Invoice number "{invoice_number}" already exists.'})
            serializer.save(firm=firm, advocate=advocate, invoice_number=invoice_number)
            return

        if user.user_type != 'advocate':
            raise PermissionDenied('Only advocates or platform owners can create advocate invoices')

        firm = user.firm

        # Use provided invoice_number or auto-generate
        invoice_number = self.request.data.get('invoice_number', '').strip()
        if not invoice_number:
            last_invoice = AdvocateInvoice.objects.filter(firm=firm).order_by('-created_at').first()
            if last_invoice and last_invoice.invoice_number:
                try:
                    last_num = int(last_invoice.invoice_number.split('-')[-1])
                    invoice_number = f"ADV-{firm.firm_code}-{last_num + 1:05d}"
                except:
                    invoice_number = f"ADV-{firm.firm_code}-00001"
            else:
                invoice_number = f"ADV-{firm.firm_code}-00001"

        if AdvocateInvoice.objects.filter(invoice_number=invoice_number).exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'invoice_number': f'Invoice number "{invoice_number}" already exists.'})

        serializer.save(firm=firm, advocate=user, invoice_number=invoice_number)
    
    def perform_update(self, serializer):
        instance = self.get_object()
        
        # Advocates can only update their own draft invoices
        if self.request.user.user_type == 'advocate':
            if instance.advocate != self.request.user:
                raise PermissionDenied('You can only update your own invoices')
            if instance.status != 'draft':
                raise PermissionDenied('Can only update draft invoices')
        
        # Admins cannot update advocate invoices
        elif self.request.user.user_type in ['super_admin', 'admin']:
            raise PermissionDenied('Admins cannot update advocate invoices. Use approve/reject/pay actions.')
        
        serializer.save()
    
    def perform_destroy(self, instance):
        # Only advocates can delete their own draft invoices
        if self.request.user.user_type != 'advocate':
            raise PermissionDenied('Only advocates can delete their invoices')
        
        if instance.advocate != self.request.user:
            raise PermissionDenied('You can only delete your own invoices')
        
        if instance.status != 'draft':
            raise PermissionDenied('Can only delete draft invoices')
        
        instance.delete()
    
    @action(detail=True, methods=['post'])
    def send_to_advocate(self, request, pk=None):
        """
        Platform owner sends a draft invoice to the advocate.
        Changes status from 'draft' to 'sent' so the advocate can see it.
        
        POST /api/billing/advocate-invoices/{id}/send_to_advocate/
        """
        if request.user.user_type != 'platform_owner':
            return Response(
                {'error': 'Only platform owners can send invoices to advocates'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        invoice = self.get_object()
        
        if invoice.status != 'draft':
            return Response(
                {'error': f'Invoice is already {invoice.status}. Only draft invoices can be sent.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        invoice.status = 'sent'
        invoice.save()
        
        serializer = self.get_serializer(invoice)
        return Response({
            'message': f'Invoice {invoice.invoice_number} sent to {invoice.advocate.get_full_name() or invoice.advocate.email}',
            'invoice': serializer.data
        })

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
        
        # Advocates only see invoices that have been sent to them (not drafts)
        invoices = AdvocateInvoice.objects.filter(
            advocate=request.user
        ).exclude(status='draft')
        
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
            client_profiles = user.client_profiles.all()
            if not client_profiles.exists():
                return Response({'error': 'Client profile not found'}, status=400)
            invoices = Invoice.objects.filter(client__in=client_profiles)
            expenses = Expense.objects.none()
            advocate_invoices = AdvocateInvoice.objects.none()
            firm = None
        else:
            return Response({'error': 'Invalid user type'}, status=403)
        
        # Calculate metrics
        from decimal import Decimal
        from subscriptions.models import PlatformInvoice

        # For platform_owner: only platform invoices (subscription fees from firms)
        if user.user_type == 'platform_owner':
            platform_invoices = PlatformInvoice.objects.all()

            # 1. Total Revenue = paid platform invoices only
            total_revenue = platform_invoices.filter(status='paid').aggregate(
                total=Sum('total_amount')
            )['total'] or Decimal('0')

            # 2. Expenses = advocate payouts across all firms
            advocate_payouts_total = advocate_invoices.filter(status='paid').aggregate(
                total=Sum('total_amount')
            )['total'] or Decimal('0')
            total_expenses = advocate_payouts_total

            # 3. Net Profit
            net_profit = total_revenue - total_expenses

            # 4. Pending = sent/overdue platform invoices only
            pending_invoices_amount = platform_invoices.filter(
                status__in=['sent', 'overdue']
            ).aggregate(total=Sum('balance_due'))['total'] or Decimal('0')
            pending_invoices_count = platform_invoices.filter(
                status__in=['sent', 'overdue']
            ).count()

            # 5. Outstanding Payouts (approved advocate invoices not paid)
            outstanding_payouts = advocate_invoices.filter(
                status='approved'
            ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0')
            outstanding_payouts_count = advocate_invoices.filter(status='approved').count()

            # 6. Revenue chart — platform invoices last 6 months
            six_months_ago = timezone.now() - timedelta(days=180)
            from dateutil.relativedelta import relativedelta

            monthly_platform_rev = platform_invoices.filter(
                status='paid', invoice_date__gte=six_months_ago
            ).annotate(month=TruncMonth('invoice_date')).values('month').annotate(
                revenue=Sum('total_amount')
            ).order_by('month')

            monthly_adv_exp = advocate_invoices.filter(
                status='paid', invoice_date__gte=six_months_ago
            ).annotate(month=TruncMonth('invoice_date')).values('month').annotate(
                expense=Sum('total_amount')
            ).order_by('month')

            rev_map = {item['month'].strftime('%b'): float(item['revenue']) for item in monthly_platform_rev}
            exp_map = {item['month'].strftime('%b'): float(item['expense']) for item in monthly_adv_exp}

            months_ordered = [
                (timezone.now().date() - relativedelta(months=i)).strftime('%b')
                for i in range(5, -1, -1)
            ]
            revenue_chart = [{'month': m, 'amount': rev_map.get(m, 0)} for m in months_ordered]
            expense_chart = [{'month': m, 'amount': exp_map.get(m, 0)} for m in months_ordered]

            # 7. Top Firms by platform invoice revenue
            top_firms_qs = platform_invoices.filter(status='paid').values(
                'firm__id', 'firm__firm_name'
            ).annotate(total_revenue=Sum('total_amount')).order_by('-total_revenue')[:5]

            top_clients_data = [
                {
                    'client_id': str(f['firm__id']),
                    'client_name': f['firm__firm_name'],
                    'revenue': float(f['total_revenue']),
                    'invoice_count': 0,
                    'percentage': float((f['total_revenue'] / total_revenue * 100) if total_revenue > 0 else 0)
                }
                for f in top_firms_qs
            ]

            # 8. Outstanding — platform invoices only
            outstanding_invoices_data = [
                {
                    'invoice_id': str(inv.id),
                    'invoice_number': inv.invoice_number,
                    'client_name': inv.firm.firm_name,
                    'invoice_type': 'platform',
                    'amount': float(inv.balance_due),
                    'due_date': inv.due_date.isoformat(),
                    'days_overdue': (timezone.now().date() - inv.due_date).days if inv.due_date < timezone.now().date() else 0,
                    'status': inv.status
                }
                for inv in platform_invoices.filter(
                    status__in=['sent', 'overdue']
                ).order_by('due_date')[:10]
            ]

            # 9. Recent invoices — platform + client invoices merged
            recent_platform_list = [
                {
                    'invoice_id': str(inv.id),
                    'invoice_number': inv.invoice_number,
                    'client_name': inv.firm.firm_name if inv.firm else 'Solo',
                    'invoice_type': 'platform',
                    'amount': float(inv.total_amount),
                    'invoice_date': inv.invoice_date.isoformat(),
                    'status': inv.status
                }
                for inv in platform_invoices.order_by('-invoice_date')[:10]
            ]
            recent_client_list = [
                {
                    'invoice_id': str(inv.id),
                    'invoice_number': inv.invoice_number,
                    'client_name': inv.client.get_full_name() if hasattr(inv.client, 'get_full_name') else str(inv.client),
                    'invoice_type': 'client',
                    'amount': float(inv.total_amount),
                    'invoice_date': inv.invoice_date.isoformat(),
                    'status': inv.status
                }
                for inv in invoices.order_by('-invoice_date')[:10]
            ]
            recent_advocate_list = [
                {
                    'invoice_id': str(inv.id),
                    'invoice_number': inv.invoice_number,
                    'client_name': inv.advocate.get_full_name(),
                    'invoice_type': 'advocate',
                    'amount': float(inv.total_amount),
                    'invoice_date': inv.invoice_date.isoformat(),
                    'status': inv.status
                }
                for inv in advocate_invoices.order_by('-invoice_date')[:10]
            ]
            all_recent = sorted(
                recent_platform_list + recent_client_list + recent_advocate_list,
                key=lambda x: x['invoice_date'], reverse=True
            )
            recent_invoices_data = all_recent[:10]

            # 10. Invoice stats — all types
            client_paid_amount = float(invoices.filter(status='paid').aggregate(t=Sum('total_amount'))['t'] or 0)
            client_pending_amount = float(invoices.filter(
                status__in=['sent', 'viewed', 'partially_paid', 'overdue']
            ).aggregate(t=Sum('balance_due'))['t'] or 0)
            invoice_stats = {
                'platform': {
                    'total': platform_invoices.count(),
                    'paid': platform_invoices.filter(status='paid').count(),
                    'paid_amount': float(total_revenue),
                    'pending': pending_invoices_count,
                    'pending_amount': float(pending_invoices_amount),
                    'draft': platform_invoices.filter(status='draft').count(),
                },
                'client': {
                    'total': invoices.count(),
                    'paid': invoices.filter(status='paid').count(),
                    'paid_amount': client_paid_amount,
                    'pending': invoices.filter(status__in=['sent', 'viewed', 'partially_paid', 'overdue']).count(),
                    'pending_amount': client_pending_amount,
                    'draft': invoices.filter(status='draft').count(),
                },
                'advocate': {
                    'total': advocate_invoices.count(),
                    'paid': advocate_invoices.filter(status='paid').count(),
                    'paid_amount': float(advocate_payouts_total),
                    'pending': advocate_invoices.filter(status__in=['submitted', 'approved']).count(),
                    'pending_amount': float(outstanding_payouts),
                    'draft': advocate_invoices.filter(status='draft').count(),
                },
            }

            # 11. Recent advocate payouts
            recent_payouts_data = [
                {
                    'payout_id': str(p.id),
                    'payout_number': p.invoice_number,
                    'advocate_name': p.advocate.get_full_name(),
                    'amount': float(p.total_amount),
                    'date': p.invoice_date.isoformat(),
                    'status': p.status
                }
                for p in advocate_invoices.filter(
                    status__in=['approved', 'paid']
                ).order_by('-invoice_date')[:5]
            ]

            # Revenue change (last 30 vs previous 30 days)
            thirty_days_ago = timezone.now() - timedelta(days=30)
            sixty_days_ago = timezone.now() - timedelta(days=60)
            current_rev = platform_invoices.filter(
                status='paid', invoice_date__gte=thirty_days_ago
            ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0')
            prev_rev = platform_invoices.filter(
                status='paid', invoice_date__gte=sixty_days_ago, invoice_date__lt=thirty_days_ago
            ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0')
            revenue_change = float(
                ((current_rev - prev_rev) / prev_rev * 100) if prev_rev > 0 else 0
            )

            return Response({
                'summary': {
                    'total_revenue': {
                        'amount': float(total_revenue),
                        'change_percentage': revenue_change,
                        'trend': 'up' if revenue_change >= 0 else 'down'
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
                'invoice_stats': invoice_stats,
                'user_type': user.user_type
            })

        # ── Non-platform-owner path ──────────────────────────────────────────

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

    @action(detail=False, methods=['get'])
    def monthly_report(self, request):
        """
        GET /api/billing/finance-overview/monthly_report/?year=2026
        - Billed: invoices with invoice_date in that month
        - Collected: invoices with payment_date in that month (actual cash received)
        - Firm breakdown for platform owner
        """
        from subscriptions.models import FirmSubscription, PlatformInvoice

        user = request.user

        # Plan gating for firm users
        if user.user_type in ['super_admin', 'admin']:
            try:
                sub = FirmSubscription.objects.select_related('plan').get(firm=user.firm)
                if not sub.plan.enable_reports:
                    return Response(
                        {'error': 'Reports are not available on your current plan. Upgrade to Business or Enterprise.', 'upgrade_required': True},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except FirmSubscription.DoesNotExist:
                return Response({'error': 'No active subscription found.', 'upgrade_required': True}, status=status.HTTP_403_FORBIDDEN)

        year = int(request.query_params.get('year', timezone.now().year))
        MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

        if user.user_type == 'platform_owner':
            # All platform invoices regardless of year for billed/collected split
            all_pi = PlatformInvoice.objects.select_related('firm', 'subscription_plan')
            all_ci = Invoice.objects.select_related('firm', 'client')
            all_ai = AdvocateInvoice.objects.select_related('advocate', 'firm')

            monthly = []
            for i, month in enumerate(MONTHS, 1):
                # Billed = invoice_date in this month/year
                pi_billed = all_pi.filter(invoice_date__year=year, invoice_date__month=i)
                ci_billed = all_ci.filter(invoice_date__year=year, invoice_date__month=i)

                # Collected = payment_date in this month/year (actual cash received)
                pi_collected = all_pi.filter(status='paid', payment_date__year=year, payment_date__month=i)
                ci_collected = all_ci.filter(status='paid', invoice_date__year=year, invoice_date__month=i)

                # Expenses = advocate invoices paid this month
                ai_exp = all_ai.filter(status='paid', invoice_date__year=year, invoice_date__month=i)

                platform_billed = float(pi_billed.exclude(status='draft').aggregate(t=Sum('total_amount'))['t'] or 0)
                platform_collected = float(pi_collected.aggregate(t=Sum('total_amount'))['t'] or 0)
                client_billed = float(ci_billed.exclude(status='draft').aggregate(t=Sum('total_amount'))['t'] or 0)
                client_collected = float(ci_collected.aggregate(t=Sum('total_amount'))['t'] or 0)
                expenses = float(ai_exp.aggregate(t=Sum('total_amount'))['t'] or 0)

                total_billed = platform_billed + client_billed
                total_collected = platform_collected + client_collected

                monthly.append({
                    'month': month,
                    'platform_revenue': platform_billed,
                    'platform_collected': platform_collected,
                    'client_revenue': client_billed,
                    'client_collected': client_collected,
                    'total_revenue': total_billed,
                    'total_collected': total_collected,
                    'expenses': expenses,
                    'net_profit': total_collected - expenses,
                    'invoice_count': pi_billed.count() + ci_billed.count(),
                    'paid_count': pi_collected.count() + ci_collected.count(),
                    'pending_count': pi_billed.filter(status__in=['sent', 'overdue']).count() + ci_billed.filter(status__in=['sent', 'viewed', 'overdue', 'partially_paid']).count(),
                })

            # Firm breakdown — who paid, who is pending (firms, solo advocates, clients)
            firm_breakdown = []
            
            # Platform invoices (firms and solo advocates)
            for pi in all_pi.filter(invoice_date__year=year).exclude(status='draft').order_by('firm__firm_name', 'invoice_date'):
                firm_breakdown.append({
                    'type': 'platform',  # subscription invoice
                    'firm_name': pi.firm.firm_name if pi.firm else 'Solo Advocate',
                    'advocate_name': None,
                    'client_name': None,
                    'invoice_number': pi.invoice_number,
                    'invoice_date': pi.invoice_date.isoformat(),
                    'due_date': pi.due_date.isoformat(),
                    'plan': pi.subscription_plan.name if pi.subscription_plan else '—',
                    'total_amount': float(pi.total_amount),
                    'paid_amount': float(pi.paid_amount),
                    'balance_due': float(pi.balance_due),
                    'status': pi.status,
                    'payment_date': pi.payment_date.isoformat() if pi.payment_date else None,
                })
            
            # Client invoices (from solo advocates or firms)
            for ci in all_ci.filter(invoice_date__year=year).exclude(status='draft').order_by('firm__firm_name', 'invoice_date'):
                advocate_name = None
                if ci.case and ci.case.assigned_advocate:
                    advocate_name = ci.case.assigned_advocate.get_full_name() or ci.case.assigned_advocate.email
                
                client_name = ci.client.get_full_name() if ci.client else '—'
                
                # Get the latest payment date from related payments
                latest_payment = ci.payments.order_by('-payment_date').first()
                payment_date = latest_payment.payment_date.isoformat() if latest_payment else None
                
                firm_breakdown.append({
                    'type': 'client',  # client invoice
                    'firm_name': ci.firm.firm_name if ci.firm else 'Solo Advocate',
                    'advocate_name': advocate_name,
                    'client_name': client_name,
                    'invoice_number': ci.invoice_number,
                    'invoice_date': ci.invoice_date.isoformat(),
                    'due_date': ci.due_date.isoformat(),
                    'plan': 'Client Invoice',
                    'total_amount': float(ci.total_amount),
                    'paid_amount': float(ci.paid_amount),
                    'balance_due': float(ci.balance_due),
                    'status': ci.status,
                    'payment_date': payment_date,
                })

        else:  # super_admin / admin
            firm = user.firm
            inv_qs = Invoice.objects.filter(firm=firm)
            exp_qs = Expense.objects.filter(firm=firm)
            adv_qs = AdvocateInvoice.objects.filter(firm=firm)

            monthly = []
            for i, month in enumerate(MONTHS, 1):
                inv_month = inv_qs.filter(invoice_date__year=year, invoice_date__month=i)
                billed = float(inv_month.exclude(status='draft').aggregate(t=Sum('total_amount'))['t'] or 0)
                collected = float(inv_month.filter(status='paid').aggregate(t=Sum('paid_amount'))['t'] or 0)
                exp = float(exp_qs.filter(date__year=year, date__month=i).aggregate(t=Sum('amount'))['t'] or 0)
                adv_exp = float(adv_qs.filter(invoice_date__year=year, invoice_date__month=i, status='paid').aggregate(t=Sum('total_amount'))['t'] or 0)
                total_exp = exp + adv_exp
                monthly.append({
                    'month': month,
                    'total_revenue': billed,
                    'total_collected': collected,
                    'expenses': total_exp,
                    'net_profit': collected - total_exp,
                    'invoice_count': inv_month.count(),
                    'paid_count': inv_month.filter(status='paid').count(),
                    'pending_count': inv_month.filter(status__in=['sent', 'viewed', 'overdue', 'partially_paid']).count(),
                })
            firm_breakdown = []

        totals = {
            'total_revenue': sum(m['total_revenue'] for m in monthly),
            'total_collected': sum(m.get('total_collected', 0) for m in monthly),
            'expenses': sum(m['expenses'] for m in monthly),
            'net_profit': sum(m['net_profit'] for m in monthly),
        }

        return Response({
            'year': year,
            'monthly': monthly,
            'totals': totals,
            'firm_breakdown': firm_breakdown,
        })
