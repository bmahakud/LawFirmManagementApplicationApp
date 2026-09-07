import os
import sys
import re
import html as html_lib
import ctypes.util

# Automatic macOS Homebrew library resolver for weasyprint / gobject
if sys.platform == 'darwin':
    _orig_find_library = ctypes.util.find_library
    def _patched_find_library(name):
        for ext in ['.dylib', '.0.dylib', '.2.dylib', '-0.dylib']:
            p = f'/opt/homebrew/lib/lib{name}{ext}'
            if os.path.exists(p):
                return p
            clean_name = name.replace('-0', '').replace('-2', '')
            p2 = f'/opt/homebrew/lib/lib{clean_name}{ext}'
            if os.path.exists(p2):
                return p2
        return _orig_find_library(name)
    ctypes.util.find_library = _patched_find_library

    try:
        import cffi
        _orig_dlopen = cffi.FFI.dlopen
        def _patched_dlopen(self, name, flags=0):
            if isinstance(name, str) and not os.path.isabs(name):
                found = _patched_find_library(name)
                if found:
                    name = found
            return _orig_dlopen(self, name, flags)
        cffi.FFI.dlopen = _patched_dlopen
    except Exception:
        pass

try:
    import weasyprint
except Exception:
    weasyprint = None

from django.conf import settings

# Dynamically locate the "Court Forms" directory across local Mac and production Linux
_candidates = [
    os.path.abspath(os.path.join(str(settings.BASE_DIR), '..', 'Court Forms')),
    os.path.abspath(os.path.join(str(settings.BASE_DIR), 'Court Forms')),
    os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'Court Forms')),
    '/Users/diracai/Desktop/Projects DiracAI/AntLegal/LawFirmManagementApplicationApp/Court Forms',
]
COURT_FORMS_DIR = next((d for d in _candidates if os.path.isdir(d)), _candidates[0])

