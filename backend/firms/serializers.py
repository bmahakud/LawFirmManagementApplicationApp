from rest_framework import serializers
from .models import Firm, Branch


class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = [
            'id', 'firm', 'branch_name', 'branch_code', 'city', 'state',
            'address', 'phone_number', 'email', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class FirmSerializer(serializers.ModelSerializer):
    branches = BranchSerializer(many=True, read_only=True)
    
    class Meta:
        model = Firm
        fields = [
            'id', 'firm_name', 'firm_code', 'city', 'state', 'country',
            'address', 'postal_code', 'phone_number', 'email', 'website',
            'subscription_type', 'is_active', 'branches', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
