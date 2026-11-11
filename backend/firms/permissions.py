from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied
from django.utils import timezone

class IsSubscriptionActive(permissions.BasePermission):
    """
    Prevents access to functional APIs if the firm's subscription has expired or is deactivated.
    Platform Owners and Partner Managers are exempt from this check.
    """
    
    def has_permission(self, request, view):
        user = request.user
        
        # 1. Non-authenticated users (login, registration) can always pass
        if not user or not user.is_authenticated:
            return True
        
        # 2. Exempt authentication and public endpoints (login, logout, OTP, registration, etc.)
        exempt_views = [
            'AuthenticationViewSet',
            'UserInvitationViewSet',
            'FirmJoinLinkViewSet',
            'GlobalConfigurationViewSet'
        ]
        if view.__class__.__name__ in exempt_views:
            return True
            
        # 3. Platform Owners and Partner Managers are platform-level and always have access
        if user.user_type in ['platform_owner', 'partner_manager']:
            return True
            
        # 4. Check firm status
        firm = user.firm
        if not firm:
            # If they don't have a firm, either they are a client waiting for assignment or platform-level staff
            return True
            
        if firm.is_suspended:
            # Allow access to specific views even when suspended so users can:
            # - See dashboard with subscription notice
            # - Update their profile
            # - View subscription/billing info
            # - Refill or renew subscription
            # - Logout
            allowed_views_when_suspended = [
                'DashboardViewSet',
                'GlobalConfigurationViewSet', 
                'CustomUserViewSet',
                'FirmViewSet',            # To view firm subscription status
                'SubscriptionPlanViewSet',# To see available plans
                'FirmSubscriptionViewSet',# To refill / renew / upgrade subscription
                'PlatformInvoiceViewSet', # To view subscription invoices
            ]
            if view.__class__.__name__ in allowed_views_when_suspended:
                return True
            
            # Build detailed message based on suspension reason
            if not firm.is_active:
                message = (
                    f"Your firm '{firm.firm_name}' has been suspended. "
                    "Please contact support for assistance."
                )
            elif not firm.subscription_end_date or firm.subscription_end_date < timezone.now():
                if firm.subscription_end_date:
                    days_expired = max(1, (timezone.now() - firm.subscription_end_date).days)
                    message = (
                        f"Your firm's 1-month free trial expired {days_expired} day{'s' if days_expired != 1 else ''} ago "
                        f"(on {firm.subscription_end_date.strftime('%B %d, %Y')}). "
                        f"Please refill or renew your subscription to continue using AntLegal."
                    )
                else:
                    message = (
                        f"Your firm '{firm.firm_name}' does not have an active subscription. "
                        f"Please refill or activate your subscription to continue using AntLegal."
                    )
            else:
                message = "Your firm's subscription is not active. Please refill your subscription."
                
            raise PermissionDenied(detail=message)
            
        return True
