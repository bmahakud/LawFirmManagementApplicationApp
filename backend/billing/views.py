from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Sum
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from .models import TimeEntry, Expense, Invoice, Payment, TrustAccount
from .serializers import (
    TimeEntrySerializer, ExpenseSerializer, InvoiceSerializer,
    InvoiceListSerializer, PaymentSerializer, TrustAccountSerializer
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
        
        if user.user_type == 'platform_owner':
            return Invoice.objects.all()
        elif user.user_type in ['super_admin', 'admin']:
            return Invoice.objects.filter(firm=user.firm)
        elif user.user_type in ['advocate', 'paralegal']:
            return Invoice.objects.filter(
                Q(firm=user.firm) & (
                    Q(case__assigned_advocate=user) |
                    Q(case__assigned_paralegal=user)
                )
            ).distinct()
        elif user.user_type == 'client':
            client_profile = getattr(user, 'client_profile', None)
            if client_profile:
                return Invoice.objects.filter(client=client_profile)
        
        return Invoice.objects.none()
    
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
        
        serializer.save(
            firm=firm,
            invoice_number=invoice_number,
            created_by=self.request.user
        )
    
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
