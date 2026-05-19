"""
Management command to seed 25 E-Courts legal document templates
Run: python manage.py seed_ecourts_templates
"""
from django.core.management.base import BaseCommand
from documents.models_templates import DocumentTemplate


class Command(BaseCommand):
    help = 'Seeds the database with 25 E-Courts legal document templates'

    def handle(self, *args, **kwargs):
        templates = [
            {
                'name': 'Address Form',
                'description': 'Form for providing address details to the court',
                'category': 'ecourts',
                'template_fields': {
                    'court_name': {'type': 'text', 'label': 'In the Court of'},
                    'case_number': {'type': 'text', 'label': 'Case'},
                    'versus': {'type': 'text', 'label': 'Versus'},
                    'suit_number': {'type': 'text', 'label': 'Suit'},
                    'hearing_date': {'type': 'date', 'label': 'Date of Hearing'},
                    'address_table': {
                        'type': 'table',
                        'label': 'The address of Plaintiff/Defendant/Applicant is as under',
                        'columns': [
                            {'key': 'name_with_father', 'label': 'Name with Father\'s Name'},
                            {'key': 'caste', 'label': 'Caste'},
                            {'key': 'resident_of', 'label': 'Resident of'},
                            {'key': 'post_office', 'label': 'Post Office'},
                            {'key': 'tehsil', 'label': 'Tehsil'},
                            {'key': 'district', 'label': 'Distt.'},
                            {'key': 'remarks', 'label': 'Remarks'}
                        ],
                        'min_rows': 1,
                        'max_rows': 10
                    },
                    'notice_text': {
                        'type': 'static',
                        'content': 'All the summons, notices orders etc. in connection with the above suit be sent to me at the address given above.'
                    },
                    'change_notice': {
                        'type': 'static',
                        'content': 'In Case of any change in address, the same shall be communicated to with full particulars and details.'
                    }
                }
            },
            {
                'name': 'Advocate Form',
                'description': 'Form for advocate enrollment and details',
                'category': 'ecourts',
                'template_fields': {
                    'advocate_name': 'text',
                    'enrollment_number': 'text',
                    'bar_council': 'text',
                    'enrollment_date': 'date',
                    'address': 'textarea',
                    'phone': 'text',
                    'email': 'text',
                }
            },
            {
                'name': 'Bail Bond',
                'description': 'Application for bail bond',
                'category': 'application',
                'template_fields': {
                    'court_name': 'text',
                    'case_number': 'text',
                    'case_year': 'text',
                    'applicant_name': 'text',
                    'fir_number': 'text',
                    'police_station': 'text',
                    'sections': 'text',
                    'surety_name': 'text',
                    'surety_address': 'textarea',
                    'bond_amount': 'text',
                    'date': 'date',
                }
            },
            {
                'name': 'CA Form 7',
                'description': 'Caveat application form',
                'category': 'application',
                'template_fields': {
                    'court_name': 'text',
                    'caveator_name': 'text',
                    'caveator_address': 'textarea',
                    'matter_description': 'textarea',
                    'advocate_name': 'text',
                    'date': 'date',
                }
            },
            {
                'name': 'Case Information Format',
                'description': 'Standard format for case information',
                'category': 'ecourts',
                'template_fields': {
                    'case_type': 'text',
                    'case_number': 'text',
                    'case_year': 'text',
                    'filing_date': 'date',
                    'petitioner_name': 'text',
                    'respondent_name': 'text',
                    'court_name': 'text',
                    'judge_name': 'text',
                    'case_status': 'text',
                }
            },
            {
                'name': 'Check List 138 NI Act Matters',
                'description': 'Checklist for Section 138 NI Act cases',
                'category': 'ecourts',
                'template_fields': {
                    'complainant_name': 'text',
                    'accused_name': 'text',
                    'cheque_number': 'text',
                    'cheque_date': 'date',
                    'cheque_amount': 'text',
                    'bank_name': 'text',
                    'bounce_date': 'date',
                    'legal_notice_date': 'date',
                    'complaint_date': 'date',
                }
            },
            {
                'name': 'Check List',
                'description': 'General checklist for court proceedings',
                'category': 'ecourts',
                'template_fields': {
                    'case_number': 'text',
                    'case_type': 'text',
                    'documents_filed': 'textarea',
                    'pending_documents': 'textarea',
                    'next_hearing_date': 'date',
                }
            },
            {
                'name': 'Commercial Court Rules and Forms',
                'description': 'Forms as per Commercial Courts Act',
                'category': 'ecourts',
                'template_fields': {
                    'court_name': 'text',
                    'suit_number': 'text',
                    'plaintiff_name': 'text',
                    'defendant_name': 'text',
                    'commercial_dispute_nature': 'textarea',
                    'claim_amount': 'text',
                }
            },
            {
                'name': 'E-Court Fee',
                'description': 'Electronic court fee payment form',
                'category': 'ecourts',
                'template_fields': {
                    'case_number': 'text',
                    'case_type': 'text',
                    'court_fee_amount': 'text',
                    'payment_mode': 'text',
                    'transaction_id': 'text',
                    'payment_date': 'date',
                }
            },
            {
                'name': 'Filing Form',
                'description': 'General filing form for court documents',
                'category': 'ecourts',
                'template_fields': {
                    'case_number': 'text',
                    'case_type': 'text',
                    'document_type': 'text',
                    'filing_date': 'date',
                    'filed_by': 'text',
                    'advocate_name': 'text',
                }
            },
            {
                'name': 'Form for SMS and Mail Facility',
                'description': 'Form to register for SMS and email notifications',
                'category': 'ecourts',
                'template_fields': {
                    'party_name': 'text',
                    'case_number': 'text',
                    'mobile_number': 'text',
                    'email': 'text',
                    'notification_preference': 'text',
                }
            },
            {
                'name': 'Form No 45 Bail Bond',
                'description': 'Standard bail bond form as per Form No. 45',
                'category': 'application',
                'template_fields': {
                    'court_name': 'text',
                    'case_number': 'text',
                    'accused_name': 'text',
                    'fir_number': 'text',
                    'sections': 'text',
                    'surety1_name': 'text',
                    'surety1_address': 'textarea',
                    'surety2_name': 'text',
                    'surety2_address': 'textarea',
                    'bond_amount': 'text',
                    'date': 'date',
                }
            },
            {
                'name': 'Index Form',
                'description': 'Index of documents filed in a case',
                'category': 'ecourts',
                'template_fields': {
                    'case_number': 'text',
                    'case_title': 'text',
                    'document_list': 'textarea',
                    'total_pages': 'text',
                    'filed_by': 'text',
                    'date': 'date',
                }
            },
            {
                'name': 'Inspection Form',
                'description': 'Application for inspection of court file',
                'category': 'application',
                'template_fields': {
                    'court_name': {'type': 'text', 'label': 'IN THE COURT OF'},
                    'case_number': {'type': 'text', 'label': 'NO'},
                    'case_year': {'type': 'text', 'label': 'OF 201_'},
                    'matter_title': {'type': 'text', 'label': 'IN THE MATTER OF'},
                    'versus': {'type': 'static', 'content': 'VERSUS'},
                    'petitioner_respondent': {'type': 'text', 'label': 'Petitioner/Respondent'},
                    'fir_case_number': {'type': 'text', 'label': 'FIR / Case No.'},
                    'ndoh': {'type': 'text', 'label': 'NDOH :-'},
                    'application_title': {
                        'type': 'static',
                        'content': 'HUMBLE APPLICATION FOR INSPECTION OF THE COURT FILE'
                    },
                    'showeth_intro': {'type': 'static', 'content': 'MOST RESPECTFULLY SHOWETH :-'},
                    'point_1': {
                        'type': 'paragraph',
                        'label': 'Point 1',
                        'template': 'That the above said matter is pending adjudication and determination before the Hon\'ble Court and the next date of hearing is ___________.'
                    },
                    'next_hearing_date': {'type': 'date', 'label': 'Next Hearing Date'},
                    'point_2': {
                        'type': 'paragraph',
                        'label': 'Point 2',
                        'template': 'That the counsel for the _______________ wants to inspect the Court file and documents.'
                    },
                    'counsel_name': {'type': 'text', 'label': 'Counsel for the'},
                    'prayer_title': {'type': 'static', 'content': 'PRAYER'},
                    'prayer_text': {
                        'type': 'paragraph',
                        'template': 'It is therefore, most respectfully prayed that this Hon\'ble Court may be pleased to allow the Counsel for the _________________ to inspect the Court file.'
                    },
                    'inspection_purpose': {'type': 'textarea', 'label': 'Purpose of Inspection'},
                    'address': {'type': 'text', 'label': 'Address'},
                    'city': {'type': 'text', 'label': 'City', 'default': 'NEW DELHI'},
                    'date': {'type': 'date', 'label': 'DATED'},
                    'advocate_signature': {'type': 'signature', 'label': 'Advocate'},
                    'petitioner_signature': {'type': 'signature', 'label': 'For the Petitioner / Respondent'}
                }
            },
            {
                'name': 'List of Documents',
                'description': 'List of documents to be filed',
                'category': 'ecourts',
                'template_fields': {
                    'case_number': 'text',
                    'party_name': 'text',
                    'document_list': 'textarea',
                    'total_documents': 'text',
                    'date': 'date',
                }
            },
            {
                'name': 'Litigant Form',
                'description': 'Form for litigant details',
                'category': 'ecourts',
                'template_fields': {
                    'litigant_name': 'text',
                    'father_husband_name': 'text',
                    'age': 'text',
                    'address': 'textarea',
                    'mobile': 'text',
                    'email': 'text',
                    'party_type': 'text',
                }
            },
            {
                'name': 'Memo of Appearance',
                'description': 'Memorandum of appearance for advocates',
                'category': 'ecourts',
                'template_fields': {
                    'court_name': 'text',
                    'case_number': 'text',
                    'case_year': 'text',
                    'party_name': 'text',
                    'advocate_name': 'text',
                    'enrollment_number': 'text',
                    'date': 'date',
                    'advocate_signature': 'signature',
                }
            },
            {
                'name': 'Memorandum of Appearance Form',
                'description': 'Detailed memorandum of appearance',
                'category': 'ecourts',
                'template_fields': {
                    'court_name': 'text',
                    'case_type': 'text',
                    'case_number': 'text',
                    'petitioner_name': 'text',
                    'respondent_name': 'text',
                    'advocate_name': 'text',
                    'enrollment_number': 'text',
                    'bar_council': 'text',
                    'address': 'textarea',
                    'phone': 'text',
                    'email': 'text',
                    'date': 'date',
                }
            },
            {
                'name': 'Notice to Produce Documents',
                'description': 'Notice to opposite party to produce documents',
                'category': 'notice',
                'template_fields': {
                    'court_name': 'text',
                    'case_number': 'text',
                    'party_name': 'text',
                    'opposite_party_name': 'text',
                    'documents_required': 'textarea',
                    'purpose': 'textarea',
                    'date': 'date',
                }
            },
            {
                'name': 'Personal Bail Bond Form',
                'description': 'Personal bail bond application',
                'category': 'application',
                'template_fields': {
                    'court_name': 'text',
                    'case_number': 'text',
                    'accused_name': 'text',
                    'father_name': 'text',
                    'address': 'textarea',
                    'fir_number': 'text',
                    'sections': 'text',
                    'bond_amount': 'text',
                    'date': 'date',
                    'signature': 'signature',
                }
            },
            {
                'name': 'Process Fee Form',
                'description': 'Form for process fee payment',
                'category': 'ecourts',
                'template_fields': {
                    'case_number': 'text',
                    'process_type': 'text',
                    'number_of_summons': 'text',
                    'fee_amount': 'text',
                    'payment_mode': 'text',
                    'date': 'date',
                }
            },
            {
                'name': 'Process Fee (5 KB)',
                'description': 'Simplified process fee form',
                'category': 'ecourts',
                'template_fields': {
                    'case_number': 'text',
                    'fee_amount': 'text',
                    'date': 'date',
                }
            },
            {
                'name': 'Surety Bond',
                'description': 'Surety bond for bail',
                'category': 'application',
                'template_fields': {
                    'court_name': 'text',
                    'case_number': 'text',
                    'accused_name': 'text',
                    'surety_name': 'text',
                    'surety_father_name': 'text',
                    'surety_address': 'textarea',
                    'surety_occupation': 'text',
                    'property_details': 'textarea',
                    'bond_amount': 'text',
                    'date': 'date',
                    'surety_signature': 'signature',
                }
            },
            {
                'name': 'Vakalatnama Form',
                'description': 'Power of attorney for legal representation',
                'category': 'ecourts',
                'template_fields': {
                    'court_name': 'text',
                    'case_number': 'text',
                    'case_year': 'text',
                    'client_name': 'text',
                    'client_father_name': 'text',
                    'client_address': 'textarea',
                    'advocate_name': 'text',
                    'enrollment_number': 'text',
                    'advocate_address': 'textarea',
                    'date': 'date',
                    'client_signature': 'signature',
                    'advocate_signature': 'signature',
                }
            },
            {
                'name': 'Vakalatnama (6 KB)',
                'description': 'Simplified Vakalatnama form',
                'category': 'ecourts',
                'template_fields': {
                    'court_name': 'text',
                    'case_number': 'text',
                    'client_name': 'text',
                    'advocate_name': 'text',
                    'date': 'date',
                    'client_signature': 'signature',
                }
            },
        ]

        created_count = 0
        updated_count = 0

        for template_data in templates:
            template, created = DocumentTemplate.objects.update_or_create(
                name=template_data['name'],
                defaults={
                    'description': template_data['description'],
                    'category': template_data['category'],
                    'template_fields': template_data['template_fields'],
                    'is_active': True,
                    'is_public': True,
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'✓ Created: {template.name}'))
            else:
                updated_count += 1
                self.stdout.write(self.style.WARNING(f'↻ Updated: {template.name}'))

        self.stdout.write(self.style.SUCCESS(f'\n✅ Seeding complete!'))
        self.stdout.write(self.style.SUCCESS(f'   Created: {created_count} templates'))
        self.stdout.write(self.style.SUCCESS(f'   Updated: {updated_count} templates'))
        self.stdout.write(self.style.SUCCESS(f'   Total: {len(templates)} templates'))