FORM_DEFINITIONS = {
    'address': {
        'filename': 'forms_Address Form (1).html',
        'width': 816,
        'height': 1056,
        'fields': [
            {'name': 'court_name', 'type': 'text', 'left': 215, 'top': 149, 'pdf_top': 154, 'width': 512, 'height': 24},
            {'name': 'case_number', 'type': 'text', 'left': 140, 'top': 185, 'pdf_top': 190, 'width': 285, 'height': 24},
            {'name': 'opposite_party', 'type': 'text', 'left': 490, 'top': 185, 'pdf_top': 190, 'width': 237, 'height': 24},
            {'name': 'suit_number', 'type': 'text', 'left': 135, 'top': 221, 'pdf_top': 226, 'width': 290, 'height': 24},
            {'name': 'hearing_date', 'type': 'text', 'left': 545, 'top': 221, 'pdf_top': 226, 'width': 182, 'height': 24},
            {'name': 'name_father', 'type': 'textarea', 'left': 89, 'top': 358, 'width': 108, 'height': 384},
            {'name': 'caste', 'type': 'textarea', 'left': 198, 'top': 358, 'width': 72, 'height': 384},
            {'name': 'resident_of', 'type': 'textarea', 'left': 271, 'top': 358, 'width': 90, 'height': 384},
            {'name': 'post_office', 'type': 'textarea', 'left': 362, 'top': 358, 'width': 90, 'height': 384},
            {'name': 'tehsil', 'type': 'textarea', 'left': 454, 'top': 358, 'width': 90, 'height': 384},
            {'name': 'district', 'type': 'textarea', 'left': 545, 'top': 358, 'width': 90, 'height': 384},
            {'name': 'remarks', 'type': 'textarea', 'left': 636, 'top': 358, 'width': 90, 'height': 384},
        ],
        'signature': {'name': 'signature', 'left': 480, 'top': 920, 'width': 240, 'height': 55, 'label': 'Signature of Applicant'}
    },
    'advocate': {
        'filename': 'forms_Advocate Form_1.html',
        'width': 793.33,
        'height': 1122.67,
        'fields': [
            {'name': 'adv_surname', 'type': 'text', 'left': 278, 'top': 201, 'pdf_top': 207, 'width': 148, 'height': 41},
            {'name': 'adv_firstname', 'type': 'text', 'left': 429, 'top': 201, 'pdf_top': 207, 'width': 148, 'height': 41},
            {'name': 'adv_middlename', 'type': 'text', 'left': 580, 'top': 201, 'pdf_top': 207, 'width': 149, 'height': 41},
            {'name': 'adv_sex', 'type': 'text', 'left': 278, 'top': 268, 'pdf_top': 274, 'width': 450, 'height': 40},
            {'name': 'adv_dob_dd', 'type': 'text', 'left': 278, 'top': 312, 'pdf_top': 318, 'width': 148, 'height': 44},
            {'name': 'adv_dob_mm', 'type': 'text', 'left': 429, 'top': 312, 'pdf_top': 318, 'width': 148, 'height': 44},
            {'name': 'adv_dob_yyyy', 'type': 'text', 'left': 580, 'top': 312, 'pdf_top': 318, 'width': 149, 'height': 44},
            {'name': 'bar_reg_no', 'type': 'text', 'left': 278, 'top': 384, 'pdf_top': 390, 'width': 450, 'height': 42},
            {'name': 'residential_address', 'type': 'textarea', 'left': 278, 'top': 430, 'width': 450, 'height': 54},
            {'name': 'office_address', 'type': 'textarea', 'left': 278, 'top': 487, 'width': 450, 'height': 49},
            {'name': 'district', 'type': 'text', 'left': 278, 'top': 538, 'pdf_top': 540, 'width': 450, 'height': 22},
            {'name': 'email', 'type': 'text', 'left': 278, 'top': 563, 'pdf_top': 567, 'width': 450, 'height': 32},
            {'name': 'mobile_no', 'type': 'text', 'left': 175, 'top': 598, 'pdf_top': 602, 'width': 250, 'height': 34},
            {'name': 'phone_office', 'type': 'text', 'left': 525, 'top': 598, 'pdf_top': 602, 'width': 203, 'height': 34},
            {'name': 'phone_residence', 'type': 'text', 'left': 205, 'top': 635, 'pdf_top': 639, 'width': 220, 'height': 34},
            {'name': 'fax_no', 'type': 'text', 'left': 580, 'top': 635, 'pdf_top': 639, 'width': 148, 'height': 34},
            {'name': 'marathi_surname', 'type': 'text', 'left': 278, 'top': 744, 'pdf_top': 750, 'width': 148, 'height': 50},
            {'name': 'marathi_firstname', 'type': 'text', 'left': 429, 'top': 744, 'pdf_top': 750, 'width': 148, 'height': 50},
            {'name': 'marathi_middlename', 'type': 'text', 'left': 580, 'top': 744, 'pdf_top': 750, 'width': 149, 'height': 50},
            {'name': 'marathi_residential_address', 'type': 'textarea', 'left': 278, 'top': 821, 'width': 450, 'height': 50},
            {'name': 'marathi_office_address', 'type': 'textarea', 'left': 278, 'top': 874, 'width': 450, 'height': 49},
        ],
        'signature': {'name': 'advocate_signature', 'left': 480, 'top': 935, 'width': 220, 'height': 55, 'label': 'Signature of Advocate'}
    },
    'bail': {
        'filename': 'forms_Bail Bond.html',
        'width': 816,
        'height': 1056,
        'fields': [
            {'name': 'court_name', 'type': 'text', 'left': 268, 'top': 164, 'pdf_top': 169, 'width': 455, 'height': 24},
            {'name': 'case_number', 'type': 'text', 'left': 195, 'top': 194, 'pdf_top': 199, 'width': 230, 'height': 24},
            {'name': 'accused_name', 'type': 'text', 'left': 286, 'top': 317, 'pdf_top': 322, 'width': 439, 'height': 24},
            {'name': 'accused_age', 'type': 'text', 'left': 156, 'top': 350, 'pdf_top': 355, 'width': 56, 'height': 24},
            {'name': 'accused_address', 'type': 'text', 'left': 260, 'top': 350, 'pdf_top': 355, 'width': 465, 'height': 24},
            {'name': 'police_station', 'type': 'text', 'left': 120, 'top': 416, 'pdf_top': 421, 'width': 255, 'height': 24},
            {'name': 'court_of', 'type': 'text', 'left': 120, 'top': 449, 'pdf_top': 454, 'width': 265, 'height': 24},
            {'name': 'offence_date', 'type': 'text', 'left': 328, 'top': 482, 'pdf_top': 487, 'width': 397, 'height': 24},
            {'name': 'bond_amount_num', 'type': 'text', 'left': 335, 'top': 614, 'pdf_top': 619, 'width': 185, 'height': 24},
            {'name': 'bond_amount_words', 'type': 'text', 'left': 220, 'top': 647, 'pdf_top': 652, 'width': 195, 'height': 24},
            {'name': 'dated_day', 'type': 'text', 'left': 518, 'top': 647, 'pdf_top': 652, 'width': 207, 'height': 24},
            {'name': 'dated_month_year', 'type': 'text', 'left': 175, 'top': 680, 'pdf_top': 685, 'width': 115, 'height': 24},
        ],
        'signature': {'name': 'accused_signature', 'left': 415, 'top': 710, 'width': 230, 'height': 42, 'label': 'Signature of the accused.'}
    },
    'ca_form_7': {
        'filename': 'forms_CA form 7.html',
        'width': 1056,
        'height': 816,
        'fields': [
            {'name': 'district_officer', 'type': 'text', 'left': 230, 'top': 250, 'pdf_top': 255, 'width': 295, 'height': 20},
            {'name': 'applicant_name', 'type': 'text', 'left': 365, 'top': 268, 'pdf_top': 273, 'width': 160, 'height': 20},
            {'name': 'father_name', 'type': 'text', 'left': 180, 'top': 286, 'pdf_top': 291, 'width': 140, 'height': 20},
            {'name': 'resident_of', 'type': 'text', 'left': 400, 'top': 286, 'pdf_top': 291, 'width': 125, 'height': 20},
            {'name': 'post_office_district', 'type': 'text', 'left': 230, 'top': 304, 'pdf_top': 309, 'width': 295, 'height': 20},
            {'name': 'case_number_desc', 'type': 'text', 'left': 170, 'top': 340, 'pdf_top': 345, 'width': 355, 'height': 20},
            {'name': 'mauza', 'type': 'text', 'left': 145, 'top': 376, 'pdf_top': 381, 'width': 380, 'height': 20},
            {'name': 'police_station', 'type': 'text', 'left': 125, 'top': 412, 'pdf_top': 417, 'width': 120, 'height': 20},
            {'name': 'goshwara_no', 'type': 'text', 'left': 340, 'top': 412, 'pdf_top': 417, 'width': 185, 'height': 20},
            {'name': 'district', 'type': 'text', 'left': 145, 'top': 448, 'pdf_top': 453, 'width': 380, 'height': 20},
            {'name': 'parties_name', 'type': 'text', 'left': 200, 'top': 466, 'pdf_top': 471, 'width': 325, 'height': 20},
            {'name': 'nature_of_case', 'type': 'text', 'left': 185, 'top': 484, 'pdf_top': 489, 'width': 225, 'height': 20},
            {'name': 'next_date_pending', 'type': 'text', 'left': 285, 'top': 502, 'pdf_top': 507, 'width': 240, 'height': 20},
            {'name': 'court_name', 'type': 'text', 'left': 96, 'top': 538, 'pdf_top': 543, 'width': 430, 'height': 20},
            {'name': 'doc_date', 'type': 'textarea', 'left': 92, 'top': 605, 'width': 140, 'height': 105},
            {'name': 'doc_description', 'type': 'textarea', 'left': 238, 'top': 640, 'width': 140, 'height': 70},
            {'name': 'doc_purpose', 'type': 'textarea', 'left': 384, 'top': 675, 'width': 140, 'height': 35},
            {'name': 'court_fee_stamp', 'type': 'text', 'left': 775, 'top': 354, 'pdf_top': 360, 'width': 185, 'height': 20},
            {'name': 'fee_stamp_number', 'type': 'text', 'left': 590, 'top': 381, 'pdf_top': 386, 'width': 130, 'height': 20},
            {'name': 'fee_stamp_value', 'type': 'text', 'left': 780, 'top': 381, 'pdf_top': 386, 'width': 180, 'height': 20},
            {'name': 'delivery_mode', 'type': 'text', 'left': 580, 'top': 462, 'pdf_top': 467, 'width': 380, 'height': 20},
            {'name': 'applicant_signature', 'type': 'text', 'left': 825, 'top': 515, 'pdf_top': 520, 'width': 135, 'height': 20},
            {'name': 'application_date', 'type': 'text', 'left': 815, 'top': 542, 'pdf_top': 547, 'width': 145, 'height': 20},
            {'name': 'order_on_application', 'type': 'text', 'left': 650, 'top': 569, 'pdf_top': 574, 'width': 310, 'height': 20},
        ],
        'signature': {'name': 'signature', 'left': 780, 'top': 500, 'width': 180, 'height': 38, 'label': 'Signature of Applicant'}
    },
    'case_info': {
        'filename': 'Case_Information_Format_Simple.html',
        'width': 794,
        'height': 1123,
        'is_semantic_form': True,
        'fields': [],
        'signatures': [
            {'name': 'advocate_signature', 'page': 0, 'left': 450, 'top': 940, 'width': 180, 'height': 50, 'label': 'Signature of Advocate', 'type': 'advocate'}
        ]
    },
    'checklist_138': {
        'filename': 'forms_Check List 138 NI Act Matters.html',
        'width': 816,
        'height': 1056,
        'fields': [
            {'name': 'case_details', 'type': 'textarea', 'left': 458, 'top': 156, 'width': 268, 'height': 58},
            {'name': 'cheque_amount', 'type': 'text', 'left': 490, 'top': 218, 'pdf_top': 223, 'width': 234, 'height': 24},
            {'name': 'bounce_area', 'type': 'textarea', 'left': 458, 'top': 290, 'width': 268, 'height': 50},
            {'name': 'complainant_details', 'type': 'textarea', 'left': 458, 'top': 344, 'width': 268, 'height': 134},
            {'name': 'accused_details', 'type': 'textarea', 'left': 458, 'top': 482, 'width': 268, 'height': 134},
            {'name': 'accused_5a_details', 'type': 'textarea', 'left': 458, 'top': 620, 'width': 268, 'height': 128},
            {'name': 'accused_5b_details', 'type': 'textarea', 'left': 458, 'top': 752, 'width': 268, 'height': 122},
            {'name': 'police_station', 'type': 'text', 'left': 458, 'top': 878, 'pdf_top': 883, 'width': 268, 'height': 26},
            {'name': 'other_info', 'type': 'textarea', 'left': 458, 'top': 908, 'width': 268, 'height': 38},
        ]
    },
    'checklist': {
        'filename': 'forms_Check List.html',
        'width': 816,
        'height': 1056,
        'fields': [
            {'name': 'valuation_jurisdiction', 'type': 'textarea', 'left': 421, 'top': 157, 'width': 354, 'height': 65},
            {'name': 'advocate_details', 'type': 'textarea', 'left': 421, 'top': 224, 'width': 354, 'height': 62},
            {'name': 'suit_nature', 'type': 'textarea', 'left': 421, 'top': 288, 'width': 354, 'height': 65},
            {'name': 'plaintiff_age', 'type': 'text', 'left': 485, 'top': 356, 'pdf_top': 361, 'width': 288, 'height': 28},
            {'name': 'defendant_age', 'type': 'text', 'left': 495, 'top': 390, 'pdf_top': 395, 'width': 278, 'height': 28},
            {'name': 'caveat_details', 'type': 'textarea', 'left': 421, 'top': 423, 'width': 354, 'height': 65},
            {'name': 'earmarked_court', 'type': 'textarea', 'left': 421, 'top': 490, 'width': 354, 'height': 65},
            {'name': 'relief_sought', 'type': 'textarea', 'left': 469, 'top': 665, 'width': 58, 'height': 128},
            {'name': 'val_jurisdiction', 'type': 'textarea', 'left': 529, 'top': 665, 'width': 80, 'height': 128},
            {'name': 'val_court_fee', 'type': 'textarea', 'left': 611, 'top': 665, 'width': 75, 'height': 128},
            {'name': 'court_fee_paid', 'type': 'textarea', 'left': 688, 'top': 665, 'width': 87, 'height': 128},
            {'name': 'connected_cases', 'type': 'textarea', 'left': 421, 'top': 795, 'width': 354, 'height': 88},
        ]
    },
    'commercial_court': {
        'filename': 'forms_Commercial Court Rules and Forms.html',
        'width': 816,
        'height': 1056,
        'fields': [
            # =========================================================================
            # PAGE 0 - SCHEDULE I: FORM 1 - MEDIATION APPLICATION FORM [Rule 3(1)]
            # =========================================================================
            # Authority
            {'name': 'authority_name_address', 'page': 0, 'type': 'text', 'left': 170, 'top': 172, 'pdf_top': 172, 'width': 476, 'height': 22},

            # Details of Parties - Applicant
            {'name': 'applicant_name', 'page': 0, 'type': 'text', 'left': 230, 'top': 232, 'pdf_top': 232, 'width': 505, 'height': 22},
            {'name': 'applicant_address', 'page': 0, 'type': 'text', 'left': 170, 'top': 272, 'pdf_top': 272, 'width': 565, 'height': 22},
            {'name': 'applicant_phone', 'page': 0, 'type': 'text', 'left': 195, 'top': 292, 'pdf_top': 292, 'width': 100, 'height': 20},
            {'name': 'applicant_mobile', 'page': 0, 'type': 'text', 'left': 350, 'top': 292, 'pdf_top': 292, 'width': 135, 'height': 20},
            {'name': 'applicant_email', 'page': 0, 'type': 'text', 'left': 560, 'top': 292, 'pdf_top': 292, 'width': 175, 'height': 20},

            # Details of Parties - Opposite Party
            {'name': 'opposite_party_name', 'page': 0, 'type': 'text', 'left': 260, 'top': 312, 'pdf_top': 312, 'width': 475, 'height': 22},
            {'name': 'opposite_party_address', 'page': 0, 'type': 'text', 'left': 170, 'top': 352, 'pdf_top': 352, 'width': 565, 'height': 22},
            {'name': 'opposite_party_phone', 'page': 0, 'type': 'text', 'left': 175, 'top': 372, 'pdf_top': 372, 'width': 100, 'height': 20},
            {'name': 'opposite_party_mobile', 'page': 0, 'type': 'text', 'left': 335, 'top': 372, 'pdf_top': 372, 'width': 130, 'height': 20},
            {'name': 'opposite_party_email', 'page': 0, 'type': 'text', 'left': 545, 'top': 372, 'pdf_top': 372, 'width': 190, 'height': 20},

            # Details of Dispute
            {'name': 'dispute_nature', 'page': 0, 'type': 'text', 'left': 130, 'top': 432, 'pdf_top': 432, 'width': 605, 'height': 22},
            {'name': 'quantum_claim', 'page': 0, 'type': 'text', 'left': 225, 'top': 452, 'pdf_top': 452, 'width': 510, 'height': 22},
            {'name': 'territorial_jurisdiction', 'page': 0, 'type': 'text', 'left': 375, 'top': 472, 'pdf_top': 472, 'width': 360, 'height': 22},
            {'name': 'dispute_synopsis', 'page': 0, 'type': 'text', 'left': 540, 'top': 492, 'pdf_top': 492, 'width': 195, 'height': 22},
            {'name': 'additional_points', 'page': 0, 'type': 'text', 'left': 275, 'top': 512, 'pdf_top': 512, 'width': 460, 'height': 22},

            # Details of Fee Paid
            {'name': 'fee_dd_no', 'page': 0, 'type': 'text', 'left': 245, 'top': 592, 'pdf_top': 592, 'width': 155, 'height': 20},
            {'name': 'fee_dd_date', 'page': 0, 'type': 'text', 'left': 445, 'top': 592, 'pdf_top': 592, 'width': 110, 'height': 20},
            {'name': 'fee_bank_branch', 'page': 0, 'type': 'text', 'left': 125, 'top': 614, 'pdf_top': 614, 'width': 125, 'height': 20},
            {'name': 'fee_txn_no', 'page': 0, 'type': 'text', 'left': 105, 'top': 635, 'pdf_top': 635, 'width': 130, 'height': 20},
            {'name': 'fee_txn_date', 'page': 0, 'type': 'text', 'left': 285, 'top': 635, 'pdf_top': 635, 'width': 120, 'height': 20},

            # Date
            {'name': 'application_date', 'page': 0, 'type': 'text', 'left': 115, 'top': 678, 'pdf_top': 678, 'width': 130, 'height': 20},

            # For Office Use Box
            {'name': 'office_received_on', 'page': 0, 'type': 'text', 'left': 215, 'top': 808, 'pdf_top': 808, 'width': 510, 'height': 20},
            {'name': 'office_file_no', 'page': 0, 'type': 'text', 'left': 200, 'top': 830, 'pdf_top': 830, 'width': 525, 'height': 20},
            {'name': 'office_notice_mode', 'page': 0, 'type': 'text', 'left': 370, 'top': 851, 'pdf_top': 851, 'width': 355, 'height': 20},
            {'name': 'office_notice_date', 'page': 0, 'type': 'text', 'left': 255, 'top': 873, 'pdf_top': 873, 'width': 470, 'height': 20},
            {'name': 'office_ack_status', 'page': 0, 'type': 'text', 'left': 405, 'top': 894, 'pdf_top': 894, 'width': 320, 'height': 20},
            {'name': 'office_report_date', 'page': 0, 'type': 'text', 'left': 540, 'top': 915, 'pdf_top': 915, 'width': 185, 'height': 20},

            # =========================================================================
            # PAGE 1 - FORM 2: NOTICE / FINAL NOTICE TO THE OPPOSITE PARTY [Rule 3(2), 3(3)]
            # =========================================================================
            {'name': 'p1_authority_name_address', 'page': 1, 'type': 'text', 'left': 200, 'top': 198, 'pdf_top': 198, 'width': 416, 'height': 22},
            {'name': 'p1_authority_name', 'page': 1, 'type': 'text', 'left': 470, 'top': 224, 'pdf_top': 224, 'width': 185, 'height': 20},
            {'name': 'p1_applicant_name', 'page': 1, 'type': 'text', 'left': 220, 'top': 247, 'pdf_top': 247, 'width': 175, 'height': 20},
            {'name': 'p1_opposite_party_name', 'page': 1, 'type': 'text', 'left': 505, 'top': 247, 'pdf_top': 247, 'width': 225, 'height': 20},
            {'name': 'p1_appearance_date', 'page': 1, 'type': 'text', 'left': 75, 'top': 408, 'pdf_top': 408, 'width': 140, 'height': 20},
            {'name': 'p1_appearance_time', 'page': 1, 'type': 'text', 'left': 225, 'top': 408, 'pdf_top': 408, 'width': 110, 'height': 20},
            {'name': 'p1_appearance_place', 'page': 1, 'type': 'text', 'left': 385, 'top': 408, 'pdf_top': 408, 'width': 350, 'height': 20},
            {'name': 'p1_authority_address', 'page': 1, 'type': 'textarea', 'left': 75, 'top': 730, 'pdf_top': 730, 'width': 250, 'height': 40},
            {'name': 'p1_notice_date', 'page': 1, 'type': 'text', 'left': 115, 'top': 758, 'pdf_top': 758, 'width': 130, 'height': 20},

            # =========================================================================
            # PAGE 2 - FORM 3: NON-STARTER REPORT [Rule 3(4), 3(6)]
            # =========================================================================
            {'name': 'p2_authority_name', 'page': 2, 'type': 'text', 'left': 200, 'top': 156, 'pdf_top': 156, 'width': 416, 'height': 22},
            {'name': 'p2_applicant_name', 'page': 2, 'type': 'text', 'left': 245, 'top': 180, 'pdf_top': 180, 'width': 485, 'height': 22},
            {'name': 'p2_application_date', 'page': 2, 'type': 'text', 'left': 420, 'top': 222, 'pdf_top': 222, 'width': 310, 'height': 22},
            {'name': 'p2_opposite_party_name', 'page': 2, 'type': 'text', 'left': 280, 'top': 265, 'pdf_top': 265, 'width': 450, 'height': 22},
            {'name': 'p2_appearance_date', 'page': 2, 'type': 'text', 'left': 420, 'top': 308, 'pdf_top': 308, 'width': 310, 'height': 22},
            {'name': 'p2_rule_sub', 'page': 2, 'type': 'text', 'left': 340, 'top': 351, 'pdf_top': 351, 'width': 390, 'height': 22},
            {'name': 'p2_reason', 'page': 2, 'type': 'textarea', 'left': 75, 'top': 416, 'pdf_top': 416, 'width': 655, 'height': 65},
            {'name': 'p2_date', 'page': 2, 'type': 'text', 'left': 120, 'top': 523, 'pdf_top': 523, 'width': 140, 'height': 20},

            # =========================================================================
            # PAGE 3 - FORM 4: SETTLEMENT [Rule 7(1)(vii)]
            # =========================================================================
            {'name': 'p3_authority_name', 'page': 3, 'type': 'text', 'left': 200, 'top': 156, 'pdf_top': 156, 'width': 416, 'height': 22},
            {'name': 'p3_mediator_name', 'page': 3, 'type': 'text', 'left': 245, 'top': 180, 'pdf_top': 180, 'width': 485, 'height': 22},
            {'name': 'p3_applicant_name', 'page': 3, 'type': 'text', 'left': 245, 'top': 222, 'pdf_top': 222, 'width': 485, 'height': 22},
            {'name': 'p3_opposite_party_name', 'page': 3, 'type': 'text', 'left': 280, 'top': 265, 'pdf_top': 265, 'width': 450, 'height': 22},
            {'name': 'p3_application_date', 'page': 3, 'type': 'text', 'left': 420, 'top': 308, 'pdf_top': 308, 'width': 310, 'height': 22},
            {'name': 'p3_venue', 'page': 3, 'type': 'text', 'left': 235, 'top': 351, 'pdf_top': 351, 'width': 495, 'height': 22},
            {'name': 'p3_mediation_dates', 'page': 3, 'type': 'text', 'left': 245, 'top': 394, 'pdf_top': 394, 'width': 485, 'height': 22},
            {'name': 'p3_sittings', 'page': 3, 'type': 'text', 'left': 360, 'top': 437, 'pdf_top': 437, 'width': 370, 'height': 22},
            {'name': 'p3_terms', 'page': 3, 'type': 'textarea', 'left': 245, 'top': 480, 'pdf_top': 480, 'width': 485, 'height': 45},
            {'name': 'p3_date', 'page': 3, 'type': 'text', 'left': 120, 'top': 544, 'pdf_top': 544, 'width': 140, 'height': 20},

            # =========================================================================
            # PAGE 4 - FORM 5: FAILURE REPORT [Rule 7(1)(ix)]
            # =========================================================================
            {'name': 'p4_authority_name', 'page': 4, 'type': 'text', 'left': 200, 'top': 136, 'pdf_top': 136, 'width': 416, 'height': 22},
            {'name': 'p4_mediator_name', 'page': 4, 'type': 'text', 'left': 245, 'top': 158, 'pdf_top': 158, 'width': 485, 'height': 22},
            {'name': 'p4_applicant_name', 'page': 4, 'type': 'text', 'left': 245, 'top': 180, 'pdf_top': 180, 'width': 485, 'height': 22},
            {'name': 'p4_opposite_party_name', 'page': 4, 'type': 'text', 'left': 280, 'top': 201, 'pdf_top': 201, 'width': 450, 'height': 22},
            {'name': 'p4_application_date', 'page': 4, 'type': 'text', 'left': 420, 'top': 222, 'pdf_top': 222, 'width': 310, 'height': 22},
            {'name': 'p4_venue', 'page': 4, 'type': 'text', 'left': 235, 'top': 244, 'pdf_top': 244, 'width': 495, 'height': 22},
            {'name': 'p4_mediation_dates', 'page': 4, 'type': 'text', 'left': 245, 'top': 265, 'pdf_top': 265, 'width': 485, 'height': 22},
            {'name': 'p4_sittings', 'page': 4, 'type': 'text', 'left': 360, 'top': 287, 'pdf_top': 287, 'width': 370, 'height': 22},
            {'name': 'p4_failure_reasons', 'page': 4, 'type': 'textarea', 'left': 245, 'top': 308, 'pdf_top': 308, 'width': 485, 'height': 50},
            {'name': 'p4_date', 'page': 4, 'type': 'text', 'left': 120, 'top': 372, 'pdf_top': 372, 'width': 140, 'height': 20},

            # =========================================================================
            # PAGE 6 - FORMAT FOR STATISTICAL DATA [Rule 3]
            # =========================================================================
            {'name': 'stat_month', 'page': 6, 'type': 'text', 'left': 240, 'top': 760, 'pdf_top': 760, 'width': 60, 'height': 18},
            {'name': 'stat_row1_court', 'page': 6, 'type': 'text', 'left': 96, 'top': 835, 'pdf_top': 835, 'width': 75, 'height': 20},
            {'name': 'stat_row1_pending_start', 'page': 6, 'type': 'text', 'left': 180, 'top': 835, 'pdf_top': 835, 'width': 100, 'height': 20},
            {'name': 'stat_row1_instituted', 'page': 6, 'type': 'text', 'left': 290, 'top': 835, 'pdf_top': 835, 'width': 115, 'height': 20},
            {'name': 'stat_row1_pending_end', 'page': 6, 'type': 'text', 'left': 415, 'top': 835, 'pdf_top': 835, 'width': 125, 'height': 20},
            {'name': 'stat_row1_disposed', 'page': 6, 'type': 'text', 'left': 550, 'top': 835, 'pdf_top': 835, 'width': 90, 'height': 20},
            {'name': 'stat_row1_avg_days', 'page': 6, 'type': 'text', 'left': 650, 'top': 835, 'pdf_top': 835, 'width': 75, 'height': 20},
        ],
        'signatures': [
            # Form 1 (Page 0)
            {'name': 'applicant_signature', 'page': 0, 'left': 500, 'top': 670, 'width': 220, 'height': 45, 'label': 'Signature of Applicant', 'type': 'client'},
            # Form 2 (Page 1)
            {'name': 'p1_authority_signature', 'page': 1, 'left': 480, 'top': 710, 'width': 220, 'height': 45, 'label': 'Signature of the Authority', 'type': 'custom'},
            # Form 3 (Page 2)
            {'name': 'p2_authority_signature', 'page': 2, 'left': 490, 'top': 505, 'width': 220, 'height': 45, 'label': 'Signature of the Authority', 'type': 'custom'},
            # Form 4 (Page 3)
            {'name': 'p3_opposite_party_signature', 'page': 3, 'left': 75, 'top': 590, 'width': 180, 'height': 45, 'label': 'Signature of Opposite Party', 'type': 'custom'},
            {'name': 'p3_applicant_signature', 'page': 3, 'left': 280, 'top': 590, 'width': 180, 'height': 45, 'label': 'Signature of Applicant', 'type': 'client'},
            {'name': 'p3_mediator_signature', 'page': 3, 'left': 520, 'top': 590, 'width': 180, 'height': 45, 'label': 'Signature of Mediator', 'type': 'custom'},
            # Form 5 (Page 4)
            {'name': 'p4_applicant_signature', 'page': 4, 'left': 75, 'top': 460, 'width': 180, 'height': 45, 'label': 'Signature of Applicant', 'type': 'client'},
            {'name': 'p4_opposite_party_signature', 'page': 4, 'left': 495, 'top': 460, 'width': 180, 'height': 45, 'label': 'Signature of Opposite Party', 'type': 'custom'},
            {'name': 'p4_mediator_signature', 'page': 4, 'left': 310, 'top': 525, 'width': 180, 'height': 45, 'label': 'Signature of Mediator', 'type': 'custom'},
        ],
        'signature': {'name': 'applicant_signature', 'page': 0, 'left': 500, 'top': 670, 'width': 220, 'height': 45, 'label': 'Signature of Applicant', 'type': 'client'}
    },
    'ecourt_fee': {
        'filename': 'ecourt_fee_form.html',
        'width': 794,
        'height': 1123,
        'is_semantic_form': True,
        'fields': [],
        'signatures': [
            {'name': 'applicant_signature', 'page': 0, 'left': 220, 'top': 405, 'width': 220, 'height': 42, 'label': 'Signature of the applicant', 'type': 'client'},
            {'name': 'shcil_signature', 'page': 0, 'left': 220, 'top': 730, 'width': 220, 'height': 42, 'label': 'Signature & Seal of SHCIL', 'type': 'custom'},
        ],
        'signature': {'name': 'applicant_signature', 'page': 0, 'left': 220, 'top': 405, 'width': 220, 'height': 42, 'label': 'Signature of the applicant', 'type': 'client'}
    },
    'filing_form': {
        'filename': 'forms_Filing Form.html',
        'width': 793.33,
        'height': 1122.67,
        'fields': [
            {'name': 'court_name', 'type': 'text', 'left': 535, 'top': 110, 'pdf_top': 112, 'width': 195, 'height': 20},
            {'name': 'case_type', 'type': 'text', 'left': 170, 'top': 161, 'pdf_top': 161, 'width': 560, 'height': 18},
            # Plaintiff
            {'name': 'plaintiff_name', 'type': 'text', 'left': 200, 'top': 200, 'pdf_top': 202, 'width': 535, 'height': 32},
            {'name': 'plaintiff_parent_name', 'type': 'text', 'left': 200, 'top': 245, 'pdf_top': 247, 'width': 535, 'height': 26},
            {'name': 'plaintiff_address', 'type': 'textarea', 'left': 200, 'top': 280, 'pdf_top': 282, 'width': 340, 'height': 50},
            {'name': 'plaintiff_pin', 'type': 'text', 'left': 575, 'top': 310, 'pdf_top': 313, 'width': 160, 'height': 20},
            {'name': 'plaintiff_sex', 'type': 'text', 'left': 215, 'top': 340, 'pdf_top': 342, 'width': 28, 'height': 18},
            {'name': 'plaintiff_age', 'type': 'text', 'left': 472, 'top': 340, 'pdf_top': 342, 'width': 45, 'height': 18},
            {'name': 'plaintiff_caste', 'type': 'text', 'left': 586, 'top': 340, 'pdf_top': 342, 'width': 145, 'height': 18},
            {'name': 'plaintiff_nationality', 'type': 'text', 'left': 215, 'top': 366, 'pdf_top': 368, 'width': 28, 'height': 18},
            {'name': 'plaintiff_other_nation', 'type': 'text', 'left': 375, 'top': 366, 'pdf_top': 368, 'width': 95, 'height': 18},
            {'name': 'plaintiff_occupation', 'type': 'text', 'left': 550, 'top': 366, 'pdf_top': 368, 'width': 180, 'height': 18},
            {'name': 'plaintiff_email', 'type': 'text', 'left': 172, 'top': 394, 'pdf_top': 396, 'width': 118, 'height': 18},
            {'name': 'plaintiff_phone', 'type': 'text', 'left': 351, 'top': 394, 'pdf_top': 396, 'width': 95, 'height': 18},
            {'name': 'plaintiff_mobile', 'type': 'text', 'left': 508, 'top': 394, 'pdf_top': 396, 'width': 106, 'height': 18},
            {'name': 'plaintiff_fax', 'type': 'text', 'left': 663, 'top': 394, 'pdf_top': 396, 'width': 71, 'height': 18},
            {'name': 'subject', 'type': 'text', 'left': 170, 'top': 421, 'pdf_top': 423, 'width': 560, 'height': 18},
            {'name': 'advocate_code', 'type': 'text', 'left': 165, 'top': 449, 'pdf_top': 451, 'width': 80, 'height': 18},
            {'name': 'advocate_name', 'type': 'text', 'left': 320, 'top': 449, 'pdf_top': 451, 'width': 415, 'height': 18},
            # Respondent
            {'name': 'defendant_name', 'type': 'text', 'left': 200, 'top': 504, 'pdf_top': 506, 'width': 535, 'height': 32},
            {'name': 'defendant_parent_name', 'type': 'text', 'left': 200, 'top': 549, 'pdf_top': 551, 'width': 535, 'height': 26},
            {'name': 'defendant_address', 'type': 'textarea', 'left': 200, 'top': 584, 'pdf_top': 586, 'width': 340, 'height': 50},
            {'name': 'defendant_pin', 'type': 'text', 'left': 575, 'top': 614, 'pdf_top': 616, 'width': 160, 'height': 20},
            {'name': 'defendant_sex', 'type': 'text', 'left': 215, 'top': 644, 'pdf_top': 646, 'width': 28, 'height': 18},
            {'name': 'defendant_age', 'type': 'text', 'left': 472, 'top': 644, 'pdf_top': 646, 'width': 45, 'height': 18},
            {'name': 'defendant_caste', 'type': 'text', 'left': 586, 'top': 644, 'pdf_top': 646, 'width': 145, 'height': 18},
            {'name': 'defendant_nationality', 'type': 'text', 'left': 215, 'top': 670, 'pdf_top': 672, 'width': 28, 'height': 18},
            {'name': 'defendant_other_nation', 'type': 'text', 'left': 375, 'top': 670, 'pdf_top': 672, 'width': 95, 'height': 18},
            {'name': 'defendant_occupation', 'type': 'text', 'left': 550, 'top': 670, 'pdf_top': 672, 'width': 180, 'height': 18},
            {'name': 'defendant_email', 'type': 'text', 'left': 172, 'top': 698, 'pdf_top': 700, 'width': 118, 'height': 18},
            {'name': 'defendant_phone', 'type': 'text', 'left': 351, 'top': 698, 'pdf_top': 700, 'width': 95, 'height': 18},
            {'name': 'defendant_mobile', 'type': 'text', 'left': 508, 'top': 698, 'pdf_top': 700, 'width': 106, 'height': 18},
            {'name': 'defendant_fax', 'type': 'text', 'left': 663, 'top': 698, 'pdf_top': 700, 'width': 71, 'height': 18},
            {'name': 'defendant_subject', 'type': 'text', 'left': 170, 'top': 725, 'pdf_top': 727, 'width': 560, 'height': 18},
            {'name': 'resp_advocate_code', 'type': 'text', 'left': 165, 'top': 753, 'pdf_top': 755, 'width': 80, 'height': 18},
            {'name': 'resp_advocate_name', 'type': 'text', 'left': 320, 'top': 753, 'pdf_top': 755, 'width': 415, 'height': 18},
            # Lower Court
            {'name': 'lower_court_name', 'type': 'text', 'left': 200, 'top': 808, 'pdf_top': 808, 'width': 535, 'height': 18},
            {'name': 'lower_case_no', 'type': 'text', 'left': 200, 'top': 835, 'pdf_top': 835, 'width': 255, 'height': 18},
            {'name': 'lower_decision_date', 'type': 'text', 'left': 560, 'top': 835, 'pdf_top': 835, 'width': 175, 'height': 18},
            # Main Matter
            {'name': 'main_case_type', 'type': 'text', 'left': 200, 'top': 888, 'pdf_top': 888, 'width': 165, 'height': 18},
            {'name': 'main_case_no', 'type': 'text', 'left': 450, 'top': 888, 'pdf_top': 888, 'width': 80, 'height': 18},
            {'name': 'main_case_year', 'type': 'text', 'left': 600, 'top': 888, 'pdf_top': 888, 'width': 135, 'height': 18},
        ]
    },
    'bail_45': {
        'filename': 'forms_Form No 45 Bail Bond_0.html',
        'width': 816,
        'height': 1056,
        'fields': [
            # PAGE 0 - Header & Case Info
            {'name': 'court_name', 'page': 0, 'type': 'text', 'left': 210, 'top': 213, 'pdf_top': 213, 'width': 515, 'height': 20},
            {'name': 'police_station', 'page': 0, 'type': 'text', 'left': 180, 'top': 247, 'pdf_top': 247, 'width': 340, 'height': 20},
            {'name': 'ndoh', 'page': 0, 'type': 'text', 'left': 645, 'top': 247, 'pdf_top': 247, 'width': 80, 'height': 20},
            {'name': 'under_section', 'page': 0, 'type': 'text', 'left': 180, 'top': 281, 'pdf_top': 281, 'width': 340, 'height': 20},
            {'name': 'sent_to_jail_on', 'page': 0, 'type': 'text', 'left': 625, 'top': 281, 'pdf_top': 281, 'width': 100, 'height': 20},
            {'name': 'fir_no', 'page': 0, 'type': 'text', 'left': 180, 'top': 315, 'pdf_top': 315, 'width': 340, 'height': 20},

            # PAGE 0 - Accused Bail Bond
            {'name': 'accused_name', 'page': 0, 'type': 'text', 'left': 110, 'top': 399, 'pdf_top': 399, 'width': 270, 'height': 20},
            {'name': 'father_name', 'page': 0, 'type': 'text', 'left': 450, 'top': 399, 'pdf_top': 399, 'width': 275, 'height': 20},
            {'name': 'accused_address', 'page': 0, 'type': 'text', 'left': 165, 'top': 417, 'pdf_top': 417, 'width': 560, 'height': 20},
            {'name': 'arresting_ps', 'page': 0, 'type': 'text', 'left': 550, 'top': 435, 'pdf_top': 435, 'width': 175, 'height': 20},
            {'name': 'offence_details', 'page': 0, 'type': 'text', 'left': 96, 'top': 471, 'pdf_top': 471, 'width': 330, 'height': 20},
            {'name': 'bond_amount', 'page': 0, 'type': 'text', 'left': 450, 'top': 525, 'pdf_top': 525, 'width': 275, 'height': 20},
            {'name': 'bond_date', 'page': 0, 'type': 'text', 'left': 150, 'top': 587, 'pdf_top': 587, 'width': 200, 'height': 20},

            # PAGE 0 - Surety Section
            {'name': 'surety_name', 'page': 0, 'type': 'text', 'left': 110, 'top': 621, 'pdf_top': 621, 'width': 270, 'height': 20},
            {'name': 'surety_father_name', 'page': 0, 'type': 'text', 'left': 450, 'top': 621, 'pdf_top': 621, 'width': 275, 'height': 20},
            {'name': 'surety_address', 'page': 0, 'type': 'text', 'left': 165, 'top': 639, 'pdf_top': 639, 'width': 560, 'height': 20},
            {'name': 'surety_for_accused', 'page': 0, 'type': 'text', 'left': 400, 'top': 657, 'pdf_top': 657, 'width': 325, 'height': 20},
            {'name': 'surety_ps', 'page': 0, 'type': 'text', 'left': 400, 'top': 675, 'pdf_top': 675, 'width': 325, 'height': 20},
            {'name': 'surety_court', 'page': 0, 'type': 'text', 'left': 350, 'top': 693, 'pdf_top': 693, 'width': 375, 'height': 20},
            {'name': 'surety_bond_amount', 'page': 0, 'type': 'text', 'left': 330, 'top': 765, 'pdf_top': 765, 'width': 220, 'height': 20},
            {'name': 'surety_day', 'page': 0, 'type': 'text', 'left': 345, 'top': 796, 'pdf_top': 796, 'width': 70, 'height': 20},
            {'name': 'surety_month', 'page': 0, 'type': 'text', 'left': 465, 'top': 796, 'pdf_top': 796, 'width': 50, 'height': 20},
            {'name': 'surety_year', 'page': 0, 'type': 'text', 'left': 535, 'top': 796, 'pdf_top': 796, 'width': 40, 'height': 20},
            {'name': 'witness_1', 'page': 0, 'type': 'text', 'left': 144, 'top': 897, 'pdf_top': 897, 'width': 370, 'height': 20},
            {'name': 'witness_2', 'page': 0, 'type': 'text', 'left': 144, 'top': 918, 'pdf_top': 918, 'width': 370, 'height': 20},

            # PAGE 1 - Affidavit
            {'name': 'aff_deponent_name', 'page': 1, 'type': 'text', 'left': 110, 'top': 152, 'pdf_top': 152, 'width': 240, 'height': 20},
            {'name': 'aff_parent_name', 'page': 1, 'type': 'text', 'left': 500, 'top': 152, 'pdf_top': 152, 'width': 225, 'height': 20},
            {'name': 'aff_age', 'page': 1, 'type': 'text', 'left': 170, 'top': 173, 'pdf_top': 173, 'width': 70, 'height': 20},
            {'name': 'aff_address', 'page': 1, 'type': 'text', 'left': 300, 'top': 173, 'pdf_top': 173, 'width': 425, 'height': 20},
            {'name': 'aff_ration_card', 'page': 1, 'type': 'text', 'left': 675, 'top': 227, 'pdf_top': 227, 'width': 60, 'height': 20},
            {'name': 'aff_election_card', 'page': 1, 'type': 'text', 'left': 360, 'top': 248, 'pdf_top': 248, 'width': 220, 'height': 20},
            {'name': 'aff_accused_relation', 'page': 1, 'type': 'text', 'left': 235, 'top': 268, 'pdf_top': 268, 'width': 445, 'height': 20},
            {'name': 'aff_profession', 'page': 1, 'type': 'text', 'left': 345, 'top': 330, 'pdf_top': 330, 'width': 155, 'height': 20},
            {'name': 'aff_work_place', 'page': 1, 'type': 'text', 'left': 545, 'top': 330, 'pdf_top': 330, 'width': 180, 'height': 20},
            {'name': 'aff_monthly_income', 'page': 1, 'type': 'text', 'left': 500, 'top': 351, 'pdf_top': 351, 'width': 140, 'height': 20},
            {'name': 'aff_household_val', 'page': 1, 'type': 'text', 'left': 580, 'top': 371, 'pdf_top': 371, 'width': 145, 'height': 20},
            {'name': 'aff_prop_no', 'page': 1, 'type': 'text', 'left': 550, 'top': 392, 'pdf_top': 392, 'width': 175, 'height': 20},
            {'name': 'aff_prop_sqyards', 'page': 1, 'type': 'text', 'left': 220, 'top': 413, 'pdf_top': 413, 'width': 140, 'height': 20},
            {'name': 'aff_prop_address', 'page': 1, 'type': 'text', 'left': 530, 'top': 413, 'pdf_top': 413, 'width': 195, 'height': 20},
            {'name': 'aff_prop_val', 'page': 1, 'type': 'text', 'left': 290, 'top': 433, 'pdf_top': 433, 'width': 160, 'height': 20},
            {'name': 'aff_fdr_no', 'page': 1, 'type': 'text', 'left': 305, 'top': 495, 'pdf_top': 495, 'width': 195, 'height': 20},
            {'name': 'aff_fdr_bank', 'page': 1, 'type': 'text', 'left': 645, 'top': 495, 'pdf_top': 495, 'width': 85, 'height': 20},
            {'name': 'aff_fdr_amount', 'page': 1, 'type': 'text', 'left': 200, 'top': 516, 'pdf_top': 516, 'width': 160, 'height': 20},
            {'name': 'aff_vehicle_no', 'page': 1, 'type': 'text', 'left': 290, 'top': 537, 'pdf_top': 537, 'width': 140, 'height': 20},
            {'name': 'aff_vehicle_make', 'page': 1, 'type': 'text', 'left': 515, 'top': 537, 'pdf_top': 537, 'width': 85, 'height': 20},
            {'name': 'aff_vehicle_rc', 'page': 1, 'type': 'text', 'left': 665, 'top': 537, 'pdf_top': 537, 'width': 65, 'height': 20},
            {'name': 'aff_vehicle_val', 'page': 1, 'type': 'text', 'left': 455, 'top': 558, 'pdf_top': 558, 'width': 140, 'height': 20},
            {'name': 'aff_veri_day', 'page': 1, 'type': 'text', 'left': 245, 'top': 710, 'pdf_top': 710, 'width': 125, 'height': 20},
            {'name': 'aff_veri_year', 'page': 1, 'type': 'text', 'left': 575, 'top': 710, 'pdf_top': 710, 'width': 40, 'height': 20},
        ]
    },
    'index_form': {
        'filename': 'forms_Index form.html',
        'width': 816,
        'height': 1056,
        'fields': [
            {'name': 'case_number', 'type': 'text', 'left': 580, 'top': 260, 'pdf_top': 260, 'width': 145, 'height': 20},
            {'name': 'plaintiff_name', 'type': 'text', 'left': 96, 'top': 295, 'pdf_top': 295, 'width': 535, 'height': 20},
            {'name': 'defendant_name', 'type': 'text', 'left': 96, 'top': 369, 'pdf_top': 369, 'width': 525, 'height': 20},
            # Rows 1 to 10
            {'name': 'desc_0', 'type': 'text', 'left': 130, 'top': 486, 'pdf_top': 486, 'width': 285, 'height': 20},
            {'name': 'fee_0', 'type': 'text', 'left': 430, 'top': 486, 'pdf_top': 486, 'width': 150, 'height': 20},
            {'name': 'page_0', 'type': 'text', 'left': 600, 'top': 486, 'pdf_top': 486, 'width': 125, 'height': 20},
            {'name': 'desc_1', 'type': 'text', 'left': 130, 'top': 520, 'pdf_top': 520, 'width': 285, 'height': 20},
            {'name': 'fee_1', 'type': 'text', 'left': 430, 'top': 520, 'pdf_top': 520, 'width': 150, 'height': 20},
            {'name': 'page_1', 'type': 'text', 'left': 600, 'top': 520, 'pdf_top': 520, 'width': 125, 'height': 20},
            {'name': 'desc_2', 'type': 'text', 'left': 130, 'top': 554, 'pdf_top': 554, 'width': 285, 'height': 20},
            {'name': 'fee_2', 'type': 'text', 'left': 430, 'top': 554, 'pdf_top': 554, 'width': 150, 'height': 20},
            {'name': 'page_2', 'type': 'text', 'left': 600, 'top': 554, 'pdf_top': 554, 'width': 125, 'height': 20},
            {'name': 'desc_3', 'type': 'text', 'left': 130, 'top': 588, 'pdf_top': 588, 'width': 285, 'height': 20},
            {'name': 'fee_3', 'type': 'text', 'left': 430, 'top': 588, 'pdf_top': 588, 'width': 150, 'height': 20},
            {'name': 'page_3', 'type': 'text', 'left': 600, 'top': 588, 'pdf_top': 588, 'width': 125, 'height': 20},
            {'name': 'desc_4', 'type': 'text', 'left': 130, 'top': 622, 'pdf_top': 622, 'width': 285, 'height': 20},
            {'name': 'fee_4', 'type': 'text', 'left': 430, 'top': 622, 'pdf_top': 622, 'width': 150, 'height': 20},
            {'name': 'page_4', 'type': 'text', 'left': 600, 'top': 622, 'pdf_top': 622, 'width': 125, 'height': 20},
            {'name': 'desc_5', 'type': 'text', 'left': 130, 'top': 656, 'pdf_top': 656, 'width': 285, 'height': 20},
            {'name': 'fee_5', 'type': 'text', 'left': 430, 'top': 656, 'pdf_top': 656, 'width': 150, 'height': 20},
            {'name': 'page_5', 'type': 'text', 'left': 600, 'top': 656, 'pdf_top': 656, 'width': 125, 'height': 20},
            {'name': 'desc_6', 'type': 'text', 'left': 130, 'top': 690, 'pdf_top': 690, 'width': 285, 'height': 20},
            {'name': 'fee_6', 'type': 'text', 'left': 430, 'top': 690, 'pdf_top': 690, 'width': 150, 'height': 20},
            {'name': 'page_6', 'type': 'text', 'left': 600, 'top': 690, 'pdf_top': 690, 'width': 125, 'height': 20},
            {'name': 'desc_7', 'type': 'text', 'left': 130, 'top': 724, 'pdf_top': 724, 'width': 285, 'height': 20},
            {'name': 'fee_7', 'type': 'text', 'left': 430, 'top': 724, 'pdf_top': 724, 'width': 150, 'height': 20},
            {'name': 'page_7', 'type': 'text', 'left': 600, 'top': 724, 'pdf_top': 724, 'width': 125, 'height': 20},
            {'name': 'desc_8', 'type': 'text', 'left': 130, 'top': 758, 'pdf_top': 758, 'width': 285, 'height': 20},
            {'name': 'fee_8', 'type': 'text', 'left': 430, 'top': 758, 'pdf_top': 758, 'width': 150, 'height': 20},
            {'name': 'page_8', 'type': 'text', 'left': 600, 'top': 758, 'pdf_top': 758, 'width': 125, 'height': 20},
            {'name': 'desc_9', 'type': 'text', 'left': 130, 'top': 792, 'pdf_top': 792, 'width': 285, 'height': 20},
            {'name': 'fee_9', 'type': 'text', 'left': 430, 'top': 792, 'pdf_top': 792, 'width': 150, 'height': 20},
            {'name': 'page_9', 'type': 'text', 'left': 600, 'top': 792, 'pdf_top': 792, 'width': 125, 'height': 20},
            # Footer
            {'name': 'date_day', 'type': 'text', 'left': 180, 'top': 825, 'pdf_top': 825, 'width': 190, 'height': 20},
            {'name': 'date_month', 'type': 'text', 'left': 440, 'top': 825, 'pdf_top': 825, 'width': 220, 'height': 20},
            {'name': 'date_year', 'type': 'text', 'left': 700, 'top': 825, 'pdf_top': 825, 'width': 26, 'height': 20},
        ],
        'signature': {'name': 'advocate_signature', 'left': 550, 'top': 885, 'width': 180, 'height': 45, 'label': 'Signature of Advocate'}
    },
    'inspection_form': {
        'filename': 'forms_Inspection form.html',
        'width': 816,
        'height': 1056,
        'fields': [
            # Top court & case
            {'name': 'court_name', 'type': 'text', 'left': 225, 'top': 87, 'pdf_top': 87, 'width': 500, 'height': 20},
            {'name': 'case_number', 'type': 'text', 'left': 225, 'top': 120, 'pdf_top': 120, 'width': 390, 'height': 20},
            {'name': 'year', 'type': 'text', 'left': 700, 'top': 120, 'pdf_top': 120, 'width': 26, 'height': 20},

            # Cause Title
            {'name': 'plaintiff_name', 'type': 'text', 'left': 96, 'top': 195, 'pdf_top': 195, 'width': 630, 'height': 22},
            {'name': 'defendant_name', 'type': 'text', 'left': 96, 'top': 265, 'pdf_top': 265, 'width': 630, 'height': 22},

            # Sidebar
            {'name': 'fir_case_no', 'type': 'text', 'left': 300, 'top': 304, 'pdf_top': 304, 'width': 330, 'height': 20},
            {'name': 'ndoh', 'type': 'text', 'left': 300, 'top': 338, 'pdf_top': 338, 'width': 365, 'height': 20},

            # Body
            {'name': 'hearing_date', 'type': 'text', 'left': 330, 'top': 468, 'pdf_top': 470, 'width': 230, 'height': 20},
            {'name': 'counsel_for', 'type': 'text', 'left': 270, 'top': 489, 'pdf_top': 490, 'width': 310, 'height': 20},
            {'name': 'prayer_for', 'type': 'text', 'left': 120, 'top': 606, 'pdf_top': 607, 'width': 240, 'height': 20},

            # Footer
            {'name': 'advocate_name', 'type': 'text', 'left': 480, 'top': 708, 'pdf_top': 708, 'width': 245, 'height': 20},
            {'name': 'advocate_address', 'type': 'text', 'left': 96, 'top': 738, 'pdf_top': 738, 'width': 240, 'height': 20},
            {'name': 'date', 'type': 'text', 'left': 155, 'top': 808, 'pdf_top': 808, 'width': 190, 'height': 20},
        ],
        'signature': {'name': 'advocate_signature', 'left': 550, 'top': 800, 'width': 175, 'height': 45, 'label': 'Signature of Applicant/Counsel'}
    },
    'list_of_documents': {
        'filename': 'forms_List of documents.html',
        'width': 816,
        'height': 1248,
        'fields': [
            # Header & Case Info
            {'name': 'court_name', 'type': 'text', 'left': 310, 'top': 235, 'pdf_top': 235, 'width': 395, 'height': 20},
            {'name': 'suit_number', 'type': 'text', 'left': 580, 'top': 287, 'pdf_top': 287, 'width': 70, 'height': 20},
            {'name': 'year', 'type': 'text', 'left': 705, 'top': 287, 'pdf_top': 287, 'width': 25, 'height': 20},

            # Cause Title
            {'name': 'plaintiff_name', 'type': 'text', 'left': 143, 'top': 323, 'pdf_top': 323, 'width': 487, 'height': 20},
            {'name': 'defendant_name', 'type': 'text', 'left': 143, 'top': 396, 'pdf_top': 396, 'width': 472, 'height': 20},

            # Rows 1 to 6
            {'name': 'doc_sno_0', 'type': 'text', 'left': 144, 'top': 765, 'pdf_top': 765, 'width': 48, 'height': 20},
            {'name': 'doc_desc_0', 'type': 'text', 'left': 196, 'top': 765, 'pdf_top': 765, 'width': 150, 'height': 20},
            {'name': 'doc_proof_0', 'type': 'text', 'left': 351, 'top': 765, 'pdf_top': 765, 'width': 102, 'height': 20},
            {'name': 'doc_status_0', 'type': 'text', 'left': 458, 'top': 765, 'pdf_top': 765, 'width': 163, 'height': 20},
            {'name': 'doc_remarks_0', 'type': 'text', 'left': 626, 'top': 765, 'pdf_top': 765, 'width': 74, 'height': 20},

            {'name': 'doc_sno_1', 'type': 'text', 'left': 144, 'top': 815, 'pdf_top': 815, 'width': 48, 'height': 20},
            {'name': 'doc_desc_1', 'type': 'text', 'left': 196, 'top': 815, 'pdf_top': 815, 'width': 150, 'height': 20},
            {'name': 'doc_proof_1', 'type': 'text', 'left': 351, 'top': 815, 'pdf_top': 815, 'width': 102, 'height': 20},
            {'name': 'doc_status_1', 'type': 'text', 'left': 458, 'top': 815, 'pdf_top': 815, 'width': 163, 'height': 20},
            {'name': 'doc_remarks_1', 'type': 'text', 'left': 626, 'top': 815, 'pdf_top': 815, 'width': 74, 'height': 20},

            {'name': 'doc_sno_2', 'type': 'text', 'left': 144, 'top': 865, 'pdf_top': 865, 'width': 48, 'height': 20},
            {'name': 'doc_desc_2', 'type': 'text', 'left': 196, 'top': 865, 'pdf_top': 865, 'width': 150, 'height': 20},
            {'name': 'doc_proof_2', 'type': 'text', 'left': 351, 'top': 865, 'pdf_top': 865, 'width': 102, 'height': 20},
            {'name': 'doc_status_2', 'type': 'text', 'left': 458, 'top': 865, 'pdf_top': 865, 'width': 163, 'height': 20},
            {'name': 'doc_remarks_2', 'type': 'text', 'left': 626, 'top': 865, 'pdf_top': 865, 'width': 74, 'height': 20},

            {'name': 'doc_sno_3', 'type': 'text', 'left': 144, 'top': 915, 'pdf_top': 915, 'width': 48, 'height': 20},
            {'name': 'doc_desc_3', 'type': 'text', 'left': 196, 'top': 915, 'pdf_top': 915, 'width': 150, 'height': 20},
            {'name': 'doc_proof_3', 'type': 'text', 'left': 351, 'top': 915, 'pdf_top': 915, 'width': 102, 'height': 20},
            {'name': 'doc_status_3', 'type': 'text', 'left': 458, 'top': 915, 'pdf_top': 915, 'width': 163, 'height': 20},
            {'name': 'doc_remarks_3', 'type': 'text', 'left': 626, 'top': 915, 'pdf_top': 915, 'width': 74, 'height': 20},

            {'name': 'doc_sno_4', 'type': 'text', 'left': 144, 'top': 965, 'pdf_top': 965, 'width': 48, 'height': 20},
            {'name': 'doc_desc_4', 'type': 'text', 'left': 196, 'top': 965, 'pdf_top': 965, 'width': 150, 'height': 20},
            {'name': 'doc_proof_4', 'type': 'text', 'left': 351, 'top': 965, 'pdf_top': 965, 'width': 102, 'height': 20},
            {'name': 'doc_status_4', 'type': 'text', 'left': 458, 'top': 965, 'pdf_top': 965, 'width': 163, 'height': 20},
            {'name': 'doc_remarks_4', 'type': 'text', 'left': 626, 'top': 965, 'pdf_top': 965, 'width': 74, 'height': 20},

            {'name': 'doc_sno_5', 'type': 'text', 'left': 144, 'top': 1015, 'pdf_top': 1015, 'width': 48, 'height': 20},
            {'name': 'doc_desc_5', 'type': 'text', 'left': 196, 'top': 1015, 'pdf_top': 1015, 'width': 150, 'height': 20},
            {'name': 'doc_proof_5', 'type': 'text', 'left': 351, 'top': 1015, 'pdf_top': 1015, 'width': 102, 'height': 20},
            {'name': 'doc_status_5', 'type': 'text', 'left': 458, 'top': 1015, 'pdf_top': 1015, 'width': 163, 'height': 20},
            {'name': 'doc_remarks_5', 'type': 'text', 'left': 626, 'top': 1015, 'pdf_top': 1015, 'width': 74, 'height': 20},
        ],
        'signature': {'name': 'advocate_signature', 'left': 450, 'top': 1100, 'width': 250, 'height': 45, 'label': 'Signature of Advocate/Party'}
    },
    'litigant_sms_mail': {
        'filename': 'forms_Litigant Form.html',
        'width': 793.33,
        'height': 1122.67,
        'fields': [
            {'name': 'court_complex', 'type': 'text', 'left': 285, 'top': 148, 'pdf_top': 154, 'width': 435, 'height': 24},
            {'name': 'district', 'type': 'text', 'left': 285, 'top': 181, 'pdf_top': 187, 'width': 435, 'height': 24},
            
            # Litigants Name
            {'name': 'surname', 'type': 'text', 'left': 285, 'top': 214, 'pdf_top': 220, 'width': 140, 'height': 24},
            {'name': 'first_name', 'type': 'text', 'left': 430, 'top': 214, 'pdf_top': 220, 'width': 140, 'height': 24},
            {'name': 'middle_name', 'type': 'text', 'left': 575, 'top': 214, 'pdf_top': 220, 'width': 145, 'height': 24},

            # Date of Birth
            {'name': 'dob_day', 'type': 'text', 'left': 285, 'top': 280, 'pdf_top': 286, 'width': 140, 'height': 24},
            {'name': 'dob_month', 'type': 'text', 'left': 430, 'top': 280, 'pdf_top': 286, 'width': 140, 'height': 24},
            {'name': 'dob_year', 'type': 'text', 'left': 575, 'top': 280, 'pdf_top': 286, 'width': 145, 'height': 24},

            # Address & Contact
            {'name': 'address', 'type': 'textarea', 'left': 285, 'top': 345, 'pdf_top': 350, 'width': 435, 'height': 80},
            {'name': 'address_district', 'type': 'text', 'left': 285, 'top': 447, 'pdf_top': 453, 'width': 435, 'height': 24},
            {'name': 'email', 'type': 'text', 'left': 285, 'top': 480, 'pdf_top': 486, 'width': 435, 'height': 24},
            {'name': 'mobile_no', 'type': 'text', 'left': 285, 'top': 513, 'pdf_top': 519, 'width': 140, 'height': 24},
            {'name': 'phone_no', 'type': 'text', 'left': 575, 'top': 513, 'pdf_top': 519, 'width': 145, 'height': 24},

            # Footer
            {'name': 'date_day', 'type': 'text', 'left': 200, 'top': 610, 'pdf_top': 618, 'width': 28, 'height': 20},
            {'name': 'date_month', 'type': 'text', 'left': 250, 'top': 610, 'pdf_top': 618, 'width': 28, 'height': 20},
            {'name': 'date_year', 'type': 'text', 'left': 310, 'top': 610, 'pdf_top': 618, 'width': 24, 'height': 20},
        ],
        'signature': {'name': 'litigant_signature', 'left': 480, 'top': 635, 'width': 220, 'height': 45, 'label': 'Signature of Litigant'}
    },
    'memo_appearance': {
        'filename': 'forms_Memo of Appearance.html',
        'width': 816,
        'height': 1248,
        'fields': [
            # Header
            {'name': 'court_name', 'type': 'text', 'left': 250, 'top': 286, 'pdf_top': 286, 'width': 470, 'height': 20},
            
            # Cause Title
            {'name': 'plaintiff_name', 'type': 'text', 'left': 200, 'top': 359, 'pdf_top': 359, 'width': 520, 'height': 20},
            {'name': 'defendant_name', 'type': 'text', 'left': 143, 'top': 470, 'pdf_top': 470, 'width': 577, 'height': 20},

            # Body
            {'name': 'party_represented_line1', 'type': 'text', 'left': 545, 'top': 543, 'pdf_top': 543, 'width': 175, 'height': 20},
            {'name': 'party_represented_line2', 'type': 'text', 'left': 143, 'top': 617, 'pdf_top': 617, 'width': 577, 'height': 20},
            {'name': 'party_represented_line3', 'type': 'text', 'left': 143, 'top': 690, 'pdf_top': 690, 'width': 577, 'height': 20},

            {'name': 'authorized_by_line1', 'type': 'text', 'left': 385, 'top': 764, 'pdf_top': 764, 'width': 335, 'height': 20},
            {'name': 'authorized_by_line2', 'type': 'text', 'left': 143, 'top': 838, 'pdf_top': 838, 'width': 577, 'height': 20},

            # Footer
            {'name': 'date', 'type': 'text', 'left': 195, 'top': 966, 'pdf_top': 966, 'width': 180, 'height': 20},
        ],
        'signature': {'name': 'advocate_signature', 'left': 500, 'top': 900, 'width': 220, 'height': 50, 'label': 'Signature of Advocate'}
    },
    'memo_appearance_6': {
        'filename': 'forms_Memorandum of Appearance form_6.html',
        'width': 816,
        'height': 1056,
        'fields': [
            # Header
            {'name': 'court_name', 'type': 'text', 'left': 220, 'top': 357, 'pdf_top': 357, 'width': 500, 'height': 20},
            
            # Cause Title
            {'name': 'plaintiff_name', 'type': 'text', 'left': 140, 'top': 396, 'pdf_top': 396, 'width': 580, 'height': 20},
            {'name': 'defendant_name', 'type': 'text', 'left': 96, 'top': 550, 'pdf_top': 550, 'width': 624, 'height': 20},

            # Body
            {'name': 'party_represented_line1', 'type': 'text', 'left': 540, 'top': 573, 'pdf_top': 573, 'width': 180, 'height': 20},
            {'name': 'party_represented_line2', 'type': 'text', 'left': 96, 'top': 609, 'pdf_top': 609, 'width': 624, 'height': 20},
            {'name': 'party_represented_line3', 'type': 'text', 'left': 96, 'top': 645, 'pdf_top': 645, 'width': 624, 'height': 20},

            {'name': 'authorized_by_line1', 'type': 'text', 'left': 380, 'top': 680, 'pdf_top': 680, 'width': 340, 'height': 20},
            {'name': 'authorized_by_line2', 'type': 'text', 'left': 96, 'top': 716, 'pdf_top': 716, 'width': 624, 'height': 20},

            # Footer
            {'name': 'date', 'type': 'text', 'left': 145, 'top': 788, 'pdf_top': 788, 'width': 180, 'height': 20},
        ],
        'signature': {'name': 'advocate_signature', 'left': 550, 'top': 830, 'width': 170, 'height': 50, 'label': 'Signature of Advocate'}
    },
    'notice_produce': {
        'filename': 'notice_to_produce_document.html',
        'width': 794,
        'height': 1123,
        'is_semantic_form': True,
        'fields': [],
        'signatures': [
            {'name': 'plaintiff_advocate_signature', 'page': 0, 'left': 68, 'top': 940, 'width': 260, 'height': 52, 'label': 'Advocate for Plaintiff', 'type': 'advocate'},
            {'name': 'defendant_advocate_signature', 'page': 0, 'left': 466, 'top': 940, 'width': 260, 'height': 52, 'label': 'Advocate for Defendant / Receiver', 'type': 'custom'},
        ],
        'signature': {'name': 'plaintiff_advocate_signature', 'page': 0, 'left': 68, 'top': 940, 'width': 260, 'height': 52, 'label': 'Advocate for Plaintiff', 'type': 'advocate'}
    },
    'notice_to_produce_document': {
        'filename': 'notice_to_produce_document.html',
        'width': 794,
        'height': 1123,
        'is_semantic_form': True,
        'fields': [],
        'signatures': [
            {'name': 'plaintiff_advocate_signature', 'page': 0, 'left': 68, 'top': 940, 'width': 260, 'height': 52, 'label': 'Advocate for Plaintiff', 'type': 'advocate'},
            {'name': 'defendant_advocate_signature', 'page': 0, 'left': 466, 'top': 940, 'width': 260, 'height': 52, 'label': 'Advocate for Defendant / Receiver', 'type': 'custom'},
        ],
        'signature': {'name': 'plaintiff_advocate_signature', 'page': 0, 'left': 68, 'top': 940, 'width': 260, 'height': 52, 'label': 'Advocate for Plaintiff', 'type': 'advocate'}
    },
    'personal_bail': {
        'filename': 'forms_Personal bail bond form.html',
        'width': 816,
        'height': 1056,
        'fields': [
            # PAGE 0 - Header & Case Details
            {'name': 'court_name', 'page': 0, 'type': 'text', 'left': 210, 'top': 163, 'pdf_top': 163, 'width': 515, 'height': 20},
            {'name': 'police_station', 'page': 0, 'type': 'text', 'left': 145, 'top': 199, 'pdf_top': 199, 'width': 255, 'height': 20},
            {'name': 'under_section', 'page': 0, 'type': 'text', 'left': 145, 'top': 235, 'pdf_top': 235, 'width': 255, 'height': 20},
            {'name': 'fir_no', 'page': 0, 'type': 'text', 'left': 155, 'top': 271, 'pdf_top': 271, 'width': 245, 'height': 20},

            # PAGE 0 - Personal Bond
            {'name': 'accused_name', 'page': 0, 'type': 'text', 'left': 115, 'top': 342, 'pdf_top': 342, 'width': 205, 'height': 20},
            {'name': 'father_name', 'page': 0, 'type': 'text', 'left': 455, 'top': 342, 'pdf_top': 342, 'width': 270, 'height': 20},
            {'name': 'accused_address', 'page': 0, 'type': 'text', 'left': 125, 'top': 365, 'pdf_top': 365, 'width': 550, 'height': 20},
            {'name': 'acquittal_date', 'page': 0, 'type': 'text', 'left': 365, 'top': 387, 'pdf_top': 387, 'width': 140, 'height': 20},
            {'name': 'fir_no_repeat', 'page': 0, 'type': 'text', 'left': 96, 'top': 410, 'pdf_top': 410, 'width': 140, 'height': 20},
            {'name': 'police_station_repeat', 'page': 0, 'type': 'text', 'left': 270, 'top': 410, 'pdf_top': 410, 'width': 155, 'height': 20},
            {'name': 'under_section_repeat', 'page': 0, 'type': 'text', 'left': 450, 'top': 410, 'pdf_top': 410, 'width': 115, 'height': 20},
            {'name': 'bond_amount', 'page': 0, 'type': 'text', 'left': 460, 'top': 500, 'pdf_top': 500, 'width': 265, 'height': 20},
            {'name': 'bond_date', 'page': 0, 'type': 'text', 'left': 140, 'top': 571, 'pdf_top': 571, 'width': 150, 'height': 20},

            # PAGE 0 - Surety Bond
            {'name': 'surety_name', 'page': 0, 'type': 'text', 'left': 115, 'top': 678, 'pdf_top': 678, 'width': 155, 'height': 20},
            {'name': 'surety_father', 'page': 0, 'type': 'text', 'left': 350, 'top': 678, 'pdf_top': 678, 'width': 200, 'height': 20},
            {'name': 'surety_address_line1', 'page': 0, 'type': 'text', 'left': 590, 'top': 678, 'pdf_top': 678, 'width': 135, 'height': 20},
            {'name': 'surety_address_line2', 'page': 0, 'type': 'text', 'left': 96, 'top': 701, 'pdf_top': 701, 'width': 335, 'height': 20},
            {'name': 'surety_accused_name', 'page': 0, 'type': 'text', 'left': 96, 'top': 723, 'pdf_top': 723, 'width': 210, 'height': 20},
            {'name': 'surety_accused_father', 'page': 0, 'type': 'text', 'left': 340, 'top': 723, 'pdf_top': 723, 'width': 210, 'height': 20},
            {'name': 'surety_bond_amount', 'page': 0, 'type': 'text', 'left': 260, 'top': 791, 'pdf_top': 791, 'width': 200, 'height': 20},
            {'name': 'surety_day', 'page': 0, 'type': 'text', 'left': 170, 'top': 827, 'pdf_top': 827, 'width': 170, 'height': 20},
            {'name': 'surety_month', 'page': 0, 'type': 'text', 'left': 400, 'top': 827, 'pdf_top': 827, 'width': 150, 'height': 20},
            {'name': 'surety_year', 'page': 0, 'type': 'text', 'left': 585, 'top': 827, 'pdf_top': 827, 'width': 40, 'height': 20},

            # PAGE 1 - Affidavit
            {'name': 'aff_deponent_name', 'page': 1, 'type': 'text', 'left': 110, 'top': 150, 'pdf_top': 150, 'width': 250, 'height': 20},
            {'name': 'aff_parent_name', 'page': 1, 'type': 'text', 'left': 500, 'top': 150, 'pdf_top': 150, 'width': 225, 'height': 20},
            {'name': 'aff_age', 'page': 1, 'type': 'text', 'left': 170, 'top': 170, 'pdf_top': 170, 'width': 70, 'height': 20},
            {'name': 'aff_address', 'page': 1, 'type': 'text', 'left': 275, 'top': 170, 'pdf_top': 170, 'width': 450, 'height': 20},
            {'name': 'aff_ration_card', 'page': 1, 'type': 'text', 'left': 675, 'top': 225, 'pdf_top': 225, 'width': 50, 'height': 20},
            {'name': 'aff_election_card', 'page': 1, 'type': 'text', 'left': 350, 'top': 245, 'pdf_top': 245, 'width': 240, 'height': 20},
            {'name': 'aff_accused_relation', 'page': 1, 'type': 'text', 'left': 240, 'top': 266, 'pdf_top': 266, 'width': 460, 'height': 20},
            {'name': 'aff_profession', 'page': 1, 'type': 'text', 'left': 330, 'top': 328, 'pdf_top': 328, 'width': 180, 'height': 20},
            {'name': 'aff_work_place', 'page': 1, 'type': 'text', 'left': 540, 'top': 328, 'pdf_top': 328, 'width': 185, 'height': 20},
            {'name': 'aff_tc_no', 'page': 1, 'type': 'text', 'left': 195, 'top': 348, 'pdf_top': 348, 'width': 170, 'height': 20},
            {'name': 'aff_monthly_income', 'page': 1, 'type': 'text', 'left': 450, 'top': 348, 'pdf_top': 348, 'width': 180, 'height': 20},
            {'name': 'aff_household_val', 'page': 1, 'type': 'text', 'left': 540, 'top': 369, 'pdf_top': 369, 'width': 185, 'height': 20},
            {'name': 'aff_prop_no', 'page': 1, 'type': 'text', 'left': 540, 'top': 390, 'pdf_top': 390, 'width': 185, 'height': 20},
            {'name': 'aff_prop_sqyards', 'page': 1, 'type': 'text', 'left': 215, 'top': 410, 'pdf_top': 410, 'width': 150, 'height': 20},
            {'name': 'aff_prop_address', 'page': 1, 'type': 'text', 'left': 480, 'top': 410, 'pdf_top': 410, 'width': 245, 'height': 20},
            {'name': 'aff_prop_val', 'page': 1, 'type': 'text', 'left': 290, 'top': 430, 'pdf_top': 430, 'width': 170, 'height': 20},
            {'name': 'aff_fdr_no', 'page': 1, 'type': 'text', 'left': 280, 'top': 492, 'pdf_top': 492, 'width': 210, 'height': 20},
            {'name': 'aff_fdr_bank', 'page': 1, 'type': 'text', 'left': 560, 'top': 492, 'pdf_top': 492, 'width': 165, 'height': 20},
            {'name': 'aff_fdr_amount', 'page': 1, 'type': 'text', 'left': 195, 'top': 513, 'pdf_top': 513, 'width': 170, 'height': 20},
            {'name': 'aff_vehicle_no', 'page': 1, 'type': 'text', 'left': 275, 'top': 533, 'pdf_top': 533, 'width': 140, 'height': 20},
            {'name': 'aff_vehicle_make', 'page': 1, 'type': 'text', 'left': 460, 'top': 533, 'pdf_top': 533, 'width': 120, 'height': 20},
            {'name': 'aff_vehicle_rc', 'page': 1, 'type': 'text', 'left': 635, 'top': 533, 'pdf_top': 533, 'width': 90, 'height': 20},
            {'name': 'aff_vehicle_val', 'page': 1, 'type': 'text', 'left': 430, 'top': 554, 'pdf_top': 554, 'width': 170, 'height': 20},
            {'name': 'aff_veri_day', 'page': 1, 'type': 'text', 'left': 245, 'top': 707, 'pdf_top': 707, 'width': 125, 'height': 20},
            {'name': 'aff_veri_year', 'page': 1, 'type': 'text', 'left': 440, 'top': 707, 'pdf_top': 707, 'width': 40, 'height': 20},
        ],
        'signatures': [
            {'name': 'accused_signature', 'page': 0, 'left': 530, 'top': 550, 'width': 190, 'height': 45, 'label': 'Signature of Accused', 'type': 'client'},
            {'name': 'surety_signature', 'page': 0, 'left': 430, 'top': 880, 'width': 220, 'height': 45, 'label': 'Signature of Surety', 'type': 'custom'},
            {'name': 'deponent_signature', 'page': 1, 'left': 520, 'top': 630, 'width': 200, 'height': 45, 'label': 'Signature of Deponent', 'type': 'custom'},
            {'name': 'verification_signature', 'page': 1, 'left': 520, 'top': 760, 'width': 200, 'height': 45, 'label': 'Signature of Deponent (Verification)', 'type': 'custom'}
        ]
    },
    'process_fee_form': {
        'filename': 'process_fee_form_2.html',
        'width': 794,
        'height': 1123,
        'is_semantic_form': True,
        'fields': [],
        'signatures': [
            {'name': 'advocate_signature', 'page': 0, 'left': 70, 'top': 960, 'width': 260, 'height': 52, 'label': 'Signature of Advocate', 'type': 'advocate'},
            {'name': 'ahlmad_signature', 'page': 0, 'left': 464, 'top': 960, 'width': 260, 'height': 52, 'label': 'Ahlmad / Asstt. Ahlmad', 'type': 'custom'},
        ],
        'signature': {'name': 'advocate_signature', 'page': 0, 'left': 70, 'top': 960, 'width': 260, 'height': 52, 'label': 'Signature of Advocate', 'type': 'advocate'}
    },
    'process_fee_form_2': {
        'filename': 'process_fee_form_2.html',
        'width': 794,
        'height': 1123,
        'is_semantic_form': True,
        'fields': [],
        'signatures': [
            {'name': 'advocate_signature', 'page': 0, 'left': 70, 'top': 960, 'width': 260, 'height': 52, 'label': 'Signature of Advocate', 'type': 'advocate'},
            {'name': 'ahlmad_signature', 'page': 0, 'left': 464, 'top': 960, 'width': 260, 'height': 52, 'label': 'Ahlmad / Asstt. Ahlmad', 'type': 'custom'},
        ],
        'signature': {'name': 'advocate_signature', 'page': 0, 'left': 70, 'top': 960, 'width': 260, 'height': 52, 'label': 'Signature of Advocate', 'type': 'advocate'}
    },
    'process_fee': {
        'filename': 'process_fee_form_1.html',
        'width': 794,
        'height': 1123,
        'is_semantic_form': True,
        'fields': [],
        'signatures': [
            {'name': 'received_signature', 'page': 0, 'left': 70, 'top': 960, 'width': 260, 'height': 52, 'label': 'Received P.Fee Form', 'type': 'custom'},
            {'name': 'advocate_signature', 'page': 0, 'left': 464, 'top': 960, 'width': 260, 'height': 52, 'label': 'Signature of Advocate', 'type': 'advocate'},
        ],
        'signature': {'name': 'advocate_signature', 'page': 0, 'left': 464, 'top': 960, 'width': 260, 'height': 52, 'label': 'Signature of Advocate', 'type': 'advocate'}
    },
    'process_fee_form_1': {
        'filename': 'process_fee_form_1.html',
        'width': 794,
        'height': 1123,
        'is_semantic_form': True,
        'fields': [],
        'signatures': [
            {'name': 'received_signature', 'page': 0, 'left': 70, 'top': 960, 'width': 260, 'height': 52, 'label': 'Received P.Fee Form', 'type': 'custom'},
            {'name': 'advocate_signature', 'page': 0, 'left': 464, 'top': 960, 'width': 260, 'height': 52, 'label': 'Signature of Advocate', 'type': 'advocate'},
        ],
        'signature': {'name': 'advocate_signature', 'page': 0, 'left': 464, 'top': 960, 'width': 260, 'height': 52, 'label': 'Signature of Advocate', 'type': 'advocate'}
    },
    'surety_bond': {
        'filename': 'forms_Suriety bond.html',
        'width': 816,
        'height': 1056,
        'fields': [
            {'name': 'surety_name', 'type': 'text', 'left': 220, 'top': 222, 'pdf_top': 222, 'width': 520, 'height': 20},
            {'name': 'surety_address', 'type': 'text', 'left': 120, 'top': 255, 'pdf_top': 255, 'width': 280, 'height': 20},
            {'name': 'accused_name', 'type': 'text', 'left': 120, 'top': 321, 'pdf_top': 321, 'width': 350, 'height': 20},
            {'name': 'accused_address', 'type': 'text', 'left': 510, 'top': 321, 'pdf_top': 321, 'width': 230, 'height': 20},
            {'name': 'court_name', 'type': 'text', 'left': 120, 'top': 354, 'pdf_top': 354, 'width': 250, 'height': 20},
            {'name': 'bond_amount_num', 'type': 'text', 'left': 420, 'top': 519, 'pdf_top': 519, 'width': 240, 'height': 20},
            {'name': 'bond_amount_words', 'type': 'text', 'left': 190, 'top': 552, 'pdf_top': 552, 'width': 310, 'height': 20},
            {'name': 'dated_day', 'type': 'text', 'left': 195, 'top': 585, 'pdf_top': 585, 'width': 225, 'height': 20},
            {'name': 'dated_month', 'type': 'text', 'left': 520, 'top': 585, 'pdf_top': 585, 'width': 100, 'height': 20},
            {'name': 'dated_year', 'type': 'text', 'left': 635, 'top': 585, 'pdf_top': 585, 'width': 45, 'height': 20},
        ],
        'signature': {'name': 'surety_signature', 'left': 430, 'top': 640, 'width': 220, 'height': 50, 'label': 'Signature of Surety', 'type': 'custom'}
    },
    'vakalatnama_form': {
        'filename': 'forms_Vakalatnama form.html',
        'width': 816,
        'height': 1344,
        'fields': [
            {'name': 'court_name', 'type': 'text', 'left': 210, 'top': 118, 'pdf_top': 122, 'width': 518, 'height': 20},
            {'name': 'case_number', 'type': 'text', 'left': 190, 'top': 148, 'pdf_top': 152, 'width': 230, 'height': 20},
            {'name': 'jurisdiction', 'type': 'text', 'left': 430, 'top': 148, 'pdf_top': 152, 'width': 175, 'height': 20},
            {'name': 'case_year', 'type': 'text', 'left': 690, 'top': 148, 'pdf_top': 152, 'width': 40, 'height': 20},
            {'name': 'plaintiff_name', 'type': 'text', 'left': 96, 'top': 207, 'pdf_top': 211, 'width': 440, 'height': 20},
            {'name': 'defendant_name', 'type': 'text', 'left': 96, 'top': 296, 'pdf_top': 300, 'width': 380, 'height': 20},
            {'name': 'client_name_decl', 'type': 'text', 'left': 335, 'top': 312, 'pdf_top': 316, 'width': 393, 'height': 20},
            {'name': 'client_address_decl', 'type': 'text', 'left': 96, 'top': 329, 'pdf_top': 333, 'width': 632, 'height': 20},
            {'name': 'advocate_name', 'type': 'text', 'left': 205, 'top': 358, 'pdf_top': 362, 'width': 523, 'height': 20},
            {'name': 'advocate_details', 'type': 'text', 'left': 96, 'top': 388, 'pdf_top': 392, 'width': 474, 'height': 20},
            {'name': 'dated_day', 'type': 'text', 'left': 270, 'top': 1098, 'pdf_top': 1102, 'width': 145, 'height': 20},
            {'name': 'dated_month', 'type': 'text', 'left': 465, 'top': 1098, 'pdf_top': 1102, 'width': 115, 'height': 20},
            {'name': 'dated_year', 'type': 'text', 'left': 605, 'top': 1098, 'pdf_top': 1102, 'width': 35, 'height': 20},
        ],
        'signatures': [
            {'name': 'advocate_signature', 'left': 96, 'top': 1115, 'width': 180, 'height': 45, 'label': 'Signature of Advocate', 'type': 'advocate'},
            {'name': 'client_signature', 'left': 510, 'top': 1115, 'width': 180, 'height': 45, 'label': 'Signature of Client', 'type': 'client'}
        ]
    },
    'vakalatnama': {
        'filename': 'forms_Vakalatnama.html',
        'width': 816,
        'height': 1248,
        'fields': [
            # Page 0
            {'name': 'court_name', 'page': 0, 'type': 'text', 'left': 265, 'top': 164, 'pdf_top': 164, 'width': 440, 'height': 20},
            {'name': 'case_number', 'page': 0, 'type': 'text', 'left': 290, 'top': 200, 'pdf_top': 200, 'width': 295, 'height': 20},
            {'name': 'case_year', 'page': 0, 'type': 'text', 'left': 685, 'top': 219, 'pdf_top': 219, 'width': 35, 'height': 20},
            {'name': 'plaintiff_name', 'page': 0, 'type': 'text', 'left': 143, 'top': 256, 'pdf_top': 256, 'width': 382, 'height': 20},
            {'name': 'defendant_name', 'page': 0, 'type': 'text', 'left': 143, 'top': 348, 'pdf_top': 348, 'width': 342, 'height': 20},
            {'name': 'client_name_decl', 'page': 0, 'type': 'text', 'left': 545, 'top': 403, 'pdf_top': 403, 'width': 160, 'height': 20},
            {'name': 'client_address_decl', 'page': 0, 'type': 'text', 'left': 143, 'top': 440, 'pdf_top': 440, 'width': 562, 'height': 20},
            {'name': 'advocate_name', 'page': 0, 'type': 'text', 'left': 265, 'top': 458, 'pdf_top': 458, 'width': 315, 'height': 20},

            # Page 1
            {'name': 'dated_day', 'page': 1, 'type': 'text', 'left': 595, 'top': 440, 'pdf_top': 440, 'width': 110, 'height': 20},
            {'name': 'dated_month', 'page': 1, 'type': 'text', 'left': 190, 'top': 458, 'pdf_top': 458, 'width': 110, 'height': 20},
            {'name': 'dated_year', 'page': 1, 'type': 'text', 'left': 350, 'top': 458, 'pdf_top': 458, 'width': 40, 'height': 20},
        ],
        'signatures': [
            {'name': 'advocate_signature', 'page': 1, 'left': 130, 'top': 515, 'width': 160, 'height': 50, 'label': 'Signature of Advocate', 'type': 'advocate'},
            {'name': 'client_signature', 'page': 1, 'left': 410, 'top': 515, 'width': 160, 'height': 50, 'label': 'Signature of Client', 'type': 'client'}
        ]
    }
}

