#!/usr/bin/env python
"""
Test script to verify document visibility for clients and advocates
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')
django.setup()

from accounts.models import CustomUser
from documents.models import UserDocument
from cases.models import Case
from clients.models import Client

def test_document_visibility():
    print("=" * 60)
    print("DOCUMENT VISIBILITY TEST")
    print("=" * 60)
    
    # Find a client user
    client_user = CustomUser.objects.filter(user_type='client').first()
    if not client_user:
        print("❌ No client user found")
        return
    
    print(f"\n✓ Testing with client: {client_user.username}")
    
    # Get client profile
    client_profile = client_user.client_profiles.first()
    if not client_profile:
        print("❌ Client has no profile")
        return
    
    print(f"  Client Profile ID: {client_profile.id}")
    
    # Get cases for this client
    client_cases = Case.objects.filter(client=client_profile)
    print(f"\n📁 Client has {client_cases.count()} case(s)")
    
    for case in client_cases:
        print(f"\n  Case: {case.case_title} (ID: {case.id})")
        
        # Get documents linked to this case
        case_docs = UserDocument.objects.filter(case=case, is_deleted=False)
        print(f"  Documents in case: {case_docs.count()}")
        
        for doc in case_docs:
            print(f"    - {doc.document_title}")
            print(f"      Uploaded by: {doc.uploaded_by.username} ({doc.uploaded_by.user_type})")
            print(f"      Status: {doc.verification_status}")
    
    # Test queryset visibility
    print("\n" + "=" * 60)
    print("TESTING QUERYSET VISIBILITY")
    print("=" * 60)
    
    # Simulate the get_queryset logic for client
    queryset = UserDocument.objects.filter(uploaded_by=client_user)
    print(f"\n1. Documents uploaded by client: {queryset.count()}")
    
    # Add case documents
    client_cases = Case.objects.filter(client=client_profile)
    case_docs_queryset = UserDocument.objects.filter(case__in=client_cases)
    print(f"2. Documents in client's cases: {case_docs_queryset.count()}")
    
    # Combined
    combined = queryset | case_docs_queryset
    combined = combined.filter(is_deleted=False).distinct()
    print(f"3. Total visible documents: {combined.count()}")
    
    print("\n✅ Test completed!")

if __name__ == '__main__':
    test_document_visibility()
