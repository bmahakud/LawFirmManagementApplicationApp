from rest_framework import serializers
from .models import Case, CaseActivity, Hearing, CaseDraft
from documents.models import UserDocument

class CaseActivitySerializer(serializers.ModelSerializer):
    performed_by_name = serializers.CharField(source='performed_by.get_full_name', read_only=True)
    
    class Meta:
        model = CaseActivity
        fields = '__all__'

class HearingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hearing
        fields = '__all__'

class CaseDraftSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = CaseDraft
        fields = '__all__'

class CaseSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.get_full_name', read_only=True)
    advocate_name = serializers.CharField(source='assigned_advocate.get_full_name', read_only=True)
    paralegal_name = serializers.CharField(source='assigned_paralegal.get_full_name', read_only=True)
    branch_name = serializers.CharField(source='branch.branch_name', read_only=True)
    
    activities = CaseActivitySerializer(many=True, read_only=True)
    hearings = HearingSerializer(many=True, read_only=True)
    drafts = CaseDraftSerializer(many=True, read_only=True)
    
    class Meta:
        model = Case
        fields = [
            'id', 'firm', 'branch', 'branch_name', 'client', 'client_name', 'assigned_advocate', 'advocate_name',
            'assigned_paralegal', 'paralegal_name', 'case_title', 'case_number',
            'case_type', 'description', 'status', 'category', 'priority', 'stage',
            'case_summary', 'billing_type', 'estimated_value', 'total_fee', 'hearing_fee', 'additional_expenses',
            'payment_terms', 'loe_notes',
            'petitioner_name', 'respondent_name', 'opposing_counsel', 'court_name', 'court_no',
            'judge_name', 'district', 'state', 'representing', 'cnr_number',
            'filing_date', 'next_hearing_date', 'created_at', 'updated_at',
            'activities', 'hearings', 'drafts'
        ]
        read_only_fields = ['id', 'firm', 'created_at', 'updated_at']
    
    def validate_client(self, value):
        """Accept either Client ID or CustomUser ID and convert to Client"""
        from clients.models import Client
        from accounts.models import CustomUser
        
        # First try as Client ID
        try:
            return value
        except:
            pass
        
        # If validation fails, try to find Client by user_account
        try:
            user = CustomUser.objects.get(id=value.id)
            if user.user_type == 'client':
                client = Client.objects.filter(user_account=user).first()
                if client:
                    return client
        except:
            pass
        
        return value
    
    def to_internal_value(self, data):
        """Convert CustomUser ID to Client ID if needed"""
        from clients.models import Client
        
        if 'client' in data:
            client_id = data['client']
            # Try to find if this is a CustomUser ID
            try:
                client = Client.objects.filter(user_account_id=client_id).first()
                if client:
                    data = data.copy()
                    data['client'] = str(client.id)
            except:
                pass
        
        return super().to_internal_value(data)