def get_template_key(name):
    if not name:
        return None
    raw_key = str(name).strip().lower()
    if raw_key in FORM_DEFINITIONS:
        return raw_key

    n = raw_key.replace('_', ' ').replace('-', ' ')
    if 'orissa' in n or 'annexure' in n or 'drafting' in n:
        return None
    if 'ca form' in n or 'ca 7' in n or 'certified copy' in n:
        return 'ca_form_7'
    elif 'case info' in n or 'information format' in n:
        return 'case_info'
    elif '138' in n:
        return 'checklist_138'
    elif 'check list' in n or 'checklist' in n:
        return 'checklist'
    elif 'commercial' in n:
        return 'commercial_court'
    elif 'e court' in n or 'ecourt' in n:
        return 'ecourt_fee'
    elif 'filing form' in n:
        return 'filing_form'
    elif 'litigant' in n or 'sms' in n:
        return 'litigant_sms_mail'
    elif 'index' in n:
        return 'index_form'
    elif 'inspection' in n:
        return 'inspection_form'
    elif 'list of doc' in n or 'document list' in n:
        return 'list_of_documents'
    elif 'memo' in n and '6' in n:
        return 'memo_appearance_6'
    elif 'memo' in n or 'appearance' in n:
        return 'memo_appearance'
    elif 'notice' in n or 'produce' in n:
        return 'notice_produce'
    elif 'personal bail' in n or '437' in n:
        return 'personal_bail'
    elif 'talbana' in n or 'process fee form' in n or 'process_fee_form_2' in n:
        return 'process_fee_form'
    elif 'process fee' in n or 'process_fee_form_1' in n or 'compact' in n:
        return 'process_fee'
    elif 'suriety' in n or 'surety' in n:
        return 'surety_bond'
    elif 'form no 45' in n or 'bail bond 0' in n or 'form 45' in n:
        return 'bail_45'
    elif 'bail' in n:
        return 'bail'
    elif 'vakalatnama form' in n:
        return 'vakalatnama_form'
    elif 'vakalatnama' in n:
        return 'vakalatnama'
    elif 'advocate' in n:
        return 'advocate'
    elif 'address' in n:
        return 'address'
    return None

