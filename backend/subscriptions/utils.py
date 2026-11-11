"""
Subscription limit checking utilities
"""
from django.db.models import Q


def get_firm_usage(firm):
    """Get current usage statistics for a firm"""
    from accounts.models import CustomUser
    from cases.models import Case
    from clients.models import Client
    
    # Count users by type
    advocates_count = CustomUser.objects.filter(
        firm=firm,
        user_type='advocate',
        is_active=True
    ).count()
    
    paralegals_count = CustomUser.objects.filter(
        firm=firm,
        user_type='paralegal',
        is_active=True
    ).count()
    
    admins_count = CustomUser.objects.filter(
        firm=firm,
        user_type__in=['admin', 'super_admin'],
        is_active=True
    ).count()
    
    total_users = advocates_count + paralegals_count + admins_count
    
    # Count clients
    clients_count = Client.objects.filter(firm=firm).count()
    
    # Count active cases
    active_cases_count = Case.objects.filter(
        firm=firm,
        status__in=['running', 'created', 'filed', 'evidence', 'hearing', 'open', 'in_progress']
    ).count()
    
    # Count branches
    branches_count = firm.branches.filter(is_active=True).count()
    
    return {
        'advocates': advocates_count,
        'paralegals': paralegals_count,
        'admins': admins_count,
        'total_users': total_users,
        'clients': clients_count,
        'active_cases': active_cases_count,
        'branches': branches_count,
    }


def can_add_user(firm, user_type):
    """
    Check if firm can add more users of specified type
    
    Returns: (can_add: bool, message: str, upgrade_required: bool)
    """
    try:
        subscription = firm.subscription
        if not subscription or not subscription.is_valid:
            return False, "No active subscription. Please subscribe to a plan.", True
    except:
        return False, "No active subscription. Please subscribe to a plan.", True
    
    plan = subscription.plan
    usage = get_firm_usage(firm)
    
    # Check specific user type limits
    if user_type == 'advocate':
        if usage['advocates'] >= plan.max_advocates:
            return False, f"Advocate limit reached ({plan.max_advocates}/{plan.max_advocates}). Upgrade your plan to add more advocates.", True
    
    elif user_type == 'paralegal':
        if usage['paralegals'] >= plan.max_paralegals:
            return False, f"Paralegal limit reached ({plan.max_paralegals}/{plan.max_paralegals}). Upgrade your plan to add more paralegals.", True
    
    elif user_type in ['admin', 'super_admin']:
        if usage['admins'] >= plan.max_admins:
            return False, f"Admin limit reached ({plan.max_admins}/{plan.max_admins}). Upgrade your plan to add more admins.", True
    
    # Check total user limit
    if usage['total_users'] >= plan.max_users:
        return False, f"Total user limit reached ({plan.max_users}/{plan.max_users}). Upgrade your plan to add more team members.", True
    
    return True, "OK", False


def can_add_client(firm):
    """Check if firm can add more clients"""
    try:
        subscription = firm.subscription
        if not subscription or not subscription.is_valid:
            return False, "No active subscription", True
    except:
        return False, "No active subscription", True
    
    plan = subscription.plan
    usage = get_firm_usage(firm)
    
    if usage['clients'] >= plan.max_clients:
        return False, f"Client limit reached ({plan.max_clients}/{plan.max_clients}). Upgrade your plan.", True
    
    return True, "OK", False


def can_add_case(firm):
    """Check if firm can add more active cases"""
    try:
        subscription = firm.subscription
        if not subscription or not subscription.is_valid:
            return False, "No active subscription", True
    except:
        return False, "No active subscription", True
    
    plan = subscription.plan
    usage = get_firm_usage(firm)
    
    if usage['active_cases'] >= plan.max_cases:
        return False, f"Active case limit reached ({plan.max_cases}/{plan.max_cases}). Upgrade your plan or close some cases.", True
    
    return True, "OK", False


def can_add_branch(firm):
    """Check if firm can add more branches"""
    try:
        subscription = firm.subscription
        if not subscription or not subscription.is_valid:
            return False, "No active subscription", True
    except:
        return False, "No active subscription", True
    
    plan = subscription.plan
    usage = get_firm_usage(firm)
    
    if usage['branches'] >= plan.max_branches:
        return False, f"Branch limit reached ({plan.max_branches}/{plan.max_branches}). Upgrade your plan.", True
    
    return True, "OK", False


def get_subscription_status(firm):
    """
    Get comprehensive subscription status for a firm
    
    Returns dict with:
    - is_valid: bool
    - plan_name: str
    - usage: dict
    - limits: dict
    - warnings: list
    """
    try:
        subscription = firm.subscription
        plan = subscription.plan
        
        if not subscription.is_valid:
            from django.utils import timezone
            is_expired = bool(subscription.end_date and subscription.end_date <= timezone.now())
            days_expired = max(1, (timezone.now() - subscription.end_date).days) if (subscription.end_date and is_expired) else 0
            return {
                'is_valid': False,
                'plan_name': plan.name if plan else 'Trial',
                'plan_type': plan.plan_type if plan else 'trial',
                'status': 'expired' if is_expired else subscription.status,
                'end_date': subscription.end_date,
                'days_expired': days_expired,
                'message': f"Subscription expired {days_expired} day{'s' if days_expired != 1 else ''} ago" if is_expired else 'Subscription expired or inactive'
            }
        
        usage = get_firm_usage(firm)
        
        limits = {
            'advocates': plan.max_advocates,
            'paralegals': plan.max_paralegals,
            'admins': plan.max_admins,
            'total_users': plan.max_users,
            'clients': plan.max_clients,
            'active_cases': plan.max_cases,
            'branches': plan.max_branches,
            'storage_gb': plan.max_storage_gb,
        }
        
        # Calculate percentages
        percentages = {}
        warnings = []
        
        for key in usage:
            if key in limits and limits[key] > 0:
                percentage = (usage[key] / limits[key]) * 100
                percentages[key] = round(percentage, 1)
                
                # Add warnings for high usage
                if percentage >= 90:
                    warnings.append(f"{key.replace('_', ' ').title()} usage at {percentage}%")
                elif percentage >= 80:
                    warnings.append(f"{key.replace('_', ' ').title()} usage at {percentage}%")
        
        return {
            'is_valid': True,
            'plan_name': plan.name,
            'plan_type': plan.plan_type,
            'status': subscription.status,
            'end_date': subscription.end_date,
            'usage': usage,
            'limits': limits,
            'percentages': percentages,
            'warnings': warnings,
            'features': {
                'billing': plan.enable_billing,
                'calendar': plan.enable_calendar,
                'documents': plan.enable_documents,
                'reports': plan.enable_reports,
                'api_access': plan.enable_api_access,
            }
        }
    
    except Exception as e:
        return {
            'is_valid': False,
            'plan_name': None,
            'message': 'No subscription found'
        }
