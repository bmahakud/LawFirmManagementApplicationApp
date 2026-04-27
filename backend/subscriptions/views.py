from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q, Sum
from .models import SubscriptionPlan, FirmSubscription, PlatformInvoice
from .serializers import (
    SubscriptionPlanSerializer, 
    FirmSubscriptionSerializer,
    PlatformInvoiceSerializer,
    PlatformInvoiceListSerializer,
    PlatformInvoicePaymentSerializer
)
from .utils import get_subscription_status, can_add_user, can_add_client, can_add_case, can_add_branch

class SubscriptionPlanViewSet(viewsets.ModelViewSet):
    """ViewSet for managing subscription plans (Platform Owner only)"""
    queryset = SubscriptionPlan.objects.all()
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        # Only platform owner can create/update plans
        return [permissions.IsAuthenticated()] # Simplified for now, logic below

    def create(self, request, *args, **kwargs):
        if request.user.user_type != 'platform_owner':
            return Response({'error': 'Only Platform Owner can create plans'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

class FirmSubscriptionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing firm subscriptions"""
    serializer_class = FirmSubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'platform_owner':
            return FirmSubscription.objects.all()
        # Firm members can only see their own firm's subscription
        return FirmSubscription.objects.filter(firm=user.firm)

    @action(detail=False, methods=['get'])
    def my_subscription(self, request):
        """Get the current firm's subscription details"""
        if not request.user.firm:
            return Response({'error': 'User is not associated with a firm'}, status=status.HTTP_400_BAD_REQUEST)
        
        subscription = FirmSubscription.objects.filter(firm=request.user.firm).first()
        if not subscription:
            return Response({'error': 'No subscription found for this firm'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = self.get_serializer(subscription)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def status(self, request):
        """Get comprehensive subscription status with usage and limits"""
        if not request.user.firm:
            return Response({'error': 'User is not associated with a firm'}, status=status.HTTP_400_BAD_REQUEST)
        
        status_data = get_subscription_status(request.user.firm)
        return Response(status_data)
    
    @action(detail=False, methods=['post'])
    def check_limit(self, request):
        """Check if firm can add a specific resource type"""
        if not request.user.firm:
            return Response({'error': 'User is not associated with a firm'}, status=status.HTTP_400_BAD_REQUEST)
        
        resource_type = request.data.get('resource_type')  # 'advocate', 'paralegal', 'admin', 'client', 'case', 'branch'
        user_type = request.data.get('user_type')  # for user resources
        
        firm = request.user.firm
        
        if resource_type == 'user' and user_type:
            can_add, message, upgrade_required = can_add_user(firm, user_type)
        elif resource_type == 'client':
            can_add, message, upgrade_required = can_add_client(firm)
        elif resource_type == 'case':
            can_add, message, upgrade_required = can_add_case(firm)
        elif resource_type == 'branch':
            can_add, message, upgrade_required = can_add_branch(firm)
        else:
            return Response({'error': 'Invalid resource_type'}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'can_add': can_add,
            'message': message,
            'upgrade_required': upgrade_required
        })

    @action(detail=False, methods=['post'])
    def subscribe(self, request):
        """Placeholder for upgrade/subscribe logic"""
        # Logic to handle Stripe/Razorpay would go here
        return Response({'message': 'Payment gateway integration pending'})
    
    @action(detail=True, methods=['post'])
    def renew(self, request, pk=None):
        """
        Renew a subscription
        
        POST /api/subscriptions/subscriptions/{id}/renew/
        Body: {
            "duration_months": 1,  // or 12 for yearly
            "payment_method": "card",
            "payment_reference": "TXN123456"
        }
        """
        subscription = self.get_object()
        
        # Only platform owner or super admin can renew
        if request.user.user_type not in ['platform_owner', 'super_admin']:
            return Response({
                'error': 'Only platform owner or super admin can renew subscriptions'
            }, status=status.HTTP_403_FORBIDDEN)
        
        duration_months = request.data.get('duration_months', 1)
        payment_method = request.data.get('payment_method', 'manual')
        payment_reference = request.data.get('payment_reference', '')
        
        try:
            duration_months = int(duration_months)
            if duration_months not in [1, 3, 6, 12]:
                return Response({
                    'error': 'Duration must be 1, 3, 6, or 12 months'
                }, status=status.HTTP_400_BAD_REQUEST)
        except ValueError:
            return Response({
                'error': 'Invalid duration_months value'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate new end date
        from datetime import timedelta
        now = timezone.now()
        
        # If subscription is still active, extend from current end date
        # Otherwise, start from now
        if subscription.end_date > now:
            new_end_date = subscription.end_date + timedelta(days=duration_months * 30)
        else:
            new_end_date = now + timedelta(days=duration_months * 30)
        
        # Update subscription
        subscription.end_date = new_end_date
        subscription.status = 'active'
        subscription.is_trial = False
        subscription.save()
        
        # Update firm
        firm = subscription.firm
        firm.subscription_end_date = new_end_date
        firm.is_active = True
        firm.save()
        
        # Log the renewal
        from audit.models import AuditLog
        AuditLog.objects.create(
            user=request.user,
            firm=firm,
            action='subscription_renewed',
            resource_type='subscription',
            resource_id=str(subscription.id),
            details={
                'duration_months': duration_months,
                'new_end_date': new_end_date.isoformat(),
                'payment_method': payment_method,
                'payment_reference': payment_reference
            }
        )
        
        serializer = self.get_serializer(subscription)
        return Response({
            'message': f'Subscription renewed successfully for {duration_months} months',
            'subscription': serializer.data,
            'new_end_date': new_end_date
        })
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """
        Activate a suspended/expired subscription
        
        POST /api/subscriptions/subscriptions/{id}/activate/
        """
        subscription = self.get_object()
        
        # Only platform owner can activate
        if request.user.user_type != 'platform_owner':
            return Response({
                'error': 'Only platform owner can activate subscriptions'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Activate subscription
        subscription.status = 'active'
        subscription.save()
        
        # Activate firm
        firm = subscription.firm
        firm.is_active = True
        firm.save()
        
        # Log the activation
        from audit.models import AuditLog
        AuditLog.objects.create(
            user=request.user,
            firm=firm,
            action='subscription_activated',
            resource_type='subscription',
            resource_id=str(subscription.id),
            details={
                'activated_by': request.user.email
            }
        )
        
        serializer = self.get_serializer(subscription)
        return Response({
            'message': 'Subscription activated successfully',
            'subscription': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def suspend(self, request, pk=None):
        """
        Suspend a subscription
        
        POST /api/subscriptions/subscriptions/{id}/suspend/
        Body: {
            "reason": "Payment failed"
        }
        """
        subscription = self.get_object()
        
        # Only platform owner can suspend
        if request.user.user_type != 'platform_owner':
            return Response({
                'error': 'Only platform owner can suspend subscriptions'
            }, status=status.HTTP_403_FORBIDDEN)
        
        reason = request.data.get('reason', 'No reason provided')
        
        # Suspend subscription
        subscription.status = 'canceled'
        subscription.save()
        
        # Suspend firm
        firm = subscription.firm
        firm.is_active = False
        firm.save()
        
        # Log the suspension
        from audit.models import AuditLog
        AuditLog.objects.create(
            user=request.user,
            firm=firm,
            action='subscription_suspended',
            resource_type='subscription',
            resource_id=str(subscription.id),
            details={
                'suspended_by': request.user.email,
                'reason': reason
            }
        )
        
        serializer = self.get_serializer(subscription)
        return Response({
            'message': 'Subscription suspended successfully',
            'subscription': serializer.data
        })



class PlatformInvoiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Platform Invoices (Platform Owner bills Firms for subscriptions)
    
    Permissions:
    - Platform Owner: Full access (create, view all, update, delete)
    - Super Admin/Admin: View their firm's invoices only
    - Others: No access
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['invoice_number', 'firm__firm_name']
    ordering_fields = ['invoice_date', 'due_date', 'total_amount', 'status']
    ordering = ['-invoice_date']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return PlatformInvoiceListSerializer
        return PlatformInvoiceSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        if user.user_type == 'platform_owner':
            # Platform owner sees all invoices
            queryset = PlatformInvoice.objects.all()
        elif user.user_type in ['super_admin', 'admin']:
            # Firm admins see only their firm's invoices
            queryset = PlatformInvoice.objects.filter(firm=user.firm)
        else:
            # Others cannot access
            queryset = PlatformInvoice.objects.none()
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by firm
        firm_id = self.request.query_params.get('firm')
        if firm_id and user.user_type == 'platform_owner':
            queryset = queryset.filter(firm_id=firm_id)
        
        return queryset
    
    def perform_create(self, serializer):
        # Only platform owner can create invoices
        if self.request.user.user_type != 'platform_owner':
            raise permissions.PermissionDenied('Only Platform Owner can create platform invoices')
        
        # Generate invoice number
        last_invoice = PlatformInvoice.objects.order_by('-created_at').first()
        
        if last_invoice and last_invoice.invoice_number:
            try:
                # Extract number from format: PLAT-2024-001
                parts = last_invoice.invoice_number.split('-')
                if len(parts) == 3:
                    last_num = int(parts[2])
                    invoice_number = f"PLAT-{timezone.now().year}-{last_num + 1:03d}"
                else:
                    invoice_number = f"PLAT-{timezone.now().year}-001"
            except:
                invoice_number = f"PLAT-{timezone.now().year}-001"
        else:
            invoice_number = f"PLAT-{timezone.now().year}-001"
        
        serializer.save(
            invoice_number=invoice_number,
            created_by=self.request.user
        )
    
    def perform_update(self, serializer):
        # Only platform owner can update invoices
        if self.request.user.user_type != 'platform_owner':
            raise permissions.PermissionDenied('Only Platform Owner can update platform invoices')
        
        # Cannot update paid invoices
        instance = self.get_object()
        if instance.status == 'paid':
            raise permissions.PermissionDenied('Cannot update paid invoices')
        
        serializer.save()
    
    def perform_destroy(self, instance):
        # Only platform owner can delete invoices
        if self.request.user.user_type != 'platform_owner':
            raise permissions.PermissionDenied('Only Platform Owner can delete platform invoices')
        
        # Cannot delete paid invoices
        if instance.status == 'paid':
            raise permissions.PermissionDenied('Cannot delete paid invoices')
        
        instance.delete()
    
    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        """
        Send invoice to firm
        
        POST /api/subscriptions/platform-invoices/{id}/send/
        """
        if request.user.user_type != 'platform_owner':
            return Response({
                'error': 'Only Platform Owner can send invoices'
            }, status=status.HTTP_403_FORBIDDEN)
        
        invoice = self.get_object()
        
        if invoice.status == 'paid':
            return Response({
                'error': 'Cannot send paid invoice'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update status and sent date
        invoice.status = 'sent'
        invoice.sent_date = timezone.now()
        invoice.save()
        
        # TODO: Send email notification to firm
        
        serializer = self.get_serializer(invoice)
        return Response({
            'message': 'Invoice sent successfully',
            'invoice': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        """
        Mark invoice as paid
        
        POST /api/subscriptions/platform-invoices/{id}/mark_paid/
        Body: {
            "amount": 2948.82,
            "payment_method": "bank_transfer",
            "transaction_id": "TXN123456",
            "payment_date": "2024-05-15",
            "payment_notes": "Payment received"
        }
        """
        if request.user.user_type != 'platform_owner':
            return Response({
                'error': 'Only Platform Owner can mark invoices as paid'
            }, status=status.HTTP_403_FORBIDDEN)
        
        invoice = self.get_object()
        
        if invoice.status == 'paid':
            return Response({
                'error': 'Invoice is already paid'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate payment data
        payment_serializer = PlatformInvoicePaymentSerializer(data=request.data)
        if not payment_serializer.is_valid():
            return Response(payment_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        payment_data = payment_serializer.validated_data
        
        # Check if payment amount matches total
        if payment_data['amount'] != invoice.total_amount:
            return Response({
                'error': f'Payment amount ({payment_data["amount"]}) does not match invoice total ({invoice.total_amount})'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Mark as paid using helper method
        invoice.mark_as_paid(
            amount=payment_data['amount'],
            payment_method=payment_data['payment_method'],
            transaction_id=payment_data.get('transaction_id', ''),
            payment_date=payment_data.get('payment_date')
        )
        
        # Add payment notes if provided
        if 'payment_notes' in payment_data:
            invoice.payment_notes = payment_data['payment_notes']
            invoice.save()
        
        serializer = self.get_serializer(invoice)
        return Response({
            'message': 'Invoice marked as paid successfully',
            'invoice': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Cancel invoice
        
        POST /api/subscriptions/platform-invoices/{id}/cancel/
        Body: {
            "reason": "Subscription cancelled"
        }
        """
        if request.user.user_type != 'platform_owner':
            return Response({
                'error': 'Only Platform Owner can cancel invoices'
            }, status=status.HTTP_403_FORBIDDEN)
        
        invoice = self.get_object()
        
        if invoice.status == 'paid':
            return Response({
                'error': 'Cannot cancel paid invoice'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        reason = request.data.get('reason', '')
        
        invoice.status = 'cancelled'
        if reason:
            invoice.internal_notes = f"Cancelled: {reason}\n{invoice.internal_notes}"
        invoice.save()
        
        serializer = self.get_serializer(invoice)
        return Response({
            'message': 'Invoice cancelled successfully',
            'invoice': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def my_invoices(self, request):
        """
        Get invoices for current user's firm
        
        GET /api/subscriptions/platform-invoices/my_invoices/
        """
        if not request.user.firm:
            return Response({
                'error': 'User is not associated with a firm'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        invoices = PlatformInvoice.objects.filter(firm=request.user.firm)
        
        # Filter by status if provided
        status_filter = request.query_params.get('status')
        if status_filter:
            invoices = invoices.filter(status=status_filter)
        
        serializer = PlatformInvoiceListSerializer(invoices, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get platform invoice statistics
        
        GET /api/subscriptions/platform-invoices/stats/
        """
        if request.user.user_type != 'platform_owner':
            return Response({
                'error': 'Only Platform Owner can view statistics'
            }, status=status.HTTP_403_FORBIDDEN)
        
        queryset = PlatformInvoice.objects.all()
        
        total_invoiced = queryset.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        total_paid = queryset.filter(status='paid').aggregate(Sum('paid_amount'))['paid_amount__sum'] or 0
        total_outstanding = queryset.filter(
            status__in=['sent', 'overdue']
        ).aggregate(Sum('balance_due'))['balance_due__sum'] or 0
        
        overdue_count = queryset.filter(status='overdue').count()
        
        return Response({
            'total_invoiced': total_invoiced,
            'total_paid': total_paid,
            'total_outstanding': total_outstanding,
            'overdue_count': overdue_count,
            'total_invoices': queryset.count(),
            'paid_invoices': queryset.filter(status='paid').count(),
            'pending_invoices': queryset.filter(status__in=['draft', 'sent']).count(),
        })