def _resolve_signatures(defn, field_values, form_obj):
    """
    Consolidates template signature slots and placed signatures without creating duplicates.
    Prioritizes placed coordinates/page over template defaults.
    """
    all_sig_defs = []
    if defn.get('signatures'):
        for s in defn['signatures']:
            if s:
                all_sig_defs.append(dict(s))
    elif defn.get('signature'):
        all_sig_defs.append(dict(defn['signature']))

    raw_placed = field_values.get('placed_signatures', []) if isinstance(field_values, dict) else []
    placed_sigs = []
    if isinstance(raw_placed, dict):
        for k, v in raw_placed.items():
            if isinstance(v, dict):
                item = dict(v)
                if 'id' not in item and 'name' not in item:
                    item['id'] = k
                    item['name'] = k
                if 'image_url' not in item and 'data_url' in item:
                    item['image_url'] = item['data_url']
                placed_sigs.append(item)
            elif isinstance(v, str):
                placed_sigs.append({'id': k, 'name': k, 'image_url': v})
    elif isinstance(raw_placed, list):
        for v in raw_placed:
            if isinstance(v, dict):
                item = dict(v)
                if 'image_url' not in item and 'data_url' in item:
                    item['image_url'] = item['data_url']
                placed_sigs.append(item)
    offsets = field_values.get('signature_offsets', {}) if isinstance(field_values, dict) else {}

    def is_matching_slot(slot, ps):
        s_name = str(slot.get('name') or slot.get('id') or '').lower()
        s_id = str(slot.get('id') or slot.get('name') or '').lower()
        s_type = str(slot.get('type') or '').lower()
        if not s_type:
            if 'client' in s_name or 'accused' in s_name or 'litigant' in s_name:
                s_type = 'client'
            elif 'advocate' in s_name or 'counsel' in s_name:
                s_type = 'advocate'
            else:
                s_type = 'custom'
            slot['type'] = s_type

        ps_id = str(ps.get('id') or '').lower()
        ps_name = str(ps.get('name') or '').lower()
        ps_type = str(ps.get('type') or '').lower()

        # Dynamic / added signatures with unique generated IDs (e.g. 'sig_...') must NEVER match a template slot
        if ps_id.startswith('sig_') or ps_name.startswith('sig_'):
            return False

        if ps_id and (ps_id == s_name or ps_id == s_id):
            return True
        if ps_name and (ps_name == s_name or ps_name == s_id):
            return True
        if s_type in ['advocate', 'client'] and (ps_id == f'{s_type}_primary' or ps_id == f'{s_type}_signature' or ps_name == f'{s_type}_signature'):
            return True
        return False

    # 1. Update existing template slots with placed info or offsets
    matched_ps_ids = set()
    for slot in all_sig_defs:
        s_name = slot.get('name', '')
        s_id = slot.get('id', s_name)
        s_type = slot.get('type', 'custom')

        for ps in placed_sigs:
            if ps.get('id') in matched_ps_ids or ps.get('name') in matched_ps_ids:
                continue
            if is_matching_slot(slot, ps):
                if ps.get('id'): matched_ps_ids.add(str(ps.get('id')))
                if ps.get('name'): matched_ps_ids.add(str(ps.get('name')))
                if 'x' in ps or 'left' in ps:
                    slot['left'] = ps.get('x', ps.get('left'))
                if 'y' in ps or 'top' in ps:
                    slot['top'] = ps.get('y', ps.get('top'))
                if 'width' in ps:
                    slot['width'] = ps.get('width')
                if 'height' in ps:
                    slot['height'] = ps.get('height')
                if 'page' in ps:
                    try:
                        slot['page'] = int(ps.get('page', 0))
                    except (ValueError, TypeError):
                        slot['page'] = 0
                if ps.get('image_url'):
                    slot['image_url'] = ps.get('image_url')
                break

        override_pos = offsets.get(s_id) or offsets.get(s_name) or offsets.get(s_type)
        if override_pos and isinstance(override_pos, dict):
            if 'x' in override_pos:
                slot['left'] = override_pos['x']
            if 'y' in override_pos:
                slot['top'] = override_pos['y']
            if 'width' in override_pos:
                slot['width'] = override_pos['width']
            if 'height' in override_pos:
                slot['height'] = override_pos['height']
            if 'page' in override_pos:
                try:
                    slot['page'] = int(override_pos['page'])
                except (ValueError, TypeError):
                    slot['page'] = 0

    # 2. Append un-matched placed signatures (custom signatures added dynamically)
    for ps in placed_sigs:
        ps_id = str(ps.get('id', ''))
        ps_name = str(ps.get('name', ''))
        if ps_id not in matched_ps_ids and ps_name not in matched_ps_ids:
            try:
                sig_p = int(ps.get('page', 0))
            except (ValueError, TypeError):
                sig_p = 0
            all_sig_defs.append({
                'id': ps.get('id', f"sig_{ps.get('name', 'custom')}"),
                'name': ps.get('name', ps.get('id', 'custom_signature')),
                'label': ps.get('label', 'Signature'),
                'type': ps.get('type', 'custom'),
                'left': ps.get('x', ps.get('left', 450)),
                'top': ps.get('y', ps.get('top', 700)),
                'width': ps.get('width', 160),
                'height': ps.get('height', 50),
                'page': sig_p,
                'image_url': ps.get('image_url')
            })

    # 3. Resolve images for all signature slots
    for sig_item in all_sig_defs:
        s_name = str(sig_item.get('name', ''))
        s_id = str(sig_item.get('id', s_name))
        s_type = str(sig_item.get('type', 'custom'))

        if not sig_item.get('image_url'):
            for ps in placed_sigs:
                p_id = str(ps.get('id', ''))
                p_name = str(ps.get('name', ''))
                if (p_id and p_id == s_id) or (p_name and p_name == s_name):
                    sig_item['image_url'] = ps.get('image_url')
                    break

        if not sig_item.get('image_url') and form_obj:
            if s_id in ['advocate_signature', 'advocate_primary'] or s_name == 'advocate_signature':
                adv_sig = getattr(form_obj, 'advocate_signature_image', None)
                if adv_sig and hasattr(adv_sig, 'url'):
                    sig_item['image_url'] = adv_sig.url
            elif s_id in ['client_signature', 'client_primary'] or s_name == 'client_signature':
                cli_sig = getattr(form_obj, 'client_signature_image', None)
                if cli_sig and hasattr(cli_sig, 'url'):
                    sig_item['image_url'] = cli_sig.url

    return all_sig_defs


