"""
Management command to seed PDF-style court form templates
"""
from django.core.management.base import BaseCommand
from documents.models_templates import CourtFormTemplate


class Command(BaseCommand):
    help = 'Seed PDF-style court form templates with pre-written legal content'
    
    def handle(self, *args, **options):
        self.stdout.write('Seeding PDF-style court form templates...')
        
        templates = [
            {
                'name': 'BLANK A4 DRAFTING PAPER',
                'description': 'A blank A4 sheet for custom drafting from scratch',
                'category': 'drafting',
                'sequence': 10,
                'content_structure': {
                    'page_size': 'A4',
                    'margins': {'top': 72, 'right': 72, 'bottom': 72, 'left': 72},
                    'sections': [
                        {
                            'type': 'header',
                            'content': '{document_title}',
                            'style': {'align': 'center', 'bold': True, 'size': 14, 'underline': True}
                        },
                        {
                            'type': 'spacer', 'height': 40
                        },
                        {
                            'type': 'textarea',
                            'field': 'document_content',
                            'placeholder': 'Start typing your document here...',
                            'style': {'align': 'justify', 'line_height': 1.8, 'size': 13}
                        },
                        {
                            'type': 'spacer', 'height': 500
                        }
                    ]
                },
                'default_field_mappings': {}
            },
            {
                'name': 'SYNOPSIS (Orissa High Court)',
                'description': 'Appendix-I Synopsis for Criminal Miscellaneous documents',
                'category': 'drafting',
                'sequence': 2,
                'content_structure': {
                    'page_size': 'A4',
                    'margins': {'top': 72, 'right': 72, 'bottom': 72, 'left': 72},
                    'sections': [
                        {
                            'type': 'header',
                            'content': '[A]',
                            'style': {'align': 'right', 'bold': False, 'size': 12}
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'header',
                            'content': 'APPENDIX-I',
                            'style': {'align': 'left', 'bold': True, 'size': 12, 'underline': True}
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'header',
                            'content': 'S Y N O P S I S',
                            'style': {'align': 'center', 'bold': True, 'size': 14, 'underline': True}
                        },
                        {
                            'type': 'spacer', 'height': 40
                        },
                        {
                            'type': 'paragraph',
                            'content': '       The petitioner has file the above anticipatory bail application as he has been falsely implicated and due to apprehending his arrest in connection with {police_station} P.S. Case No.{fir_number} of {year} corresponding to {gr_number} of {year} pending before the court of learned {lower_court_name}, {place}.',
                            'style': {'align': 'justify', 'line_height': 1.8, 'size': 13}
                        },
                        {
                            'type': 'spacer', 'height': 60
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {
                                    'prefix': 'PLACE:', 
                                    'field': 'place',
                                    'flex': 1
                                },
                                {
                                    'prefix': 'DATE:', 
                                    'field': 'date',
                                    'flex': 1
                                }
                            ],
                            'style': {'bold': False, 'size': 10}
                        },
                        {
                            'type': 'spacer', 'height': 30
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {
                                    'flex': 1
                                },
                                {
                                    'prefix': 'Advocate Name:', 
                                    'field': 'advocate_name',
                                    'flex': 2,
                                    'align': 'center'
                                }
                            ],
                            'style': {'bold': False, 'size': 10}
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {
                                    'flex': 1
                                },
                                {
                                    'prefix': 'En. No.:', 
                                    'field': 'enrollment_number',
                                    'flex': 2,
                                    'align': 'center'
                                }
                            ],
                            'style': {'bold': False, 'size': 10}
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {
                                    'flex': 1
                                },
                                {
                                    'prefix': 'Ph. No.:', 
                                    'field': 'phone_number',
                                    'flex': 2,
                                    'align': 'center'
                                }
                            ],
                            'style': {'bold': False, 'size': 10}
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {
                                    'flex': 1
                                },
                                {
                                    'prefix': 'Designation:', 
                                    'field': 'advocate_designation',
                                    'flex': 2,
                                    'align': 'center'
                                }
                            ],
                            'style': {'bold': False, 'size': 10}
                        }
                    ]
                },
                'default_field_mappings': {
                    'police_station': 'case.police_station',
                    'fir_number': 'case.fir_number',
                    'year': 'case.year',
                    'gr_number': 'case.gr_number',
                    'lower_court_name': 'case.court_name'
                }
            },
            {
                'name': 'LIST OF DATES & EVENTS (Orissa High Court)',
                'description': 'Appendix-II List of Dates and Events',
                'category': 'drafting',
                'sequence': 3,
                'content_structure': {
                    'page_size': 'A4',
                    'margins': {'top': 72, 'right': 72, 'bottom': 72, 'left': 72},
                    'sections': [
                        {
                            'type': 'header',
                            'content': 'APPENDIX-II',
                            'style': {'align': 'right', 'bold': True, 'size': 12}
                        },
                        {
                            'type': 'header',
                            'content': 'LIST OF DATES & EVENTS',
                            'style': {'align': 'center', 'bold': True, 'size': 14, 'underline': True}
                        },
                        {
                            'type': 'spacer', 'height': 30
                        },
                        {
                            'type': 'dynamic_table',
                            'columns': [
                                {'header': 'DATE', 'field': 'date', 'width': '25%'},
                                {'header': 'EVENTS', 'field': 'events', 'width': '75%'}
                            ],
                            'rows': 10
                        },
                        {
                            'type': 'spacer', 'height': 40
                        },
                        {
                            'type': 'signature_block',
                            'content': 'Advocate for the Petitioner',
                            'style': {'align': 'right'}
                        }
                    ]
                },
                'default_field_mappings': {}
            },
            {
                'name': 'ABLAPL PETITION (Orissa High Court)',
                'description': 'Anticipatory Bail Application (ABLAPL) Petition',
                'category': 'drafting',
                'sequence': 4,
                'content_structure': {
                    'page_size': 'A4',
                    'margins': {'top': 72, 'right': 72, 'bottom': 72, 'left': 72},
                    'sections': [
                        {
                            'type': 'header',
                            'content': 'IN THE HIGH COURT OF ORISSA, CUTTACK',
                            'style': {'align': 'center', 'bold': True, 'size': 14}
                        },
                        {
                            'type': 'header',
                            'content': '(Criminal Miscellaneous Jurisdiction)',
                            'style': {'align': 'center', 'size': 12}
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {'prefix': 'ABLAPL NO.', 'field': 'ablapl_no', 'flex': 2},
                                {'prefix': 'OF 202', 'field': 'year_suffix', 'flex': 1}
                            ],
                            'style': {'bold': True}
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'editable_line',
                            'prefix': '',
                            'field': 'petitioner_name',
                            'suffix': '... Petitioner',
                            'style': {'bold': True}
                        },
                        {
                            'type': 'header',
                            'content': '-Versus-',
                            'style': {'align': 'center', 'bold': True}
                        },
                        {
                            'type': 'editable_line',
                            'prefix': 'State of Odisha',
                            'field': 'state_opp_party',
                            'suffix': '... Opp. Party',
                            'style': {'bold': True}
                        },
                        {
                            'type': 'spacer', 'height': 30
                        },
                        {
                            'type': 'header',
                            'content': 'PETITION UNDER SECTION 438 OF Cr.P.C.',
                            'style': {'align': 'center', 'bold': True, 'size': 12, 'underline': True}
                        },
                        {
                            'type': 'paragraph',
                            'content': 'The petitioner above named most respectfully showeth:',
                            'style': {'align': 'left', 'size': 11}
                        },
                        {
                            'type': 'paragraph',
                            'content': '1. That the petitioner is a law-abiding citizen of India.\n2. That the petitioner has been falsely implicated in the above-mentioned case due to local village politics.\n3. That the petitioner is ready and willing to cooperate with the investigation.',
                            'style': {'align': 'justify', 'line_height': 1.6, 'size': 11}
                        },
                        {
                            'type': 'spacer', 'height': 40
                        },
                        {
                            'type': 'signature_block',
                            'content': 'Advocate for the Petitioner',
                            'style': {'align': 'right'}
                        }
                    ]
                },
                'default_field_mappings': {
                    'petitioner_name': 'client.full_name'
                }
            },
            {
                'name': 'ANNEXURE (Generic Cover Page)',
                'description': 'Generic cover page for an annexure (FIR, Orders, Evidence, etc.)',
                'category': 'drafting',
                'sequence': 5,
                'content_structure': {
                    'page_size': 'A4',
                    'margins': {'top': 72, 'right': 72, 'bottom': 72, 'left': 72},
                    'sections': [
                        {
                            'type': 'header',
                            'content': 'ANNEXURE-{annexure_no}',
                            'style': {'align': 'center', 'bold': True, 'size': 16, 'underline': True}
                        },
                        {
                            'type': 'spacer', 'height': 60
                        },
                        {
                            'type': 'paragraph',
                            'content': '       True copy of the {document_description} dated {document_date}.',
                            'style': {'align': 'justify', 'line_height': 1.8, 'size': 14}
                        },
                        {
                            'type': 'spacer', 'height': 150
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {
                                    'prefix': 'CUTTACK\nDATE: {current_date}', 
                                    'field': 'place_date', 
                                    'flex': 1
                                },
                                {
                                    'prefix': 'ADVOCATE\nFOR THE PETITIONER', 
                                    'field': 'advocate_signature', 
                                    'flex': 1, 
                                    'align': 'center'
                                }
                            ],
                            'style': {'bold': True, 'size': 11}
                        }
                    ]
                },
                'default_field_mappings': {
                    'annexure_no': '1',
                    'document_description': 'F.I.R.',
                    'document_date': '01.01.2026'
                }
            },
            {
                'name': 'INDEX (Orissa High Court)',
                'description': 'Document Index for Orissa High Court filing (Criminal Miscellaneous)',
                'category': 'drafting',
                'sequence': 1,
                'content_structure': {
                    'page_size': 'A4',
                    'margins': {'top': 72, 'right': 72, 'bottom': 72, 'left': 72},
                    'sections': [
                        {
                            'type': 'header',
                            'content': 'IN THE HIGH COURT OF ORISSA, CUTTACK',
                            'style': {'align': 'center', 'bold': True, 'size': 14}
                        },
                        {
                            'type': 'header',
                            'content': '(Criminal Miscellaneous Jurisdiction)',
                            'style': {'align': 'center', 'size': 12}
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {'prefix': 'ABLAPL NO.', 'field': 'ablapl_no', 'flex': 2},
                                {'prefix': 'OF 202', 'field': 'year_suffix', 'flex': 1}
                            ],
                            'style': {'bold': True}
                        },
                        {
                            'type': 'header',
                            'content': 'CODE NO.091002.',
                            'style': {'align': 'right', 'bold': True, 'size': 11, 'underline': True}
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {'prefix': '', 'field': 'petitioner_name', 'flex': 3},
                                {'prefix': '...Petitioner', 'field': '', 'flex': 1}
                            ],
                            'style': {'bold': True}
                        },
                        {
                            'type': 'header',
                            'content': '-Versus-',
                            'style': {'align': 'center', 'bold': True}
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {'prefix': '{opposite_party}', 'field': 'opposite_party', 'flex': 3},
                                {'prefix': '.....Opp. Party', 'field': '', 'flex': 1}
                            ],
                            'style': {'bold': True}
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'header',
                            'content': 'I N D E X',
                            'style': {'align': 'center', 'bold': True, 'size': 14, 'underline': True}
                        },
                        {
                            'type': 'dynamic_table',
                            'columns': [
                                {'header': 'SL. NO.', 'field': 'sl_no', 'width': '10%'},
                                {'header': 'DESCRIPTION OF DOCUMENTS', 'field': 'desc', 'width': '70%'},
                                {'header': 'PAGE', 'field': 'page', 'width': '20%'}
                            ],
                            'rows': 8,
                            'row_height': 50
                        },
                        {
                            'type': 'spacer', 'height': 40
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {
                                    'prefix': 'PLACE:',
                                    'field': 'place',
                                    'flex': 1
                                },
                                {
                                    'prefix': 'Advocate Name:',
                                    'field': 'advocate_name',
                                    'flex': 1,
                                    'align': 'center'
                                }
                            ],
                            'style': {'bold': True, 'size': 11}
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {
                                    'prefix': 'DATE:',
                                    'field': 'date',
                                    'flex': 1
                                },
                                {
                                    'prefix': 'En.No.:',
                                    'field': 'enrollment_number',
                                    'flex': 1,
                                    'align': 'center'
                                }
                            ],
                            'style': {'bold': True, 'size': 11}
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {'flex': 1},
                                {
                                    'prefix': 'Ph.No.:',
                                    'field': 'phone_number',
                                    'flex': 1,
                                    'align': 'center'
                                }
                            ],
                            'style': {'bold': True, 'size': 11}
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {'flex': 1},
                                {
                                    'prefix': 'Designation:',
                                    'field': 'advocate_designation',
                                    'flex': 1,
                                    'align': 'center'
                                }
                            ],
                            'style': {'bold': True, 'size': 11}
                        }
                    ]
                },
                'default_field_mappings': {
                    'petitioner_name': 'client.full_name',
                    'opposite_party': 'case.opposite_party'
                }
            },
            {
                'name': 'Form No 45 Bail Bond',
                'description': 'Standard bail bond form as per Form No. 45',
                'category': 'drafting',
                'sequence': 7,
                'content_structure': {
                    'page_size': 'A4',
                    'margins': {'top': 72, 'right': 72, 'bottom': 72, 'left': 72},
                    'sections': [
                        {
                            'type': 'header',
                            'content': 'IN THE COURT OF {court_name}',
                            'style': {'align': 'center', 'bold': True, 'size': 14, 'uppercase': True}
                        },
                        {
                            'type': 'spacer',
                            'height': 20
                        },
                        {
                            'type': 'header',
                            'content': 'FORM NO. 45',
                            'style': {'align': 'center', 'bold': True, 'size': 12}
                        },
                        {
                            'type': 'header',
                            'content': 'BAIL BOND',
                            'style': {'align': 'center', 'bold': True, 'size': 12, 'underline': True}
                        },
                        {
                            'type': 'paragraph',
                            'content': '(See Section 436 to 450 of the Code of Criminal Procedure, 1973)',
                            'style': {'align': 'center', 'size': 10, 'italic': True}
                        },
                        {
                            'type': 'spacer',
                            'height': 20
                        },
                        {
                            'type': 'field_group',
                            'fields': [
                                {'name': 'date', 'label': 'Date', 'type': 'date', 'inline': True},
                                {'name': 'sections', 'label': 'Sections', 'type': 'text', 'inline': True}
                            ]
                        },
                        {
                            'type': 'spacer',
                            'height': 15
                        },
                        {
                            'type': 'paragraph',
                            'content': 'I, {accused_name}, son/daughter/wife of {father_name}, aged {age} years, resident of {address}, do hereby bind myself to attend before the Court of {court_name} on {hearing_date} and continue to attend until otherwise directed by the Court, to answer to the charge on which I have been admitted to bail.',
                            'style': {'align': 'justify', 'size': 11, 'line_height': 1.5}
                        },
                        {
                            'type': 'spacer',
                            'height': 15
                        },
                        {
                            'type': 'paragraph',
                            'content': 'And I bind myself to pay to Government the sum of Rs. {bond_amount}/- (Rupees {bond_amount_words}) if I fail to comply with this condition.',
                            'style': {'align': 'justify', 'size': 11, 'line_height': 1.5}
                        },
                        {
                            'type': 'spacer',
                            'height': 15
                        },
                        {
                            'type': 'paragraph',
                            'content': 'FIR Number: {fir_number}',
                            'style': {'size': 11}
                        },
                        {
                            'type': 'paragraph',
                            'content': 'Case Number: {case_number}',
                            'style': {'size': 11}
                        },
                        {
                            'type': 'spacer',
                            'height': 30
                        },
                        {
                            'type': 'signature_block',
                            'content': 'Signature of the Accused',
                            'style': {'align': 'right'}
                        },
                        {
                            'type': 'spacer',
                            'height': 20
                        },
                        {
                            'type': 'paragraph',
                            'content': 'Accepted this {acceptance_date}',
                            'style': {'size': 11}
                        },
                        {
                            'type': 'spacer',
                            'height': 30
                        },
                        {
                            'type': 'signature_block',
                            'content': 'Magistrate/Judge',
                            'style': {'align': 'right'}
                        }
                    ]
                },
                'default_field_mappings': {
                    'court_name': 'case.court_name',
                    'case_number': 'case.case_number',
                    'accused_name': 'client.full_name',
                    'address': 'client.address'
                }
            },
            {
                'name': 'Vakalatnama',
                'description': 'Standard Power of Attorney (Vakalatnama) for Court Representation',
                'category': 'drafting',
                'sequence': 11,
                'content_structure': {
                    'page_size': 'A4',
                    'margins': {'top': 72, 'right': 72, 'bottom': 72, 'left': 72},
                    'sections': [
                        {
                            'type': 'stamp_box'
                        },
                        {
                            'type': 'editable_line',
                            'prefix': 'IN THE COURT OF',
                            'field': 'court_full_name',
                            'style': {'bold': True}
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {'prefix': 'Suit /Appeal No./CWP', 'field': 'case_tracking_no', 'flex': 2.5},
                                {'prefix': 'JURISDICTION', 'field': 'jurisdiction', 'flex': 1}
                            ]
                        },
                        {
                            'type': 'paragraph',
                            'content': 'of 202{year_suffix}',
                            'style': {'align': 'right'}
                        },
                        {
                            'type': 'paragraph',
                            'content': 'In re:',
                            'style': {'bold': True}
                        },
                        {
                            'type': 'editable_line',
                            'prefix': '',
                            'field': 'plaintiff_names',
                            'suffix': 'Plaintiff /Appellants/ Petitioner/ Complainant',
                            'style': {'align': 'justify'}
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'header',
                            'content': 'V E R S U S',
                            'style': {'align': 'center', 'bold': True}
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'editable_line',
                            'prefix': '',
                            'field': 'defendant_names',
                            'suffix': 'Defendant/Respondent/ Accused',
                            'style': {'align': 'justify'}
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'paragraph',
                            'content': 'KNOW ALL to whom these present shall come that I/We {litigant_names_full} the above named {litigant_role} do hereby appoint (herein after called the advocate/s) to be my/our Advocate in the above noted case authorized him :-',
                            'style': {'align': 'justify', 'line_height': 1.6}
                        },
                        {
                            'type': 'paragraph',
                            'content': 'To act, appear and plead in the above-noted case in this Court or in any other Court in which the same may be tried or heard and also in the appellate Court including High Court subject to payment of fees separately for each Court by me/ us.',
                            'style': {'align': 'justify', 'size': 11}
                        },
                        {
                            'type': 'paragraph',
                            'content': 'To sign, file verify and present pleadings, appeals cross objections or petitions for execution review, revision, withdrawal, compromise or other petitions or affidavits or other documents as may be deemed necessary or proper for the prosecution of the said case in all its stages.',
                            'style': {'align': 'justify', 'size': 11}
                        },
                        {
                            'type': 'paragraph',
                            'content': 'To file and take back documents to admit and/or deny the documents of opposite party.',
                            'style': {'align': 'justify', 'size': 11}
                        },
                        {
                            'type': 'paragraph',
                            'content': 'To withdraw or compromise the said case or submit to arbitration any differences or disputes that may arise touching or in any manner relating to the said case.',
                            'style': {'align': 'justify', 'size': 11}
                        },
                        {
                            'type': 'paragraph',
                            'content': 'To take execution proceedings.',
                            'style': {'align': 'justify', 'size': 11}
                        },
                        {
                            'type': 'paragraph',
                            'content': 'The deposit, draw and receive money, cheques, cash and grant receipts thereof and to do all other acts and things which may be necessary to be done for the progress and in the course of the prosecution of the said case.',
                            'style': {'align': 'justify', 'size': 11}
                        },
                        {
                            'type': 'paragraph',
                            'content': 'To appoint and instruct any other Legal Practitioner, authorizing him to exercise the power and authority hereby conferred upon the Advocate whenever he may think it to do so and to sign the Power of Attorney on our behalf.',
                            'style': {'align': 'justify', 'size': 11}
                        },
                        {
                            'type': 'paragraph',
                            'content': 'And I/We the undersigned do hereby agree to ratify and confirm all acts done by the Advocate or his substitute in the matter as my/our own acts, as if done by me/us to all intents and purposes.',
                            'style': {'align': 'justify', 'size': 11}
                        },
                        {
                            'type': 'paragraph',
                            'content': 'And I/We undertake that I / we or my /our duly authorized agent would appear in the Court on all hearings and will inform the Advocates for appearance when the case is called.',
                            'style': {'align': 'justify', 'size': 11}
                        },
                        {
                            'type': 'paragraph',
                            'content': 'And I /we undersigned do hereby agree not to hold the advocate or his substitute responsible for the result of the said case. The adjournment costs whenever ordered by the Court shall be of the Advocate which he shall receive and retain himself.',
                            'style': {'align': 'justify', 'size': 11}
                        },
                        {
                            'type': 'paragraph',
                            'content': 'And I /we the undersigned do hereby agree that in the event of the whole or part of the fee agreed by me/us to be paid to the Advocate remaining unpaid he shall be entitled to withdraw from the prosecution of the said case until the same is paid up. The fee settled is only for the above case and above Court. I/We hereby agree that once the fee is paid. I /we will not be entitled for the refund of the same in any case whatsoever. If the case lasts for more than three years, the advocate shall be entitled for additional fee equivalent to half of the agreed fee for every addition three years or part thereof.',
                            'style': {'align': 'justify', 'size': 11}
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'paragraph',
                            'content': 'IN WITNESS WHEREOF I/We do hereunto set my /our hand to these presents the contents of which have been understood by me/us on this {day_of_witness} day of {month_of_witness} 202{year_suffix}.',
                            'style': {'align': 'justify'}
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'paragraph',
                            'content': 'Accepted subject to the terms of fees.',
                            'style': {'bold': True}
                        },
                        {
                            'type': 'spacer', 'height': 50
                        },
                        {
                            'type': 'page_break'
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {'prefix': 'Advocate', 'field': 'advocate_signature', 'flex': 1},
                                {'prefix': 'Client', 'field': 'client_signature_1', 'flex': 1, 'align': 'center'},
                                {'prefix': 'Client', 'field': 'client_signature_2', 'flex': 1, 'align': 'right'}
                            ],
                            'style': {'bold': True}
                        }
                    ]
                },
                'default_field_mappings': {
                    'court_full_name': 'case.court_name',
                    'case_tracking_no': 'case.case_number'
                }
            },
            {
                'name': 'Memorandum of Appearance',
                'description': 'Standard Memorandum of Appearance for Advocates',
                'category': 'drafting',
                'sequence': 9,
                'content_structure': {
                    'page_size': 'A4',
                    'margins': {'top': 80, 'right': 60, 'bottom': 60, 'left': 60},
                    'sections': [
                        {
                            'type': 'header',
                            'content': 'Memorandum of Appearance',
                            'style': {'align': 'center', 'bold': True, 'size': 32}
                        },
                        {
                            'type': 'header',
                            'content': 'OF',
                            'style': {'align': 'center', 'bold': True, 'size': 14}
                        },
                        {
                            'type': 'header',
                            'content': 'ADVOCATE',
                            'style': {'align': 'center', 'bold': True, 'size': 18}
                        },
                        {
                            'type': 'spacer', 'height': 50
                        },
                        {
                            'type': 'editable_line',
                            'prefix': 'In the Court of',
                            'field': 'court_name',
                            'style': {'size': 12}
                        },
                        {
                            'type': 'spacer', 'height': 30
                        },
                        {
                            'type': 'editable_line',
                            'prefix': 'In Re :',
                            'field': 'case_title',
                            'style': {'size': 12}
                        },
                        {
                            'type': 'spacer', 'height': 30
                        },
                        {
                            'type': 'header',
                            'content': 'V E R S U S',
                            'style': {'align': 'center', 'bold': True, 'size': 14}
                        },
                        {
                            'type': 'spacer', 'height': 50
                        },
                        {
                            'type': 'editable_line',
                            'prefix': '',
                            'field': 'opposite_party',
                            'style': {'size': 12}
                        },
                        {
                            'type': 'spacer', 'height': 50
                        },
                        {
                            'type': 'paragraph',
                            'content': 'The undersigned is appearing in the above case on behalf of {client_name}',
                            'style': {'size': 12}
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'editable_line',
                            'prefix': '',
                            'field': 'client_desc_extra',
                            'style': {'size': 12}
                        },
                        {
                            'type': 'spacer', 'height': 40
                        },
                        {
                            'type': 'paragraph',
                            'content': 'He has been authorized to appear by {authorizer_name}',
                            'style': {'size': 12}
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'editable_line',
                            'prefix': '',
                            'field': 'authority_extra',
                            'style': {'size': 12}
                        },
                        {
                            'type': 'spacer', 'height': 80
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {'prefix': 'Dated', 'field': 'current_date', 'flex': 1},
                                {'prefix': 'ADVOCATE', 'field': '', 'flex': 1, 'align': 'right'}
                            ]
                        }
                    ]
                },
                'default_field_mappings': {
                    'court_name': 'case.court_name',
                    'client_name': 'client.full_name',
                    'authorizer_name': 'client.full_name'
                }
            },
            {
                'name': 'Address Form',
                'description': 'Standard Address Form for Court Service',
                'category': 'drafting',
                'sequence': 6,
                'content_structure': {
                    'page_size': 'A4',
                    'margins': {'top': 72, 'right': 72, 'bottom': 72, 'left': 72},
                    'sections': [
                        {
                            'type': 'header',
                            'content': 'ADDRESS FORM',
                            'style': {'align': 'center', 'bold': True, 'size': 16}
                        },
                        {
                            'type': 'spacer', 'height': 30
                        },
                        {
                            'type': 'editable_line',
                            'prefix': 'In the Court of :',
                            'field': 'court_name',
                            'style': {'size': 11}
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {'prefix': 'Case', 'field': 'case_number', 'flex': 1.2},
                                {'prefix': 'Versus', 'field': 'opposite_party', 'flex': 1}
                            ]
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {'prefix': 'Suit', 'field': 'suit_type', 'flex': 1.2},
                                {'prefix': 'Date of Hearing', 'field': 'hearing_date', 'flex': 1}
                            ]
                        },
                        {
                            'type': 'spacer', 'height': 30
                        },
                        {
                            'type': 'paragraph',
                            'content': 'The address of Plaintiff/ Defendant/ Applicant is as under :-',
                            'style': {'size': 11}
                        },
                        {
                            'type': 'spacer', 'height': 15
                        },
                        {
                            'type': 'dynamic_table',
                            'columns': [
                                {'header': "Name with Father's Name", 'field': 'name_father', 'width': '25%'},
                                {'header': 'Caste', 'field': 'caste', 'width': '10%'},
                                {'header': 'Resident of', 'field': 'residence', 'width': '20%'},
                                {'header': 'Post Office', 'field': 'post_office', 'width': '15%'},
                                {'header': 'Tehsil', 'field': 'tehsil', 'width': '10%'},
                                {'header': 'Distt.', 'field': 'district', 'width': '10%'},
                                {'header': 'Remarks', 'field': 'remarks', 'width': '10%'}
                            ],
                            'rows': 1
                        },
                        {
                            'type': 'spacer', 'height': 40
                        },
                        {
                            'type': 'paragraph',
                            'content': 'Sir,',
                            'style': {'size': 11}
                        },
                        {
                            'type': 'spacer', 'height': 15
                        },
                        {
                            'type': 'paragraph',
                            'content': '       All the summons, notices orders etc. In connection with the above suit be sent to me at the address given above.',
                            'style': {'size': 11, 'align': 'justify', 'line_height': 1.5}
                        },
                        {
                            'type': 'spacer', 'height': 15
                        },
                        {
                            'type': 'paragraph',
                            'content': '       In Case of any change in address, the same shall be communicated to with full particulars and details.',
                            'style': {'size': 11, 'align': 'justify', 'line_height': 1.5}
                        }
                    ]
                },
                'default_field_mappings': {
                    'court_name': 'case.court_name',
                    'case_number': 'case.case_number',
                    'opposite_party': 'case.opposite_party'
                }
            },
            {
                'name': 'Index Form',
                'description': 'Index list for documents filed in court',
                'category': 'drafting',
                'sequence': 2,
                'content_structure': {
                    'page_size': 'A4',
                    'margins': {'top': 72, 'right': 72, 'bottom': 72, 'left': 72},
                    'sections': [
                        {
                            'type': 'header',
                            'content': 'IN THE COURT OF {court_name}',
                            'style': {'align': 'center', 'bold': True, 'size': 14}
                        },
                        {
                            'type': 'header',
                            'content': 'INDEX',
                            'style': {'align': 'center', 'bold': True, 'size': 12, 'underline': True}
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'paragraph',
                            'content': 'Case: {case_title}\nCase No: {case_number}',
                            'style': {'bold': True}
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'dynamic_table',
                            'columns': [
                                {'header': 'Sr. No.', 'field': 'sr_no', 'width': '10%'},
                                {'header': 'Description of Documents', 'field': 'description', 'width': '70%'},
                                {'header': 'Pages', 'field': 'pages', 'width': '20%'}
                            ],
                            'rows': 5
                        },
                        {
                            'type': 'spacer', 'height': 40
                        },
                        {
                            'type': 'signature_block',
                            'content': 'Through Advocate',
                            'style': {'align': 'right'}
                        }
                    ]
                },
                'default_field_mappings': {
                    'court_name': 'case.court_name',
                    'case_number': 'case.case_number'
                }
            },
            {
                'name': 'List of Documents',
                'description': 'Standard List of Documents Produced by Plaintiff/Defendant',
                'category': 'drafting',
                'sequence': 40,
                'content_structure': {
                    'page_size': 'A4',
                    'margins': {'top': 72, 'right': 72, 'bottom': 72, 'left': 72},
                    'sections': [
                        {
                            'type': 'header',
                            'content': 'List of documents Produced by',
                            'style': {'align': 'center', 'size': 14}
                        },
                        {
                            'type': 'paragraph',
                            'content': 'PLAINTIFF\nDEFENDANT',
                            'style': {'align': 'right', 'bold': True, 'underline': True}
                        },
                        {
                            'type': 'paragraph',
                            'content': '(Order XIII Rule 1 of the order of Civil Procedure, Form prescribed by the High Court in the Court of',
                            'style': {'size': 10}
                        },
                        {
                            'type': 'spacer', 'height': 15
                        },
                        {
                            'type': 'paragraph',
                            'content': 'Suit No. ___________ of 202{year_suffix}',
                            'style': {'align': 'right'}
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {'prefix': '', 'field': 'plaintiff_name', 'flex': 4},
                                {'prefix': 'Plaintiff', 'field': '', 'flex': 1}
                            ]
                        },
                        {
                            'type': 'spacer', 'height': 15
                        },
                        {
                            'type': 'header',
                            'content': 'Versus',
                            'style': {'align': 'center'}
                        },
                        {
                            'type': 'spacer', 'height': 15
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {'prefix': '', 'field': 'defendant_name', 'flex': 4},
                                {'prefix': 'Defendant', 'field': '', 'flex': 1}
                            ]
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'paragraph',
                            'content': 'List of documents produced with the plaint (or at first hearing on behalf of the Plaintiff or defendant).',
                            'style': {'size': 11}
                        },
                        {
                            'type': 'spacer', 'height': 15
                        },
                        {
                            'type': 'dynamic_table',
                            'columns': [
                                {'header': '1\nS.No.', 'field': 'sno', 'width': '5%'},
                                {'header': '2\nDescription and date If any', 'field': 'desc', 'width': '25%'},
                                {'header': '3\nThat the document is intended to prove', 'field': 'proof', 'width': '20%'},
                                {'header': '4\nWhat become of the document\nBrought the record | If rejected date of return', 'field': 'status', 'width': '30%'},
                                {'header': '5\nRemarks', 'field': 'remarks', 'width': '20%'}
                            ],
                            'rows': 10,
                            'row_height': 60
                        },
                        {
                            'type': 'spacer', 'height': 30
                        },
                        {
                            'type': 'paragraph',
                            'content': 'through Advocate',
                            'style': {'align': 'right'}
                        },
                        {
                            'type': 'paragraph',
                            'content': 'Signature of part or plead procedure',
                            'style': {'align': 'right'}
                        }
                    ]
                },
                'default_field_mappings': {
                    'court_name': 'case.court_name',
                    'case_number': 'case.case_number'
                }
            },
            {
                'name': 'Process Fee',
                'description': 'Standard Process Fee (P.F.) Form with Table and Acknowledgement',
                'category': 'drafting',
                'sequence': 70,
                'content_structure': {
                    'page_size': 'A4',
                    'margins': {'top': 72, 'right': 72, 'bottom': 72, 'left': 72},
                    'sections': [
                        {
                            'type': 'header',
                            'content': 'Process Fee Form',
                            'style': {'align': 'center', 'bold': True, 'size': 14}
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'editable_line',
                            'prefix': 'IN THE COURT OF',
                            'field': 'court_name_top',
                            'style': {'size': 11}
                        },
                        {
                            'type': 'editable_line',
                            'prefix': 'Suit/Case No.',
                            'field': 'case_no_top',
                            'style': {'size': 11}
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {'prefix': '', 'field': 'plaintiff_name', 'flex': 2},
                                {'prefix': 'Versus', 'field': 'defendant_name', 'flex': 2}
                            ]
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {'prefix': 'P.D.O.H.', 'field': 'pdoh', 'flex': 1},
                                {'prefix': 'N.D.O.H.', 'field': 'ndoh', 'flex': 1}
                            ]
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'dynamic_table',
                            'columns': [
                                {'header': 'Date of Filing', 'field': 'filing_date', 'width': '15%'},
                                {'header': 'Filed By Whom', 'field': 'filed_by', 'width': '20%'},
                                {'header': 'Purpose of Filing', 'field': 'purpose', 'width': '20%'},
                                {'header': 'Number', 'field': 'number_val', 'width': '10%'},
                                {'header': 'Amount of P. Fees', 'field': 'fees_amt', 'width': '15%'},
                                {'header': 'Court Fee Affixed', 'field': 'fee_affixed', 'width': '20%'}
                            ],
                            'rows': 1,
                            'row_height': 350
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'paragraph',
                            'content': '---------------------------------------------------------------------------------------------------------------------------------',
                            'style': {'align': 'center'}
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'paragraph',
                            'content': 'In the Court of Shri',
                            'style': {'size': 11}
                        },
                        {
                            'type': 'editable_line',
                            'prefix': '',
                            'field': 'judge_name_footer',
                            'style': {'size': 11}
                        },
                        {
                            'type': 'editable_line',
                            'prefix': 'Suit/Case No.',
                            'field': 'case_no_footer',
                            'style': {'size': 11}
                        },
                        {
                             'type': 'grid_row',
                             'columns': [
                                 {'prefix': 'In Re', 'field': 'case_title_footer', 'flex': 2},
                                 {'prefix': 'V/S', 'field': 'vs_footer', 'flex': 2}
                             ]
                        },
                        {
                             'type': 'grid_row',
                             'columns': [
                                 {'prefix': 'P.D.O.H.', 'field': 'pdoh_footer', 'flex': 1},
                                 {'prefix': 'N.D.O.H.', 'field': 'ndoh_footer', 'flex': 1}
                             ]
                        },
                        {
                            'type': 'editable_line',
                            'prefix': 'Date of Filing',
                            'field': 'filing_date_footer',
                            'style': {'size': 11}
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'paragraph',
                            'content': 'Ahlmad / Asstt. Ahlmad',
                            'style': {'align': 'right', 'bold': True}
                        }
                    ]
                },
                'default_field_mappings': {
                    'court_name_top': 'case.court_name'
                }
            },
            {
                'name': 'Surety Bond',
                'description': 'Standard Surety Bond for Court Guarantee',
                'category': 'drafting',
                'sequence': 55,
                'content_structure': {
                    'page_size': 'A4',
                    'margins': {'top': 72, 'right': 72, 'bottom': 72, 'left': 72},
                    'sections': [
                        {
                            'type': 'header',
                            'content': 'SURETY BOND.',
                            'style': {'align': 'center', 'bold': True}
                        },
                        {
                            'type': 'spacer', 'height': 40
                        },
                        {
                            'type': 'editable_line',
                            'prefix': 'I,',
                            'field': 'surety_name_ro',
                            'style': {'size': 11}
                        },
                        {
                            'type': 'paragraph',
                            'content': '_____________________________________________ hereby declare myself or (we jointly and severally declare ourselves and such of us ) surety / or (sureties) for the above said name _________________________________________ R/o _________________________________ that he shall attend the _______________________________________Court for the purpose of on every day on which any Investigation, officer or Court for the purpose of such investigation, or to answer the charge against him ( as the case may be and in case of his making default therein) I hereby bind my self (we hereby bind ourselves)',
                            'style': {'size': 11, 'line_height': 2.5, 'align': 'justify'}
                        },
                        {
                            'type': 'spacer', 'height': 40
                        },
                        {
                            'type': 'editable_line',
                            'prefix': 'To forfeit to the Government the sum of Rs.',
                            'field': 'bond_amount',
                            'style': {'size': 11}
                        },
                        {
                            'type': 'editable_line',
                            'prefix': '(in words)',
                            'field': 'bond_amount_words',
                            'style': {'size': 11}
                        },
                        {
                            'type': 'spacer', 'height': 30
                        },
                        {
                             'type': 'grid_row',
                             'columns': [
                                 {'prefix': 'Dated this', 'field': 'dated_day', 'flex': 1},
                                 {'prefix': 'day of', 'field': 'dated_month', 'flex': 1},
                                 {'prefix': '202', 'field': 'dated_year', 'flex': 0.5}
                             ]
                        },
                        {
                            'type': 'spacer', 'height': 60
                        },
                        {
                            'type': 'paragraph',
                            'content': '(Signature of the surety.)',
                            'style': {'align': 'right'}
                        }
                    ]
                },
                'default_field_mappings': {
                    'case_number': 'case.case_number',
                    'accused_name': 'client.full_name'
                }
            },
            {
                'name': 'Inspection Form',
                'description': 'Standard Application for Inspection of Court File',
                'category': 'drafting',
                'sequence': 8,
                'content_structure': {
                    'page_size': 'A4',
                    'margins': {'top': 72, 'right': 72, 'bottom': 72, 'left': 72},
                    'sections': [
                        {
                            'type': 'editable_line',
                            'prefix': 'IN THE COURT OF',
                            'field': 'court_name',
                            'style': {'bold': True}
                        },
                        {
                            'type': 'spacer', 'height': 15
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {'prefix': 'NO', 'field': 'case_number', 'flex': 2.5},
                                {'prefix': 'OF 202', 'field': 'year_suffix', 'flex': 0.5}
                            ]
                        },
                        {
                            'type': 'spacer', 'height': 15
                        },
                        {
                            'type': 'editable_line',
                            'prefix': 'IN THE MATTER OF',
                            'field': 'case_matter',
                            'style': {'bold': True}
                        },
                        {
                            'type': 'spacer', 'height': 30
                        },
                        {
                            'type': 'header',
                            'content': 'VERSUS',
                            'style': {'align': 'center', 'bold': True}
                        },
                        {
                            'type': 'spacer', 'height': 30
                        },
                        {
                            'type': 'paragraph',
                            'content': 'FIR / Case No. {case_no_val}',
                            'style': {'align': 'right', 'bold': True}
                        },
                        {
                            'type': 'paragraph',
                            'content': 'NDOH :- {hearing_date}',
                            'style': {'align': 'right', 'bold': True}
                        },
                        {
                            'type': 'spacer', 'height': 30
                        },
                        {
                            'type': 'header',
                            'content': 'HUMBLE APPLICATION FOR INSPECTION OF THE COURT FILE',
                            'style': {'align': 'center', 'bold': True, 'size': 14}
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'paragraph',
                            'content': 'MOST RESPECTFULLY SHOWETH :-',
                            'style': {'size': 11}
                        },
                        {
                            'type': 'spacer', 'height': 15
                        },
                        {
                            'type': 'paragraph',
                            'content': '1. That the above said matter is pending adjudication and determination before the Hon’ble Court and the next date of hearing is {hearing_date_val}.',
                            'style': {'size': 11, 'align': 'justify'}
                        },
                        {
                            'type': 'spacer', 'height': 10
                        },
                        {
                            'type': 'paragraph',
                            'content': '2. That the counsel for the {party_represented} wants to inspect the Court file and documents.',
                            'style': {'size': 11, 'align': 'justify'}
                        },
                        {
                            'type': 'spacer', 'height': 30
                        },
                        {
                            'type': 'header',
                            'content': 'PRAYER',
                            'style': {'align': 'center', 'bold': True}
                        },
                        {
                            'type': 'spacer', 'height': 15
                        },
                        {
                            'type': 'paragraph',
                            'content': 'It is therefore, most respectfully prayed that this Hon’ble Court may be pleased to allow the Counsel for the {party_represented_prayer} to inspect the Court file.',
                            'style': {'size': 11, 'align': 'justify'}
                        },
                        {
                            'type': 'spacer', 'height': 50
                        },
                        {
                            'type': 'paragraph',
                            'content': 'Yours faithfully',
                            'style': {'align': 'right'}
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {'prefix': 'Address', 'field': 'advocate_address', 'flex': 1.5},
                                {'prefix': 'Advocate', 'field': 'advocate_name', 'flex': 1, 'align': 'right'}
                            ],
                            'style': {'bold': True}
                        },
                        {
                            'type': 'spacer', 'height': 10
                        },
                        {
                            'type': 'paragraph',
                            'content': '{city_name}',
                            'style': {'bold': True}
                        },
                        {
                            'type': 'paragraph',
                            'content': 'DATED :',
                            'style': {'bold': True}
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'paragraph',
                            'content': 'For the Petitioner / Respondent',
                            'style': {'align': 'right', 'bold': True}
                        }
                    ]
                },
                'default_field_mappings': {
                    'court_name': 'case.court_name',
                    'case_number': 'case.case_number',
                    'hearing_date': 'case.next_hearing_date',
                    'city_name': 'NEW DELHI'
                }
            },
            {
                'name': 'Litigant Form',
                'description': 'Mobile-Email Details Collection Form for Litigants',
                'category': 'drafting',
                'content_structure': {
                    'page_size': 'A4',
                    'margins': {'top': 72, 'right': 72, 'bottom': 72, 'left': 72},
                    'sections': [
                        {
                            'type': 'header',
                            'content': 'Mobile-Email Details Collection Form for Litigants',
                            'style': {'align': 'center', 'bold': True, 'size': 12, 'underline': True}
                        },
                        {
                            'type': 'header',
                            'content': '(Please use CAPITAL Letters Only)',
                            'style': {'align': 'center', 'size': 10}
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'form_grid',
                            'rows': [
                                {
                                    'cells': [
                                        {'label': 'Court Complex', 'field': 'court_complex', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'label': 'District', 'field': 'district_main', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'label': 'Litigants Name', 'flex': 1, 'background': True},
                                        {'field': 'surname', 'flex': 1},
                                        {'field': 'first_name', 'flex': 1},
                                        {'field': 'middle_name', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'label': '', 'flex': 1, 'background': True},
                                        {'text': 'SURNAME', 'flex': 1},
                                        {'text': 'FIRST NAME', 'flex': 1},
                                        {'text': 'MIDDLE NAME', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'label': 'Date of Birth', 'flex': 1, 'background': True},
                                        {'field': 'dob_dd', 'flex': 1},
                                        {'field': 'dob_mm', 'flex': 1},
                                        {'field': 'dob_yyyy', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'label': '', 'flex': 1, 'background': True},
                                        {'text': 'DD', 'flex': 1},
                                        {'text': 'MM', 'flex': 1},
                                        {'text': 'YYYY', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'label': 'Address', 'field': 'address_line_1', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'label': '', 'field': 'address_line_2', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'label': '', 'field': 'address_line_3', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'label': 'District', 'field': 'district_litigant', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'label': 'E-mail Address', 'field': 'email_litigant', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'label': 'Mobile No.', 'field': 'mobile_no', 'flex': 1.5},
                                        {'label': 'Phone No.', 'field': 'phone_no', 'flex': 1.5}
                                    ]
                                }
                            ]
                        },
                        {
                            'type': 'spacer', 'height': 50
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {'prefix': 'Date :', 'field': 'date_val', 'flex': 1},
                                {'prefix': '/', 'field': 'month_val', 'flex': 0.5},
                                {'prefix': '/20', 'field': 'year_val', 'flex': 0.5},
                                {'prefix': 'Signature of Litigants', 'field': '', 'flex': 2, 'align': 'right'}
                            ]
                        },
                        {
                            'type': 'spacer', 'height': 40
                        },
                        {
                            'type': 'paragraph',
                            'content': 'Signature of Advocate',
                            'style': {'align': 'right'}
                        },
                        {
                            'type': 'spacer', 'height': 30
                        },
                        {
                            'type': 'header',
                            'content': 'Verified by',
                            'style': {'align': 'center'}
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'header',
                            'content': 'Asst.Supdt/Superintendent',
                            'style': {'align': 'center'}
                        }
                    ]
                },
                'default_field_mappings': {
                    'court_complex': 'case.court_name',
                    'district_main': 'district_val'
                }
            },
            {
                'name': 'Filing Form',
                'description': 'Standard Civil Case Filing Form for Court Registrations',
                'category': 'drafting',
                'content_structure': {
                    'page_size': 'A4',
                    'margins': {'top': 50, 'right': 50, 'bottom': 50, 'left': 50},
                    'sections': [
                        {
                            'type': 'header',
                            'content': 'DISTRICT & SESSIONS COURT {district_name}',
                            'style': {'align': 'center', 'bold': True, 'size': 12, 'background': True}
                        },
                        {
                            'type': 'header',
                            'content': 'CIVIL CASE - FILING FORM',
                            'style': {'align': 'center', 'bold': True, 'size': 10, 'background': True}
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {'prefix': 'Case Type', 'field': 'case_type', 'flex': 1}
                            ],
                            'style': {'border': True}
                        },
                        {
                            'type': 'header',
                            'content': 'PLAINTIFF DETAILS',
                            'style': {'align': 'center', 'bold': True, 'size': 10, 'background': True}
                        },
                        {
                            'type': 'character_boxes',
                            'label': 'Name',
                            'sublabel': 'In Blocks',
                            'field': 'plaintiff_name',
                            'cols': 25,
                            'rows': 2
                        },
                        {
                            'type': 'character_boxes',
                            'label': 'Father/Mother/Husband',
                            'sublabel': 'Strike out which is not applicable',
                            'field': 'plaintiff_parent',
                            'cols': 25,
                            'rows': 2
                        },
                        {
                            'type': 'character_boxes',
                            'label': 'Address',
                            'sublabel': 'In Blocks',
                            'field': 'plaintiff_address',
                            'cols': 25,
                            'rows': 3
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {'prefix': 'Sex (? Appropriate)', 'field': 'plaintiff_sex_marker', 'flex': 0.5},
                                {'prefix': 'Male', 'field': 'is_male', 'flex': 0.3},
                                {'prefix': 'Female', 'field': 'is_female', 'flex': 0.3},
                                {'prefix': 'Age (in Completed Years)', 'field': 'plaintiff_age', 'flex': 0.5},
                                {'prefix': 'Caste', 'field': 'plaintiff_caste', 'flex': 1}
                            ]
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {'prefix': 'Nationality', 'field': 'plaintiff_nationality', 'flex': 1},
                                {'prefix': 'If Indian (?)', 'field': 'is_indian', 'flex': 1},
                                {'prefix': 'If Other Mention', 'field': 'other_nationality', 'flex': 1},
                                {'prefix': 'Occupation', 'field': 'plaintiff_occupation', 'flex': 1}
                            ]
                        },
                        {
                           'type': 'grid_row',
                            'columns': [
                                {'prefix': 'E-mail address', 'field': 'plaintiff_email', 'flex': 1.5},
                                {'prefix': 'Phone', 'field': 'plaintiff_phone', 'flex': 1},
                                {'prefix': 'Mobile', 'field': 'plaintiff_mobile', 'flex': 1},
                                {'prefix': 'Fax', 'field': 'plaintiff_fax', 'flex': 1}
                            ]
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {'prefix': 'Subject', 'field': 'case_subject', 'flex': 1}
                            ]
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {'prefix': 'Advocate Code', 'field': 'advocate_code', 'flex': 1},
                                {'prefix': 'Advocate', 'field': 'advocate_name', 'flex': 3}
                            ]
                        },
                        {
                            'type': 'header',
                            'content': 'RESPONDENT DETAILS',
                            'style': {'align': 'center', 'bold': True, 'size': 10, 'background': True}
                        },
                        {
                            'type': 'character_boxes',
                            'label': 'Name',
                            'sublabel': 'In Blocks',
                            'field': 'respondent_name',
                            'cols': 25,
                            'rows': 2
                        },
                        {
                            'type': 'character_boxes',
                            'label': 'Father/Mother/Husband',
                            'sublabel': 'Strike out which is not applicable',
                            'field': 'respondent_parent',
                            'cols': 25,
                            'rows': 2
                        },
                        {
                            'type': 'character_boxes',
                            'label': 'Address',
                            'sublabel': 'In Blocks',
                            'field': 'respondent_address',
                            'cols': 25,
                            'rows': 3
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {'prefix': 'Sex (? Appropriate)', 'field': 'resp_sex_marker', 'flex': 0.5},
                                {'prefix': 'Male', 'field': 'resp_is_male', 'flex': 0.3},
                                {'prefix': 'Female', 'field': 'resp_is_female', 'flex': 0.3},
                                {'prefix': 'Age (in Completed Years)', 'field': 'resp_age', 'flex': 0.5},
                                {'prefix': 'Caste', 'field': 'resp_caste', 'flex': 1}
                            ]
                        },
                        {
                            'type': 'header',
                            'content': 'LOWER COURT DETAILS',
                            'style': {'align': 'center', 'bold': True, 'size': 10, 'background': True}
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {'prefix': 'Court Name', 'field': 'lower_court_name', 'flex': 1}
                            ]
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {'prefix': 'Case No.', 'field': 'lower_case_no', 'flex': 1},
                                {'prefix': 'Decision Date', 'field': 'decision_date', 'flex': 1}
                            ]
                        },
                        {
                            'type': 'header',
                            'content': 'MAIN MATTER DETAILS',
                            'style': {'align': 'center', 'bold': True, 'size': 10, 'background': True}
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {'prefix': 'Case Type', 'field': 'case_type_main', 'flex': 1},
                                {'prefix': 'Case No.', 'field': 'case_no_main', 'flex': 1},
                                {'prefix': 'Year', 'field': 'case_year_main', 'flex': 1}
                            ]
                        },
                        {
                            'type': 'header',
                            'content': '------------- FOR OFFICE USE ONLY -------------',
                            'style': {'align': 'center', 'bold': True, 'size': 10}
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {'prefix': 'Case Type', 'field': 'office_case_type', 'flex': 1},
                                {'prefix': 'Filing No', 'field': 'filing_no', 'flex': 1},
                                {'prefix': 'Filing Date', 'field': 'filing_date_office', 'flex': 1}
                            ]
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {'prefix': 'Objection Red. Date', 'field': 'objection_date', 'flex': 1},
                                {'prefix': 'Objection Compliance Date', 'field': 'compliance_date', 'flex': 1}
                            ]
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {'prefix': 'Registration No', 'field': 'reg_no', 'flex': 1},
                                {'prefix': 'Registration Date', 'field': 'reg_date', 'flex': 1},
                                {'prefix': 'Listing Date', 'field': 'listing_date', 'flex': 1}
                            ]
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {'prefix': 'Court Allotted', 'field': 'court_allotted', 'flex': 1.5},
                                {'prefix': 'Allocation Date', 'field': 'allocation_date', 'flex': 1}
                            ]
                        },
                        {
                            'type': 'character_boxes',
                            'label': 'Case Code',
                            'field': 'case_code',
                            'cols': 25,
                            'rows': 1
                        }
                    ]
                },
                'default_field_mappings': {
                    'district_name': 'NEW DELHI',
                    'advocate_name': 'Counsel Name'
                }
            },
            {
                'name': 'Advocate Form',
                'description': 'Advocate Registration and Information Form',
                'category': 'drafting',
                'content_structure': {
                    'page_size': 'A4',
                    'margins': {'top': 50, 'right': 50, 'bottom': 50, 'left': 50},
                    'sections': [
                        {
                            'type': 'form_grid',
                            'rows': [
                                {
                                    'cells': [
                                        {'label': 'Advocate Name', 'flex': 1},
                                        {'field': 'adv_surname', 'flex': 1},
                                        {'field': 'adv_first_name', 'flex': 1},
                                        {'field': 'adv_middle_name', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'label': '(Capital letters only)', 'flex': 1},
                                        {'text': 'SURNAME', 'flex': 1},
                                        {'text': 'FIRST NAME', 'flex': 1},
                                        {'text': 'MIDDLE NAME', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'label': 'Sex', 'flex': 1},
                                        {'text': 'Male / Female', 'field': 'adv_sex', 'flex': 3}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'label': 'Date of Birth', 'flex': 1},
                                        {'field': 'adv_dob_dd', 'flex': 1},
                                        {'field': 'adv_dob_mm', 'flex': 1},
                                        {'field': 'adv_dob_yyyy', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'label': '', 'flex': 1},
                                        {'text': 'DD', 'flex': 1},
                                        {'text': 'MM', 'flex': 1},
                                        {'text': 'YYYY', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'label': 'Bar Registration Number', 'flex': 1},
                                        {'field': 'bar_reg_no', 'placeholder': 'MAH/_______/________', 'flex': 3}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'label': 'Residential Address', 'field': 'res_address', 'flex': 3}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'label': 'Office Address', 'field': 'off_address', 'flex': 3}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'label': 'District', 'field': 'adv_district', 'flex': 3}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'label': 'email', 'field': 'adv_email', 'flex': 3}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'label': 'Mobile No.', 'field': 'adv_mobile', 'flex': 1},
                                        {'label': 'Phone Office', 'field': 'adv_phone_off', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'label': 'Phone Residence', 'field': 'adv_phone_res', 'flex': 1},
                                        {'label': 'Fax No. (If, available)', 'field': 'adv_fax', 'flex': 1}
                                    ]
                                }
                            ]
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'header',
                            'content': 'मराठी',
                            'style': {'align': 'center', 'background': True}
                        },
                        {
                            'type': 'form_grid',
                            'rows': [
                                {
                                    'cells': [
                                        {'label': 'विधीज्ञाचे नाव', 'flex': 1},
                                        {'field': 'adv_surname_mr', 'flex': 1},
                                        {'field': 'adv_first_name_mr', 'flex': 1},
                                        {'field': 'adv_middle_name_mr', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'label': '', 'flex': 1},
                                        {'text': 'आडनाव', 'flex': 1},
                                        {'text': 'स्वत:चे नाव', 'flex': 1},
                                        {'text': 'वडिलांचे नाव', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'label': 'निवासस्थानाचा पत्ता', 'field': 'res_address_mr', 'flex': 3}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'label': 'कार्यालयाचा पत्ता', 'field': 'off_address_mr', 'flex': 3}
                                    ]
                                }
                            ]
                        },
                        {
                            'type': 'spacer', 'height': 40
                        },
                        {
                            'type': 'paragraph',
                            'content': 'Signature of Advocate',
                            'style': {'align': 'right'}
                        }
                    ]
                },
                'default_field_mappings': {
                    'adv_district': 'Aurangabad'
                }
            },
            {
                'name': 'Check-list',
                'description': 'Court Case Filing Check-list',
                'category': 'drafting',
                'content_structure': {
                    'page_size': 'A4',
                    'margins': {'top': 50, 'right': 50, 'bottom': 50, 'left': 50},
                    'sections': [
                        {
                            'type': 'header',
                            'content': 'CHECK-LIST',
                            'style': {'align': 'center', 'bold': True, 'size': 18}
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'form_grid',
                            'rows': [
                                {
                                    'cells': [
                                        {'text': '1.', 'flex': 0.2},
                                        {'label': 'VALUATION OF SUIT JURISDICTION', 'field': 'valuation_suit', 'flex': 2}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'text': '2.', 'flex': 0.2},
                                        {'label': 'NAME & ADDRESS OF ADVOCATE', 'field': 'adv_name_addr', 'flex': 2}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'text': '3.', 'flex': 0.2},
                                        {'label': 'NATURE OF SUIT', 'field': 'suit_nature', 'flex': 2}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'text': '4.', 'flex': 0.2},
                                        {'label': 'AGE OF PARTIES', 'flex': 2},
                                        {'label': 'Plaintiff', 'field': 'age_plaintiff', 'flex': 2}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'text': '', 'flex': 0.2},
                                        {'label': '', 'flex': 2},
                                        {'label': 'Defendant', 'field': 'age_defendant', 'flex': 2}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'text': '5.', 'flex': 0.2},
                                        {'label': 'CAVEAT', 'field': 'caveat_val', 'flex': 2}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'text': '6.', 'flex': 0.2},
                                        {'label': 'WHETHER ANYT EARMARKED COURT', 'field': 'earmarked_court', 'flex': 2}
                                    ]
                                }
                            ]
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {'prefix': '7. COURT FEE AFFIXED', 'field': '', 'flex': 1}
                            ],
                            'style': {'border': True}
                        },
                        {
                            'type': 'dynamic_table',
                            'columns': [
                                {'header': 'Sl No.', 'field': 'sl_no', 'width': '10%'},
                                {'header': 'Relief Sought', 'field': 'relief', 'width': '20%'},
                                {'header': 'Valuation of Relief for jurisdiction', 'field': 'val_jurisdiction', 'width': '25%'},
                                {'header': 'Valuation of relief for court fee', 'field': 'val_court_fee', 'width': '25%'},
                                {'header': 'Court fee paid individually', 'field': 'fee_paid', 'width': '20%'}
                            ],
                            'rows': 7
                        },
                        {
                            'type': 'form_grid',
                            'rows': [
                                {
                                    'cells': [
                                        {'text': '8.', 'flex': 0.2},
                                        {'label': 'CONNECTED CASES IF ANY & NAME OF THE COURT WHERE PENDING', 'field': 'connected_cases', 'flex': 2}
                                    ]
                                }
                            ]
                        }
                    ]
                },
                'default_field_mappings': {}
            },
            {
                'name': 'Bail Bond Form',
                'description': 'Standard Bail Bond for Attendance before Police or Court',
                'category': 'drafting',
                'content_structure': {
                    'page_size': 'A4',
                    'margins': {'top': 72, 'right': 72, 'bottom': 72, 'left': 72},
                    'sections': [
                        {
                            'type': 'header',
                            'content': 'BAIL BOND',
                            'style': {'align': 'center', 'bold': True, 'size': 14}
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'editable_line',
                            'prefix': 'IN THE COURT OF',
                            'field': 'court_name',
                            'style': {'size': 11}
                        },
                        {
                            'type': 'editable_line',
                            'prefix': 'Case No.',
                            'field': 'case_no',
                            'style': {'size': 11}
                        },
                        {
                            'type': 'spacer', 'height': 15
                        },
                        {
                            'type': 'paragraph',
                            'content': 'BOND OR BAIL BOND FOR ATTENDANCE BEFORE OFFICER IN CHARGE OF THE POLICE STATION OR COURT.',
                            'style': {'align': 'center', 'bold': True}
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'editable_line',
                            'prefix': '       I, (Name)',
                            'field': 'accused_name',
                            'style': {'size': 11}
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {'prefix': 'Age', 'field': 'accused_age', 'flex': 1},
                                {'prefix': 'R/o.', 'field': 'accused_address', 'flex': 4}
                            ]
                        },
                        {
                            'type': 'paragraph',
                            'content': 'having been arrested or detained without warrant by the officer in-charge or Police Station {ps_name} ( or having been brought before the court of {court_desc} changed with the offences on {offence_date} and required to give surety for, my attendance before such officer or court and required on condition, that I shall attend such officer or court on everyday on which any investigation or trial is held with regard to such charges and in case of making default therein, I bind myself to forfeit to the Government the sum of Rs. {bond_amt}.',
                            'style': {'align': 'justify', 'line_height': 1.8}
                        },
                        {
                            'type': 'editable_line',
                            'prefix': 'In words Rs.',
                            'field': 'bond_amt_words',
                            'style': {'size': 11}
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {'prefix': 'Dated this', 'field': 'date_day', 'flex': 1},
                                {'prefix': 'day of', 'field': 'date_month', 'flex': 1},
                                {'prefix': '202{year_suffix}', 'field': '', 'flex': 0.5}
                            ]
                        },
                        {
                            'type': 'spacer', 'height': 50
                        },
                        {
                            'type': 'signature_block',
                            'content': '(Signature of the accused.)',
                            'style': {'align': 'right'}
                        }
                    ]
                },
                'default_field_mappings': {
                    'court_name': 'case.court_name',
                    'case_no': 'case.case_number',
                    'accused_name': 'client.full_name',
                    'accused_address': 'client.address'
                }
            },
            {
                'name': 'CA Form 7',
                'description': 'FORM C.A.I. (RULE) Application for Certified Copy',
                'category': 'drafting',
                'content_structure': {
                    'page_size': 'A4',
                    'margins': {'top': 40, 'right': 40, 'bottom': 40, 'left': 40},
                    'sections': [
                        {
                            'type': 'header',
                            'content': 'FORM. C.A.I.',
                            'style': {'align': 'center', 'bold': True, 'size': 18}
                        },
                        {
                            'type': 'header',
                            'content': '(RULE)',
                            'style': {'align': 'center', 'bold': True, 'size': 14}
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {'prefix': 'Application for copy [ ]', 'field': '', 'flex': 1},
                                {'prefix': 'Urgent [ ]', 'field': '', 'flex': 0.5},
                                {'prefix': 'Ordinary [ ]', 'field': '', 'flex': 0.5}
                            ],
                            'style': {'align': 'right'}
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {
                                    'columns': [
                                        {'type': 'editable_line', 'prefix': 'To the District Officer', 'field': 'dist_officer'},
                                        {'type': 'editable_line', 'prefix': 'Name of applicant', 'field': 'applicant_name'},
                                        {'type': 'editable_line', 'prefix': 'W/o, D/o, S/o', 'field': 'parent_name', 'suffix': 'Resident of'},
                                        {'type': 'editable_line', 'prefix': '', 'field': 'residence_addr'},
                                        {'type': 'editable_line', 'prefix': 'Post Office and District', 'field': 'po_dist'},
                                        {'type': 'paragraph', 'content': 'Description and number of the case from the record of which the copy is Required', 'style': {'size': 10}},
                                        {'type': 'editable_line', 'prefix': '', 'field': 'case_desc_no'},
                                        {'type': 'grid_row', 'columns': [
                                            {'prefix': 'Mauza', 'field': 'mauza', 'flex': 1},
                                            {'prefix': 'P.S.', 'field': 'ps', 'flex': 1}
                                        ]},
                                        {'type': 'grid_row', 'columns': [
                                            {'prefix': 'Goshwara No.', 'field': 'goshwara', 'flex': 1},
                                            {'prefix': 'District', 'field': 'district_name', 'flex': 1}
                                        ]},
                                        {'type': 'editable_line', 'prefix': 'Name of Parties', 'field': 'parties_names'},
                                        {'type': 'grid_row', 'columns': [
                                            {'prefix': 'Nature of case', 'field': 'case_nature', 'flex': 1.5},
                                            {'prefix': 'Date of Decision', 'field': 'decision_date', 'flex': 1}
                                        ]},
                                        {'type': 'editable_line', 'prefix': 'Order Next date fixed', 'field': 'next_date'},
                                        {'type': 'editable_line', 'prefix': 'Name of Court', 'field': 'court_name_val'}
                                    ],
                                    'flex': 1
                                },
                                {
                                    'columns': [
                                        {'type': 'header', 'content': 'SPACE FOR COURT FEES STAMP', 'style': {'align': 'center', 'bold': True, 'size': 14}},
                                        {'type': 'spacer', 'height': 100},
                                        {'type': 'editable_line', 'prefix': 'Court fee Stamp filed', 'field': 'stamp_filed'},
                                        {'type': 'grid_row', 'columns': [
                                            {'prefix': 'Number', 'field': 'stamp_num', 'flex': 1},
                                            {'prefix': 'Value', 'field': 'stamp_val', 'flex': 1}
                                        ]},
                                        {'type': 'paragraph', 'content': 'I copy to be sent by post or Will applicant attend in Person', 'style': {'size': 10}},
                                        {'type': 'editable_line', 'prefix': '', 'field': 'attendance_mode'},
                                        {'type': 'spacer', 'height': 20},
                                        {'type': 'editable_line', 'prefix': 'Signature', 'field': 'sig_applicant'},
                                        {'type': 'editable_line', 'prefix': 'Date', 'field': 'sig_date'},
                                        {'type': 'editable_line', 'prefix': 'Order on application', 'field': 'order_on_app'},
                                        {'type': 'editable_line', 'prefix': 'Sig. Copying Agent', 'field': 'sig_agent'},
                                        {'type': 'editable_line', 'prefix': 'Date', 'field': 'agent_date'},
                                        {'type': 'editable_line', 'prefix': 'Sig. Recipient', 'field': 'sig_recipient'},
                                        {'type': 'editable_line', 'prefix': 'Date', 'field': 'recipient_date'}
                                    ],
                                    'flex': 1
                                }
                            ]
                        }
                    ]
                },
                'default_field_mappings': {
                    'applicant_name': 'client.full_name',
                    'court_name_val': 'case.court_name'
                }
            },
            {
                'name': 'NI Act Check List',
                'description': 'Check List for Sec 138 NI Act Matters',
                'category': 'drafting',
                'content_structure': {
                    'page_size': 'A4',
                    'margins': {'top': 50, 'right': 50, 'bottom': 50, 'left': 50},
                    'sections': [
                        {
                            'type': 'header',
                            'content': 'CHECK LIST',
                            'style': {'align': 'center', 'bold': True, 'size': 18}
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'form_grid',
                            'rows': [
                                {
                                    'cells': [
                                        {'text': '1.', 'flex': 0.2},
                                        {'label': 'Details of the case whether 138 N.I. Act, complaint case etc.', 'field': 'case_details_ni', 'flex': 2}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'text': '2.', 'flex': 0.2},
                                        {'label': 'Total Cheque(s) Amount Only in 138 Cases.', 'field': 'cheque_amount', 'placeholder': 'Rs.', 'flex': 2}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'text': '3.', 'flex': 0.2},
                                        {'label': 'Area of bounce cheque (s)', 'field': 'bounce_area', 'flex': 2}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'text': '4.', 'flex': 0.2},
                                        {'label': 'Name\nAddress of the complaint,\n\nAge :\n(Whether Sr. Citizen)\nGender\nContact No.', 'field': 'complaint_details', 'flex': 2},
                                        {'text': 'Male/Female', 'field': 'complaint_gender', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'text': '5.', 'flex': 0.2},
                                        {'label': 'Name\nAddress of the complaint,\n\nAge :\n(Whether Sr. Citizen)\nGender\nContact No.', 'field': 'accused_details_ni', 'flex': 2},
                                        {'text': 'Male/Female', 'field': 'accused_gender_ni', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'text': '5-a.', 'flex': 0.2},
                                        {'label': 'Name\nAddress of the complaint,\n\nAge :\n(Whether Sr. Citizen)\nGender\nContact No.', 'field': 'accused_details_5a', 'flex': 2},
                                        {'text': 'Male/Female', 'field': 'accused_gender_5a', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'text': '5-b.', 'flex': 0.2},
                                        {'label': 'Name\nAddress of the complaint,\n\nAge :\n(Whether Sr. Citizen)\nGender\nContact No.', 'field': 'accused_details_5b', 'flex': 2},
                                        {'text': 'Male/Female', 'field': 'accused_gender_5b', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'text': '6.', 'flex': 0.2},
                                        {'label': 'Name of Police Station', 'field': 'ps_name_ni', 'flex': 2}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'text': '7.', 'flex': 0.2},
                                        {'label': 'Any other information with respect to present case.', 'field': 'other_info_ni', 'flex': 2}
                                    ]
                                }
                            ]
                        }
                    ]
                },
                'default_field_mappings': {
                    'complaint_details': 'client.full_name'
                }
            },
            {
                'name': 'E-Court Fee Form',
                'description': 'SHCIL e-Court fee Receipt Application Form and Receipt',
                'category': 'drafting',
                'content_structure': {
                    'page_size': 'A4',
                    'margins': {'top': 30, 'right': 30, 'bottom': 30, 'left': 30},
                    'sections': [
                        {
                            'type': 'header',
                            'content': 'Stock Holding Corporation of India Limited',
                            'style': {'align': 'center', 'bold': True, 'size': 18}
                        },
                        {
                            'type': 'paragraph',
                            'content': 'Registered office : 301, Centre Point, Dr. Babasaheb Ambedkar Road, Parel, Mumbai – 400012\nVisit us at : www.shcilestamp.com',
                            'style': {'align': 'center', 'size': 9}
                        },
                        {
                            'type': 'header',
                            'content': 'e-Court fee Receipt Application Form',
                            'style': {'align': 'center', 'bold': True, 'size': 20}
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {'prefix': 'SHCIL e-Court fee', 'field': '', 'flex': 1},
                                {'prefix': '(To be filled in CAPITAL letter by the client)', 'field': '', 'flex': 1, 'align': 'right'}
                            ],
                            'style': {'background': True}
                        },
                        {
                            'type': 'form_grid',
                            'rows': [
                                {
                                    'cells': [
                                        {'label': 'Name of the Litigant (s)', 'field': 'litigant_name', 'flex': 2.5},
                                        {'label': 'Phone No', 'field': 'phone_no', 'flex': 1},
                                        {'label': 'Mobile', 'field': 'mobile_no', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'label': 'eCourt fee Amount', 'field': 'fee_amount', 'placeholder': '₹', 'flex': 1.5},
                                        {'label': 'Type of Payment', 'text': '[ ] Cash [ ] Cheque [ ] DD [ ] Pay-Order [ ] NEFT\n[ ] RTGS [ ] Account to Account Transfer', 'flex': 2}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'label': 'Details of Cash/ Cheque/ DD/ PO/ RTGS/NEFT/Funds Transfer Account No.', 'field': 'payment_details', 'flex': 3},
                                        {'label': 'Date:', 'field': 'payment_date', 'placeholder': '/ / 20', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'label': 'Bank Name', 'field': 'bank_name', 'flex': 1.5},
                                        {'label': 'Branch Name', 'field': 'branch_name', 'flex': 1.5}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'label': 'Signature of the applicant', 'field': 'applicant_sig', 'flex': 3}
                                    ]
                                }
                            ]
                        },
                        {
                            'type': 'spacer', 'height': 30
                        },
                        {
                            'type': 'paragraph',
                            'content': '-------------------------------------------✂-------------------------------------------✂-------------------------------------------',
                            'style': {'align': 'center'}
                        },
                        {
                            'type': 'spacer', 'height': 15
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {'prefix': 'SHCIL e-Court fee', 'field': '', 'flex': 1},
                                {'prefix': 'Receipt', 'field': '', 'flex': 1, 'align': 'center'},
                                {'prefix': '(To be filled in CAPITAL letter by the client)', 'field': '', 'flex': 1, 'align': 'right'}
                            ],
                            'style': {'background': True}
                        },
                        {
                            'type': 'form_grid',
                            'rows': [
                                {
                                    'cells': [
                                        {'label': 'Name of the Litigant (s)', 'field': 'litigant_name_receipt', 'flex': 2.5},
                                        {'label': 'Phone No', 'field': 'phone_no_receipt', 'flex': 1},
                                        {'label': 'Mobile', 'field': 'mobile_no_receipt', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'label': 'eCourt fee Amount', 'field': 'fee_amount_receipt', 'placeholder': '₹', 'flex': 1.5},
                                        {'label': 'Type of Payment', 'text': '[ ] Cash [ ] Cheque [ ] DD [ ] Pay-Order [ ] NEFT\n[ ] RTGS [ ] Account to Account Transfer', 'flex': 2}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'label': 'Details of Cash/ Cheque/ DD/ PO/ RTGS/NEFT/Funds Transfer Account No.', 'field': 'payment_details_receipt', 'flex': 3},
                                        {'label': 'Date:', 'field': 'payment_date_receipt', 'placeholder': '/ / 20', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'label': 'Bank Name', 'field': 'bank_name_receipt', 'flex': 1.5},
                                        {'label': 'Branch Name', 'field': 'branch_name_receipt', 'flex': 1.5}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'label': 'Signature & Seal of SHCIL', 'field': 'shcil_sig', 'flex': 3}
                                    ]
                                }
                            ]
                        },
                        {
                            'type': 'spacer', 'height': 15
                        },
                        {
                            'type': 'paragraph',
                            'content': 'This original receipt has to be produced and surrenderd to collect the eCourt fee receipt',
                            'style': {'align': 'center', 'bold': True}
                        }
                    ]
                },
                'default_field_mappings': {
                    'litigant_name': 'client.full_name',
                    'litigant_name_receipt': 'client.full_name',
                    'mobile_no': 'client.phone_number',
                    'mobile_no_receipt': 'client.phone_number'
                }
            },
            {
                'name': 'Personal Bail Bond',
                'description': 'Bail Bond U/S 437-A Cr.P.C. with Affidavit (2 Pages)',
                'category': 'drafting',
                'content_structure': {
                    'page_size': 'A4',
                    'margins': {'top': 50, 'right': 50, 'bottom': 50, 'left': 50},
                    'sections': [
                        {
                            'type': 'header',
                            'content': 'BAIL BOND U/S 437-A CR.P.C.',
                            'style': {'align': 'center', 'bold': True, 'size': 14}
                        },
                        {
                            'type': 'header',
                            'content': 'BOND & BAIL BOND FOR ATTENDANCE BEFORE THE APPELLANT COURT',
                            'style': {'align': 'center', 'bold': True, 'size': 12}
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'editable_line',
                            'prefix': 'In the court of Sh.',
                            'field': 'judge_name',
                            'style': {'size': 11}
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {'prefix': 'P.S. ...:', 'field': 'ps_name', 'flex': 1},
                                {'prefix': 'U/S', 'field': 'sections_law', 'flex': 1},
                                {'prefix': 'FIR No.', 'field': 'fir_number', 'flex': 1}
                            ]
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'header',
                            'content': 'PERSONAL BOND',
                            'style': {'align': 'center', 'bold': True, 'underline': True}
                        },
                        {
                            'type': 'paragraph',
                            'content': 'I, {accused_name} S/o. Sh. {accused_parent} R/o {accused_address} Having been acquitted by this Hon’ble Court on {acquittal_date} in above said case FIR No. {fir_number} P.S. {ps_name} U/s {sections_law} and required to give surety for my attendance before the Hon’ble Court on condition that I shall attend the Hon’ble Appellate Court on every date of hearing in which any appeal filed against the judgment & Order of acquittal, passed by this Hon’ble Court and in case making default therein I myself undertake to forfeit to the Govt. of India the sum of Rs. {bond_amount}.',
                            'style': {'align': 'justify', 'line_height': 1.8}
                        },
                        {
                            'type': 'spacer', 'height': 15
                        },
                        {
                            'type': 'paragraph',
                            'content': 'Delhi\nDate:\n\nSignature',
                            'style': {'bold': True}
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'header',
                            'content': 'SURETY BOND',
                            'style': {'align': 'center', 'bold': True, 'underline': True}
                        },
                        {
                            'type': 'paragraph',
                            'content': 'I, {surety_name} S/o. Sh. {surety_parent} R/o {surety_address} hereby declare myself for the above said Sh. {accused_name} S/o {accused_parent} shall attend the appellate court every date in which any appeal filed against the Judgment & Order of acquittal, passed by this Hon’ble Court and in case making default therein I myself undertake to forfeit to the Govt. of India the sum of Rs. {surety_amount}.',
                            'style': {'align': 'justify', 'line_height': 1.8}
                        },
                        {
                            'type': 'editable_line',
                            'prefix': 'Dated this',
                            'field': 'date_day',
                            'suffix': 'day of',
                            'style': {'size': 11}
                        },
                        {
                            'type': 'editable_line',
                            'prefix': '',
                            'field': 'date_month_year',
                            'suffix': '201',
                            'style': {'size': 11}
                        },
                        {
                            'type': 'spacer', 'height': 30
                        },
                        {
                            'type': 'signature_block',
                            'content': 'Presented by:',
                            'style': {'align': 'center'}
                        },
                        {
                            'type': 'signature_block',
                            'content': 'Signature',
                            'style': {'align': 'right'}
                        },
                        {
                            'type': 'spacer', 'height': 50
                        },
                        {
                            'type': 'header',
                            'content': 'AFFIDAVIT',
                            'style': {'align': 'center', 'bold': True, 'size': 24, 'italic': True}
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'paragraph',
                            'content': 'I, {deponent_name} son / daughter / wife of {deponent_parent} Aged about {deponent_age} R/o {deponent_address} do hereby solemnly affirm and declare as under...',
                            'style': {'align': 'justify', 'line_height': 1.5}
                        },
                        {
                            'type': 'paragraph',
                            'content': '1. That deponent is the resident of above said address and having his/her Ration Card no. is {ration_card} and Election Card No. {election_card}.',
                            'style': {'align': 'justify'}
                        },
                        {
                            'type': 'paragraph',
                            'content': '2. That accused is {accused_relation} of the deponent and deponent has full control over him/her and capable to produce him/her before this hon’ble court.',
                            'style': {'align': 'justify'}
                        },
                        {
                            'type': 'paragraph',
                            'content': '3. That deponent is working as {work_desc} at {work_place} T/C. No. {tc_number} earns Rs. {income_amt} per month.',
                            'style': {'align': 'justify'}
                        },
                        {
                            'type': 'paragraph',
                            'content': '4. That deponent is the owner of household articles valued about of Rs. {articles_value}.',
                            'style': {'align': 'justify'}
                        },
                        {
                            'type': 'paragraph',
                            'content': '5. That deponent is the owner of the immovable property bearing No. {property_no} Measuring {property_size} sq. yards situated at {property_loc} valued not less than Rs. {property_value}.',
                            'style': {'align': 'justify'}
                        },
                        {
                            'type': 'paragraph',
                            'content': '6. That deponent undertakes to produce the accused before the honourable court on every date of hearing.',
                            'style': {'align': 'justify'}
                        },
                        {
                            'type': 'paragraph',
                            'content': '7. That I have an F.D.R. No. {fdr_no} Issued by {fdr_bank} For Rs. {fdr_amount}.',
                            'style': {'align': 'justify'}
                        },
                        {
                            'type': 'paragraph',
                            'content': '8. That I own a vehicle No. {vehicle_no} make {vehicle_make} R/C no {vehicle_rc} at present valued not less than Rs. {vehicle_value}.',
                            'style': {'align': 'justify'}
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'header',
                            'content': 'DEPONENT',
                            'style': {'align': 'right', 'bold': True}
                        },
                        {
                            'type': 'header',
                            'content': 'VERIFICATION',
                            'style': {'align': 'left', 'bold': True}
                        },
                        {
                            'type': 'paragraph',
                            'content': 'Verified at Delhi on this {verify_day} day of 200{verify_year} that the contents of this Affidavit are true and correct to the best of my knowledge & nothing material has been concealed therefrom, no part of it is untrue.',
                            'style': {'align': 'justify'}
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'header',
                            'content': 'DEPONENT',
                            'style': {'align': 'right', 'bold': True}
                        }
                    ]
                },
                'default_field_mappings': {
                    'accused_name': 'client.full_name',
                    'accused_address': 'client.address',
                    'judge_name': 'case.judge_name',
                    'ps_name': 'case.police_station'
                }
            },
            {
                'name': 'Case Information Format',
                'description': 'Main Case Information and Extra Party Information Form (2 Pages)',
                'category': 'drafting',
                'content_structure': {
                    'page_size': 'A4',
                    'margins': {'top': 40, 'right': 40, 'bottom': 40, 'left': 40},
                    'sections': [
                        {
                            'type': 'header',
                            'content': 'CHECK LIST\nCASE INFORMATION FORMAT',
                            'style': {'align': 'center', 'bold': True, 'size': 16}
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {'prefix': 'Civil _____', 'field': 'is_civil', 'flex': 1},
                                {'prefix': 'Criminal _____', 'field': 'is_criminal', 'flex': 1}
                            ],
                            'style': {'align': 'right'}
                        },
                        {
                            'type': 'editable_line',
                            'prefix': 'DISTRICT',
                            'field': 'district_name_ext',
                            'style': {'bold': True}
                        },
                        {
                            'type': 'header',
                            'content': 'S.NO. PLAINTIFF/PETITIONER/COMPLAINANT/APPELLANT/DECREE HOLDER ETC\nPLEASE FILL UP ALL THE RELEVANT FIELDS & (*) FIELDS ARE MANDATORY',
                            'style': {'size': 10, 'background': True}
                        },
                        {
                            'type': 'form_grid',
                            'rows': [
                                {'cells': [{'text': '1.', 'flex': 0.1}, {'label': 'Name of the Plaintiff/complainant/etc', 'field': 'p_name', 'flex': 2}]},
                                {'cells': [{'text': '2.', 'flex': 0.1}, {'label': 'S/o W/o D/o', 'field': 'p_parent', 'flex': 2}]},
                                {'cells': [{'text': '3.', 'flex': 0.1}, {'label': 'Address', 'field': 'p_address', 'flex': 2}]},
                                {
                                    'cells': [
                                        {'text': '4.', 'flex': 0.1}, {'label': 'Aadhar Card No.', 'field': 'p_aadhar', 'flex': 1},
                                        {'label': 'Pin Code', 'field': 'p_pincode', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'text': '5.', 'flex': 0.1}, {'label': 'Gender', 'text': 'Male---Female---Other---', 'field': 'p_gender', 'flex': 1},
                                        {'label': 'Nationality', 'field': 'p_nationality', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'text': '6.', 'flex': 0.1}, {'label': 'Date of Birth', 'field': 'p_dob', 'flex': 1},
                                        {'label': 'Age', 'field': 'p_age', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'text': '7.', 'flex': 0.1}, {'label': 'Mobile No.', 'field': 'p_mobile', 'flex': 1},
                                        {'label': 'E mail Id', 'field': 'p_email', 'flex': 1}
                                    ]
                                },
                                {'cells': [{'text': '9.', 'flex': 0.1}, {'label': 'Act/Section', 'field': 'p_act_section', 'flex': 2}]},
                                {
                                    'cells': [
                                        {'text': '10.', 'flex': 0.1}, {'label': 'Valuation of Suit', 'field': 'suit_valuation', 'flex': 1},
                                        {'label': 'Court Fee Ascertained', 'field': 'fee_ascertained', 'flex': 1}
                                    ]
                                },
                                {'cells': [{'text': '', 'flex': 0.1}, {'label': 'Court Fee paid/Deposited', 'field': 'fee_paid_deposited', 'flex': 2}]},
                                {'cells': [{'text': '11.', 'flex': 0.1}, {'label': 'Police Station', 'field': 'ps_name_info', 'flex': 2}]},
                                {'cells': [{'text': '12.', 'flex': 0.1}, {'label': 'F.I.R. NO. and Year', 'field': 'fir_no_year', 'flex': 2}]}
                            ]
                        },
                        {
                            'type': 'page_break'
                        },
                        {
                            'type': 'header',
                            'content': 'S.NO. DEFENDANT/ACCUSED/RESPONDENT JUDGEMENT DEBATER ETC\nPLEASE FILL UP ALL THE RELEVANT FIELDS & (*) FIELDS ARE MANDATORY',
                            'style': {'size': 10, 'background': True}
                        },
                        {
                            'type': 'form_grid',
                            'rows': [
                                {'cells': [{'text': '1.', 'flex': 0.1}, {'label': 'Name of the DEFENDANT/ACCUSED/etc', 'field': 'd_name', 'flex': 2}]},
                                {'cells': [{'text': '2.', 'flex': 0.1}, {'label': 'S/o W/o D/o', 'field': 'd_parent', 'flex': 2}]},
                                {'cells': [{'text': '3.', 'flex': 0.1}, {'label': 'Address', 'field': 'd_address', 'flex': 2}]},
                                {
                                    'cells': [
                                        {'text': '4.', 'flex': 0.1}, {'label': 'Aadhar Card No.', 'field': 'd_aadhar', 'flex': 1},
                                        {'label': 'Pin Code', 'field': 'd_pincode', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'text': '5.', 'flex': 0.1}, {'label': 'Gender', 'text': 'Male---Female---Other---', 'field': 'd_gender', 'flex': 1},
                                        {'label': 'Nationality', 'field': 'd_nationality', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'text': '6.', 'flex': 0.1}, {'label': 'Date of Birth', 'field': 'd_dob', 'flex': 1},
                                        {'label': 'Age', 'field': 'd_age', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'text': '7.', 'flex': 0.1}, {'label': 'Mobile No.', 'field': 'd_mobile', 'flex': 1},
                                        {'label': 'E mail Id', 'field': 'd_email', 'flex': 1}
                                    ]
                                }
                            ]
                        },
                        {
                            'type': 'header',
                            'content': 'S.NO. ADVOCATE FOR PLAINTIFF/ COMPLAINANT /PETITIONER /DECREE HOLDER ETC',
                            'style': {'size': 10, 'background': True}
                        },
                        {
                            'type': 'form_grid',
                            'rows': [
                                {
                                    'cells': [
                                        {'text': '1.', 'flex': 0.1}, {'label': 'NAME OF THE ADVOCATER', 'field': 'adv_name_info', 'flex': 1},
                                        {'label': 'ENROLMENT NO.', 'field': 'adv_enroll', 'flex': 1}
                                    ]
                                },
                                {'cells': [{'text': '2.', 'flex': 0.1}, {'label': 'OFFICE/ CHAMBER NO.', 'field': 'adv_office', 'flex': 2}]},
                                {
                                    'cells': [
                                        {'text': '3.', 'flex': 0.1}, {'label': 'MOBILE NO.', 'field': 'adv_mobile_info', 'flex': 1},
                                        {'label': 'E-mail:', 'field': 'adv_email_info', 'flex': 1}
                                    ]
                                }
                            ]
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'editable_line',
                            'prefix': 'SUBMITTED BY:-',
                            'field': 'submitted_by_name'
                        },
                        {
                            'type': 'paragraph',
                            'content': 'PLAINTIFF / PETITIONER / DEFENDANT / ACCUSED / OTHER / ADVOCATE',
                            'style': {'align': 'center', 'bold': True, 'size': 10}
                        },
                        {
                            'type': 'spacer', 'height': 40
                        },
                        {
                            'type': 'page_break'
                        },
                        {
                            'type': 'header',
                            'content': 'EXTRA PARTY INFORMATION',
                            'style': {'align': 'center', 'bold': True, 'size': 16}
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'form_grid',
                            'rows': [
                                {'cells': [{'text': '1.', 'flex': 0.1}, {'label': 'Name Of The Extra Party', 'field': 'ep1_name', 'flex': 2}]},
                                {'cells': [{'text': '2.', 'flex': 0.1}, {'label': 'S/o W/o D/o', 'field': 'ep1_parent', 'flex': 2}]},
                                {'cells': [{'text': '3.', 'flex': 0.1}, {'label': 'Address', 'field': 'ep1_address', 'flex': 2}]},
                                {
                                    'cells': [
                                        {'text': '4.', 'flex': 0.1}, {'label': 'Aadhar Card No.', 'field': 'ep1_aadhar', 'flex': 1},
                                        {'label': 'Pin Code', 'field': 'ep1_pincode', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'text': '5.', 'flex': 0.1}, {'label': 'Gender', 'text': 'Male [ ] Female [ ] Other [ ]', 'field': 'ep1_gender', 'flex': 1},
                                        {'label': 'Nationality', 'text': 'INDIAN [ ] Other: ', 'field': 'ep1_nationality', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'text': '6.', 'flex': 0.1}, {'label': 'Date of Birth', 'placeholder': '/ /', 'field': 'ep1_dob', 'flex': 1},
                                        {'label': 'Age', 'field': 'ep1_age', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'text': '7.', 'flex': 0.1}, {'label': 'Mobile No.', 'field': 'ep1_mobile', 'flex': 1},
                                        {'label': 'e-mail:', 'field': 'ep1_email', 'flex': 1}
                                    ]
                                }
                            ]
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'form_grid',
                            'rows': [
                                {'cells': [{'text': '1.', 'flex': 0.1}, {'label': 'Name Of The Extra Party', 'field': 'ep2_name', 'flex': 2}]},
                                {'cells': [{'text': '2.', 'flex': 0.1}, {'label': 'S/o W/o D/o', 'field': 'ep2_parent', 'flex': 2}]},
                                {'cells': [{'text': '3.', 'flex': 0.1}, {'label': 'Address', 'field': 'ep2_address', 'flex': 2}]},
                                {
                                    'cells': [
                                        {'text': '4.', 'flex': 0.1}, {'label': 'Aadhar Card No.', 'field': 'ep2_aadhar', 'flex': 1},
                                        {'label': 'Pin Code', 'field': 'ep2_pincode', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'text': '5.', 'flex': 0.1}, {'label': 'Gender', 'text': 'Male [ ] Female [ ] Other [ ]', 'field': 'ep2_gender', 'flex': 1},
                                        {'label': 'Nationality', 'text': 'INDIAN [ ] Other: ', 'field': 'ep2_nationality', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'text': '6.', 'flex': 0.1}, {'label': 'Date of Birth', 'placeholder': '/ /', 'field': 'ep2_dob', 'flex': 1},
                                        {'label': 'Age', 'field': 'ep2_age', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'text': '7.', 'flex': 0.1}, {'label': 'Mobile No.', 'field': 'ep2_mobile', 'flex': 1},
                                        {'label': 'e-mail:', 'field': 'ep2_email', 'flex': 1}
                                    ]
                                }
                            ]
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'editable_line',
                            'prefix': 'SUBMITTED BY:-',
                            'field': 'submitted_by_name_extra'
                        },
                        {
                            'type': 'paragraph',
                            'content': 'PLAINTIFF / PETITIONER / DEFENDANT / ACCUSED / OTHER / ADVOCATE',
                            'style': {'align': 'center', 'bold': True, 'size': 10}
                        }
                    ]
                },
                'default_field_mappings': {
                    'p_name': 'client.full_name',
                    'p_address': 'client.address',
                    'adv_name_info': 'Counsel Name',
                    'district_name_ext': 'NEW DELHI'
                }
            },
            {
                'name': 'Advocate Details Form',
                'description': 'Mobile-Email Details Collection Form for Advocates',
                'category': 'drafting',
                'content_structure': {
                    'page_size': 'A4',
                    'margins': {'top': 50, 'right': 50, 'bottom': 50, 'left': 50},
                    'sections': [
                        {
                            'type': 'header',
                            'content': 'Mobile-Email Details Collection Form for Advocates',
                            'style': {'align': 'center', 'bold': True}
                        },
                        {
                            'type': 'paragraph',
                            'content': '(Please use Capital Letters only)',
                            'style': {'align': 'center', 'size': 10}
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'form_grid',
                            'rows': [
                                {
                                    'cells': [
                                        {'label': 'Court Complex:', 'field': 'court_complex_adv', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'label': 'District:', 'field': 'district_adv', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'text': 'Advocate Name', 'flex': 0.8},
                                        {'label': 'SURNAME', 'field': 'adv_surname', 'flex': 1},
                                        {'label': 'FIRST NAME', 'field': 'adv_firstname', 'flex': 1},
                                        {'label': 'MIDDLE NAME', 'field': 'adv_middlename', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'text': 'Sex', 'flex': 0.8},
                                        {'label': 'Male / Female', 'field': 'adv_sex', 'flex': 3}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'text': 'Date of Birth', 'flex': 0.8},
                                        {'label': 'DD', 'field': 'adv_dob_dd', 'flex': 1},
                                        {'label': 'MM', 'field': 'adv_dob_mm', 'flex': 1},
                                        {'label': 'YYYY', 'field': 'adv_dob_yyyy', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'label': 'Bar Council Registration Number', 'field': 'bar_reg_no', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'label': 'Residential Address', 'field': 'res_address_adv', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'label': 'Office Address', 'field': 'off_address_adv', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'label': 'District', 'field': 'district_adv_2', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'label': 'Email', 'field': 'adv_email_col', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'label': 'Mobile No.', 'field': 'adv_mobile_col', 'flex': 1},
                                        {'label': 'Phone Office', 'field': 'adv_phone_off', 'flex': 1}
                                    ]
                                },
                                {
                                    'cells': [
                                        {'label': 'Phone Residence', 'field': 'adv_phone_res', 'flex': 1},
                                        {'label': 'Fax No. (If, available)', 'field': 'adv_fax', 'flex': 1}
                                    ]
                                }
                            ]
                        },
                        {
                            'type': 'spacer', 'height': 80
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {'prefix': 'Date:', 'field': 'current_date_adv', 'flex': 1},
                                {'prefix': 'Signature of Advocate', 'field': '', 'flex': 1, 'align': 'right', 'bold': True}
                            ]
                        }
                    ]
                },
                'default_field_mappings': {
                    'adv_firstname': 'Counsel Name',
                    'adv_email_col': 'User Email',
                    'adv_mobile_col': 'User Phone'
                }
            },
            {
                'name': 'Commercial Court Mediation Forms',
                'description': 'Schedule I Forms 1-6 for Pre-Institution Mediation (5 Pages)',
                'category': 'drafting',
                'content_structure': {
                    'page_size': 'A4',
                    'margins': {'top': 50, 'right': 50, 'bottom': 50, 'left': 50},
                    'sections': [
                        {
                            'type': 'header',
                            'content': 'SCHEDULE I\nFORM 1: MEDIATION APPLICATION FORM',
                            'style': {'align': 'center', 'bold': True}
                        },
                        {
                            'type': 'paragraph',
                            'content': '[See rule 3(1)]\nName of the Authority and address',
                            'style': {'align': 'center'}
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'header',
                            'content': 'DETAILS OF PARTIES:',
                            'style': {'align': 'left', 'bold': True}
                        },
                        {
                            'type': 'paragraph',
                            'content': '1. Name of applicant : {applicant_name}\n2. Address and contact details of applicant:\n   Address:- {applicant_address}\n   Telephone No. {app_tel} Mobile {app_mob} E-mail ID: {app_email}',
                            'style': {'line_height': 1.6}
                        },
                        {
                            'type': 'paragraph',
                            'content': '3. Name of opposite party: {op_name}\n4. Address and contact details of opposite party:\n   Address:- {op_address}\n   Telephone No. {op_tel} Mobile {op_mob} E-mail ID: {op_email}',
                            'style': {'line_height': 1.6}
                        },
                        {
                            'type': 'header',
                            'content': 'DETAILS OF DISPUTE:',
                            'style': {'align': 'left', 'bold': True}
                        },
                        {
                            'type': 'paragraph',
                            'content': '1. Nature of dispute as per section 2(1)(c) of the Commercial Courts Act 2015 (4 of 2016):\n   {dispute_nature}\n2. Quantum of Claim: {quantum_claim}\n3. Territorial jurisdiction of the competent Court: {jurisdiction}\n4. Brief synopsis of commercial dispute (not to exceed 5000 words):\n   {synopsis}\n5. Additional points of relevance:\n   {additional_points}',
                            'style': {'line_height': 1.5}
                        },
                        {
                            'type': 'header',
                            'content': 'DETAILS OF FEE PAID:',
                            'style': {'align': 'left', 'bold': True}
                        },
                        {
                            'type': 'paragraph',
                            'content': 'Fee paid by DD No.{dd_no} dated {dd_date} Name of Bank and branch {bank_branch} Online transaction No.{tx_no} dated {tx_date}',
                            'style': {'line_height': 1.6}
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'paragraph',
                            'content': 'Date: {current_date}\n\nNote.- Form shall be submitted to the Authority with a fee of one thousand rupees.',
                            'style': {'bold': True}
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'form_grid',
                            'rows': [
                                {
                                    'cells': [
                                        {'label': 'For Office Use:\nForm received on :\nFile No. allotted:\nMode of sending notice to the opposite party:\nNotice to opposite party sent on:\nWhether Notice acknowledged by opposite party or not:\nDate of Non-starter report/Assignment of commercial dispute to Mediator:', 'field': 'office_use_notes', 'flex': 1}
                                    ]
                                }
                            ]
                        },
                        {
                            'type': 'spacer', 'height': 50
                        },
                        {
                            'type': 'header',
                            'content': 'FORM 2: NOTICE/FINAL NOTICE TO THE OPPOSITE PARTY FOR PRE-INSTITUTION MEDIATION',
                            'style': {'align': 'center', 'bold': True}
                        },
                        {
                            'type': 'paragraph',
                            'content': '[See rule 3(2) and rule 3(3)]\nName of the Authority and address.',
                            'style': {'align': 'center'}
                        },
                        {
                            'type': 'paragraph',
                            'content': '1. Whereas a commercial dispute has been submitted to {authority_name} by {applicant_name} against {op_name} requesting for pre-institution mediation in terms of section 12-A of Chapter III-A of Commercial Courts Act, 2015. A copy of the mediation application Form is attached herewith.',
                            'style': {'align': 'justify', 'line_height': 1.5}
                        },
                        {
                            'type': 'paragraph',
                            'content': '2. The opposite party is here but directed to appear in person or through his duly authorized representative or Counsel on {appearance_date} (Date) {appearance_time} (Time) at the {appearance_place} and convey his consent to participate in mediation process.',
                            'style': {'align': 'justify', 'line_height': 1.5}
                        },
                        {
                            'type': 'paragraph',
                            'content': '3. Failure to appear before the Authority by opposite party would be deemed as his refusal to participate in mediation process initiated by the applicant.',
                            'style': {'align': 'justify'}
                        },
                        {
                            'type': 'paragraph',
                            'content': '4. In case, the date and time mentioned in para 2 i sought to be rescheduled the same can be done by the opposite party either on its own or through its authorized representative or counsel by making a request in writing at-least two days prior to the scheduled date of appearance.',
                            'style': {'align': 'justify'}
                        },
                        {
                            'type': 'spacer', 'height': 30
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {'prefix': 'Authority address\n\nDate:', 'field': 'current_date', 'flex': 1},
                                {'prefix': 'Signature of the Authority', 'field': '', 'flex': 1, 'align': 'right'}
                            ]
                        },
                        {
                            'type': 'spacer', 'height': 50
                        },
                        {
                            'type': 'header',
                            'content': 'FORM 3 : NON-STARTER REPORT',
                            'style': {'align': 'center', 'bold': True}
                        },
                        {
                            'type': 'paragraph',
                            'content': '[See Rule 3 (4) and (6)]\nName of the Authority and address',
                            'style': {'align': 'center'}
                        },
                        {
                            'type': 'paragraph',
                            'content': '1. Name of the applicant : {applicant_name}\n2. Date of application for Pre-Institution mediation : {app_date}\n3. Name of the opposite party : {op_name}\n4. Date scheduled for appearance of opposite party : {appearance_date}\n5. Report made under rule 3(4) or 3(6) : {report_under_rule}\n6. Non-Starter Report reason :\n   {non_starter_reason}',
                            'style': {'line_height': 1.8}
                        },
                        {
                            'type': 'spacer', 'height': 30
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {'prefix': 'Date :', 'field': 'current_date', 'flex': 1},
                                {'prefix': 'Signature of the Authority', 'field': '', 'flex': 1, 'align': 'right'}
                            ]
                        },
                        {
                            'type': 'paragraph',
                            'content': 'Copy to :\n   Applicant.\n   Opposite Party.',
                            'style': {'bold': True}
                        },
                        {
                            'type': 'spacer', 'height': 50
                        },
                        {
                            'type': 'header',
                            'content': 'FORM 4 : SETTLEMENT',
                            'style': {'align': 'center', 'bold': True}
                        },
                        {
                            'type': 'paragraph',
                            'content': '[See rule 7(1)(vii)]\nName of the Authority and address',
                            'style': {'align': 'center'}
                        },
                        {
                            'type': 'paragraph',
                            'content': '1. Name of the Mediator : {mediator_name}\n2. Name of the applicant : {applicant_name}\n3. Name of the opposite party : {op_name}\n4. Date of application for Pre-Institution mediation : {app_date}\n5. Venue of mediation : {venue}\n6. Date(s) of mediation : {mediation_dates}\n7. No. of sittings and duration of sittings : {sittings_details}\n8. Terms of settlement :\n   {settlement_terms}',
                            'style': {'line_height': 1.8}
                        },
                        {
                            'type': 'spacer', 'height': 30
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {'prefix': 'Date :\nSignature of Opposite Party', 'field': '', 'flex': 1},
                                {'prefix': '\nSignature of Applicant', 'field': '', 'flex': 1, 'align': 'center'},
                                {'prefix': '\nSignature of Mediator', 'field': '', 'flex': 1, 'align': 'right'}
                            ]
                        },
                        {
                            'type': 'spacer', 'height': 50
                        },
                        {
                            'type': 'header',
                            'content': 'FORM: FAILURE REPORT',
                            'style': {'align': 'center', 'bold': True}
                        },
                        {
                            'type': 'paragraph',
                            'content': '[See rule 7(1)(ix)]\nName of the Authority and address',
                            'style': {'align': 'center'}
                        },
                        {
                            'type': 'paragraph',
                            'content': '1. Name of the Mediator : {mediator_name}\n2. Name of the applicant : {applicant_name}\n3. Name of the opposite party : {op_name}\n4. Date of application for Pre-Institution mediation : {app_date}\n5. Venue of mediation : {venue}\n6. Date(s) of mediation : {mediation_dates}\n7. No. of sitting and duration of sittings : {sittings_details}\n8. Reasons for failure :\n   {failure_reasons}',
                            'style': {'line_height': 1.8}
                        },
                        {
                            'type': 'spacer', 'height': 20
                        },
                        {
                            'type': 'paragraph',
                            'content': 'Date :',
                            'style': {'bold': True}
                        },
                        {
                            'type': 'grid_row',
                            'columns': [
                                {'prefix': 'Signature of Applicant', 'field': '', 'flex': 1},
                                {'prefix': 'Signature of Opposite Party', 'field': '', 'flex': 1, 'align': 'right'}
                            ]
                        },
                        {
                            'type': 'signature_block',
                            'content': 'Signature of Mediator',
                            'style': {'align': 'center'}
                        },
                        {
                            'type': 'spacer', 'height': 30
                        },
                        {
                            'type': 'header',
                            'content': 'Form 6 : MEDIATION DATA\n[See Rule 10(2)]',
                            'style': {'align': 'center', 'bold': True}
                        },
                        {
                            'type': 'dynamic_table',
                            'headers': [
                                {'text': 'Sr. No', 'flex': 0.5},
                                {'text': 'Name of the Authority', 'flex': 1.2},
                                {'text': 'Name of Applicant Party\n(Indiv / Corp)', 'flex': 1.5},
                                {'text': 'Nature of Opposite Party\n(Indiv / Corp)', 'flex': 1.5},
                                {'text': 'No. of application slab-wise\n(I to V)', 'flex': 2},
                                {'text': 'No. of app disposed Rule 3(4)/3(6)', 'flex': 1},
                                {'text': 'No. refer mediation', 'flex': 0.8},
                                {'text': 'No. settlement not arrived', 'flex': 1},
                                {'text': 'No. settlement reached', 'flex': 1}
                            ],
                            'row_count': 3,
                            'fields': ['sr', 'auth', 'app_type', 'op_type', 'slabs', 'disposed', 'referred', 'fail', 'success']
                        },
                        {
                            'type': 'spacer', 'height': 50
                        },
                        {
                            'type': 'header',
                            'content': '*SCHEDULE II\nMEDIATION FEE\n[See rule 11]',
                            'style': {'align': 'center', 'bold': True}
                        },
                        {
                            'type': 'dynamic_table',
                            'headers': [
                                {'text': 'Sr. No.', 'flex': 0.5},
                                {'text': 'QUANTUM OF CLAIM', 'flex': 2},
                                {'text': 'MEDIATION FEE PAYABLE TO AUTHORITY (IN INR)', 'flex': 1.5}
                            ],
                            'rows': [
                                ['1.', 'From Rs. 3,00,000 to Rs. 10,00,000.', 'Rs. 15,000'],
                                ['2.', 'Above Rs. 10,00,000 and upto to Rs. 50,00,000.', 'Rs. 30,000'],
                                ['3.', 'Above Rs. 50,00,000 and upto to Rs. 1,00,00,000.', 'Rs. 40,000'],
                                ['4.', 'Above Rs. 1,00,00,000 and upto to Rs. 3,00,00,000.', 'Rs. 50,000'],
                                ['5.', 'Above Rs. 3,00,00,000.', 'Rs. 75,000']
                            ],
                            'style': {'bold_header': True}
                        },
                        {
                            'type': 'spacer', 'height': 80
                        },
                        {
                            'type': 'header',
                            'content': 'THE COMMERCIAL COURTS (STATISTICAL DATA)\nRules, 2018*',
                            'style': {'align': 'center', 'bold': True}
                        },
                        {
                            'type': 'paragraph',
                            'content': 'In exercise of the powers conferred by sub-section (1) of section 21-A of the Commercial Courts Act, 20154 and in pursuance of section 17 of the said Act, the Central Government hereby makes the following rules, namely:-',
                            'style': {'align': 'justify'}
                        },
                        {
                            'type': 'paragraph',
                            'content': '1. Short title and commencement. (1) These rules may be called The Commercial Courts (Statistical Data) Rules, 2018.\n(2) They shall come into force on the date of their publication in the Official Gazette.\n\n2. definitions. - (1) In these rules unless the context otherwise requires, -\n(a) \"Act\" means the Commercial Courts Act, 2015 (4 of 2016);\n(b) \"Schedule\" means the Schedule appended to these rules.\n(c) The words and expressions used and not defined in these rules but defined in the Act, Shall have the same meanings as respectively assigned to them in that Act.',
                            'style': {'align': 'justify', 'line_height': 1.4}
                        },
                        {
                            'type': 'paragraph',
                            'content': '3. Collection and disclosure of data by Commercial Courts, Commercial Appellate Courts, Commercial Divisions and Commercial Appellate Divisions of High Courts. - The statistical data, as required by section 17 of the Act, regarding the number of suits, applications, appeals or writ petitions filed before the Commercial Courts, Commercial Appellate Courts, Commercial Division or Commercial Appellate Division, as the case may be, the pendency of such cases, the status of each case, and the number of cases disposed off, shall be maintained, updated and published by the tenth day of every month in the form specified in Schedule appended to these rules, by the concerned High Courts on their website.',
                            'style': {'align': 'justify', 'bold': True}
                        },
                        {
                            'type': 'spacer', 'height': 30
                        },
                        {
                            'type': 'header',
                            'content': 'SCHEDULE\nFORMAT FOR STATISTICAL DATA\n[See rule 3]',
                            'style': {'align': 'center', 'bold': True, 'size': 14}
                        },
                        {
                            'type': 'dynamic_table',
                            'headers': [
                                {'text': 'Sr. No', 'flex': 0.4},
                                {'text': 'Name of the Court', 'flex': 1},
                                {'text': 'No. of case pending (on the 1st day of month)', 'flex': 1.2},
                                {'text': 'No. of new cases instituted (during the month)', 'flex': 1.2},
                                {'text': 'Total Cases pending in Court (on last day)', 'flex': 1.2},
                                {'text': 'No. of cases disposed (during the month)', 'flex': 1},
                                {'text': 'Average no. of days taken to decide', 'flex': 1}
                            ],
                            'row_count': 3,
                            'fields': ['sr_stat', 'court_name_stat', 'pending_start', 'instituted', 'pending_end', 'disposed_stat', 'avg_days']
                        },
                        {
                            'type': 'spacer', 'height': 30
                        },
                        {
                            'type': 'paragraph',
                            'content': '*Vide G.S.R. 607(E), dated 3-7-2018, published in the Gazette of India, Ext., Pt. II, S. 3(i), dated 3-7-2018.',
                            'style': {'size': 10, 'italic': True}
                        }
                    ]
                },
                'default_field_mappings': {
                    'applicant_name': 'client.full_name',
                    'applicant_address': 'client.address',
                    'op_name': 'case.opposing_counsel',
                    'authority_name': 'DISTRICT LEGAL SERVICES AUTHORITY'
                }
            },
        ]

        created_count = 0
        updated_count = 0
        
        for template_data in templates:
            template, created = CourtFormTemplate.objects.update_or_create(
                name=template_data['name'],
                defaults={
                    'description': template_data['description'],
                    'category': template_data['category'],
                    'sequence': template_data.get('sequence', 0),
                    'content_structure': template_data['content_structure'],
                    'default_field_mappings': template_data['default_field_mappings'],
                    'is_active': True
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'✓ Created: {template.name}'))
            else:
                updated_count += 1
                self.stdout.write(self.style.WARNING(f'↻ Updated: {template.name}'))
        
        self.stdout.write(self.style.SUCCESS(
            f'\nCompleted! Created: {created_count}, Updated: {updated_count}'
        ))
