from rest_framework import serializers
from accounts.serializers import CustomUserSerializer
from .models import Partner


class PartnerSerializer(serializers.ModelSerializer):
    user_details = CustomUserSerializer(source='user', read_only=True)
    
    class Meta:
        model = Partner
        fields = [
            'id', 'user', 'user_details', 'company_name', 'registration_number',
            'commission_percentage', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