def render_structured_form_html(content, field_values=None, is_edit_mode=False, form_obj=None):
    """
    Renders an official court form that defines a JSON content_structure (e.g. Orissa High Court,
    Annexure, Blank A4 drafting papers, etc.) into an interactive A4 HTML page with full
    editing, field value persistence, and signature placement support.
    """
    field_values = dict(field_values or {})
    sections = content.get('sections', []) if isinstance(content, dict) else []
    margins = content.get('margins', {}) if isinstance(content, dict) else {}
    top_m = int(margins.get('top', 50))
    bottom_m = int(margins.get('bottom', 50))
    left_m = int(margins.get('left', 50))
    right_m = int(margins.get('right', 50))
    is_landscape = (
        content.get('orientation') == 'landscape' or
        content.get('page_size') == 'A4_LANDSCAPE' or
        (isinstance(content.get('page_size'), str) and 'landscape' in content.get('page_size').lower())
    )
    sheet_w = 1123 if is_landscape else 794
    sheet_h = 794 if is_landscape else 1123
    page_size_str = 'A4 landscape' if is_landscape else 'A4 portrait'

    adv_sig_url = ''
    cli_sig_url = ''
    if form_obj:
        adv_sig = getattr(form_obj, 'advocate_signature_image', None)
        if adv_sig and hasattr(adv_sig, 'url'):
            adv_sig_url = adv_sig.url
        cli_sig = getattr(form_obj, 'client_signature_image', None)
        if cli_sig and hasattr(cli_sig, 'url'):
            cli_sig_url = cli_sig.url

    placed_sigs = field_values.get('placed_signatures', []) if isinstance(field_values.get('placed_signatures'), list) else []
    for ps in placed_sigs:
        if isinstance(ps, dict):
            if ps.get('type') == 'advocate' and ps.get('image_url'):
                adv_sig_url = ps['image_url']
            elif ps.get('type') == 'client' and ps.get('image_url'):
                cli_sig_url = ps['image_url']

    def _get_v(k):
        v = field_values.get(k)
        return str(v) if v is not None else ''

    def _replace_placeholders(text, is_edit):
        if not text:
            return ''
        def _sub(m):
            f_name = m.group(1).strip()
            v = _get_v(f_name)
            esc = html_lib.escape(v)
            if is_edit:
                return (
                    f'<input type="text" class="cf-input" data-field="{f_name}" value="{esc}" '
                    f'placeholder="{f_name.replace("_", " ")}" '
                    f'style="display:inline-block; border:none; border-bottom:2px solid #3b82f6; '
                    f'background:rgba(239,246,255,0.85); color:#1e3a8a; font-weight:700; '
                    f'padding:1px 6px; font-size:inherit; outline:none; border-radius:2px;" />'
                )
            else:
                return f'<span class="cf-filled" style="font-weight:bold; border-bottom:1px solid #000; padding:0 4px;">{esc or "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"}</span>'
        return re.sub(r'\{([^}]+)\}', _sub, str(text))

    body_items = []
    for idx, sec in enumerate(sections):
        st = sec.get('type')
        style = sec.get('style', {}) if isinstance(sec.get('style'), dict) else {}
        size = style.get('size', 14)
        align = style.get('align', 'left')
        bold = 'bold' if style.get('bold') else 'normal'
        italic = 'italic' if style.get('italic') else 'normal'
        underline = 'underline' if style.get('underline') else 'none'
        lh = style.get('line_height', 1.5)

        if st == 'header':
            txt = _replace_placeholders(sec.get('content', ''), is_edit_mode)
            body_items.append(
                f'<h1 style="font-size:{size}px; text-align:{align}; font-weight:{bold}; '
                f'text-decoration:{underline}; text-transform:uppercase; margin:8px 0; color:#000;">{txt}</h1>'
            )
        elif st == 'spacer':
            h = sec.get('height', 15)
            body_items.append(f'<div style="height:{h}px;"></div>')
        elif st == 'paragraph':
            txt = _replace_placeholders(sec.get('content', ''), is_edit_mode)
            body_items.append(
                f'<p style="font-size:{size}px; text-align:{align}; font-weight:{bold}; '
                f'font-style:{italic}; line-height:{lh}; margin:8px 0; color:#111;">{txt}</p>'
            )
        elif st == 'editable_line':
            f_name = sec.get('field', f'line_{idx}')
            prefix = _replace_placeholders(sec.get('prefix', ''), False)
            v = html_lib.escape(_get_v(f_name))
            if is_edit_mode:
                body_items.append(
                    f'<div style="display:flex; align-items:baseline; margin:6px 0; font-size:{size}px;">'
                    f'<span style="margin-right:8px; font-weight:500;">{prefix}</span>'
                    f'<input type="text" class="cf-input" data-field="{f_name}" value="{v}" '
                    f'style="flex:1; border:none; border-bottom:2px solid #3b82f6; background:rgba(239,246,255,0.85); color:#1e3a8a; font-weight:700; padding:2px 6px; outline:none;" /></div>'
                )
            else:
                body_items.append(
                    f'<div style="display:flex; align-items:baseline; margin:6px 0; font-size:{size}px;">'
                    f'<span style="margin-right:8px; font-weight:500;">{prefix}</span>'
                    f'<span style="flex:1; border-bottom:1px solid #000; font-weight:bold;">{v}</span></div>'
                )
        elif st == 'grid_row':
            cols = sec.get('columns', []) if isinstance(sec.get('columns'), list) else []
            col_items = []
            border_st = 'border: 1px solid #000; padding: 8px;' if style.get('border') else ''
            for c_idx, col in enumerate(cols):
                c_flex = col.get('flex', 1)
                c_align = col.get('align', 'left')
                c_field = col.get('field', '')
                c_prefix = _replace_placeholders(col.get('prefix', ''), is_edit_mode).replace('\n', '<br/>')
                
                is_adv_sig = 'advocate' in c_field.lower() or 'advocate' in col.get('prefix', '').lower()
                is_cli_sig = 'client' in c_field.lower() or 'petitioner' in col.get('prefix', '').lower() or 'litigant' in col.get('prefix', '').lower()
                
                sig_img = adv_sig_url if is_adv_sig else (cli_sig_url if is_cli_sig else None)
                sig_markup = ''
                if is_adv_sig or is_cli_sig or 'signature' in c_field.lower():
                    sig_type = 'advocate' if is_adv_sig else 'client'
                    sig_label = 'Advocate Signature' if is_adv_sig else 'Client Signature'
                    if sig_img:
                        sig_markup = f'<div style="margin-bottom:4px;"><img src="{sig_img}" alt="{sig_label}" style="max-height:50px; max-width:160px; object-fit:contain;" /></div>'
                    elif is_edit_mode:
                        sig_markup = f'<div class="cf-sig-box" data-sig-type="{sig_type}" style="border:1.5px dashed #6366f1; background:rgba(99,102,241,0.08); padding:6px 12px; border-radius:4px; font-size:11px; color:#4f46e5; font-weight:600; cursor:pointer; margin-bottom:4px; display:inline-block;">✍ {sig_label}</div>'

                input_part = ''
                if c_field and not (is_adv_sig or is_cli_sig) and is_edit_mode and '{' not in col.get('prefix', ''):
                    c_val = html_lib.escape(_get_v(c_field))
                    input_part = f'<div style="margin-top:4px;"><input type="text" class="cf-input" data-field="{c_field}" value="{c_val}" style="width:100%; border:none; border-bottom:2px solid #3b82f6; background:rgba(239,246,255,0.85); color:#1e3a8a; font-weight:700; padding:2px 6px; outline:none;" /></div>'
                elif c_field and not (is_adv_sig or is_cli_sig) and not is_edit_mode:
                    c_val = html_lib.escape(_get_v(c_field))
                    if c_val:
                        input_part = f'<div style="margin-top:4px; font-weight:bold; border-bottom:1px solid #000;">{c_val}</div>'

                col_items.append(
                    f'<div style="flex:{c_flex}; text-align:{c_align}; padding:4px 8px;">'
                    f'{sig_markup}<div>{c_prefix}</div>{input_part}</div>'
                )
            body_items.append(f'<div style="display:flex; justify-content:space-between; margin:16px 0; {border_st}">{"".join(col_items)}</div>')
        elif st == 'stamp_box':
            body_items.append(
                '<div style="display:flex; justify-content:center; margin:16px 0;">'
                '<div style="width:240px; height:80px; border:2px dashed #6b7280; display:flex; '
                'align-items:center; justify-content:center; font-size:11px; font-weight:bold; '
                'color:#9ca3af; letter-spacing:2px; text-transform:uppercase;">Affix Stamp Here</div></div>'
            )
        elif st == 'signature_block':
            sig_txt = _replace_placeholders(sec.get('content', 'Signature'), False)
            sig_lower = sec.get('content', '').lower()
            is_adv_sig = 'advocate' in sig_lower or 'counsel' in sig_lower
            is_cli_sig = 'client' in sig_lower or 'petitioner' in sig_lower or 'deponent' in sig_lower
            sig_img = adv_sig_url if is_adv_sig else (cli_sig_url if is_cli_sig else None)
            sig_type = 'advocate' if is_adv_sig else 'client'
            sig_label = 'Advocate Signature' if is_adv_sig else 'Client Signature'

            sig_markup = ''
            if sig_img:
                sig_markup = f'<div style="margin-bottom:4px;"><img src="{sig_img}" alt="{sig_label}" style="max-height:55px; max-width:180px; object-fit:contain;" /></div>'
            elif is_edit_mode:
                sig_markup = f'<div class="cf-sig-box" data-sig-type="{sig_type}" style="border:1.5px dashed #6366f1; background:rgba(99,102,241,0.08); padding:6px 12px; border-radius:4px; font-size:11px; color:#4f46e5; font-weight:600; cursor:pointer; margin-bottom:4px; display:inline-block;">✍ {sig_label}</div>'

            body_items.append(
                f'<div style="margin:20px 0; text-align:{align};">'
                f'{sig_markup}<div style="display:inline-block; border-top:2px solid #000; padding-top:4px; min-width:180px; font-weight:600;">{sig_txt}</div></div>'
            )
        elif st == 'dynamic_table':
            cols = sec.get('columns', []) if isinstance(sec.get('columns'), list) else []
            rows_val = sec.get('rows', 1)
            row_h = sec.get('row_height', 40)
            th_cells = "".join([
                f'<th style="border:1px solid #000; padding:6px; background:#f3f4f6; font-size:11px; text-align:center; width:{c.get("width", "auto")};">{c.get("header", "")}</th>'
                for c in cols
            ])
            tr_rows = []
            if isinstance(rows_val, list):
                for row_data in rows_val:
                    if isinstance(row_data, list):
                        td_cells = "".join([f'<td style="border:1px solid #000; padding:6px; font-size:12px;">{cell}</td>' for cell in row_data])
                        tr_rows.append(f'<tr>{td_cells}</tr>')
            else:
                rows_cnt = int(rows_val) if str(rows_val).isdigit() else 1
                for r_idx in range(rows_cnt):
                    td_cells = []
                    for c in cols:
                        c_f = f"{c.get('field')}_{r_idx}"
                        val = html_lib.escape(_get_v(c_f))
                        if is_edit_mode:
                            td_cells.append(
                                f'<td style="border:1px solid #000; padding:0; height:{row_h}px;">'
                                f'<textarea class="cf-textarea" data-field="{c_f}" '
                                f'style="width:100%; height:100%; min-height:{row_h}px; border:none; padding:4px; box-sizing:border-box; font-family:inherit; resize:none;">{val}</textarea></td>'
                            )
                        else:
                            td_cells.append(f'<td style="border:1px solid #000; padding:6px; height:{row_h}px; font-size:12px; vertical-align:top;">{val}</td>')
                    tr_rows.append(f'<tr>{"".join(td_cells)}</tr>')
            body_items.append(f'<table style="width:100%; border-collapse:collapse; margin:12px 0;"><thead><tr>{th_cells}</tr></thead><tbody>{"".join(tr_rows)}</tbody></table>')
        elif st == 'form_grid':
            grid_rows = sec.get('rows', []) if isinstance(sec.get('rows'), list) else []
            rendered_rows = []
            for r in grid_rows:
                cells = r.get('cells', []) if isinstance(r.get('cells'), list) else []
                cell_htmls = []
                for cell in cells:
                    flex = cell.get('flex', 1)
                    lbl = cell.get('label', '')
                    fld = cell.get('field', '')
                    bg = '#f9fafb' if cell.get('background') else '#fff'
                    val = html_lib.escape(_get_v(fld))
                    if is_edit_mode and fld:
                        inp = f'<input type="text" class="cf-input" data-field="{fld}" value="{val}" placeholder="{cell.get("placeholder", "")}" style="flex:1; border:none; border-bottom:1px solid #3b82f6; padding:2px 4px; outline:none;" />'
                    elif fld:
                        inp = f'<span style="font-weight:bold; padding:0 4px;">{val}</span>'
                    else:
                        inp = ''
                    lbl_span = f'<span style="font-size:11px; font-weight:bold; margin-right:6px;">{lbl}</span>' if lbl else ''
                    cell_htmls.append(f'<div style="flex:{flex}; background:{bg}; border-right:1px solid #000; padding:6px; display:flex; align-items:center;">{lbl_span}{inp}</div>')
                rendered_rows.append(f'<div style="display:flex; border-bottom:1px solid #000; min-height:36px;">{"".join(cell_htmls)}</div>')
            body_items.append(f'<div style="border:1px solid #000; margin:12px 0;">{"".join(rendered_rows)}</div>')
        elif st == 'field_group':
            flds = sec.get('fields', []) if isinstance(sec.get('fields'), list) else []
            f_htmls = []
            for f in flds:
                f_name = f.get('name', '')
                f_lbl = f.get('label', '')
                f_type = f.get('type', 'text')
                val = html_lib.escape(_get_v(f_name))
                if is_edit_mode:
                    inp = f'<input type="{f_type}" class="cf-input" data-field="{f_name}" value="{val}" style="border:none; border-bottom:2px solid #3b82f6; background:rgba(239,246,255,0.85); color:#1e3a8a; font-weight:700; padding:2px 6px; outline:none;" />'
                else:
                    inp = f'<span style="font-weight:bold; border-bottom:1px solid #000; padding:0 6px;">{val}</span>'
                f_htmls.append(f'<div style="display:flex; align-items:center; gap:6px;"><span style="font-weight:bold; font-size:13px;">{f_lbl}:</span>{inp}</div>')
            body_items.append(f'<div style="display:flex; gap:24px; margin:12px 0;">{"".join(f_htmls)}</div>')
        elif st == 'textarea':
            f_name = sec.get('field', f'text_{idx}')
            val = html_lib.escape(_get_v(f_name))
            if is_edit_mode:
                body_items.append(f'<div style="margin:12px 0;"><textarea class="cf-textarea" data-field="{f_name}" style="width:100%; min-height:100px; border:1px solid #93c5fd; padding:6px; box-sizing:border-box; font-family:inherit; border-radius:2px;">{val}</textarea></div>')
            else:
                body_items.append(f'<div style="margin:12px 0; white-space:pre-wrap; font-size:13px; line-height:1.5;">{val}</div>')
        elif st == 'character_boxes':
            f_name = sec.get('field', f'char_{idx}')
            lbl = sec.get('label', '')
            sublbl = sec.get('sublabel', '')
            val = html_lib.escape(_get_v(f_name))
            sublbl_span = f' <span style="font-size:10px; color:#6b7280;">({sublbl})</span>' if sublbl else ''
            if is_edit_mode:
                body_items.append(
                    f'<div style="margin:8px 0;">'
                    f'<div style="font-size:11px; font-weight:bold; margin-bottom:2px;">{lbl}{sublbl_span}</div>'
                    f'<input type="text" class="cf-input" data-field="{f_name}" value="{val}" '
                    f'style="width:100%; letter-spacing:3px; font-family:monospace; font-size:13px; font-weight:bold; '
                    f'border:none; border-bottom:2px solid #3b82f6; background:rgba(239,246,255,0.85); color:#1e3a8a; padding:3px 6px;" /></div>'
                )
            else:
                body_items.append(
                    f'<div style="margin:8px 0;">'
                    f'<div style="font-size:11px; font-weight:bold;">{lbl}{sublbl_span}</div>'
                    f'<div style="border-bottom:1px solid #000; letter-spacing:3px; font-family:monospace; font-weight:bold; padding:2px 0;">{val}</div></div>'
                )
        elif st == 'two_column_table':
            left_col = sec.get('left_column', []) if isinstance(sec.get('left_column'), list) else []
            right_col = sec.get('right_column', []) if isinstance(sec.get('right_column'), list) else []
            table_rows = []
            for t_idx, left_text in enumerate(left_col):
                right_text = right_col[t_idx] if t_idx < len(right_col) else ''
                is_field = right_text.startswith('{') and right_text.endswith('}')
                field_name = right_text.strip('{}') if is_field else f'tbl_{idx}_{t_idx}'
                right_val = html_lib.escape(_get_v(field_name) if is_field else right_text)
                if is_edit_mode and is_field:
                    right_markup = f'<input type="text" class="cf-input" data-field="{field_name}" value="{right_val}" style="width:100%; border:none; border-bottom:2px solid #3b82f6; background:rgba(239,246,255,0.85); color:#1e3a8a; font-weight:bold; padding:2px 6px;" />'
                else:
                    right_markup = f'<span style="font-weight:bold; border-bottom:1px solid #000; padding-bottom:1px;">{right_val}</span>'
                table_rows.append(f'<tr><td style="padding:4px 16px 4px 0; text-align:right; font-size:13px; font-weight:500;">{left_text}</td><td style="padding:4px 0; font-size:13px;">{right_markup}</td></tr>')
            body_items.append(f'<table style="margin:12px auto; border-collapse:collapse;"><tbody>{"".join(table_rows)}</tbody></table>')
        elif st == 'page_break':
            body_items.append('<div style="page-break-after:always; height:0;"></div>')

    content_html = "\n".join(body_items)

    edit_scripts = ''
    if is_edit_mode:
        edit_scripts = '''
<script>
(function() {
    function getAllValues() {
        var vals = {};
        var inputs = document.querySelectorAll('[data-field], input[name], textarea[name]');
        for (var i = 0; i < inputs.length; i++) {
            var el = inputs[i];
            var name = el.getAttribute('data-field') || el.getAttribute('name');
            if (name) {
                if (el.type === 'checkbox' || el.type === 'radio') {
                    if (el.checked) vals[name] = el.value;
                } else {
                    vals[name] = el.value;
                }
            }
        }
        return vals;
    }

    function sendPageSize() {
        var p0 = document.getElementById('p0') || document.body;
        var w = p0.offsetWidth || p0.clientWidth || 794;
        var h = p0.offsetHeight || p0.clientHeight || 1123;
        try {
            window.parent.postMessage({ type: 'COURT_FORM_PAGE_SIZE', width: w, height: h }, '*');
        } catch(e) {}
    }

    function broadcastValues() {
        var vals = getAllValues();
        try {
            window.parent.postMessage({ type: 'COURT_FORM_VALUES', values: vals }, '*');
        } catch(e) {}
    }

    function emit(f, v) {
        if (!f) return;
        try {
            window.parent.postMessage({ type: 'COURT_FORM_FIELD_UPDATE', fieldName: f, value: v }, '*');
        } catch(e) {}
    }

    document.addEventListener('input', function(e) {
        if (e.target && (e.target.hasAttribute('data-field') || e.target.hasAttribute('name'))) {
            var name = e.target.getAttribute('data-field') || e.target.getAttribute('name');
            emit(name, e.target.value);
            broadcastValues();
            try {
                window.parent.postMessage({ type: 'COURT_FORM_DIRTY', isDirty: true }, '*');
            } catch(err) {}
        }
    });

    document.addEventListener('change', function(e) {
        broadcastValues();
        try {
            window.parent.postMessage({ type: 'COURT_FORM_DIRTY', isDirty: true }, '*');
        } catch(err) {}
    });

    window.addEventListener('message', function(ev) {
        if (!ev.data) return;
        var msg = ev.data;
        if (msg.type === 'SET_COURT_FORM_FIELD_VALUES' && msg.values) {
            for (var k in msg.values) {
                var inp = document.querySelector('[data-field="' + k + '"]') || document.querySelector('[name="' + k + '"]');
                if (inp) {
                    inp.value = msg.values[k];
                }
            }
        } else if (msg.type === 'GET_COURT_FORM_FIELD_VALUES') {
            broadcastValues();
        } else if (msg.type === 'INJECT_COURT_FORM_SIGNATURE' && msg.signature) {
            var sType = msg.signature.type || 'advocate';
            var box = document.querySelector('.cf-sig-box[data-sig-type="' + sType + '"]');
            if (box && msg.signature.image_url) {
                box.innerHTML = '<img src="' + msg.signature.image_url + '" alt="Signature" style="max-height:50px; max-width:160px; object-fit:contain;" />';
                broadcastValues();
            }
        }
    });

    window.addEventListener('load', function() {
        sendPageSize();
        broadcastValues();
    });
    window.addEventListener('resize', sendPageSize);
})();
</script>
'''

    return f'''<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&display=swap');
body {{
    margin: 0;
    padding: 0;
    background: #e8e8e8;
    font-family: 'Calibri', 'Arial', 'Noto Sans Devanagari', sans-serif;
}}
.sheet {{
    width: {sheet_w}px;
    min-height: {sheet_h}px;
    margin: 12px auto;
    background: #ffffff;
    padding: {top_m}px {right_m}px {bottom_m}px {left_m}px;
    box-sizing: border-box;
    box-shadow: 0 4px 14px rgba(0,0,0,0.15);
}}
.cf-input:focus, .cf-textarea:focus {{
    background: #ffffff !important;
    border-bottom: 2px solid #1d4ed8 !important;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3) !important;
}}
@media print {{
    body {{ background: #fff !important; }}
    .sheet {{ margin: 0 !important; box-shadow: none !important; width: 100% !important; }}
    @page {{ size: {page_size_str}; margin: 0; }}
}}
</style>
</head>
<body>
<div class="sheet" id="p0">
{content_html}
</div>
{edit_scripts}
</body>
</html>'''


