from rest_framework import serializers
from .models import Client
from accounts.models import CustomUser


class AdvocateListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing advocates (used in client dropdown)"""
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ['id', 'first_name', 'last_name', 'full_name', 'email', 'phone_number']
        read_only_fields = fields

    def get_full_name(self, obj):
        name = f"{obj.first_name} {obj.last_name}".strip()
        return name or obj.email


class ClientSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    advocate_name = serializers.SerializerMethodField()
    
    # Accept address fields from frontend
    address_line_1 = serializers.CharField(write_only=True, required=False, allow_blank=True)
    address_line_2 = serializers.CharField(write_only=True, required=False, allow_blank=True)
    city = serializers.CharField(write_only=True, required=False, allow_blank=True)
    state = serializers.CharField(write_only=True, required=False, allow_blank=True)
    postal_code = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Client
        fields = [
            'id', 'firm', 'first_name', 'last_name', 'full_name',
            'email', 'phone_number', 'address', 'profile_image', 'brief_summary',
            'assigned_advocate', 'advocate_name', 'user_account',
            'address_line_1', 'address_line_2', 'city', 'state', 'postal_code',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'firm', 'created_at', 'updated_at']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

    def get_advocate_name(self, obj):
        if obj.assigned_advocate:
            name = f"{obj.assigned_advocate.first_name} {obj.assigned_advocate.last_name}".strip()
            return name or obj.assigned_advocate.email
        return None
    
    def create(self, validated_data):
        # Extract address fields
        address_line_1 = validated_data.pop('address_line_1', '')
        address_line_2 = validated_data.pop('address_line_2', '')
        city = validated_data.pop('city', '')
        state = validated_data.pop('state', '')
        postal_code = validated_data.pop('postal_code', '')
        
        # Combine into single address field
        address_parts = [
            address_line_1,
            address_line_2,
            city,
            state,
            postal_code
        ]
        combined_address = ', '.join([part for part in address_parts if part])
        validated_data['address'] = combined_address
        
        return super().create(validated_data)
