from rest_framework import serializers
from .models import Case, CaseActivity, Hearing, CaseDraft
from documents.models import UserDocument
from core.serializers import ClientField
from .serializers_service import ServiceAttemptListSerializer

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
    client = ClientField()
    client_name = serializers.CharField(source='client.get_full_name', read_only=True)
    advocate_name = serializers.CharField(source='assigned_advocate.get_full_name', read_only=True)
    assigned_advocate_name = serializers.CharField(source='assigned_advocate.get_full_name', read_only=True)
    paralegal_name = serializers.CharField(source='assigned_paralegal.get_full_name', read_only=True)
    branch_name = serializers.CharField(source='branch.branch_name', read_only=True)
    solo_advocate_name = serializers.CharField(source='solo_advocate.get_full_name', read_only=True)
    
    activities = CaseActivitySerializer(many=True, read_only=True)
    hearings = HearingSerializer(many=True, read_only=True)
    drafts = CaseDraftSerializer(many=True, read_only=True)
    service_attempts = ServiceAttemptListSerializer(many=True, read_only=True)
    
    class Meta:
        model = Case
        fields = [
            'id', 'firm', 'branch', 'branch_name', 'solo_advocate', 'solo_advocate_name',
            'client', 'client_name', 'assigned_advocate', 'advocate_name', 'assigned_advocate_name',
            'assigned_paralegal', 'paralegal_name', 'case_title', 'case_number',
            'case_type', 'description', 'status', 'category', 'priority', 'stage',
            'case_summary', 'billing_type', 'estimated_value', 'total_fee', 'hearing_fee', 'additional_expenses',
            'payment_terms', 'loe_notes',
            'petitioner_name', 'respondent_name', 'opposing_counsel', 'court_name', 'court_no',
            'judge_name', 'district', 'state', 'representing', 'cnr_number',
            'filing_date', 'next_hearing_date', 'created_at', 'updated_at',
            'activities', 'hearings', 'drafts', 'service_attempts'
        ]
        read_only_fields = ['id', 'firm', 'solo_advocate', 'created_at', 'updated_at']
