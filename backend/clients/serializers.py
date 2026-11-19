from rest_framework import serializers
from .models import Client, Lead
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
    profile_image = serializers.SerializerMethodField()
    
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

    def get_profile_image(self, obj):
        img = obj.profile_image or (obj.user_account.profile_image if obj.user_account else None)
        if not img:
            return None
        request = self.context.get('request')
        try:
            url = img.url
            if request and not url.startswith('http'):
                return request.build_absolute_uri(url)
            return url
        except Exception:
            return str(img)
    
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

    def update(self, instance, validated_data):
        address_line_1 = validated_data.pop('address_line_1', None)
        address_line_2 = validated_data.pop('address_line_2', None)
        city = validated_data.pop('city', None)
        state = validated_data.pop('state', None)
        postal_code = validated_data.pop('postal_code', None)

        if any([address_line_1, address_line_2, city, state, postal_code]):
            address_parts = [
                address_line_1 or '',
                address_line_2 or '',
                city or '',
                state or '',
                postal_code or ''
            ]
            combined_address = ', '.join([part for part in address_parts if part])
            if combined_address:
                validated_data['address'] = combined_address

        return super().update(instance, validated_data)


class LeadSerializer(serializers.ModelSerializer):
    client = serializers.PrimaryKeyRelatedField(queryset=Client.objects.all(), required=False, allow_null=True)
    client_name = serializers.SerializerMethodField()
    client_phone = serializers.SerializerMethodField()
    client_email = serializers.SerializerMethodField()
    client_profile_image = serializers.SerializerMethodField()
    advocate_name = serializers.SerializerMethodField()
    converted_case_title = serializers.SerializerMethodField()
    converted_case_number = serializers.SerializerMethodField()
    is_prospect = serializers.SerializerMethodField()

    class Meta:
        model = Lead
        fields = [
            'id', 'firm', 'client', 'is_prospect',
            'prospect_name', 'prospect_phone', 'prospect_email',
            'client_name', 'client_phone', 'client_email', 'client_profile_image',
            'assigned_advocate', 'advocate_name',
            'title', 'category', 'case_type', 'opposing_party', 'brief_summary', 'source', 'priority',
            'status', 'estimated_fee', 'consultation_date', 'intake_notes', 'loss_reason',
            'converted_case', 'converted_case_title', 'converted_case_number', 'converted_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'firm', 'converted_case', 'converted_case_title',
            'converted_case_number', 'converted_at', 'created_at', 'updated_at',
            'is_prospect'
        ]

    def get_is_prospect(self, obj):
        return obj.client is None

    def get_client_name(self, obj):
        if obj.client:
            return obj.client.get_full_name()
        return obj.prospect_name or 'Prospective Client'

    def get_client_phone(self, obj):
        if obj.client:
            return obj.client.phone_number
        return obj.prospect_phone or ''

    def get_client_email(self, obj):
        if obj.client:
            return obj.client.email
        return obj.prospect_email or ''

    def get_client_profile_image(self, obj):
        if not obj.client:
            return None
        img = obj.client.profile_image or (obj.client.user_account.profile_image if obj.client.user_account else None)
        if not img:
            return None
        request = self.context.get('request')
        try:
            url = img.url
            if request and not url.startswith('http'):
                return request.build_absolute_uri(url)
            return url
        except Exception:
            return str(img)

    def get_advocate_name(self, obj):
        if obj.assigned_advocate:
            name = f"{obj.assigned_advocate.first_name} {obj.assigned_advocate.last_name}".strip()
            return name or obj.assigned_advocate.email
        return None

    def get_converted_case_title(self, obj):
        return obj.converted_case.case_title if obj.converted_case else None

    def get_converted_case_number(self, obj):
        if not obj.converted_case:
            return None
        return obj.converted_case.case_number or obj.converted_case.registration_number or 'Case File'

