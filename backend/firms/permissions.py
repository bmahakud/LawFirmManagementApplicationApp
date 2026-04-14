from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied

class IsSubscriptionActive(permissions.BasePermission):
    """
    Prevents access to functional APIs if the firm's subscription has expired or is deactivated.
    Platform Owners and Partner Managers are exempt from this check.
    """
    message = "Your firm's subscription has expired or has been suspended. Please contact support to renew."

    def has_permission(self, request, view):
        user = request.user
        
        # 1. Non-authenticated users don't get past this anyway if and view has IsAuthenticated
        if not user or not user.is_authenticated:
            return True
            
        # 2. Platform Owners and Partner Managers can always access (they manage the system)
        if user.user_type in ['platform_owner', 'partner_manager']:
            return True
            
        # 3. Check firm status
        firm = user.firm
        if not firm:
            # If they don't have a firm, either they are a client waiting for assignment or platform-level staff
            return True
            
        if firm.is_suspended:
            # Check if this is a safe method or a specific list API they need?
            # Usually everything is blocked except maybe the dashboard info showing "Expired"
            if view.__class__.__name__ == 'DashboardViewSet':
                return True
                
            raise PermissionDenied(self.message)
            
        return True
