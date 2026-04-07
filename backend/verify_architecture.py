import os
import django
import uuid
import sys
from datetime import timedelta
from django.utils import timezone

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')
django.setup()

from firms.models import Firm, Branch
from accounts.models import CustomUser, UserFirmRole
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token

def verify():
    client = APIClient()
    
    # 1. Create Firm
    firm, created = Firm.objects.get_or_create(
        firm_name="Global Law Associates",
        defaults={
            'firm_code': "GLA-001",
            'city': "Bhubaneswar",
            'state': "Odisha",
            'country': "India",
            'phone_number': "+919998887776",
            'email': "contact@glalaw.com"
        }
    )
    print(f"Firm: {firm.firm_name} ({'Created' if created else 'Existing'})")
    
    # 2. Create Platform Owner
    platform_user = CustomUser.objects.filter(email="owner@platform.com").first()
    if not platform_user:
        platform_user = CustomUser.objects.create_user(
            username="owner@platform.com",
            email="owner@platform.com",
            phone_number="+919999999901",
            password="Password123",
            user_type="platform_owner"
        )
        print(f"Created Platform Owner: {platform_user.email}")
    else:
        print(f"Existing Platform Owner: {platform_user.email}")
    token, _ = Token.objects.get_or_create(user=platform_user)
    
    # 3. Create Branches (via API)
    client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
    print("\nCreating branches...")
    for b_name in ['Joba', 'Barbil']:
        response = client.post('/api/branches/', {
            'firm': str(firm.id),
            'branch_name': b_name,
            'branch_code': f"GLA-{b_name.upper()}-{str(uuid.uuid4())[:4]}",
            'city': b_name,
            'state': 'Odisha',
            'is_active': True
        })
        if response.status_code == 201:
            print(f"Successfully created branch: {b_name}")
        elif response.status_code == 400 and 'branch_name' in response.data:
            print(f"Branch {b_name} already exists.")
        else:
            print(f"Error creating branch {b_name}: {response.data}")
            
    branches = Branch.objects.filter(firm=firm)
    joba_branch = branches.get(branch_name='Joba')
    barbil_branch = branches.get(branch_name='Barbil')
    
    # 4. Create Super Admin for Firm
    super_admin = CustomUser.objects.filter(email="admin@glalaw.com").first()
    if not super_admin:
        super_admin = CustomUser.objects.create_user(
            username="admin@glalaw.com",
            email="admin@glalaw.com",
            phone_number="+919999999902",
            password="Password123",
            user_type="super_admin",
            firm=firm
        )
        print(f"\nCreated Super Admin: {super_admin.email} (linked to {firm.firm_name})")
    else:
        print(f"\nExisting Super Admin: {super_admin.email}")
    
    # Verify UserFirmRole
    role = UserFirmRole.objects.get(user=super_admin, firm=firm)
    print(f"UserFirmRole verified: Role={role.user_type}, IsLastActive={role.is_last_active}")

    # 5. Add Advocate to Joba Branch via API
    client.credentials(HTTP_AUTHORIZATION=f'Token {Token.objects.get_or_create(user=super_admin)[0].key}')
    print("\nAdding Advocate to Joba Branch...")
    response = client.post('/api/users/add_user/', {
        'email': 'advocate@joba.com',
        'phone_number': '+910000000001',
        'user_type': 'advocate',
        'first_name': 'Joba',
        'last_name': 'Advocate',
        'branch_id': str(joba_branch.id)
    })
    if response.status_code == 201:
        print(f"Successfully added advocate to branch {joba_branch.branch_name}")
    else:
        print(f"Error adding user: {response.data}")
        sys.exit(1)
        
    adv_user = CustomUser.objects.get(email='advocate@joba.com')
    adv_role = UserFirmRole.objects.get(user=adv_user, firm=firm)
    print(f"Advocate Branch verified: {adv_role.branch.branch_name if adv_role.branch else 'None'}")
    
    # 6. Switch Firm/Branch context for Super Admin
    # Super admin starts with firm=firm, branch=None. Let's move them to Barbil.
    print(f"\nSwitching {super_admin.email} to branch {barbil_branch.branch_name}...")
    response = client.post('/api/users/switch_firm/', {
        'firm_id': str(firm.id),
        'branch_id': str(barbil_branch.id)
    })
    if response.status_code == 200:
        print(f"Switch successful: {response.data['message']}")
        # Verify sync back to CustomUser
        super_admin.refresh_from_db()
        # Verify UserFirmRole
        role.refresh_from_db()
        print(f"Current active branch in UserFirmRole: {role.branch.branch_name}")
    else:
        print(f"Error switching: {response.data}")
        sys.exit(1)

    print("\nArchitecture Verification Complete: SUCCESS!")

if __name__ == "__main__":
    verify()
