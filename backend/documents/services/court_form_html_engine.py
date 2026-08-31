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

import weasyprint
from django.conf import settings


COURT_FORMS_DIR = '/Users/diracai/Desktop/Projects DiracAI/AntLegal/LawFirmManagementApplicationApp/Court Forms'

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
        'filename': 'forms_Case Information Format.html',
        'width': 794,
        'height': 1123,
        'fields': [
            {'name': 'caseType', 'type': 'text', 'left': 200, 'top': 160, 'width': 200, 'height': 24},
            {'name': 'district', 'type': 'text', 'left': 480, 'top': 160, 'width': 220, 'height': 24},
            {'name': 'p_name', 'type': 'text', 'left': 180, 'top': 210, 'width': 520, 'height': 24},
            {'name': 'p_parent', 'type': 'text', 'left': 180, 'top': 245, 'width': 520, 'height': 24},
            {'name': 'p_address', 'type': 'textarea', 'left': 180, 'top': 280, 'width': 520, 'height': 50},
            {'name': 'p_mobile', 'type': 'text', 'left': 180, 'top': 340, 'width': 200, 'height': 24},
            {'name': 'p_email', 'type': 'text', 'left': 480, 'top': 340, 'width': 220, 'height': 24},
            {'name': 'd_name', 'type': 'text', 'left': 180, 'top': 410, 'width': 520, 'height': 24},
            {'name': 'd_address', 'type': 'textarea', 'left': 180, 'top': 445, 'width': 520, 'height': 50},
            {'name': 'adv_name', 'type': 'text', 'left': 180, 'top': 540, 'width': 520, 'height': 24},
            {'name': 'adv_bar_no', 'type': 'text', 'left': 180, 'top': 575, 'width': 520, 'height': 24},
        ],
        'signature': {'name': 'signature', 'left': 480, 'top': 980, 'width': 220, 'height': 50, 'label': 'Signature of Advocate'}
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
            {'name': 'applicant_name', 'type': 'text', 'left': 240, 'top': 178, 'pdf_top': 183, 'width': 485, 'height': 24},
            {'name': 'applicant_address', 'type': 'textarea', 'left': 96, 'top': 250, 'width': 630, 'height': 50},
            {'name': 'applicant_phone', 'type': 'text', 'left': 200, 'top': 290, 'pdf_top': 295, 'width': 180, 'height': 24},
            {'name': 'applicant_mobile', 'type': 'text', 'left': 420, 'top': 290, 'pdf_top': 295, 'width': 180, 'height': 24},
            {'name': 'opposite_party_name', 'type': 'text', 'left': 260, 'top': 330, 'pdf_top': 335, 'width': 465, 'height': 24},
            {'name': 'opposite_party_address', 'type': 'textarea', 'left': 96, 'top': 370, 'width': 630, 'height': 50},
            {'name': 'dispute_synopsis', 'type': 'textarea', 'left': 96, 'top': 490, 'width': 630, 'height': 200},
        ],
        'signature': {'name': 'applicant_signature', 'left': 480, 'top': 720, 'width': 245, 'height': 50, 'label': 'Signature of Applicant'}
    },
    'ecourt_fee': {
        'filename': 'forms_E-Court Fee.html',
        'width': 794,
        'height': 1123,
        'fields': [
            {'name': 'a_name', 'type': 'text', 'left': 220, 'top': 235, 'width': 240, 'height': 24},
            {'name': 'a_phone', 'type': 'text', 'left': 540, 'top': 235, 'width': 90, 'height': 24},
            {'name': 'a_mobile', 'type': 'text', 'left': 685, 'top': 235, 'width': 85, 'height': 24},
            {'name': 'a_amount', 'type': 'text', 'left': 230, 'top': 270, 'width': 230, 'height': 24},
            {'name': 'a_bank', 'type': 'text', 'left': 220, 'top': 345, 'width': 240, 'height': 24},
            {'name': 'a_branch', 'type': 'text', 'left': 550, 'top': 345, 'width': 220, 'height': 24},
        ],
        'signature': {'name': 'applicant_signature', 'left': 220, 'top': 380, 'width': 550, 'height': 30, 'label': 'Signature of the applicant'}
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
        'filename': 'forms_Notice to produce documents.html',
        'width': 816,
        'height': 1056,
        'fields': [
            # Header & Case Info
            {'name': 'case_number', 'type': 'text', 'left': 140, 'top': 212, 'pdf_top': 212, 'width': 260, 'height': 20},
            {'name': 'hearing_date', 'type': 'text', 'left': 665, 'top': 212, 'pdf_top': 212, 'width': 103, 'height': 20},
            {'name': 'year', 'type': 'text', 'left': 230, 'top': 240, 'pdf_top': 240, 'width': 70, 'height': 20},
            
            # Court
            {'name': 'court_name', 'type': 'text', 'left': 235, 'top': 268, 'pdf_top': 268, 'width': 215, 'height': 20},
            {'name': 'court_division', 'type': 'text', 'left': 570, 'top': 268, 'pdf_top': 268, 'width': 198, 'height': 20},

            # Cause Title
            {'name': 'plaintiff_name', 'type': 'text', 'left': 285, 'top': 295, 'pdf_top': 295, 'width': 480, 'height': 20},
            {'name': 'defendant_name', 'type': 'text', 'left': 270, 'top': 323, 'pdf_top': 323, 'width': 498, 'height': 20},

            # Body
            {'name': 'plaint_date', 'type': 'text', 'left': 145, 'top': 370, 'pdf_top': 370, 'width': 135, 'height': 20},

            # Rows 1 to 7
            {'name': 'doc_sno_0', 'type': 'text', 'left': 122, 'top': 486, 'pdf_top': 486, 'width': 80, 'height': 20},
            {'name': 'doc_desc_0', 'type': 'text', 'left': 206, 'top': 486, 'pdf_top': 486, 'width': 236, 'height': 20},
            {'name': 'doc_date_0', 'type': 'text', 'left': 446, 'top': 486, 'pdf_top': 486, 'width': 158, 'height': 20},
            {'name': 'doc_remarks_0', 'type': 'text', 'left': 608, 'top': 486, 'pdf_top': 486, 'width': 158, 'height': 20},

            {'name': 'doc_sno_1', 'type': 'text', 'left': 122, 'top': 536, 'pdf_top': 536, 'width': 80, 'height': 20},
            {'name': 'doc_desc_1', 'type': 'text', 'left': 206, 'top': 536, 'pdf_top': 536, 'width': 236, 'height': 20},
            {'name': 'doc_date_1', 'type': 'text', 'left': 446, 'top': 536, 'pdf_top': 536, 'width': 158, 'height': 20},
            {'name': 'doc_remarks_1', 'type': 'text', 'left': 608, 'top': 536, 'pdf_top': 536, 'width': 158, 'height': 20},

            {'name': 'doc_sno_2', 'type': 'text', 'left': 122, 'top': 586, 'pdf_top': 586, 'width': 80, 'height': 20},
            {'name': 'doc_desc_2', 'type': 'text', 'left': 206, 'top': 586, 'pdf_top': 586, 'width': 236, 'height': 20},
            {'name': 'doc_date_2', 'type': 'text', 'left': 446, 'top': 586, 'pdf_top': 586, 'width': 158, 'height': 20},
            {'name': 'doc_remarks_2', 'type': 'text', 'left': 608, 'top': 586, 'pdf_top': 586, 'width': 158, 'height': 20},

            {'name': 'doc_sno_3', 'type': 'text', 'left': 122, 'top': 636, 'pdf_top': 636, 'width': 80, 'height': 20},
            {'name': 'doc_desc_3', 'type': 'text', 'left': 206, 'top': 636, 'pdf_top': 636, 'width': 236, 'height': 20},
            {'name': 'doc_date_3', 'type': 'text', 'left': 446, 'top': 636, 'pdf_top': 636, 'width': 158, 'height': 20},
            {'name': 'doc_remarks_3', 'type': 'text', 'left': 608, 'top': 636, 'pdf_top': 636, 'width': 158, 'height': 20},

            {'name': 'doc_sno_4', 'type': 'text', 'left': 122, 'top': 686, 'pdf_top': 686, 'width': 80, 'height': 20},
            {'name': 'doc_desc_4', 'type': 'text', 'left': 206, 'top': 686, 'pdf_top': 686, 'width': 236, 'height': 20},
            {'name': 'doc_date_4', 'type': 'text', 'left': 446, 'top': 686, 'pdf_top': 686, 'width': 158, 'height': 20},
            {'name': 'doc_remarks_4', 'type': 'text', 'left': 608, 'top': 686, 'pdf_top': 686, 'width': 158, 'height': 20},

            {'name': 'doc_sno_5', 'type': 'text', 'left': 122, 'top': 736, 'pdf_top': 736, 'width': 80, 'height': 20},
            {'name': 'doc_desc_5', 'type': 'text', 'left': 206, 'top': 736, 'pdf_top': 736, 'width': 236, 'height': 20},
            {'name': 'doc_date_5', 'type': 'text', 'left': 446, 'top': 736, 'pdf_top': 736, 'width': 158, 'height': 20},
            {'name': 'doc_remarks_5', 'type': 'text', 'left': 608, 'top': 736, 'pdf_top': 736, 'width': 158, 'height': 20},

            {'name': 'doc_sno_6', 'type': 'text', 'left': 122, 'top': 786, 'pdf_top': 786, 'width': 80, 'height': 20},
            {'name': 'doc_desc_6', 'type': 'text', 'left': 206, 'top': 786, 'pdf_top': 786, 'width': 236, 'height': 20},
            {'name': 'doc_date_6', 'type': 'text', 'left': 446, 'top': 786, 'pdf_top': 786, 'width': 158, 'height': 20},
            {'name': 'doc_remarks_6', 'type': 'text', 'left': 608, 'top': 786, 'pdf_top': 786, 'width': 158, 'height': 20},

            # Footer
            {'name': 'date', 'type': 'text', 'left': 145, 'top': 942, 'pdf_top': 942, 'width': 95, 'height': 20},
        ],
        'signature': {'name': 'advocate_signature', 'left': 580, 'top': 880, 'width': 180, 'height': 45, 'label': 'Signature of Advocate'}
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
        'filename': 'forms_Process fee form.html',
        'width': 816,
        'height': 1056,
        'fields': [
            # Top Header
            {'name': 'court_name', 'type': 'text', 'left': 220, 'top': 128, 'pdf_top': 128, 'width': 508, 'height': 20},
            {'name': 'case_number', 'type': 'text', 'left': 180, 'top': 164, 'pdf_top': 164, 'width': 320, 'height': 20},
            {'name': 'plaintiff_name', 'type': 'text', 'left': 96, 'top': 200, 'pdf_top': 200, 'width': 284, 'height': 20},
            {'name': 'defendant_name', 'type': 'text', 'left': 445, 'top': 200, 'pdf_top': 200, 'width': 283, 'height': 20},
            {'name': 'pdoh', 'type': 'text', 'left': 150, 'top': 236, 'pdf_top': 236, 'width': 200, 'height': 20},
            {'name': 'ndoh', 'type': 'text', 'left': 575, 'top': 236, 'pdf_top': 236, 'width': 153, 'height': 20},

            # Table Rows 0 to 7
            {'name': 'date_filing_0', 'type': 'text', 'left': 89, 'top': 330, 'pdf_top': 330, 'width': 104, 'height': 20},
            {'name': 'filed_by_0', 'type': 'text', 'left': 196, 'top': 330, 'pdf_top': 330, 'width': 104, 'height': 20},
            {'name': 'purpose_0', 'type': 'text', 'left': 302, 'top': 330, 'pdf_top': 330, 'width': 104, 'height': 20},
            {'name': 'number_0', 'type': 'text', 'left': 409, 'top': 330, 'pdf_top': 330, 'width': 104, 'height': 20},
            {'name': 'amount_0', 'type': 'text', 'left': 515, 'top': 330, 'pdf_top': 330, 'width': 104, 'height': 20},
            {'name': 'court_fee_0', 'type': 'text', 'left': 622, 'top': 330, 'pdf_top': 330, 'width': 104, 'height': 20},

            {'name': 'date_filing_1', 'type': 'text', 'left': 89, 'top': 375, 'pdf_top': 375, 'width': 104, 'height': 20},
            {'name': 'filed_by_1', 'type': 'text', 'left': 196, 'top': 375, 'pdf_top': 375, 'width': 104, 'height': 20},
            {'name': 'purpose_1', 'type': 'text', 'left': 302, 'top': 375, 'pdf_top': 375, 'width': 104, 'height': 20},
            {'name': 'number_1', 'type': 'text', 'left': 409, 'top': 375, 'pdf_top': 375, 'width': 104, 'height': 20},
            {'name': 'amount_1', 'type': 'text', 'left': 515, 'top': 375, 'pdf_top': 375, 'width': 104, 'height': 20},
            {'name': 'court_fee_1', 'type': 'text', 'left': 622, 'top': 375, 'pdf_top': 375, 'width': 104, 'height': 20},

            {'name': 'date_filing_2', 'type': 'text', 'left': 89, 'top': 420, 'pdf_top': 420, 'width': 104, 'height': 20},
            {'name': 'filed_by_2', 'type': 'text', 'left': 196, 'top': 420, 'pdf_top': 420, 'width': 104, 'height': 20},
            {'name': 'purpose_2', 'type': 'text', 'left': 302, 'top': 420, 'pdf_top': 420, 'width': 104, 'height': 20},
            {'name': 'number_2', 'type': 'text', 'left': 409, 'top': 420, 'pdf_top': 420, 'width': 104, 'height': 20},
            {'name': 'amount_2', 'type': 'text', 'left': 515, 'top': 420, 'pdf_top': 420, 'width': 104, 'height': 20},
            {'name': 'court_fee_2', 'type': 'text', 'left': 622, 'top': 420, 'pdf_top': 420, 'width': 104, 'height': 20},

            {'name': 'date_filing_3', 'type': 'text', 'left': 89, 'top': 465, 'pdf_top': 465, 'width': 104, 'height': 20},
            {'name': 'filed_by_3', 'type': 'text', 'left': 196, 'top': 465, 'pdf_top': 465, 'width': 104, 'height': 20},
            {'name': 'purpose_3', 'type': 'text', 'left': 302, 'top': 465, 'pdf_top': 465, 'width': 104, 'height': 20},
            {'name': 'number_3', 'type': 'text', 'left': 409, 'top': 465, 'pdf_top': 465, 'width': 104, 'height': 20},
            {'name': 'amount_3', 'type': 'text', 'left': 515, 'top': 465, 'pdf_top': 465, 'width': 104, 'height': 20},
            {'name': 'court_fee_3', 'type': 'text', 'left': 622, 'top': 465, 'pdf_top': 465, 'width': 104, 'height': 20},

            {'name': 'date_filing_4', 'type': 'text', 'left': 89, 'top': 510, 'pdf_top': 510, 'width': 104, 'height': 20},
            {'name': 'filed_by_4', 'type': 'text', 'left': 196, 'top': 510, 'pdf_top': 510, 'width': 104, 'height': 20},
            {'name': 'purpose_4', 'type': 'text', 'left': 302, 'top': 510, 'pdf_top': 510, 'width': 104, 'height': 20},
            {'name': 'number_4', 'type': 'text', 'left': 409, 'top': 510, 'pdf_top': 510, 'width': 104, 'height': 20},
            {'name': 'amount_4', 'type': 'text', 'left': 515, 'top': 510, 'pdf_top': 510, 'width': 104, 'height': 20},
            {'name': 'court_fee_4', 'type': 'text', 'left': 622, 'top': 510, 'pdf_top': 510, 'width': 104, 'height': 20},

            {'name': 'date_filing_5', 'type': 'text', 'left': 89, 'top': 555, 'pdf_top': 555, 'width': 104, 'height': 20},
            {'name': 'filed_by_5', 'type': 'text', 'left': 196, 'top': 555, 'pdf_top': 555, 'width': 104, 'height': 20},
            {'name': 'purpose_5', 'type': 'text', 'left': 302, 'top': 555, 'pdf_top': 555, 'width': 104, 'height': 20},
            {'name': 'number_5', 'type': 'text', 'left': 409, 'top': 555, 'pdf_top': 555, 'width': 104, 'height': 20},
            {'name': 'amount_5', 'type': 'text', 'left': 515, 'top': 555, 'pdf_top': 555, 'width': 104, 'height': 20},
            {'name': 'court_fee_5', 'type': 'text', 'left': 622, 'top': 555, 'pdf_top': 555, 'width': 104, 'height': 20},

            {'name': 'date_filing_6', 'type': 'text', 'left': 89, 'top': 600, 'pdf_top': 600, 'width': 104, 'height': 20},
            {'name': 'filed_by_6', 'type': 'text', 'left': 196, 'top': 600, 'pdf_top': 600, 'width': 104, 'height': 20},
            {'name': 'purpose_6', 'type': 'text', 'left': 302, 'top': 600, 'pdf_top': 600, 'width': 104, 'height': 20},
            {'name': 'number_6', 'type': 'text', 'left': 409, 'top': 600, 'pdf_top': 600, 'width': 104, 'height': 20},
            {'name': 'amount_6', 'type': 'text', 'left': 515, 'top': 600, 'pdf_top': 600, 'width': 104, 'height': 20},
            {'name': 'court_fee_6', 'type': 'text', 'left': 622, 'top': 600, 'pdf_top': 600, 'width': 104, 'height': 20},

            {'name': 'date_filing_7', 'type': 'text', 'left': 89, 'top': 645, 'pdf_top': 645, 'width': 104, 'height': 20},
            {'name': 'filed_by_7', 'type': 'text', 'left': 196, 'top': 645, 'pdf_top': 645, 'width': 104, 'height': 20},
            {'name': 'purpose_7', 'type': 'text', 'left': 302, 'top': 645, 'pdf_top': 645, 'width': 104, 'height': 20},
            {'name': 'number_7', 'type': 'text', 'left': 409, 'top': 645, 'pdf_top': 645, 'width': 104, 'height': 20},
            {'name': 'amount_7', 'type': 'text', 'left': 515, 'top': 645, 'pdf_top': 645, 'width': 104, 'height': 20},
            {'name': 'court_fee_7', 'type': 'text', 'left': 622, 'top': 645, 'pdf_top': 645, 'width': 104, 'height': 20},

            # Lower Section (Court Receipt Copy)
            {'name': 'lower_court_name', 'type': 'text', 'left': 96, 'top': 738, 'pdf_top': 738, 'width': 632, 'height': 20},
            {'name': 'lower_case_number', 'type': 'text', 'left': 180, 'top': 774, 'pdf_top': 774, 'width': 300, 'height': 20},
            {'name': 'lower_plaintiff_name', 'type': 'text', 'left': 135, 'top': 810, 'pdf_top': 810, 'width': 250, 'height': 20},
            {'name': 'lower_defendant_name', 'type': 'text', 'left': 425, 'top': 810, 'pdf_top': 810, 'width': 303, 'height': 20},
            {'name': 'lower_pdoh', 'type': 'text', 'left': 155, 'top': 846, 'pdf_top': 846, 'width': 180, 'height': 20},
            {'name': 'lower_ndoh', 'type': 'text', 'left': 410, 'top': 846, 'pdf_top': 846, 'width': 180, 'height': 20},
            {'name': 'filing_date', 'type': 'text', 'left': 175, 'top': 881, 'pdf_top': 881, 'width': 200, 'height': 20},
        ],
        'signature': {'name': 'advocate_signature', 'left': 550, 'top': 865, 'width': 170, 'height': 50, 'label': 'Signature of Advocate'}
    },
    'process_fee': {
        'filename': 'forms_Process fee.html',
        'width': 816,
        'height': 1248,
        'fields': [
            # Top Header
            {'name': 'court_name', 'type': 'text', 'left': 270, 'top': 156, 'pdf_top': 172, 'width': 433, 'height': 20},
            {'name': 'case_number', 'type': 'text', 'left': 200, 'top': 198, 'pdf_top': 212, 'width': 503, 'height': 20},
            {'name': 'plaintiff_name', 'type': 'text', 'left': 143, 'top': 216, 'pdf_top': 232, 'width': 245, 'height': 20},
            {'name': 'defendant_name', 'type': 'text', 'left': 450, 'top': 216, 'pdf_top': 232, 'width': 253, 'height': 20},
            {'name': 'suit_number', 'type': 'text', 'left': 175, 'top': 235, 'pdf_top': 251, 'width': 340, 'height': 20},
            {'name': 'hearing_date', 'type': 'text', 'left': 645, 'top': 235, 'pdf_top': 251, 'width': 60, 'height': 20},

            # Table Rows 0 to 14 (15 rows)
            {'name': 'date_filing_0', 'type': 'text', 'left': 136, 'top': 320, 'pdf_top': 320, 'width': 93, 'height': 20},
            {'name': 'filed_by_0', 'type': 'text', 'left': 231, 'top': 320, 'pdf_top': 320, 'width': 93, 'height': 20},
            {'name': 'purpose_0', 'type': 'text', 'left': 325, 'top': 320, 'pdf_top': 320, 'width': 93, 'height': 20},
            {'name': 'number_0', 'type': 'text', 'left': 419, 'top': 320, 'pdf_top': 320, 'width': 93, 'height': 20},
            {'name': 'amount_0', 'type': 'text', 'left': 514, 'top': 320, 'pdf_top': 320, 'width': 93, 'height': 20},
            {'name': 'court_fee_0', 'type': 'text', 'left': 608, 'top': 320, 'pdf_top': 320, 'width': 93, 'height': 20},

            {'name': 'date_filing_1', 'type': 'text', 'left': 136, 'top': 368, 'pdf_top': 368, 'width': 93, 'height': 20},
            {'name': 'filed_by_1', 'type': 'text', 'left': 231, 'top': 368, 'pdf_top': 368, 'width': 93, 'height': 20},
            {'name': 'purpose_1', 'type': 'text', 'left': 325, 'top': 368, 'pdf_top': 368, 'width': 93, 'height': 20},
            {'name': 'number_1', 'type': 'text', 'left': 419, 'top': 368, 'pdf_top': 368, 'width': 93, 'height': 20},
            {'name': 'amount_1', 'type': 'text', 'left': 514, 'top': 368, 'pdf_top': 368, 'width': 93, 'height': 20},
            {'name': 'court_fee_1', 'type': 'text', 'left': 608, 'top': 368, 'pdf_top': 368, 'width': 93, 'height': 20},

            {'name': 'date_filing_2', 'type': 'text', 'left': 136, 'top': 416, 'pdf_top': 416, 'width': 93, 'height': 20},
            {'name': 'filed_by_2', 'type': 'text', 'left': 231, 'top': 416, 'pdf_top': 416, 'width': 93, 'height': 20},
            {'name': 'purpose_2', 'type': 'text', 'left': 325, 'top': 416, 'pdf_top': 416, 'width': 93, 'height': 20},
            {'name': 'number_2', 'type': 'text', 'left': 419, 'top': 416, 'pdf_top': 416, 'width': 93, 'height': 20},
            {'name': 'amount_2', 'type': 'text', 'left': 514, 'top': 416, 'pdf_top': 416, 'width': 93, 'height': 20},
            {'name': 'court_fee_2', 'type': 'text', 'left': 608, 'top': 416, 'pdf_top': 416, 'width': 93, 'height': 20},

            {'name': 'date_filing_3', 'type': 'text', 'left': 136, 'top': 464, 'pdf_top': 464, 'width': 93, 'height': 20},
            {'name': 'filed_by_3', 'type': 'text', 'left': 231, 'top': 464, 'pdf_top': 464, 'width': 93, 'height': 20},
            {'name': 'purpose_3', 'type': 'text', 'left': 325, 'top': 464, 'pdf_top': 464, 'width': 93, 'height': 20},
            {'name': 'number_3', 'type': 'text', 'left': 419, 'top': 464, 'pdf_top': 464, 'width': 93, 'height': 20},
            {'name': 'amount_3', 'type': 'text', 'left': 514, 'top': 464, 'pdf_top': 464, 'width': 93, 'height': 20},
            {'name': 'court_fee_3', 'type': 'text', 'left': 608, 'top': 464, 'pdf_top': 608, 'width': 93, 'height': 20},

            {'name': 'date_filing_4', 'type': 'text', 'left': 136, 'top': 512, 'pdf_top': 512, 'width': 93, 'height': 20},
            {'name': 'filed_by_4', 'type': 'text', 'left': 231, 'top': 512, 'pdf_top': 512, 'width': 93, 'height': 20},
            {'name': 'purpose_4', 'type': 'text', 'left': 325, 'top': 512, 'pdf_top': 512, 'width': 93, 'height': 20},
            {'name': 'number_4', 'type': 'text', 'left': 419, 'top': 512, 'pdf_top': 512, 'width': 93, 'height': 20},
            {'name': 'amount_4', 'type': 'text', 'left': 514, 'top': 512, 'pdf_top': 512, 'width': 93, 'height': 20},
            {'name': 'court_fee_4', 'type': 'text', 'left': 608, 'top': 512, 'pdf_top': 512, 'width': 93, 'height': 20},

            {'name': 'date_filing_5', 'type': 'text', 'left': 136, 'top': 560, 'pdf_top': 560, 'width': 93, 'height': 20},
            {'name': 'filed_by_5', 'type': 'text', 'left': 231, 'top': 560, 'pdf_top': 560, 'width': 93, 'height': 20},
            {'name': 'purpose_5', 'type': 'text', 'left': 325, 'top': 560, 'pdf_top': 560, 'width': 93, 'height': 20},
            {'name': 'number_5', 'type': 'text', 'left': 419, 'top': 560, 'pdf_top': 560, 'width': 93, 'height': 20},
            {'name': 'amount_5', 'type': 'text', 'left': 514, 'top': 560, 'pdf_top': 560, 'width': 93, 'height': 20},
            {'name': 'court_fee_5', 'type': 'text', 'left': 608, 'top': 560, 'pdf_top': 560, 'width': 93, 'height': 20},

            {'name': 'date_filing_6', 'type': 'text', 'left': 136, 'top': 608, 'pdf_top': 608, 'width': 93, 'height': 20},
            {'name': 'filed_by_6', 'type': 'text', 'left': 231, 'top': 608, 'pdf_top': 608, 'width': 93, 'height': 20},
            {'name': 'purpose_6', 'type': 'text', 'left': 325, 'top': 608, 'pdf_top': 608, 'width': 93, 'height': 20},
            {'name': 'number_6', 'type': 'text', 'left': 419, 'top': 608, 'pdf_top': 608, 'width': 93, 'height': 20},
            {'name': 'amount_6', 'type': 'text', 'left': 514, 'top': 608, 'pdf_top': 608, 'width': 93, 'height': 20},
            {'name': 'court_fee_6', 'type': 'text', 'left': 608, 'top': 608, 'pdf_top': 608, 'width': 93, 'height': 20},

            {'name': 'date_filing_7', 'type': 'text', 'left': 136, 'top': 656, 'pdf_top': 656, 'width': 93, 'height': 20},
            {'name': 'filed_by_7', 'type': 'text', 'left': 231, 'top': 656, 'pdf_top': 656, 'width': 93, 'height': 20},
            {'name': 'purpose_7', 'type': 'text', 'left': 325, 'top': 656, 'pdf_top': 656, 'width': 93, 'height': 20},
            {'name': 'number_7', 'type': 'text', 'left': 419, 'top': 656, 'pdf_top': 656, 'width': 93, 'height': 20},
            {'name': 'amount_7', 'type': 'text', 'left': 514, 'top': 656, 'pdf_top': 656, 'width': 93, 'height': 20},
            {'name': 'court_fee_7', 'type': 'text', 'left': 608, 'top': 656, 'pdf_top': 656, 'width': 93, 'height': 20},

            {'name': 'date_filing_8', 'type': 'text', 'left': 136, 'top': 704, 'pdf_top': 704, 'width': 93, 'height': 20},
            {'name': 'filed_by_8', 'type': 'text', 'left': 231, 'top': 704, 'pdf_top': 704, 'width': 93, 'height': 20},
            {'name': 'purpose_8', 'type': 'text', 'left': 325, 'top': 704, 'pdf_top': 704, 'width': 93, 'height': 20},
            {'name': 'number_8', 'type': 'text', 'left': 419, 'top': 704, 'pdf_top': 704, 'width': 93, 'height': 20},
            {'name': 'amount_8', 'type': 'text', 'left': 514, 'top': 704, 'pdf_top': 704, 'width': 93, 'height': 20},
            {'name': 'court_fee_8', 'type': 'text', 'left': 608, 'top': 704, 'pdf_top': 704, 'width': 93, 'height': 20},

            {'name': 'date_filing_9', 'type': 'text', 'left': 136, 'top': 752, 'pdf_top': 752, 'width': 93, 'height': 20},
            {'name': 'filed_by_9', 'type': 'text', 'left': 231, 'top': 752, 'pdf_top': 752, 'width': 93, 'height': 20},
            {'name': 'purpose_9', 'type': 'text', 'left': 325, 'top': 752, 'pdf_top': 752, 'width': 93, 'height': 20},
            {'name': 'number_9', 'type': 'text', 'left': 419, 'top': 752, 'pdf_top': 752, 'width': 93, 'height': 20},
            {'name': 'amount_9', 'type': 'text', 'left': 514, 'top': 752, 'pdf_top': 752, 'width': 93, 'height': 20},
            {'name': 'court_fee_9', 'type': 'text', 'left': 608, 'top': 752, 'pdf_top': 752, 'width': 93, 'height': 20},

            {'name': 'date_filing_10', 'type': 'text', 'left': 136, 'top': 800, 'pdf_top': 800, 'width': 93, 'height': 20},
            {'name': 'filed_by_10', 'type': 'text', 'left': 231, 'top': 800, 'pdf_top': 800, 'width': 93, 'height': 20},
            {'name': 'purpose_10', 'type': 'text', 'left': 325, 'top': 800, 'pdf_top': 800, 'width': 93, 'height': 20},
            {'name': 'number_10', 'type': 'text', 'left': 419, 'top': 800, 'pdf_top': 800, 'width': 93, 'height': 20},
            {'name': 'amount_10', 'type': 'text', 'left': 514, 'top': 800, 'pdf_top': 800, 'width': 93, 'height': 20},
            {'name': 'court_fee_10', 'type': 'text', 'left': 608, 'top': 800, 'pdf_top': 800, 'width': 93, 'height': 20},

            {'name': 'date_filing_11', 'type': 'text', 'left': 136, 'top': 848, 'pdf_top': 848, 'width': 93, 'height': 20},
            {'name': 'filed_by_11', 'type': 'text', 'left': 231, 'top': 848, 'pdf_top': 848, 'width': 93, 'height': 20},
            {'name': 'purpose_11', 'type': 'text', 'left': 325, 'top': 848, 'pdf_top': 848, 'width': 93, 'height': 20},
            {'name': 'number_11', 'type': 'text', 'left': 419, 'top': 848, 'pdf_top': 848, 'width': 93, 'height': 20},
            {'name': 'amount_11', 'type': 'text', 'left': 514, 'top': 848, 'pdf_top': 848, 'width': 93, 'height': 20},
            {'name': 'court_fee_11', 'type': 'text', 'left': 608, 'top': 848, 'pdf_top': 848, 'width': 93, 'height': 20},

            {'name': 'date_filing_12', 'type': 'text', 'left': 136, 'top': 896, 'pdf_top': 896, 'width': 93, 'height': 20},
            {'name': 'filed_by_12', 'type': 'text', 'left': 231, 'top': 896, 'pdf_top': 896, 'width': 93, 'height': 20},
            {'name': 'purpose_12', 'type': 'text', 'left': 325, 'top': 896, 'pdf_top': 896, 'width': 93, 'height': 20},
            {'name': 'number_12', 'type': 'text', 'left': 419, 'top': 896, 'pdf_top': 896, 'width': 93, 'height': 20},
            {'name': 'amount_12', 'type': 'text', 'left': 514, 'top': 896, 'pdf_top': 896, 'width': 93, 'height': 20},
            {'name': 'court_fee_12', 'type': 'text', 'left': 608, 'top': 896, 'pdf_top': 896, 'width': 93, 'height': 20},

            {'name': 'date_filing_13', 'type': 'text', 'left': 136, 'top': 944, 'pdf_top': 944, 'width': 93, 'height': 20},
            {'name': 'filed_by_13', 'type': 'text', 'left': 231, 'top': 944, 'pdf_top': 944, 'width': 93, 'height': 20},
            {'name': 'purpose_13', 'type': 'text', 'left': 325, 'top': 944, 'pdf_top': 944, 'width': 93, 'height': 20},
            {'name': 'number_13', 'type': 'text', 'left': 419, 'top': 944, 'pdf_top': 944, 'width': 93, 'height': 20},
            {'name': 'amount_13', 'type': 'text', 'left': 514, 'top': 944, 'pdf_top': 944, 'width': 93, 'height': 20},
            {'name': 'court_fee_13', 'type': 'text', 'left': 608, 'top': 944, 'pdf_top': 944, 'width': 93, 'height': 20},

            {'name': 'date_filing_14', 'type': 'text', 'left': 136, 'top': 992, 'pdf_top': 992, 'width': 93, 'height': 20},
            {'name': 'filed_by_14', 'type': 'text', 'left': 231, 'top': 992, 'pdf_top': 992, 'width': 93, 'height': 20},
            {'name': 'purpose_14', 'type': 'text', 'left': 325, 'top': 992, 'pdf_top': 992, 'width': 93, 'height': 20},
            {'name': 'number_14', 'type': 'text', 'left': 419, 'top': 992, 'pdf_top': 992, 'width': 93, 'height': 20},
            {'name': 'amount_14', 'type': 'text', 'left': 514, 'top': 992, 'pdf_top': 992, 'width': 93, 'height': 20},
            {'name': 'court_fee_14', 'type': 'text', 'left': 608, 'top': 992, 'pdf_top': 992, 'width': 93, 'height': 20},
        ],
        'signature': {'name': 'advocate_signature', 'left': 550, 'top': 1030, 'width': 153, 'height': 50, 'label': 'Signature of Advocate', 'type': 'advocate'}
    },

    'process_fee_form': {
        'filename': 'forms_Process fee.html',
        'width': 816,
        'height': 1056,
        'fields': [
            {'name': 'court_name', 'type': 'text', 'left': 235, 'top': 160, 'pdf_top': 160, 'width': 475, 'height': 20},
            {'name': 'case_number', 'type': 'text', 'left': 235, 'top': 195, 'pdf_top': 195, 'width': 355, 'height': 20},
            {'name': 'case_year', 'type': 'text', 'left': 620, 'top': 195, 'pdf_top': 195, 'width': 90, 'height': 20},
            {'name': 'plaintiff_name', 'type': 'text', 'left': 120, 'top': 255, 'pdf_top': 255, 'width': 590, 'height': 20},
            {'name': 'defendant_name', 'type': 'text', 'left': 120, 'top': 335, 'pdf_top': 335, 'width': 590, 'height': 20},
            {'name': 'nature_of_process', 'type': 'text', 'left': 120, 'top': 415, 'pdf_top': 415, 'width': 590, 'height': 20},
            {'name': 'process_fee_amount', 'type': 'text', 'left': 235, 'top': 485, 'pdf_top': 485, 'width': 475, 'height': 20},
            {'name': 'dated', 'type': 'text', 'left': 120, 'top': 865, 'pdf_top': 865, 'width': 300, 'height': 20},
        ],
        'signature': {'name': 'advocate_signature', 'left': 550, 'top': 865, 'width': 170, 'height': 50, 'label': 'Signature of Advocate', 'type': 'advocate'}
    },
    'process_fee': {
        'filename': 'forms_Process fee_1.html',
        'width': 816,
        'height': 1248,
        'fields': [
            {'name': 'court_name', 'type': 'text', 'left': 235, 'top': 140, 'pdf_top': 140, 'width': 475, 'height': 20},
            {'name': 'case_number', 'type': 'text', 'left': 235, 'top': 175, 'pdf_top': 175, 'width': 355, 'height': 20},
            {'name': 'case_year', 'type': 'text', 'left': 620, 'top': 175, 'pdf_top': 175, 'width': 90, 'height': 20},
            {'name': 'plaintiff_name', 'type': 'text', 'left': 120, 'top': 235, 'pdf_top': 235, 'width': 590, 'height': 20},
            {'name': 'defendant_name', 'type': 'text', 'left': 120, 'top': 315, 'pdf_top': 315, 'width': 590, 'height': 20},

            # 14 Table Rows
            {'name': 'date_filing_1', 'type': 'text', 'left': 136, 'top': 416, 'pdf_top': 416, 'width': 93, 'height': 20},
            {'name': 'filed_by_1', 'type': 'text', 'left': 231, 'top': 416, 'pdf_top': 416, 'width': 93, 'height': 20},
            {'name': 'purpose_1', 'type': 'text', 'left': 325, 'top': 416, 'pdf_top': 416, 'width': 93, 'height': 20},
            {'name': 'number_1', 'type': 'text', 'left': 419, 'top': 416, 'pdf_top': 416, 'width': 93, 'height': 20},
            {'name': 'amount_1', 'type': 'text', 'left': 514, 'top': 416, 'pdf_top': 416, 'width': 93, 'height': 20},
            {'name': 'court_fee_1', 'type': 'text', 'left': 608, 'top': 416, 'pdf_top': 416, 'width': 93, 'height': 20},

            {'name': 'date_filing_2', 'type': 'text', 'left': 136, 'top': 458, 'pdf_top': 458, 'width': 93, 'height': 20},
            {'name': 'filed_by_2', 'type': 'text', 'left': 231, 'top': 458, 'pdf_top': 458, 'width': 93, 'height': 20},
            {'name': 'purpose_2', 'type': 'text', 'left': 325, 'top': 458, 'pdf_top': 458, 'width': 93, 'height': 20},
            {'name': 'number_2', 'type': 'text', 'left': 419, 'top': 458, 'pdf_top': 458, 'width': 93, 'height': 20},
            {'name': 'amount_2', 'type': 'text', 'left': 514, 'top': 458, 'pdf_top': 458, 'width': 93, 'height': 20},
            {'name': 'court_fee_2', 'type': 'text', 'left': 608, 'top': 458, 'pdf_top': 458, 'width': 93, 'height': 20},

            {'name': 'date_filing_3', 'type': 'text', 'left': 136, 'top': 500, 'pdf_top': 500, 'width': 93, 'height': 20},
            {'name': 'filed_by_3', 'type': 'text', 'left': 231, 'top': 500, 'pdf_top': 500, 'width': 93, 'height': 20},
            {'name': 'purpose_3', 'type': 'text', 'left': 325, 'top': 500, 'pdf_top': 500, 'width': 93, 'height': 20},
            {'name': 'number_3', 'type': 'text', 'left': 419, 'top': 500, 'pdf_top': 500, 'width': 93, 'height': 20},
            {'name': 'amount_3', 'type': 'text', 'left': 514, 'top': 500, 'pdf_top': 500, 'width': 93, 'height': 20},
            {'name': 'court_fee_3', 'type': 'text', 'left': 608, 'top': 500, 'pdf_top': 500, 'width': 93, 'height': 20},

            {'name': 'date_filing_4', 'type': 'text', 'left': 136, 'top': 542, 'pdf_top': 542, 'width': 93, 'height': 20},
            {'name': 'filed_by_4', 'type': 'text', 'left': 231, 'top': 542, 'pdf_top': 542, 'width': 93, 'height': 20},
            {'name': 'purpose_4', 'type': 'text', 'left': 325, 'top': 542, 'pdf_top': 542, 'width': 93, 'height': 20},
            {'name': 'number_4', 'type': 'text', 'left': 419, 'top': 542, 'pdf_top': 542, 'width': 93, 'height': 20},
            {'name': 'amount_4', 'type': 'text', 'left': 514, 'top': 542, 'pdf_top': 542, 'width': 93, 'height': 20},
            {'name': 'court_fee_4', 'type': 'text', 'left': 608, 'top': 542, 'pdf_top': 542, 'width': 93, 'height': 20},

            {'name': 'date_filing_5', 'type': 'text', 'left': 136, 'top': 584, 'pdf_top': 584, 'width': 93, 'height': 20},
            {'name': 'filed_by_5', 'type': 'text', 'left': 231, 'top': 584, 'pdf_top': 584, 'width': 93, 'height': 20},
            {'name': 'purpose_5', 'type': 'text', 'left': 325, 'top': 584, 'pdf_top': 584, 'width': 93, 'height': 20},
            {'name': 'number_5', 'type': 'text', 'left': 419, 'top': 584, 'pdf_top': 584, 'width': 93, 'height': 20},
            {'name': 'amount_5', 'type': 'text', 'left': 514, 'top': 584, 'pdf_top': 584, 'width': 93, 'height': 20},
            {'name': 'court_fee_5', 'type': 'text', 'left': 608, 'top': 584, 'pdf_top': 584, 'width': 93, 'height': 20},

            {'name': 'date_filing_6', 'type': 'text', 'left': 136, 'top': 626, 'pdf_top': 626, 'width': 93, 'height': 20},
            {'name': 'filed_by_6', 'type': 'text', 'left': 231, 'top': 626, 'pdf_top': 626, 'width': 93, 'height': 20},
            {'name': 'purpose_6', 'type': 'text', 'left': 325, 'top': 626, 'pdf_top': 626, 'width': 93, 'height': 20},
            {'name': 'number_6', 'type': 'text', 'left': 419, 'top': 626, 'pdf_top': 626, 'width': 93, 'height': 20},
            {'name': 'amount_6', 'type': 'text', 'left': 514, 'top': 626, 'pdf_top': 626, 'width': 93, 'height': 20},
            {'name': 'court_fee_6', 'type': 'text', 'left': 608, 'top': 626, 'pdf_top': 626, 'width': 93, 'height': 20},

            {'name': 'date_filing_7', 'type': 'text', 'left': 136, 'top': 668, 'pdf_top': 668, 'width': 93, 'height': 20},
            {'name': 'filed_by_7', 'type': 'text', 'left': 231, 'top': 668, 'pdf_top': 668, 'width': 93, 'height': 20},
            {'name': 'purpose_7', 'type': 'text', 'left': 325, 'top': 668, 'pdf_top': 668, 'width': 93, 'height': 20},
            {'name': 'number_7', 'type': 'text', 'left': 419, 'top': 668, 'pdf_top': 668, 'width': 93, 'height': 20},
            {'name': 'amount_7', 'type': 'text', 'left': 514, 'top': 668, 'pdf_top': 668, 'width': 93, 'height': 20},
            {'name': 'court_fee_7', 'type': 'text', 'left': 608, 'top': 668, 'pdf_top': 668, 'width': 93, 'height': 20},

            {'name': 'date_filing_8', 'type': 'text', 'left': 136, 'top': 710, 'pdf_top': 710, 'width': 93, 'height': 20},
            {'name': 'filed_by_8', 'type': 'text', 'left': 231, 'top': 710, 'pdf_top': 710, 'width': 93, 'height': 20},
            {'name': 'purpose_8', 'type': 'text', 'left': 325, 'top': 710, 'pdf_top': 710, 'width': 93, 'height': 20},
            {'name': 'number_8', 'type': 'text', 'left': 419, 'top': 710, 'pdf_top': 710, 'width': 93, 'height': 20},
            {'name': 'amount_8', 'type': 'text', 'left': 514, 'top': 710, 'pdf_top': 710, 'width': 93, 'height': 20},
            {'name': 'court_fee_8', 'type': 'text', 'left': 608, 'top': 710, 'pdf_top': 710, 'width': 93, 'height': 20},

            {'name': 'date_filing_9', 'type': 'text', 'left': 136, 'top': 752, 'pdf_top': 752, 'width': 93, 'height': 20},
            {'name': 'filed_by_9', 'type': 'text', 'left': 231, 'top': 752, 'pdf_top': 752, 'width': 93, 'height': 20},
            {'name': 'purpose_9', 'type': 'text', 'left': 325, 'top': 752, 'pdf_top': 752, 'width': 93, 'height': 20},
            {'name': 'number_9', 'type': 'text', 'left': 419, 'top': 752, 'pdf_top': 752, 'width': 93, 'height': 20},
            {'name': 'amount_9', 'type': 'text', 'left': 514, 'top': 752, 'pdf_top': 752, 'width': 93, 'height': 20},
            {'name': 'court_fee_9', 'type': 'text', 'left': 608, 'top': 752, 'pdf_top': 752, 'width': 93, 'height': 20},

            {'name': 'date_filing_10', 'type': 'text', 'left': 136, 'top': 800, 'pdf_top': 800, 'width': 93, 'height': 20},
            {'name': 'filed_by_10', 'type': 'text', 'left': 231, 'top': 800, 'pdf_top': 800, 'width': 93, 'height': 20},
            {'name': 'purpose_10', 'type': 'text', 'left': 325, 'top': 800, 'pdf_top': 800, 'width': 93, 'height': 20},
            {'name': 'number_10', 'type': 'text', 'left': 419, 'top': 800, 'pdf_top': 800, 'width': 93, 'height': 20},
            {'name': 'amount_10', 'type': 'text', 'left': 514, 'top': 800, 'pdf_top': 800, 'width': 93, 'height': 20},
            {'name': 'court_fee_10', 'type': 'text', 'left': 608, 'top': 800, 'pdf_top': 800, 'width': 93, 'height': 20},

            {'name': 'date_filing_11', 'type': 'text', 'left': 136, 'top': 848, 'pdf_top': 848, 'width': 93, 'height': 20},
            {'name': 'filed_by_11', 'type': 'text', 'left': 231, 'top': 848, 'pdf_top': 848, 'width': 93, 'height': 20},
            {'name': 'purpose_11', 'type': 'text', 'left': 325, 'top': 848, 'pdf_top': 848, 'width': 93, 'height': 20},
            {'name': 'number_11', 'type': 'text', 'left': 419, 'top': 848, 'pdf_top': 848, 'width': 93, 'height': 20},
            {'name': 'amount_11', 'type': 'text', 'left': 514, 'top': 848, 'pdf_top': 848, 'width': 93, 'height': 20},
            {'name': 'court_fee_11', 'type': 'text', 'left': 608, 'top': 848, 'pdf_top': 848, 'width': 93, 'height': 20},

            {'name': 'date_filing_12', 'type': 'text', 'left': 136, 'top': 896, 'pdf_top': 896, 'width': 93, 'height': 20},
            {'name': 'filed_by_12', 'type': 'text', 'left': 231, 'top': 896, 'pdf_top': 896, 'width': 93, 'height': 20},
            {'name': 'purpose_12', 'type': 'text', 'left': 325, 'top': 896, 'pdf_top': 896, 'width': 93, 'height': 20},
            {'name': 'number_12', 'type': 'text', 'left': 419, 'top': 896, 'pdf_top': 896, 'width': 93, 'height': 20},
            {'name': 'amount_12', 'type': 'text', 'left': 514, 'top': 896, 'pdf_top': 896, 'width': 93, 'height': 20},
            {'name': 'court_fee_12', 'type': 'text', 'left': 608, 'top': 896, 'pdf_top': 896, 'width': 93, 'height': 20},

            {'name': 'date_filing_13', 'type': 'text', 'left': 136, 'top': 944, 'pdf_top': 944, 'width': 93, 'height': 20},
            {'name': 'filed_by_13', 'type': 'text', 'left': 231, 'top': 944, 'pdf_top': 944, 'width': 93, 'height': 20},
            {'name': 'purpose_13', 'type': 'text', 'left': 325, 'top': 944, 'pdf_top': 944, 'width': 93, 'height': 20},
            {'name': 'number_13', 'type': 'text', 'left': 419, 'top': 944, 'pdf_top': 944, 'width': 93, 'height': 20},
            {'name': 'amount_13', 'type': 'text', 'left': 514, 'top': 944, 'pdf_top': 944, 'width': 93, 'height': 20},
            {'name': 'court_fee_13', 'type': 'text', 'left': 608, 'top': 944, 'pdf_top': 944, 'width': 93, 'height': 20},

            {'name': 'date_filing_14', 'type': 'text', 'left': 136, 'top': 992, 'pdf_top': 992, 'width': 93, 'height': 20},
            {'name': 'filed_by_14', 'type': 'text', 'left': 231, 'top': 992, 'pdf_top': 992, 'width': 93, 'height': 20},
            {'name': 'purpose_14', 'type': 'text', 'left': 325, 'top': 992, 'pdf_top': 992, 'width': 93, 'height': 20},
            {'name': 'number_14', 'type': 'text', 'left': 419, 'top': 992, 'pdf_top': 992, 'width': 93, 'height': 20},
            {'name': 'amount_14', 'type': 'text', 'left': 514, 'top': 992, 'pdf_top': 992, 'width': 93, 'height': 20},
            {'name': 'court_fee_14', 'type': 'text', 'left': 608, 'top': 992, 'pdf_top': 992, 'width': 93, 'height': 20},
        ],
        'signature': {'name': 'advocate_signature', 'left': 550, 'top': 1030, 'width': 153, 'height': 50, 'label': 'Signature of Advocate', 'type': 'advocate'}
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
    if 'ca form' in n or 'ca 7' in n or 'certified copy' in n:
        return 'ca_form_7'
    elif '138' in n:
        return 'checklist_138'
    elif 'check list' in n or 'checklist' in n:
        return 'checklist'
    elif 'commercial' in n:
        return 'commercial_court'
    elif 'e court' in n or 'ecourt' in n:
        return 'ecourt_fee'
    elif 'case info' in n or 'information format' in n:
        return 'case_info'
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
    elif 'process fee form' in n:
        return 'process_fee_form'
    elif 'process fee' in n:
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

    placed_sigs = field_values.get('placed_signatures', []) if isinstance(field_values, dict) else []
    offsets = field_values.get('signature_offsets', {}) if isinstance(field_values, dict) else {}

    def is_matching_slot(slot, ps):
        s_name = str(slot.get('name') or slot.get('id') or '').lower()
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

        if ps_id and (ps_id == s_name or ps_id == str(slot.get('id') or '').lower()):
            return True
        if ps_name and (ps_name == s_name or ps_name == str(slot.get('id') or '').lower()):
            return True
        if s_type in ['advocate', 'client'] and (ps_type == s_type or ps_id == f'{s_type}_primary' or s_type in ps_name or s_type in ps_id):
            return True
        return False

    # 1. Update existing template slots with placed info or offsets
    matched_ps_ids = set()
    for slot in all_sig_defs:
        s_name = slot.get('name', '')
        s_id = slot.get('id', s_name)
        s_type = slot.get('type', 'custom')

        for ps in placed_sigs:
            if is_matching_slot(slot, ps):
                if ps.get('id'): matched_ps_ids.add(str(ps.get('id')))
                if ps.get('name'): matched_ps_ids.add(str(ps.get('name')))
                if 'x' in ps or 'left' in ps:
                    slot['left'] = ps.get('x', ps.get('left'))
                if 'y' in ps or 'top' in ps:
                    slot['top'] = ps.get('y', ps.get('top'))
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
        s_name = sig_item.get('name', '')
        s_id = sig_item.get('id', s_name)
        s_type = sig_item.get('type', 'custom')

        if not sig_item.get('image_url'):
            for ps in placed_sigs:
                if ps.get('id') == s_id or ps.get('name') == s_name or (ps.get('type') == s_type and ps.get('image_url')):
                    sig_item['image_url'] = ps.get('image_url')
                    break

        if not sig_item.get('image_url') and form_obj:
            if s_type == 'advocate':
                adv_sig = getattr(form_obj, 'advocate_signature_image', None)
                if adv_sig and hasattr(adv_sig, 'url'):
                    sig_item['image_url'] = adv_sig.url
            elif s_type == 'client':
                cli_sig = getattr(form_obj, 'client_signature_image', None)
                if cli_sig and hasattr(cli_sig, 'url'):
                    sig_item['image_url'] = cli_sig.url
            else:
                adv_sig = getattr(form_obj, 'advocate_signature_image', None)
                cli_sig = getattr(form_obj, 'client_signature_image', None)
                if adv_sig and hasattr(adv_sig, 'url'):
                    sig_item['image_url'] = adv_sig.url
                elif cli_sig and hasattr(cli_sig, 'url'):
                    sig_item['image_url'] = cli_sig.url

    return all_sig_defs

def render_form_html(template_name, field_values=None, is_edit_mode=False, form_obj=None):
    """
    Renders the exact HTML court form with injected editable inputs (in edit mode)
    or filled text + signatures (in PDF mode).
    """
    key = get_template_key(template_name)
    if not key:
        return None

    defn = FORM_DEFINITIONS.get(key)
    if not defn:
        return None

    html_path = os.path.join(COURT_FORMS_DIR, defn['filename'])
    if not os.path.exists(html_path):
        return None

    with open(html_path, 'r', encoding='utf-8') as f:
        raw_html = f.read()

    field_values = field_values or {}
    fields = defn.get('fields', [])
    sig_def = defn.get('signature')
    page_w = defn.get('width', 816)
    page_h = defn.get('height', 1056)

    def _get_val(name):
        v = field_values.get(name)
        if v is not None and str(v).strip() != '':
            return str(v)
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
        elif name == 'plaintiff_name':
            for alt in ['petitioner_name', 'appellant_name', 'complainant_name']:
                if field_values.get(alt):
                    return str(field_values[alt])
        elif name == 'defendant_name':
            for alt in ['respondent_name', 'accused_name', 'opposite_party']:
                if field_values.get(alt):
                    return str(field_values[alt])
        elif name == 'suit_number':
            for alt in ['case_number', 'suit_no']:
                if field_values.get(alt):
                    return str(field_values[alt])
        elif name == 'hearing_date':
            for alt in ['ndoh', 'next_hearing_date']:
                if field_values.get(alt):
                    return str(field_values[alt])
        elif name == 'court_complex':
            for alt in ['court_name', 'court']:
                if field_values.get(alt):
                    return str(field_values[alt])
        elif name in ['first_name', 'surname', 'middle_name']:
            full = field_values.get('client_name') or field_values.get('litigant_name') or field_values.get('full_name')
            if full and isinstance(full, str):
                parts = full.strip().split()
                if name == 'first_name' and len(parts) >= 1:
                    return parts[0]
                elif name == 'surname' and len(parts) >= 2:
                    return parts[-1]
                elif name == 'middle_name' and len(parts) >= 3:
                    return ' '.join(parts[1:-1])
        elif name in ['dob_day', 'dob_month', 'dob_year']:
            dob = field_values.get('dob') or field_values.get('date_of_birth')
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
            dt = field_values.get('date') or field_values.get('filing_date')
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
        elif name == 'email':
            for alt in ['client_email', 'email_address']:
                if field_values.get(alt):
                    return str(field_values[alt])
        elif name == 'address_district':
            for alt in ['district', 'client_district']:
                if field_values.get(alt):
                    return str(field_values[alt])
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
        elif name == 'surety_accused_father':
            for alt in ['father_name', 'accused_father']:
                if field_values.get(alt):
                    return str(field_values[alt])
        elif name == 'aff_deponent_name':
            for alt in ['surety_name', 'deponent_name', 'client_name']:
                if field_values.get(alt):
                    return str(field_values[alt])
        elif name == 'aff_parent_name':
            for alt in ['surety_father', 'parent_name', 'father_name']:
                if field_values.get(alt):
                    return str(field_values[alt])
        elif name == 'aff_address':
            for alt in ['surety_address', 'surety_address_line1', 'address']:
                if field_values.get(alt):
                    return str(field_values[alt])
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
        elif name == 'client_name_decl':
            for alt in ['client_name', 'plaintiff_name', 'full_name']:
                if field_values.get(alt):
                    return str(field_values[alt])
        elif name == 'client_address_decl':
            for alt in ['client_address', 'address']:
                if field_values.get(alt):
                    return str(field_values[alt])
        elif name == 'advocate_details':
            for alt in ['adv_bar_no', 'advocate_bar_no', 'advocate_details']:
                if field_values.get(alt):
                    return str(field_values[alt])
        elif name == 'suit_appeal_no':
            return _get_val('case_number')
        return ''

    # Build injected overlay markup
    global_styles = []
    global_scripts = []
    page_elements = {}

    resolved_signatures = _resolve_signatures(defn, field_values, form_obj)

    if is_edit_mode:
        # Interactive Edit Mode: inject cleanly styled inputs & textareas
        global_styles.append('''
<style>
.cf-input {
    border: none !important;
    border-bottom: 2px solid #3b82f6 !important;
    background: rgba(239, 246, 255, 0.85) !important;
    color: #1e3a8a !important;
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
    color: #1e3a8a !important;
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
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    pointer-events: none;
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
    transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 1200;
}
.cf-sig-box:hover .cf-sig-badge {
    opacity: 1;
    transform: translateX(-50%) scale(1);
    pointer-events: auto;
}
.cf-sig-btn-clear {
    color: #f87171;
    cursor: pointer;
    font-weight: 900;
    padding: 0 4px;
    border-radius: 3px;
    transition: background 0.15s;
}
.cf-sig-btn-clear:hover {
    background: rgba(255, 255, 255, 0.25);
    color: #ef4444;
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

            pos_style = f"left:{left_pos}px;top:{top_pos}px;width:{width_val}px;height:{height_val}px;"
            has_img_class = ' has-image' if sig_url else ''
            img_markup = f'<img src="{sig_url}" alt="{sig_label}" />' if sig_url else f'<span class="cf-sig-placeholder">✍ {sig_label}</span>'
            badge_clear = '<span class="cf-sig-btn-clear" title="Clear Signature">✕</span>' if sig_url else ''
            badge_markup = f'<div class="cf-sig-badge"><span>✍ {sig_label}</span>{badge_clear}</div>'

            sig_el = (
                f'<div class="cf-sig-box{has_img_class}" '
                f'data-sig-id="{sig_id}" data-sig-name="{sig_name}" data-sig-label="{sig_label}" '
                f'data-sig-type="{sig_type}" data-page="{sig_p}" style="{pos_style}">'
                f'{img_markup}{badge_markup}'
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
                if (el.type === 'checkbox' || el.type === 'radio') {{
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
                image_url: sImg
            }};
            placed.push(sigData);
            offsets[sId] = {{ x: sX, y: sY, page: sPage }};
            if (sName) offsets[sName] = {{ x: sX, y: sY, page: sPage }};
            if (sType) offsets[sType] = {{ x: sX, y: sY, page: sPage }};
        }}
        vals['placed_signatures'] = placed;
        vals['signature_offsets'] = offsets;
        return vals;
    }}

    function sendPageSize() {{
        var p0 = document.getElementById('p0') || document.querySelector('.sheet') || document.body;
        var w = p0.offsetWidth || p0.clientWidth || {page_w};
        var h = p0.offsetHeight || p0.clientHeight || {page_h};
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
                    '<div class="cf-sig-badge"><span>✍ ' + sigLabel + '</span><span class="cf-sig-btn-clear" title="Clear Signature">✕</span></div>';
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
            newBox.style.left = (data.x || 450) + 'px';
            newBox.style.top = (data.y || 700) + 'px';
            newBox.style.width = (data.width || 160) + 'px';
            newBox.style.height = (data.height || 50) + 'px';
            
            if (data.imageUrl) {{
                newBox.innerHTML = '<img src="' + data.imageUrl + '" alt="' + (data.label || 'Signature') + '" />' +
                    '<div class="cf-sig-badge"><span>✍ ' + (data.label || 'Signature') + '</span><span class="cf-sig-btn-clear" title="Remove Signature">✕</span></div>';
            }} else {{
                newBox.innerHTML = '<span class="cf-sig-placeholder">✍ ' + (data.label || 'Signature') + '</span>' +
                    '<div class="cf-sig-badge"><span>✍ ' + (data.label || 'Signature') + '</span></div>';
            }}
            pageEl.appendChild(newBox);
            initSignatures();
            broadcastValues();
        }}
    }});

    // Cross-Page Signature Dragging & Interaction
    var activeDrag = null;
    var grabOffsetX = 0, grabOffsetY = 0;
    var startScreenX = 0, startScreenY = 0;
    var hasMoved = false;

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
        }});
    }}

    function onMouseDown(e) {{
        if (e.target.closest('.cf-sig-btn-clear')) {{
            e.stopPropagation();
            clearSignature(e.currentTarget);
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

        for (var i = 0; i < pages.length; i++) {{
            var p = pages[i];
            var pRect = p.getBoundingClientRect();
            if (clientY >= pRect.top && (clientY <= pRect.bottom || i === pages.length - 1)) {{
                targetPage = p;
                targetPageIndex = i;
                break;
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
            try {{
                window.parent.postMessage({{
                    type: 'COURT_FORM_SIGNATURE_MOVE',
                    sigId: sigId,
                    sigName: sigName,
                    sigType: sigType,
                    page: page,
                    x: newX,
                    y: newY
                }}, '*');
            }} catch(err) {{}}
            broadcastValues();
        }} else {{
            openSignature(box);
        }}
    }}

    function onTouchStart(e) {{
        if (e.target.closest('.cf-sig-btn-clear')) {{
            e.stopPropagation();
            clearSignature(e.currentTarget);
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

        for (var i = 0; i < pages.length; i++) {{
            var p = pages[i];
            var pRect = p.getBoundingClientRect();
            if (clientY >= pRect.top && (clientY <= pRect.bottom || i === pages.length - 1)) {{
                targetPage = p;
                targetPageIndex = i;
                break;
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
            try {{
                window.parent.postMessage({{
                    type: 'COURT_FORM_SIGNATURE_MOVE',
                    sigId: sigId,
                    sigName: sigName,
                    sigType: sigType,
                    page: page,
                    x: newX,
                    y: newY
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
        box.classList.remove('has-image');
        var sigLabel = box.getAttribute('data-sig-label') || 'Signature';
        var sigId = box.getAttribute('data-sig-id');
        var sigName = box.getAttribute('data-sig-name');
        box.innerHTML = '<span class="cf-sig-placeholder">✍ ' + sigLabel + '</span>' +
            '<div class="cf-sig-badge"><span>✍ ' + sigLabel + '</span></div>';
        try {{
            window.parent.postMessage({{
                type: 'COURT_FORM_SIGNATURE_REMOVE',
                sigId: sigId,
                sigName: sigName
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
        global_styles.append('''
<style>
@page {
    size: A4 portrait;
    margin: 0;
}
body {
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
}
.cf-pdf-val {
    position: absolute !important;
    color: #000000 !important;
    font-weight: 700 !important;
    font-size: 13px !important;
    font-family: 'Calibri', 'Arial', 'DejaVu Sans', sans-serif !important;
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
    font-family: 'Calibri', 'Arial', 'DejaVu Sans', sans-serif !important;
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
        # Check if page 1 is empty and has no elements
        p1_idx = final_html.find('id="p1"')
        if p1_idx != -1:
            raw_p1_text = final_html[p1_idx:]
            import re
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
        pdf_bytes = weasyprint.HTML(string=rendered_html).write_pdf()
        return pdf_bytes
    except Exception as ex:
        print(f"Error generating PDF from HTML template: {ex}")
        import traceback
        traceback.print_exc()
        return None