def _populate_semantic_html(html_str, field_values, val_getter, is_edit_mode=True):
    """
    Populates semantic HTML court forms with data-field / name bindings.
    In edit mode: injects value="..." or checked into inputs and text into textareas.
    In print/preview mode: converts inputs/textareas into clean printed text spans or checkboxes.
    """
    import re
    import html as html_lib

    def _replace_input(match):
        tag = match.group(0)
        m_name = re.search(r'name=[\"\']([^\"\']+)[\"\']', tag)
        if not m_name:
            m_name = re.search(r'data-field=[\"\']([^\"\']+)[\"\']', tag)
        if not m_name:
            return tag

        name = m_name.group(1)
        val = val_getter(name)

        m_type = re.search(r'type=[\"\']([^\"\']+)[\"\']', tag)
        inp_type = m_type.group(1).lower() if m_type else 'text'

        if inp_type in ['checkbox', 'radio']:
            m_val = re.search(r'value=[\"\']([^\"\']+)[\"\']', tag)
            expected = m_val.group(1) if m_val else 'yes'
            is_checked = False
            if inp_type == 'checkbox':
                is_checked = bool(val and str(val).strip().lower() in ['yes', 'true', '1', 'on', 'checked', name.lower(), expected.lower()])
            else:
                is_checked = bool(val and str(val).strip().lower() == expected.strip().lower())

            if is_edit_mode:
                tag = re.sub(r'\s*checked(=[\"\'][^\"\']*[\"\'])?', '', tag)
                if is_checked:
                    base = re.sub(r'\/?>$', '', tag).rstrip()
                    tag = f'{base} checked="checked" />'
                return tag
            else:
                if inp_type == 'checkbox':
                    symbol = '&#9745;' if is_checked else '&#9744;'
                else:
                    symbol = '&#9673;' if is_checked else '&#9675;'
                return f'<span class="cf-print-symbol" style="font-size:12px;font-weight:bold;">{symbol}</span>'

        else:
            escaped_val = html_lib.escape(str(val)) if (val is not None and str(val).strip() != '') else ''
            if is_edit_mode:
                if 'value=' in tag:
                    tag = re.sub(r'value=[\"\'][^\"\']*[\"\']', f'value="{escaped_val}"', tag)
                else:
                    base = re.sub(r'\/?>$', '', tag).rstrip()
                    tag = f'{base} value="{escaped_val}" />'
                return tag
            else:
                display_val = escaped_val if escaped_val else '&nbsp;'
                return f'<span class="cf-print-val" style="font-weight:bold;color:#000;">{display_val}</span>'

    def _replace_textarea(match):
        open_tag = match.group(1)
        m_name = re.search(r'name=[\"\']([^\"\']+)[\"\']', open_tag)
        if not m_name:
            m_name = re.search(r'data-field=[\"\']([^\"\']+)[\"\']', open_tag)
        if not m_name:
            return match.group(0)

        name = m_name.group(1)
        val = val_getter(name)
        escaped_val = html_lib.escape(str(val)) if (val is not None and str(val).strip() != '') else ''

        if is_edit_mode:
            return f'{open_tag}{escaped_val}</textarea>'
        else:
            display_val = escaped_val if escaped_val else '&nbsp;'
            return f'<div class="cf-print-val" style="font-weight:bold;color:#000;white-space:pre-wrap;min-height:24px;">{display_val}</div>'

    html_str = re.sub(r'<input[^>]+>', _replace_input, html_str)
    html_str = re.sub(r'(<textarea[^>]*>)(.*?)(</textarea>)', _replace_textarea, html_str, flags=re.DOTALL)
    return html_str


