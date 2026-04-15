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

    class Meta:
        model = Client
        fields = [
            'id', 'firm', 'first_name', 'last_name', 'full_name',
            'email', 'phone_number', 'address', 'profile_image', 'brief_summary',
            'assigned_advocate', 'advocate_name', 'user_account',
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
