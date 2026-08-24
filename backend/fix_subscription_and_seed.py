#!/usr/bin/env python
"""Fix subscription and seed court form templates"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')
django.setup()

from firms.models import Firm
from documents.models_templates import CourtFormTemplate

print("=" * 60)
print("FIXING SUBSCRIPTION ISSUES")
print("=" * 60)

# Fix all firms - mark them as active
firms = Firm.objects.all()
print(f"\nFound {firms.count()} firms")

for firm in firms:
    print(f"\nFirm: {firm.firm_name}")
    print(f"  - is_active: {firm.is_active}")
    
    if not firm.is_active:
        firm.is_active = True
        firm.save()
        print(f"  ✓ Activated firm")
    else:
print("Done!")

print("\n" + "=" * 60)
print("DONE!")
print("=" * 60)