def render_form_html(template_name, field_values=None, is_edit_mode=False, form_obj=None):
    """
    Renders the exact HTML court form with injected editable inputs (in edit mode)
    or filled text + signatures (in PDF mode).
    """
    key = get_template_key(template_name)
    defn = FORM_DEFINITIONS.get(key) if key else None

    # If this form does not have a static HTML template file in Court Forms/, check for content_structure
    if not defn:
        content = None
        if form_obj:
            content = getattr(form_obj, 'filled_content', None) or (
                getattr(form_obj.template, 'content_structure', None) if getattr(form_obj, 'template', None) else None
            )
        if not content and template_name:
            try:
                from ..models import CourtFormTemplate
                tpl = CourtFormTemplate.objects.filter(name__iexact=template_name).first()
                if tpl and tpl.content_structure:
                    content = tpl.content_structure
            except Exception:
                pass

        if content and isinstance(content, dict) and content.get('sections'):
            return render_structured_form_html(content, field_values=field_values, is_edit_mode=is_edit_mode, form_obj=form_obj)
        return None

    html_path = os.path.join(COURT_FORMS_DIR, defn['filename'])
    if not os.path.exists(html_path):
        for alt in ['notice_to_produce_document.html', 'Case_Information_Format_Simple.html', 'forms_Case Information Format.html', 'process_fee_form_1.html', 'process_fee_form_2.html', os.path.basename(defn['filename'])]:
            alt_p = os.path.join(COURT_FORMS_DIR, alt)
            if os.path.exists(alt_p):
                html_path = alt_p
                break
        else:
            return None

    with open(html_path, 'r', encoding='utf-8') as f:
        raw_html = f.read()

    field_values = field_values or {}
    fields = defn.get('fields', [])
    sig_def = defn.get('signature')
    page_w = defn.get('width', 816)
    page_h = defn.get('height', 1056)

    # Detect exact dimensions from HTML if defined (e.g. #p0{width:1056px;height:816px})
    p0_match = re.search(r'#p0\s*\{([^}]+)\}', raw_html, re.I)
    if p0_match:
        props = p0_match.group(1)
        w_m = re.search(r'width:\s*(\d+(?:\.\d+)?)px', props, re.I)
        h_m = re.search(r'height:\s*(\d+(?:\.\d+)?)px', props, re.I)
        if w_m and h_m:
            page_w = float(w_m.group(1))
            page_h = float(h_m.group(1))

    case = getattr(form_obj, 'case', None) if form_obj else None
    client = getattr(form_obj, 'client', None) or (getattr(case, 'client', None) if case else None) if form_obj else None
    advocate = getattr(case, 'assigned_advocate', None) if case else None
    if not advocate and client and getattr(client, 'assigned_advocate', None):
        advocate = client.assigned_advocate
    firm = getattr(case, 'firm', None) if case else (getattr(client, 'firm', None) if client else None)
    user_account = getattr(client, 'user_account', None) if client else None

    def _get_val(name):
        v = field_values.get(name)
        if v is not None and str(v).strip() != '':
            return str(v)

        # Case Information Format & Specific Court Form Mappings
        if name in ['p_name', 'plaintiff_name', 'applicant_name', 'p1_applicant_name', 'p2_applicant_name', 'p3_applicant_name', 'p4_applicant_name']:
            for alt in ['p_name', 'plaintiff_name', 'petitioner_name', 'appellant_name', 'complainant_name', 'applicant_name']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if client and (not case or getattr(case, 'representing', '') != 'respondent'):
                return client.get_full_name()
            if case and getattr(case, 'petitioner_name', None):
                return str(case.petitioner_name)
            if client:
                return client.get_full_name()

        elif name in ['d_name', 'defendant_name', 'opposite_party_name', 'p1_opposite_party_name', 'p2_opposite_party_name', 'p3_opposite_party_name', 'p4_opposite_party_name']:
            for alt in ['d_name', 'defendant_name', 'respondent_name', 'accused_name', 'opposite_party', 'opposite_party_name']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if client and case and getattr(case, 'representing', '') == 'respondent':
                return client.get_full_name()
            if case and getattr(case, 'respondent_name', None):
                return str(case.respondent_name)

        elif name in ['district', 'address_district', 'court_district']:
            for alt in ['district', 'client_district', 'court_district']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if case and getattr(case, 'district', None):
                return str(case.district)
            if case and getattr(case, 'court_name', None):
                return str(case.court_name)

        elif name == 'is_civil':
            if field_values.get('is_criminal'):
                return '' if str(field_values.get('is_criminal')).lower() in ['yes', 'true', '1', 'on'] else 'yes'
            c_type = (getattr(case, 'case_type', '') or '').lower() if case else ''
            c_cat = (getattr(case, 'category', '') or '').lower() if case else ''
            crim_keywords = ['c.c', 'criminal', 'sessions', 'fir', 'bail', '437', '438', '439', 'cr.p.c', 'crpc', 'bnss', 'ipc', 'bns']
            if any(k in c_type or k in c_cat for k in crim_keywords):
                return ''
            return 'yes'

        elif name == 'is_criminal':
            if field_values.get('is_civil'):
                return '' if str(field_values.get('is_civil')).lower() in ['yes', 'true', '1', 'on'] else 'yes'
            c_type = (getattr(case, 'case_type', '') or '').lower() if case else ''
            c_cat = (getattr(case, 'category', '') or '').lower() if case else ''
            crim_keywords = ['c.c', 'criminal', 'sessions', 'fir', 'bail', '437', '438', '439', 'cr.p.c', 'crpc', 'bnss', 'ipc', 'bns']
            if any(k in c_type or k in c_cat for k in crim_keywords):
                return 'yes'
            return ''

        elif name == 'p_parent':
            for alt in ['p_parent', 'petitioner_father', 'father_name', 'parent_name']:
                if field_values.get(alt):
                    return str(field_values[alt])

        elif name == 'p_address':
            for alt in ['p_address', 'plaintiff_address', 'petitioner_address', 'client_address']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if client and (not case or getattr(case, 'representing', '') != 'respondent'):
                addr = getattr(client, 'address', '')
                if addr:
                    return str(addr)
                if user_account and getattr(user_account, 'address_line_1', None):
                    parts = [user_account.address_line_1, user_account.address_line_2, user_account.city, user_account.state, user_account.postal_code]
                    return ', '.join([p for p in parts if p])

        elif name == 'p_aadhar':
            for alt in ['p_aadhar', 'aadhar_number', 'client_aadhar', 'aadhar']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if user_account and getattr(user_account, 'aadhar_number', None) and (not case or getattr(case, 'representing', '') != 'respondent'):
                return str(user_account.aadhar_number)

        elif name == 'p_pincode':
            for alt in ['p_pincode', 'postal_code', 'client_pincode', 'pincode']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if user_account and getattr(user_account, 'postal_code', None) and (not case or getattr(case, 'representing', '') != 'respondent'):
                return str(user_account.postal_code)

        elif name == 'p_gender':
            for alt in ['p_gender', 'gender']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if user_account and getattr(user_account, 'gender', None) and (not case or getattr(case, 'representing', '') != 'respondent'):
                g = user_account.gender
                return 'Male' if g == 'M' else ('Female' if g == 'F' else 'Other')

        elif name == 'p_nationality':
            for alt in ['p_nationality', 'nationality']:
                if field_values.get(alt):
                    return str(field_values[alt])
            return 'Indian'

        elif name == 'p_dob':
            for alt in ['p_dob', 'dob', 'date_of_birth']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if user_account and getattr(user_account, 'date_of_birth', None) and (not case or getattr(case, 'representing', '') != 'respondent'):
                return str(user_account.date_of_birth)

        elif name == 'p_age':
            for alt in ['p_age', 'plaintiff_age', 'age']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if user_account and getattr(user_account, 'date_of_birth', None) and (not case or getattr(case, 'representing', '') != 'respondent'):
                try:
                    from django.utils import timezone
                    today = timezone.now().date()
                    dob = user_account.date_of_birth
                    return str(today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day)))
                except Exception:
                    pass

        elif name == 'p_mobile':
            for alt in ['p_mobile', 'mobile_no', 'phone', 'mobile', 'client_phone']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if client and (not case or getattr(case, 'representing', '') != 'respondent') and getattr(client, 'phone_number', None):
                return str(client.phone_number)

        elif name == 'p_email':
            for alt in ['p_email', 'email', 'client_email']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if client and (not case or getattr(case, 'representing', '') != 'respondent') and getattr(client, 'email', None):
                return str(client.email)

        elif name == 'p_act_section':
            for alt in ['p_act_section', 'act_section', 'under_section']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if case and getattr(case, 'case_type', None):
                return str(case.case_type)

        elif name == 'suit_valuation':
            for alt in ['suit_valuation', 'valuation', 'claim_amount']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if case and getattr(case, 'estimated_value', None):
                return str(case.estimated_value)

        elif name == 'fee_ascertained':
            for alt in ['fee_ascertained', 'court_fee']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if case and getattr(case, 'total_fee', None):
                return str(case.total_fee)

        elif name == 'fee_paid_deposited':
            for alt in ['fee_paid_deposited', 'fee_paid', 'court_fee_paid']:
                if field_values.get(alt):
                    return str(field_values[alt])

        elif name == 'fir_no_year':
            for alt in ['fir_no_year', 'fir_no', 'fir_number']:
                if field_values.get(alt):
                    return str(field_values[alt])

        elif name == 'd_parent':
            for alt in ['d_parent', 'respondent_father']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if case and getattr(case, 'representing', '') == 'respondent':
                return _get_val('p_parent')

        elif name == 'd_address':
            for alt in ['d_address', 'respondent_address']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if case and getattr(case, 'representing', '') == 'respondent':
                return _get_val('p_address')

        elif name == 'd_aadhar':
            for alt in ['d_aadhar']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if case and getattr(case, 'representing', '') == 'respondent':
                return _get_val('p_aadhar')

        elif name == 'd_pincode':
            for alt in ['d_pincode']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if case and getattr(case, 'representing', '') == 'respondent':
                return _get_val('p_pincode')

        elif name == 'd_gender':
            for alt in ['d_gender']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if case and getattr(case, 'representing', '') == 'respondent':
                return _get_val('p_gender')

        elif name == 'd_nationality':
            for alt in ['d_nationality']:
                if field_values.get(alt):
                    return str(field_values[alt])
            return 'Indian'

        elif name == 'd_dob':
            for alt in ['d_dob']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if case and getattr(case, 'representing', '') == 'respondent':
                return _get_val('p_dob')

        elif name == 'd_age':
            for alt in ['d_age', 'defendant_age']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if case and getattr(case, 'representing', '') == 'respondent':
                return _get_val('p_age')

        elif name == 'd_mobile':
            for alt in ['d_mobile']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if case and getattr(case, 'representing', '') == 'respondent':
                return _get_val('p_mobile')

        elif name == 'd_email':
            for alt in ['d_email']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if case and getattr(case, 'representing', '') == 'respondent':
                return _get_val('p_email')

        elif name in ['adv_name', 'advocate_name']:
            for alt in ['adv_name', 'advocate_name']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if advocate:
                return advocate.get_full_name()

        elif name in ['adv_enroll', 'advocate_bar_no']:
            for alt in ['adv_enroll', 'advocate_bar_no', 'bar_council_registration']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if advocate and getattr(advocate, 'bar_council_registration', None):
                return str(advocate.bar_council_registration)

        elif name in ['adv_office', 'advocate_address']:
            for alt in ['adv_office', 'advocate_office', 'advocate_address']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if advocate and getattr(advocate, 'address_line_1', None):
                parts = [advocate.address_line_1, advocate.address_line_2, advocate.city, advocate.state, advocate.postal_code]
                return ', '.join([p for p in parts if p])
            if firm and getattr(firm, 'address', None):
                return str(firm.address)

        elif name in ['adv_mobile', 'advocate_mobile']:
            for alt in ['adv_mobile', 'advocate_mobile', 'advocate_phone']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if advocate and getattr(advocate, 'phone_number', None):
                return str(advocate.phone_number)

        elif name in ['adv_email', 'advocate_email']:
            for alt in ['adv_email', 'advocate_email']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if advocate and getattr(advocate, 'email', None):
                return str(advocate.email)

        elif name in ['submitted_by', 'submitted_by_page2']:
            for alt in ['submitted_by', 'submitted_by_page2']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if advocate:
                return advocate.get_full_name()
            if client:
                return client.get_full_name()

        elif name in ['submitted_by_role', 'submitted_by_role_page2']:
            for alt in ['submitted_by_role', 'submitted_by_role_page2']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if advocate:
                return 'Advocate'
            if case and getattr(case, 'representing', '') == 'petitioner':
                return 'Petitioner'
            if case and getattr(case, 'representing', '') == 'respondent':
                return 'Respondent'
            return 'Advocate'

        elif name in ['ep1_case_no', 'ep2_case_no', 'ep3_case_no']:
            if field_values.get(name):
                return str(field_values[name])
            if case and getattr(case, 'case_number', None):
                return str(case.case_number)

        elif name in ['ep1_adv_name', 'ep2_adv_name', 'ep3_adv_name']:
            if field_values.get(name):
                return str(field_values[name])
            return _get_val('adv_name')

        elif name in ['ep1_adv_enroll', 'ep2_adv_enroll', 'ep3_adv_enroll']:
            if field_values.get(name):
                return str(field_values[name])
            return _get_val('adv_enroll')

        elif name in ['ep1_adv_office', 'ep2_adv_office', 'ep3_adv_office']:
            if field_values.get(name):
                return str(field_values[name])
            return _get_val('adv_office')

        elif name in ['ep1_adv_mobile', 'ep2_adv_mobile', 'ep3_adv_mobile']:
            if field_values.get(name):
                return str(field_values[name])
            return _get_val('adv_mobile')

        elif name in ['ep1_adv_email', 'ep2_adv_email', 'ep3_adv_email']:
            if field_values.get(name):
                return str(field_values[name])
            return _get_val('adv_email')

        elif name in ['ep1_nationality', 'ep2_nationality', 'ep3_nationality']:
            if field_values.get(name):
                return str(field_values[name])
            return 'Indian'

        if name.startswith('desc_'):
            try:
                idx = name.split('_')[1]
                for alt in [f'particulars_{idx}', f'item_{idx}_title', f'particulars_{int(idx)+1}']:
                    if field_values.get(alt):
                        return str(field_values[alt])
            except Exception:
                pass
        elif name.startswith('fee_'):
            try:
                idx = name.split('_')[1]
                for alt in [f'court_fee_{idx}', f'court_fee{idx}', f'court_fee_{int(idx)+1}']:
                    if field_values.get(alt):
                        return str(field_values[alt])
            except Exception:
                pass
        elif name.startswith('page_'):
            try:
                idx = name.split('_')[1]
                for alt in [f'pages_{idx}', f'page_no_{idx}', f'pages_{int(idx)+1}']:
                    if field_values.get(alt):
                        return str(field_values[alt])
            except Exception:
                pass
        elif name in ['suit_number', 'case_number', 'case_no', 'suit_no']:
            for alt in ['case_number', 'case_no', 'suit_number', 'suit_no']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if case and getattr(case, 'case_number', None):
                return str(case.case_number)
        elif name in ['case_type', 'suit_type']:
            for alt in ['case_type', 'suit_type']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if case and getattr(case, 'case_type', None):
                return str(case.case_type)
        elif name in ['year', 'case_year']:
            for alt in ['year', 'case_year']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if case and getattr(case, 'filing_date', None):
                return str(case.filing_date.year)[-2:]
            from datetime import date
            return str(date.today().year)[-2:]
        elif name in ['court_division', 'court_name_div']:
            for alt in ['court_division', 'court_name']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if case:
                parts = []
                if getattr(case, 'court_name', None):
                    parts.append(str(case.court_name))
                if getattr(case, 'district', None) and case.district not in (case.court_name or ''):
                    parts.append(str(case.district))
                if parts:
                    return ', '.join(parts)
        elif name in ['plaint_date', 'document_date']:
            for alt in ['plaint_date', 'document_date', 'filing_date', 'date']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if case and getattr(case, 'filing_date', None):
                try:
                    return case.filing_date.strftime('%d/%m/%Y')
                except Exception:
                    return str(case.filing_date)
        elif name in ['notice_date']:
            for alt in ['notice_date', 'date', 'filing_date']:
                if field_values.get(alt):
                    return str(field_values[alt])
            from datetime import date
            return date.today().strftime('%d/%m/%Y')
        elif name in ['notice_received_date']:
            for alt in ['notice_received_date']:
                if field_values.get(alt):
                    return str(field_values[alt])
            return ''
        elif name in ['notice_place', 'place']:
            for alt in ['notice_place', 'place', 'city']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if case and getattr(case, 'district', None):
                return str(case.district)
            if firm and getattr(firm, 'city', None):
                return str(firm.city)
        elif name in ['hearing_date', 'ndoh', 'next_hearing_date']:
            for alt in ['hearing_date', 'ndoh', 'next_hearing_date']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if case and getattr(case, 'next_hearing_date', None):
                return str(case.next_hearing_date.strftime('%d/%m/%Y'))
        elif name in ['pdoh', 'prev_hearing_date', 'previous_hearing_date']:
            for alt in ['pdoh', 'prev_hearing_date', 'previous_hearing_date']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if case and getattr(case, 'previous_hearing_date', None):
                return str(case.previous_hearing_date.strftime('%d/%m/%Y'))
        elif name in ['court_name', 'court_complex', 'court']:
            for alt in ['court_name', 'court', 'court_complex']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if case and getattr(case, 'court_name', None):
                return str(case.court_name)
        elif name in ['first_name', 'surname', 'middle_name']:
            full = field_values.get('client_name') or field_values.get('litigant_name') or field_values.get('full_name') or (client.get_full_name() if client else None)
            if full and isinstance(full, str):
                parts = full.strip().split()
                if name == 'first_name' and len(parts) >= 1:
                    return parts[0]
                elif name == 'surname' and len(parts) >= 2:
                    return parts[-1]
                elif name == 'middle_name' and len(parts) >= 3:
                    return ' '.join(parts[1:-1])
        elif name in ['dob_day', 'dob_month', 'dob_year']:
            dob = field_values.get('dob') or field_values.get('date_of_birth') or (str(user_account.date_of_birth) if user_account and getattr(user_account, 'date_of_birth', None) else None)
            if dob and isinstance(dob, str):
                d_parts = dob.replace('-', '/').split('/')
                if len(d_parts) == 3:
                    if len(d_parts[0]) == 4: # YYYY/MM/DD
                        y, m, d = d_parts[0], d_parts[1], d_parts[2]
                    else: # DD/MM/YYYY
                        d, m, y = d_parts[0], d_parts[1], d_parts[2]
                    if name == 'dob_day':
                        return d
                    elif name == 'dob_month':
                        return m
                    elif name == 'dob_year':
                        return y
        elif name in ['date_day', 'date_month', 'date_year']:
            dt = field_values.get('date') or field_values.get('filing_date') or (str(case.filing_date) if case and getattr(case, 'filing_date', None) else None)
            if dt and isinstance(dt, str):
                d_parts = dt.replace('-', '/').split('/')
                if len(d_parts) == 3:
                    if len(d_parts[0]) == 4: # YYYY/MM/DD
                        y, m, d = d_parts[0], d_parts[1], d_parts[2]
                    else: # DD/MM/YYYY
                        d, m, y = d_parts[0], d_parts[1], d_parts[2]
                    if name == 'date_day':
                        return d
                    elif name == 'date_month':
                        return m
                    elif name == 'date_year':
                        return y[-2:] if len(y) == 4 else y
        elif name == 'mobile_no':
            for alt in ['phone', 'mobile', 'client_phone']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if client and getattr(client, 'phone_number', None):
                return str(client.phone_number)
        elif name == 'email':
            for alt in ['client_email', 'email_address']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if client and getattr(client, 'email', None):
                return str(client.email)
        elif name == 'fir_no_repeat':
            return _get_val('fir_no')
        elif name == 'police_station_repeat':
            return _get_val('police_station')
        elif name == 'under_section_repeat':
            return _get_val('under_section')
        elif name == 'surety_accused_name':
            for alt in ['accused_name', 'client_name']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if client:
                return client.get_full_name()
        elif name == 'surety_accused_father':
            for alt in ['father_name', 'accused_father']:
                if field_values.get(alt):
                    return str(field_values[alt])
        elif name == 'aff_deponent_name':
            for alt in ['surety_name', 'deponent_name', 'client_name']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if client:
                return client.get_full_name()
        elif name == 'aff_parent_name':
            for alt in ['surety_father', 'parent_name', 'father_name']:
                if field_values.get(alt):
                    return str(field_values[alt])
        elif name == 'aff_address':
            for alt in ['surety_address', 'surety_address_line1', 'address']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if client and getattr(client, 'address', None):
                return str(client.address)
        elif name == 'surety_bond_amount':
            for alt in ['bond_amount']:
                if field_values.get(alt):
                    return str(field_values[alt])
        elif name == 'lower_court_name':
            return _get_val('court_name')
        elif name == 'lower_case_number':
            return _get_val('case_number')
        elif name == 'lower_plaintiff_name':
            return _get_val('plaintiff_name')
        elif name == 'lower_defendant_name':
            return _get_val('defendant_name')
        elif name == 'lower_pdoh':
            return _get_val('pdoh')
        elif name == 'lower_ndoh':
            return _get_val('ndoh')
        elif name == 'filing_date':
            for alt in ['date', 'filing_date']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if case and getattr(case, 'filing_date', None):
                return str(case.filing_date)
        elif name == 'client_name_decl':
            for alt in ['client_name', 'plaintiff_name', 'full_name']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if client:
                return client.get_full_name()
        elif name == 'client_address_decl':
            for alt in ['client_address', 'address']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if client and getattr(client, 'address', None):
                return str(client.address)
        elif name == 'advocate_details':
            for alt in ['adv_bar_no', 'advocate_bar_no', 'advocate_details']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if advocate and getattr(advocate, 'bar_council_registration', None):
                return str(advocate.bar_council_registration)
        elif name == 'suit_appeal_no':
            return _get_val('case_number')
        elif name in ['authority_name_address', 'p1_authority_name_address', 'p1_authority_name', 'p2_authority_name', 'p3_authority_name', 'p4_authority_name']:
            for alt in ['authority_name_address', 'authority_name', 'court_name']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if case and getattr(case, 'court_name', None):
                return f"Commercial Court / DLSA, {case.court_name}"
            return ''
        elif name in ['quantum_claim']:
            for alt in ['quantum_claim', 'claim_amount', 'estimated_value']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if case and getattr(case, 'estimated_value', None):
                try:
                    return f"Rs. {float(case.estimated_value):,.2f}"
                except (ValueError, TypeError):
                    return str(case.estimated_value)
            return ''
        elif name in ['territorial_jurisdiction']:
            for alt in ['territorial_jurisdiction', 'jurisdiction', 'court_name']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if case:
                parts = [getattr(case, 'court_name', ''), getattr(case, 'state', '')]
                return ', '.join([p for p in parts if p])
            return ''
        elif name in ['application_date', 'p1_notice_date', 'p2_application_date', 'p2_date', 'p3_application_date', 'p3_date', 'p4_application_date', 'p4_date']:
            for alt in [name, 'date', 'filing_date']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if case and getattr(case, 'filing_date', None):
                return str(case.filing_date)
            return ''
        elif name in ['applicant_address']:
            return _get_val('p_address')
        elif name in ['applicant_phone', 'applicant_mobile']:
            return _get_val('mobile_no')
        elif name in ['applicant_email']:
            return _get_val('email')
        elif name in ['litigant_name', 'receipt_litigant_name', 'a_name', 'r_name']:
            for alt in ['litigant_name', 'receipt_litigant_name', 'client_name', 'plaintiff_name', 'complainant_name', 'full_name', 'name']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if client:
                return client.get_full_name()
            return ''
        elif name in ['phone_no', 'receipt_phone_no', 'a_phone', 'r_phone']:
            for alt in ['phone_no', 'phone', 'receipt_phone_no', 'mobile_no']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if client and getattr(client, 'phone_number', None):
                return str(client.phone_number)
            return ''
        elif name in ['mobile_no', 'receipt_mobile_no', 'a_mobile', 'r_mobile']:
            for alt in ['mobile_no', 'mobile', 'receipt_mobile_no', 'phone_no', 'phone']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if client and getattr(client, 'phone_number', None):
                return str(client.phone_number)
            return ''
        elif name in ['ecourt_fee_amount', 'receipt_amount', 'a_amount', 'r_amount']:
            for alt in ['ecourt_fee_amount', 'receipt_amount', 'amount', 'fee_amount', 'court_fee']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if case:
                fee = getattr(case, 'court_fee', None) or getattr(case, 'total_fee', None) or getattr(case, 'estimated_value', None)
                if fee:
                    try:
                        return f"{float(fee):.2f}"
                    except (ValueError, TypeError):
                        return str(fee)
            return ''
        elif name in ['payment_date', 'receipt_date']:
            for alt in [name, 'payment_date', 'receipt_date', 'date', 'filing_date']:
                if field_values.get(alt):
                    return str(field_values[alt])
            if case and getattr(case, 'filing_date', None):
                try:
                    return case.filing_date.strftime('%d/%m/%Y')
                except Exception:
                    return str(case.filing_date)
            from datetime import date
            return date.today().strftime('%d/%m/%Y')
        elif name in ['payment_type', 'receipt_payment_type']:
            for alt in [name, 'payment_type', 'receipt_payment_type']:
                if field_values.get(alt):
                    return str(field_values[alt])
            return 'Cash'
        elif name in ['bank_name', 'receipt_bank_name', 'a_bank', 'r_bank']:
            for alt in [name, 'bank_name', 'receipt_bank_name', 'bank']:
                if field_values.get(alt):
                    return str(field_values[alt])
            return ''
        elif name in ['branch_name', 'receipt_branch_name', 'a_branch', 'r_branch']:
            for alt in [name, 'branch_name', 'receipt_branch_name', 'branch']:
                if field_values.get(alt):
                    return str(field_values[alt])
            return ''
        elif name in ['payment_details_acc', 'receipt_payment_details']:
            for alt in [name, 'payment_details_acc', 'receipt_payment_details', 'account_no', 'cheque_no', 'utr_no']:
                if field_values.get(alt):
                    return str(field_values[alt])
            return ''
        return ''

    # Semantic Forms (e.g. Case Information Format): populate input elements directly in HTML
    if defn.get('is_semantic_form'):
        raw_html = _populate_semantic_html(raw_html, field_values, _get_val, is_edit_mode=is_edit_mode)
        fields = []

    # Build injected overlay markup
    global_styles = []
    global_scripts = []
    page_elements = {}

    resolved_signatures = _resolve_signatures(defn, field_values, form_obj)

    if is_edit_mode:
        # Interactive Edit Mode: inject cleanly styled inputs & textareas
        global_styles.append('''
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&display=swap');
.c3, .c4, .c5, .t {
    font-family: 'f2', 'f3', 'Noto Sans Devanagari', 'Lohit Devanagari', 'Gargi', 'Mangal', 'Arial Unicode MS', sans-serif !important;
}
.cf-input {
    border: none !important;
    border-bottom: 2px solid #3b82f6 !important;
    background: rgba(239, 246, 255, 0.85) !important;
    color: #000000 !important;
    font-weight: 700 !important;
    font-size: 13px !important;
    font-family: 'Calibri', 'Arial', sans-serif !important;
    padding: 2px 6px !important;
    box-sizing: border-box !important;
    z-index: 1000 !important;
    outline: none !important;
    border-radius: 2px !important;
    transition: background 0.15s, border-color 0.15s, box-shadow 0.15s !important;
}
.cf-input:focus {
    background: #ffffff !important;
    border-bottom: 2px solid #1d4ed8 !important;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3) !important;
}
.cf-textarea {
    border: 1px dashed #93c5fd !important;
    background: rgba(239, 246, 255, 0.85) !important;
    color: #000000 !important;
    font-weight: 700 !important;
    font-size: 12.5px !important;
    font-family: 'Calibri', 'Arial', sans-serif !important;
    padding: 6px !important;
    box-sizing: border-box !important;
    z-index: 1000 !important;
    outline: none !important;
    resize: none !important;
    border-radius: 2px !important;
    line-height: 1.4 !important;
    transition: background 0.15s, border-color 0.15s, box-shadow 0.15s !important;
}
.cf-textarea:focus {
    background: #ffffff !important;
    border: 1.5px solid #2563eb !important;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3) !important;
}
.cf-sig-box {
    position: absolute;
    border: 1.5px dashed #6366f1;
    background: rgba(99, 102, 241, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    box-sizing: border-box;
    cursor: grab;
    border-radius: 6px;
    transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s, transform 0.2s;
    user-select: none;
}
.cf-sig-box:hover {
    border: 2px solid #4f46e5;
    background: rgba(99, 102, 241, 0.16);
    box-shadow: 0 8px 24px rgba(79, 70, 229, 0.35);
    transform: translateY(-2px);
    z-index: 1100;
}
.cf-sig-box:active {
    cursor: grabbing;
    transform: scale(1.02);
}
.cf-sig-box.has-image {
    border: 1.5px dashed rgba(99, 102, 241, 0.45);
    background: rgba(255, 255, 255, 0.7);
}
.cf-sig-box.has-image:hover {
    border: 2px solid #4f46e5;
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 8px 24px rgba(79, 70, 229, 0.3);
}
.cf-sig-box img {
    width: 100% !important;
    height: 100% !important;
    max-width: 100% !important;
    max-height: 100% !important;
    object-fit: contain !important;
    pointer-events: none !important;
}
.cf-sig-placeholder {
    font-size: 11px;
    font-weight: 700;
    color: #4f46e5;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    display: flex;
    align-items: center;
    gap: 4px;
    pointer-events: none;
    text-align: center;
    padding: 0 4px;
}
.cf-sig-badge {
    position: absolute;
    top: -30px;
    left: 50%;
    transform: translateX(-50%) scale(0.9);
    background: #1e1b4b;
    color: #ffffff;
    font-size: 10.5px;
    font-weight: 700;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    padding: 3px 8px;
    border-radius: 6px;
    white-space: nowrap;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
    display: flex;
    align-items: center;
    gap: 6px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.15s ease, transform 0.15s ease;
    z-index: 1200;
}
/* Hover bridge to prevent losing hover when cursor moves from box to badge */
.cf-sig-badge::after {
    content: '';
    position: absolute;
    bottom: -15px;
    left: -20px;
    right: -20px;
    height: 18px;
    background: transparent;
    pointer-events: auto;
}
.cf-sig-box:hover .cf-sig-badge,
.cf-sig-badge:hover {
    opacity: 1 !important;
    transform: translateX(-50%) scale(1) !important;
    pointer-events: auto !important;

.cf-sig-close-btn {
    position: absolute !important;
    top: -8px !important;
    right: -8px !important;
    width: 20px !important;
    height: 20px !important;
    border-radius: 50% !important;
    background: #ef4444 !important;
    color: #ffffff !important;
    border: 1.5px solid #ffffff !important;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35) !important;
    font-size: 11px !important;
    font-weight: 900 !important;
    line-height: 1 !important;
    display: none !important;
    align-items: center !important;
    justify-content: center !important;
    cursor: pointer !important;
    padding: 0 !important;
    z-index: 1300 !important;
    outline: none !important;
    transition: transform 0.15s, background-color 0.15s !important;
}
.cf-sig-box:hover .cf-sig-close-btn,
.cf-sig-close-btn:hover {
    display: flex !important;
}
.cf-sig-close-btn:hover {
    background: #dc2626 !important;
    transform: scale(1.2) !important;
}
.cf-sig-resize-handle {
    position: absolute !important;
    right: -5px !important;
    bottom: -5px !important;
    width: 14px !important;
    height: 14px !important;
    background: #4f46e5 !important;
    border: 2px solid #ffffff !important;
    border-radius: 4px !important;
    cursor: nwse-resize !important;
    z-index: 1250 !important;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35) !important;
    display: none !important;
    transition: transform 0.15s, background-color 0.15s !important;
}
.cf-sig-box:hover .cf-sig-resize-handle,
.cf-sig-resize-handle:hover {
    display: block !important;
}
.cf-sig-resize-handle:hover {
    transform: scale(1.25) !important;
    background: #3730a3 !important;
}
</style>
''')

        for fld in fields:
            p_idx = fld.get('page', 0)
            raw_val = _get_val(fld['name'])
            val = html_lib.escape(raw_val)
            pos_style = f"position:absolute;left:{fld['left']}px;top:{fld['top']}px;width:{fld['width']}px;height:{fld['height']}px;"
            if fld['type'] == 'textarea':
                el = f'<textarea class="cf-textarea" data-field="{fld["name"]}" style="{pos_style}">{val}</textarea>'
            else:
                el = f'<input class="cf-input" type="text" data-field="{fld["name"]}" value="{val}" style="{pos_style}" />'
            
            if p_idx not in page_elements:
                page_elements[p_idx] = []
            page_elements[p_idx].append(el)

        template_sig_names = set()
        if defn.get('signatures'):
            for s in defn['signatures']:
                if s.get('name'): template_sig_names.add(s['name'])
                if s.get('id'): template_sig_names.add(s['id'])
        elif defn.get('signature'):
            if defn['signature'].get('name'): template_sig_names.add(defn['signature']['name'])
            if defn['signature'].get('id'): template_sig_names.add(defn['signature']['id'])

        for sig_item in resolved_signatures:
            sig_name = sig_item.get('name', 'signature')
            sig_id = sig_item.get('id', sig_name)
            sig_label = sig_item.get('label', 'Signature')
            sig_type = sig_item.get('type', 'custom')
            sig_url = sig_item.get('image_url')
            left_pos = sig_item.get('left', 450)
            top_pos = sig_item.get('top', 700)
            width_val = sig_item.get('width', 160)
            height_val = sig_item.get('height', 50)
            sig_p = sig_item.get('page', 0)

            is_native = 'true' if (sig_name in template_sig_names or sig_id in template_sig_names) else 'false'
            pos_style = f"left:{left_pos}px;top:{top_pos}px;width:{width_val}px;height:{height_val}px;"
            has_img_class = ' has-image' if sig_url else ''
            img_markup = f'<img src="{sig_url}" alt="{sig_label}" />' if sig_url else f'<span class="cf-sig-placeholder">✍ {sig_label}</span>'
            badge_markup = f'<div class="cf-sig-badge"><span>✍ {sig_label}</span></div>'
            close_btn = f'<button type="button" class="cf-sig-close-btn" title="Remove signature / logo">✕</button>' if sig_url else ''
            resize_handle = '<div class="cf-sig-resize-handle" title="Drag to resize (make bigger or smaller)"></div>'

            sig_el = (
                f'<div class="cf-sig-box{has_img_class}" '
                f'data-sig-id="{sig_id}" data-sig-name="{sig_name}" data-sig-label="{sig_label}" '
                f'data-sig-type="{sig_type}" data-page="{sig_p}" data-native-slot="{is_native}" style="{pos_style}">'
                f'{img_markup}{badge_markup}{close_btn}{resize_handle}'
                f'</div>'
            )
            if sig_p not in page_elements:
                page_elements[sig_p] = []
            page_elements[sig_p].append(sig_el)

        global_scripts.append(f'''
<script>
(function() {{
    function getAllValues() {{
        var vals = {{}};
        var inputs = document.querySelectorAll('[data-field], input[name], textarea[name]');
        for (var i = 0; i < inputs.length; i++) {{
            var el = inputs[i];
            var name = el.getAttribute('data-field') || el.getAttribute('name');
            if (name) {{
                if (el.type === 'checkbox') {{
                    vals[name] = el.checked ? (el.value || 'yes') : '';
                }} else if (el.type === 'radio') {{
                    if (el.checked) vals[name] = el.value;
                }} else {{
                    vals[name] = el.value;
                }}
            }}
        }}

        // Collect all signature placements with exact page and coordinates
        var sigBoxes = document.querySelectorAll('.cf-sig-box');
        var placed = [];
        var offsets = {{}};
        for (var s = 0; s < sigBoxes.length; s++) {{
            var b = sigBoxes[s];
            var sId = b.getAttribute('data-sig-id') || ('sig_' + s);
            var sName = b.getAttribute('data-sig-name') || sId;
            var sLabel = b.getAttribute('data-sig-label') || 'Signature';
            var sType = b.getAttribute('data-sig-type') || 'custom';
            var sPage = parseInt(b.getAttribute('data-page') || '0', 10);
            var sX = Math.round(parseFloat(b.style.left) || 0);
            var sY = Math.round(parseFloat(b.style.top) || 0);
            var sW = Math.round(parseFloat(b.style.width) || b.offsetWidth || 160);
            var sH = Math.round(parseFloat(b.style.height) || b.offsetHeight || 50);
            var imgEl = b.querySelector('img');
            var sImg = imgEl ? imgEl.src : null;

            var sigData = {{
                id: sId,
                name: sName,
                label: sLabel,
                type: sType,
                page: sPage,
                x: sX,
                y: sY,
                width: sW,
                height: sH,
                image_url: sImg
            }};
            placed.push(sigData);
            offsets[sId] = {{ x: sX, y: sY, width: sW, height: sH, page: sPage }};
            if (sName) offsets[sName] = {{ x: sX, y: sY, width: sW, height: sH, page: sPage }};
            if (sType) offsets[sType] = {{ x: sX, y: sY, width: sW, height: sH, page: sPage }};
        }}
        vals['placed_signatures'] = placed;
        vals['signature_offsets'] = offsets;
        return vals;
    }}

    function sendPageSize() {{
        var p0 = document.getElementById('p0') || document.querySelector('.sheet') || document.body;
        var w = p0.offsetWidth || p0.clientWidth || {page_w};
        var h = document.body.scrollHeight || (p0.offsetHeight || p0.clientHeight || {page_h});
        try {{
            window.parent.postMessage({{ type: 'COURT_FORM_PAGE_SIZE', width: w, height: h }}, '*');
        }} catch(e) {{}}
    }}

    function broadcastValues() {{
        var vals = getAllValues();
        try {{
            window.parent.postMessage({{ type: 'COURT_FORM_VALUES', values: vals }}, '*');
        }} catch(e) {{}}
    }}

    function emit(f, v) {{
        if (!f) return;
        try {{
            window.parent.postMessage({{ type: 'COURT_FORM_FIELD_UPDATE', fieldName: f, value: v }}, '*');
        }} catch(e) {{}}
    }}

    document.addEventListener('input', function(e) {{
        if (e.target && (e.target.hasAttribute('data-field') || e.target.hasAttribute('name'))) {{
            var name = e.target.getAttribute('data-field') || e.target.getAttribute('name');
            emit(name, e.target.value);
            broadcastValues();
        }}
    }});

    document.addEventListener('change', function(e) {{
        if (e.target && (e.target.hasAttribute('data-field') || e.target.hasAttribute('name'))) {{
            var name = e.target.getAttribute('data-field') || e.target.getAttribute('name');
            emit(name, e.target.value);
            broadcastValues();
        }}
    }});

    window.addEventListener('message', function(e) {{
        if (!e.data) return;
        if (e.data.type === 'GET_COURT_FORM_VALUES' || e.data.type === 'REQUEST_SAVE') {{
            broadcastValues();
        }} else if (e.data.type === 'UPDATE_SIGNATURE_IMAGE') {{
            var sigId = e.data.sigId;
            var sigName = e.data.sigName;
            var imgUrl = e.data.imageUrl;
            var box = null;
            if (sigId) box = document.querySelector('.cf-sig-box[data-sig-id="' + sigId + '"]');
            if (!box && sigName) box = document.querySelector('.cf-sig-box[data-sig-name="' + sigName + '"]');
            if (!box) box = document.querySelector('.cf-sig-box');
            if (box && imgUrl) {{
                var sigLabel = box.getAttribute('data-sig-label') || 'Signature';
                box.classList.add('has-image');
                box.innerHTML = '<img src="' + imgUrl + '" alt="' + sigLabel + '" />' +
                    '<div class="cf-sig-badge"><span>✍ ' + sigLabel + '</span></div>' +
                    '<button type="button" class="cf-sig-close-btn" title="Remove signature / logo">✕</button>' +
                    '<div class="cf-sig-resize-handle" title="Drag to resize (make bigger or smaller)"></div>';
                initSignatures();
                broadcastValues();
            }}
        }} else if (e.data.type === 'ADD_NEW_SIGNATURE') {{
            var data = e.data;
            var targetPageId = 'p' + (data.page || 0);
            var pageEl = document.getElementById(targetPageId) || document.querySelector('.sheet') || document.body;
            var newBox = document.createElement('div');
            newBox.className = 'cf-sig-box' + (data.imageUrl ? ' has-image' : '');
            newBox.setAttribute('data-sig-id', data.id || ('sig_' + Date.now()));
            newBox.setAttribute('data-sig-name', data.name || 'custom_signature');
            newBox.setAttribute('data-sig-label', data.label || 'Signature');
            newBox.setAttribute('data-sig-type', data.sigType || data.type || 'custom');
            newBox.setAttribute('data-page', String(data.page || 0));
            newBox.setAttribute('data-native-slot', 'false');
            newBox.style.left = (data.x || 450) + 'px';
            newBox.style.top = (data.y || 700) + 'px';
            newBox.style.width = (data.width || 160) + 'px';
            newBox.style.height = (data.height || 50) + 'px';
            
            if (data.imageUrl) {{
                newBox.innerHTML = '<img src="' + data.imageUrl + '" alt="' + (data.label || 'Signature') + '" />' +
                    '<div class="cf-sig-badge"><span>✍ ' + (data.label || 'Signature') + '</span></div>' +
                    '<button type="button" class="cf-sig-close-btn" title="Remove signature / logo">✕</button>' +
                    '<div class="cf-sig-resize-handle" title="Drag to resize (make bigger or smaller)"></div>';
            }} else {{
                newBox.innerHTML = '<span class="cf-sig-placeholder">✍ ' + (data.label || 'Signature') + '</span>' +
                    '<div class="cf-sig-badge"><span>✍ ' + (data.label || 'Signature') + '</span></div>' +
                    '<div class="cf-sig-resize-handle" title="Drag to resize (make bigger or smaller)"></div>';
            }}
            pageEl.appendChild(newBox);
            initSignatures();
            broadcastValues();
        }}
    }});

    // Cross-Page Signature Dragging, Resizing & Interaction
    var activeDrag = null;
    var grabOffsetX = 0, grabOffsetY = 0;
    var startScreenX = 0, startScreenY = 0;
    var hasMoved = false;

    // Resizing State
    var activeResize = null;
    var resizeStartW = 0, resizeStartH = 0;
    var resizeStartX = 0, resizeStartY = 0;

    function getPageElements() {{
        var pEls = document.querySelectorAll('[id^="p"], .page, .sheet');
        var validPages = [];
        for (var i = 0; i < pEls.length; i++) {{
            var el = pEls[i];
            if (/^p\\d+$/.test(el.id) || el.classList.contains('page') || el.classList.contains('sheet')) {{
                if (validPages.indexOf(el) === -1) {{
                    validPages.push(el);
                }}
            }}
        }}
        if (validPages.length === 0) validPages = [document.body];
        validPages.sort(function(a, b) {{
            var rA = a.getBoundingClientRect();
            var rB = b.getBoundingClientRect();
            return rA.top - rB.top;
        }});
        return validPages;
    }}

    function initSignatures() {{
        var sigBoxes = document.querySelectorAll('.cf-sig-box');
        sigBoxes.forEach(function(box) {{
            box.removeEventListener('mousedown', onMouseDown);
            box.addEventListener('mousedown', onMouseDown);
            box.removeEventListener('touchstart', onTouchStart);
            box.addEventListener('touchstart', onTouchStart, {{ passive: false }});

            var clearBtns = box.querySelectorAll('.cf-sig-close-btn');
            clearBtns.forEach(function(btn) {{
                btn.removeEventListener('mousedown', onClearBtnDown);
                btn.addEventListener('mousedown', onClearBtnDown);
                btn.removeEventListener('click', onClearBtnClick);
                btn.addEventListener('click', onClearBtnClick);
            }});

            var resizer = box.querySelector('.cf-sig-resize-handle');
            if (resizer) {{
                resizer.removeEventListener('mousedown', onResizerMouseDown);
                resizer.addEventListener('mousedown', function(e) {{ onResizeStart(e, box); }});
                resizer.removeEventListener('touchstart', onResizerTouchStart);
                resizer.addEventListener('touchstart', function(e) {{ onResizeTouchStart(e, box); }}, {{ passive: false }});
            }}
        }});
    }}

    function onClearBtnDown(e) {{
        e.stopPropagation();
        e.preventDefault();
    }}

    function onClearBtnClick(e) {{
        e.stopPropagation();
        e.preventDefault();
        var box = e.target.closest('.cf-sig-box');
        if (box) clearSignature(box);
    }}

    function onResizerMouseDown(e) {{
        e.stopPropagation();
        e.preventDefault();
    }}

    function onResizerTouchStart(e) {{
        e.stopPropagation();
        e.preventDefault();
    }}

    function onResizeStart(e, box) {{
        e.stopPropagation();
        e.preventDefault();
        activeResize = box;
        resizeStartW = box.offsetWidth || 160;
        resizeStartH = box.offsetHeight || 50;
        resizeStartX = e.clientX;
        resizeStartY = e.clientY;
        document.addEventListener('mousemove', onResizeMove);
        document.addEventListener('mouseup', onResizeEnd);
    }}

    function onResizeMove(e) {{
        if (!activeResize) return;
        var dw = e.clientX - resizeStartX;
        var dh = e.clientY - resizeStartY;
        var newW = Math.max(50, Math.min(resizeStartW + dw, 650));
        var newH = Math.max(25, Math.min(resizeStartH + dh, 350));
        activeResize.style.width = Math.round(newW) + 'px';
        activeResize.style.height = Math.round(newH) + 'px';
    }}

    function onResizeEnd(e) {{
        if (!activeResize) return;
        document.removeEventListener('mousemove', onResizeMove);
        document.removeEventListener('mouseup', onResizeEnd);
        var box = activeResize;
        activeResize = null;

        var finalW = Math.round(parseFloat(box.style.width) || box.offsetWidth);
        var finalH = Math.round(parseFloat(box.style.height) || box.offsetHeight);
        var sigId = box.getAttribute('data-sig-id');
        var sigName = box.getAttribute('data-sig-name');
        var sigType = box.getAttribute('data-sig-type');
        var page = parseInt(box.getAttribute('data-page') || '0', 10);
        var curX = Math.round(parseFloat(box.style.left) || 0);
        var curY = Math.round(parseFloat(box.style.top) || 0);

        try {{
            window.parent.postMessage({{
                type: 'COURT_FORM_SIGNATURE_MOVE',
                sigId: sigId,
                sigName: sigName,
                sigType: sigType,
                page: page,
                x: curX,
                y: curY,
                width: finalW,
                height: finalH
            }}, '*');
        }} catch(err) {{}}
        broadcastValues();
    }}

    function onResizeTouchStart(e, box) {{
        e.stopPropagation();
        e.preventDefault();
        var touch = e.touches[0];
        activeResize = box;
        resizeStartW = box.offsetWidth || 160;
        resizeStartH = box.offsetHeight || 50;
        resizeStartX = touch.clientX;
        resizeStartY = touch.clientY;
        document.addEventListener('touchmove', onResizeTouchMove, {{ passive: false }});
        document.addEventListener('touchend', onResizeTouchEnd);
    }}

    function onResizeTouchMove(e) {{
        if (!activeResize) return;
        var touch = e.touches[0];
        var dw = touch.clientX - resizeStartX;
        var dh = touch.clientY - resizeStartY;
        var newW = Math.max(50, Math.min(resizeStartW + dw, 650));
        var newH = Math.max(25, Math.min(resizeStartH + dh, 350));
        activeResize.style.width = Math.round(newW) + 'px';
        activeResize.style.height = Math.round(newH) + 'px';
        e.preventDefault();
    }}

    function onResizeTouchEnd(e) {{
        if (!activeResize) return;
        document.removeEventListener('touchmove', onResizeTouchMove);
        document.removeEventListener('touchend', onResizeTouchEnd);
        onResizeEnd(e);
    }}

    function onMouseDown(e) {{
        if (e.target.closest('.cf-sig-close-btn')) {{
            e.stopPropagation();
            e.preventDefault();
            var box = e.target.closest('.cf-sig-box') || e.currentTarget;
            clearSignature(box);
            return;
        }}
        if (e.target.closest('.cf-sig-resize-handle')) {{
            return;
        }}
        activeDrag = e.currentTarget;
        var rect = activeDrag.getBoundingClientRect();
        grabOffsetX = e.clientX - rect.left;
        grabOffsetY = e.clientY - rect.top;
        startScreenX = e.clientX;
        startScreenY = e.clientY;
        hasMoved = false;
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        e.preventDefault();
    }}

    function onMouseMove(e) {{
        if (!activeDrag) return;
        var dx = e.clientX - startScreenX;
        var dy = e.clientY - startScreenY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {{
            hasMoved = true;
        }}
        if (!hasMoved) return;

        var clientX = e.clientX;
        var clientY = e.clientY;

        var pages = getPageElements();
        var targetPage = null;
        var targetPageIndex = 0;
        var bestDist = Infinity;

        for (var i = 0; i < pages.length; i++) {{
            var p = pages[i];
            var pRect = p.getBoundingClientRect();
            if (clientY >= pRect.top && clientY <= pRect.bottom) {{
                targetPage = p;
                targetPageIndex = i;
                break;
            }}
            var center = (pRect.top + pRect.bottom) / 2;
            var dist = Math.abs(clientY - center);
            if (dist < bestDist) {{
                bestDist = dist;
                targetPage = p;
                targetPageIndex = i;
            }}
        }}
        if (!targetPage) {{
            targetPage = activeDrag.parentElement || pages[0];
            targetPageIndex = pages.indexOf(targetPage) >= 0 ? pages.indexOf(targetPage) : 0;
        }}

        if (activeDrag.parentElement !== targetPage) {{
            targetPage.appendChild(activeDrag);
            activeDrag.setAttribute('data-page', String(targetPageIndex));
        }}

        var targetRect = targetPage.getBoundingClientRect();
        var newLeft = clientX - targetRect.left - grabOffsetX;
        var newTop = clientY - targetRect.top - grabOffsetY;

        var maxW = targetPage.clientWidth || {page_w};
        var maxH = targetPage.clientHeight || {page_h};
        var boxW = activeDrag.offsetWidth || 160;
        var boxH = activeDrag.offsetHeight || 50;

        newLeft = Math.max(10, Math.min(newLeft, maxW - boxW - 10));
        newTop = Math.max(10, Math.min(newTop, maxH - boxH - 10));

        activeDrag.style.left = Math.round(newLeft) + 'px';
        activeDrag.style.top = Math.round(newTop) + 'px';
    }}

    function onMouseUp(e) {{
        if (!activeDrag) return;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        
        var box = activeDrag;
        activeDrag = null;

        if (hasMoved) {{
            var sigId = box.getAttribute('data-sig-id');
            var sigName = box.getAttribute('data-sig-name');
            var sigType = box.getAttribute('data-sig-type');
            var page = parseInt(box.getAttribute('data-page') || '0', 10);
            var newX = Math.round(parseFloat(box.style.left) || 0);
            var newY = Math.round(parseFloat(box.style.top) || 0);
            var newW = Math.round(parseFloat(box.style.width) || box.offsetWidth);
            var newH = Math.round(parseFloat(box.style.height) || box.offsetHeight);
            try {{
                window.parent.postMessage({{
                    type: 'COURT_FORM_SIGNATURE_MOVE',
                    sigId: sigId,
                    sigName: sigName,
                    sigType: sigType,
                    page: page,
                    x: newX,
                    y: newY,
                    width: newW,
                    height: newH
                }}, '*');
            }} catch(err) {{}}
            broadcastValues();
        }} else {{
            openSignature(box);
        }}
    }}

    function onTouchStart(e) {{
        if (e.target.closest('.cf-sig-close-btn')) {{
            e.stopPropagation();
            e.preventDefault();
            var box = e.target.closest('.cf-sig-box') || e.currentTarget;
            clearSignature(box);
            return;
        }}
        if (e.target.closest('.cf-sig-resize-handle')) {{
            return;
        }}
        var touch = e.touches[0];
        activeDrag = e.currentTarget;
        var rect = activeDrag.getBoundingClientRect();
        grabOffsetX = touch.clientX - rect.left;
        grabOffsetY = touch.clientY - rect.top;
        startScreenX = touch.clientX;
        startScreenY = touch.clientY;
        hasMoved = false;
        document.addEventListener('touchmove', onTouchMove, {{ passive: false }});
        document.addEventListener('touchend', onTouchEnd);
    }}

    function onTouchMove(e) {{
        if (!activeDrag) return;
        var touch = e.touches[0];
        var dx = touch.clientX - startScreenX;
        var dy = touch.clientY - startScreenY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {{
            hasMoved = true;
        }}
        if (!hasMoved) return;

        var clientX = touch.clientX;
        var clientY = touch.clientY;

        var pages = getPageElements();
        var targetPage = null;
        var targetPageIndex = 0;
        var bestDist = Infinity;

        for (var i = 0; i < pages.length; i++) {{
            var p = pages[i];
            var pRect = p.getBoundingClientRect();
            if (clientY >= pRect.top && clientY <= pRect.bottom) {{
                targetPage = p;
                targetPageIndex = i;
                break;
            }}
            var center = (pRect.top + pRect.bottom) / 2;
            var dist = Math.abs(clientY - center);
            if (dist < bestDist) {{
                bestDist = dist;
                targetPage = p;
                targetPageIndex = i;
            }}
        }}
        if (!targetPage) {{
            targetPage = activeDrag.parentElement || pages[0];
            targetPageIndex = pages.indexOf(targetPage) >= 0 ? pages.indexOf(targetPage) : 0;
        }}

        if (activeDrag.parentElement !== targetPage) {{
            targetPage.appendChild(activeDrag);
            activeDrag.setAttribute('data-page', String(targetPageIndex));
        }}

        var targetRect = targetPage.getBoundingClientRect();
        var newLeft = clientX - targetRect.left - grabOffsetX;
        var newTop = clientY - targetRect.top - grabOffsetY;

        var maxW = targetPage.clientWidth || {page_w};
        var maxH = targetPage.clientHeight || {page_h};
        var boxW = activeDrag.offsetWidth || 160;
        var boxH = activeDrag.offsetHeight || 50;

        newLeft = Math.max(10, Math.min(newLeft, maxW - boxW - 10));
        newTop = Math.max(10, Math.min(newTop, maxH - boxH - 10));

        activeDrag.style.left = Math.round(newLeft) + 'px';
        activeDrag.style.top = Math.round(newTop) + 'px';
        e.preventDefault();
    }}

    function onTouchEnd(e) {{
        if (!activeDrag) return;
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', onTouchEnd);
        var box = activeDrag;
        activeDrag = null;
        if (hasMoved) {{
            var sigId = box.getAttribute('data-sig-id');
            var sigName = box.getAttribute('data-sig-name');
            var sigType = box.getAttribute('data-sig-type');
            var page = parseInt(box.getAttribute('data-page') || '0', 10);
            var newX = Math.round(parseFloat(box.style.left) || 0);
            var newY = Math.round(parseFloat(box.style.top) || 0);
            var newW = Math.round(parseFloat(box.style.width) || box.offsetWidth);
            var newH = Math.round(parseFloat(box.style.height) || box.offsetHeight);
            try {{
                window.parent.postMessage({{
                    type: 'COURT_FORM_SIGNATURE_MOVE',
                    sigId: sigId,
                    sigName: sigName,
                    sigType: sigType,
                    page: page,
                    x: newX,
                    y: newY,
                    width: newW,
                    height: newH
                }}, '*');
            }} catch(err) {{}}
            broadcastValues();
        }} else {{
            openSignature(box);
        }}
    }}

    function openSignature(box) {{
        var sigId = box.getAttribute('data-sig-id');
        var sigName = box.getAttribute('data-sig-name');
        var sigLabel = box.getAttribute('data-sig-label');
        var sigType = box.getAttribute('data-sig-type');
        var page = parseInt(box.getAttribute('data-page') || '0', 10);
        try {{
            window.parent.postMessage({{
                type: 'OPEN_SIGNATURE_PAD',
                sigId: sigId,
                sigName: sigName,
                sigLabel: sigLabel,
                sigType: sigType,
                page: page
            }}, '*');
        }} catch(err) {{}}
    }}

    function clearSignature(box) {{
        var sigLabel = box.getAttribute('data-sig-label') || 'Signature';
        var sigId = box.getAttribute('data-sig-id') || '';
        var sigName = box.getAttribute('data-sig-name') || '';
        var sigType = box.getAttribute('data-sig-type') || 'custom';
        var isNative = box.getAttribute('data-native-slot') === 'true';
        var page = parseInt(box.getAttribute('data-page') || '0', 10);

        if (!isNative) {{
            box.remove();
        }} else {{
            box.classList.remove('has-image');
            var closeBtn = box.querySelector('.cf-sig-close-btn');
            if (closeBtn) closeBtn.remove();
            box.innerHTML = '<span class="cf-sig-placeholder">✍ ' + sigLabel + '</span>' +
                '<div class="cf-sig-badge"><span>✍ ' + sigLabel + '</span></div>' +
                '<div class="cf-sig-resize-handle" title="Drag to resize (make bigger or smaller)"></div>';
            initSignatures();
        }}

        try {{
            window.parent.postMessage({{
                type: 'COURT_FORM_SIGNATURE_REMOVE',
                sigId: sigId,
                sigName: sigName,
                sigType: sigType,
                page: page
            }}, '*');
        }} catch(err) {{}}
        broadcastValues();
    }}

    if (document.readyState === 'loading') {{
        document.addEventListener('DOMContentLoaded', function() {{
            sendPageSize();
            initSignatures();
        }});
    }} else {{
        sendPageSize();
        initSignatures();
    }}
    window.addEventListener('load', function() {{
        sendPageSize();
        initSignatures();
    }});
    window.addEventListener('resize', sendPageSize);
}})();
</script>
''')
    else:
        # PDF Mode
        is_landscape = page_w > page_h
        if is_landscape:
            page_size_rule = f"{int(page_w)}px {int(page_h)}px"
        elif page_w == 794 and page_h == 1123:
            page_size_rule = "A4 portrait"
        else:
            page_size_rule = f"{int(page_w)}px {int(page_h)}px"

        global_styles.append(f'''
<style>
@page {{
    size: {page_size_rule};
    margin: 0;
}}
body {{
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
}}
.page {{
    margin: 0 auto !important;
    box-shadow: none !important;
}}
</style>
''')
        global_styles.append('''
<style>
.c3, .c4, .c5, .t {
    font-family: 'f2', 'f3', 'Noto Sans Devanagari', 'Lohit Devanagari', 'Gargi', 'Mangal', 'Arial Unicode MS', 'DejaVu Sans', sans-serif !important;
}
.cf-pdf-val {
    position: absolute !important;
    color: #000000 !important;
    font-weight: 700 !important;
    font-size: 13px !important;
    font-family: 'Calibri', 'Arial', 'Noto Sans Devanagari', 'Lohit Devanagari', 'DejaVu Sans', sans-serif !important;
    z-index: 1000 !important;
    box-sizing: border-box !important;
    white-space: pre-wrap !important;
    line-height: 1.2 !important;
    padding-left: 4px !important;
    padding-top: 2px !important;
}
.cf-pdf-cell {
    position: absolute !important;
    color: #000000 !important;
    font-weight: 700 !important;
    font-size: 11.5px !important;
    font-family: 'Calibri', 'Arial', 'Noto Sans Devanagari', 'Lohit Devanagari', 'DejaVu Sans', sans-serif !important;
    z-index: 1000 !important;
    box-sizing: border-box !important;
    white-space: pre-wrap !important;
    word-break: break-word !important;
    overflow-wrap: break-word !important;
    line-height: 1.35 !important;
    padding: 3px !important;
}
.cf-pdf-sig {
    position: absolute;
    z-index: 1000;
    text-align: center;
}
.cf-pdf-sig img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}
</style>
''')

        for fld in fields:
            val = _get_val(fld['name']).strip()
            if not val:
                continue
            p_idx = fld.get('page', 0)
            escaped_val = html_lib.escape(val).replace('\n', '<br/>')
            top_val = fld.get('pdf_top', fld['top'])
            pos_style = f"left:{fld['left']}px;top:{top_val}px;width:{fld['width']}px;"
            if fld['type'] == 'textarea':
                pos_style += f"height:{fld['height']}px;"
                el = f'<div class="cf-pdf-cell" style="{pos_style}">{escaped_val}</div>'
            else:
                el = f'<div class="cf-pdf-val" style="{pos_style}">{escaped_val}</div>'
            
            if p_idx not in page_elements:
                page_elements[p_idx] = []
            page_elements[p_idx].append(el)

        for sig_item in resolved_signatures:
            sig_url = sig_item.get('image_url')
            if sig_url:
                left_pos = sig_item.get('left', 450)
                top_pos = sig_item.get('top', 700)
                width_val = sig_item.get('width', 160)
                height_val = sig_item.get('height', 50)
                sig_p = sig_item.get('page', 0)
                sig_label = sig_item.get('label', 'Signature')

                pos_style = f"left:{left_pos}px;top:{top_pos}px;width:{width_val}px;height:{height_val}px;"
                sig_el = f'<div class="cf-pdf-sig" style="{pos_style}"><img src="{sig_url}" alt="{sig_label}" /></div>'
                if sig_p not in page_elements:
                    page_elements[sig_p] = []
                page_elements[sig_p].append(sig_el)

    final_html = raw_html
    
    if 'id="p0"' in final_html:
        # Check if page 1 is empty and has no elements (only for non-semantic PDF conversions)
        if not defn.get('is_semantic_form'):
            p1_idx = final_html.find('id="p1"')
            if p1_idx != -1:
                raw_p1_text = final_html[p1_idx:]
                cleaned_p1 = re.sub(r'<[^>]+>', '', raw_p1_text).replace('&nbsp;', '').strip()
                if not cleaned_p1 and not page_elements.get(1):
                    final_html = final_html[:p1_idx] + '</body>\n</html>'
        
        # Inject elements into all pages (page 1, 2, ...) in reverse order to maintain indices
        for p_idx in sorted(page_elements.keys(), reverse=True):
            if p_idx == 0:
                continue
            p_id_str = f'id="p{p_idx}"'
            if p_id_str in final_html:
                p_str = '\n'.join(page_elements[p_idx])
                p_start = final_html.find(p_id_str)
                p_tag_end = final_html.find('>', p_start)
                if p_tag_end != -1:
                    final_html = final_html[:p_tag_end+1] + f'\n{p_str}\n' + final_html[p_tag_end+1:]

        p0_content = global_styles + page_elements.get(0, []) + global_scripts
        p0_str = '\n'.join(p0_content)
        p0_start = final_html.find('id="p0"')
        p0_tag_end = final_html.find('>', p0_start)
        if p0_tag_end != -1:
            final_html = final_html[:p0_tag_end+1] + f'\n{p0_str}\n' + final_html[p0_tag_end+1:]
        else:
            final_html = final_html.replace('</body>', f'{p0_str}\n</body>')
    else:
        all_content = global_styles + [el for els in page_elements.values() for el in els] + global_scripts
        injected_str = '\n'.join(all_content)
        final_html = final_html.replace('</body>', f'{injected_str}\n</body>')

    return final_html

def generate_pdf_from_html_template(form_obj):
    """
    Generates a pixel-perfect court-ready PDF from the official HTML template.
    """
    os.environ['DYLD_FALLBACK_LIBRARY_PATH'] = '/opt/homebrew/lib'
    template = getattr(form_obj, 'template', None)
    tpl_name = template.name if template else ''
    field_values = getattr(form_obj, 'field_values', {}) or {}

    rendered_html = render_form_html(tpl_name, field_values=field_values, is_edit_mode=False, form_obj=form_obj)
    if not rendered_html:
        return None

    try:
        wp = weasyprint
        if wp is None:
            import weasyprint as wp
        pdf_bytes = wp.HTML(string=rendered_html).write_pdf()
        return pdf_bytes
    except Exception as ex:
        print(f"Error generating PDF from HTML template: {ex}")
        import traceback
        traceback.print_exc()
        return None
