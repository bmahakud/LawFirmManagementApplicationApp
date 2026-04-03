from rest_framework import serializers
from .models import Firm


class FirmSerializer(serializers.ModelSerializer):
    class Meta:
        model = Firm
        fields = [
            'id', 'firm_name', 'firm_code', 'city', 'state', 'country',
            'address', 'postal_code', 'phone_number', 'email', 'website',
            'subscription_type', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'firm_code', 'created_at', 'updated_at']
