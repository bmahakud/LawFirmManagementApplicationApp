export type CourtFormTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  category_display: string;
  sequence?: number;
  content_structure: {
    template_type?: 'html_overlay' | 'structured' | 'drafting';
    html_filename?: string;
    page_size?: string;
    margins?: { top: number; right: number; bottom: number; left: number };
    sections?: any[];
  };
  default_field_mappings: Record<string, string>;
  is_active: boolean;
};

export const DEFAULT_COURT_FORM_TEMPLATES: CourtFormTemplate[] = [
  {
    "id": "227f6a06-5856-4f0c-a156-59309b353a0f",
    "name": "Address Form",
    "description": "Official Court Form for Address Verification and Service",
    "category": "application",
    "category_display": "Application",
    "sequence": 1,
    "content_structure": {
      "template_type": "html_overlay",
      "html_filename": "forms_Address Form (1).html",
      "page_size": "A4",
      "margins": { "top": 50, "left": 50, "right": 50, "bottom": 50 },
      "sections": []
    },
    "default_field_mappings": {
      "court_name": "case.court_name",
      "case_number": "case.case_number",
      "opposite_party": "case.opposite_party"
    },
    "is_active": true
  },
  {
    "id": "d7a1c73e-3132-452f-9fe9-a4920c57995f",
    "name": "Advocate Form",
    "description": "Official Advocate Registration Details Form",
    "category": "advocate_form",
    "category_display": "Advocate Form",
    "sequence": 2,
    "content_structure": {
      "template_type": "html_overlay",
      "html_filename": "forms_Advocate Form_1.html",
      "page_size": "A4",
      "margins": { "top": 50, "left": 50, "right": 50, "bottom": 50 },
      "sections": []
    },
    "default_field_mappings": {
      "district": "Aurangabad",
      "bar_reg_no": "MAH/"
    },
    "is_active": true
  },
  {
    "id": "34f3194c-aa91-4bfe-a68f-ada38cd87821",
    "name": "Bail Bond",
    "description": "Official Court Form No. 45 Bail Bond for Attendance",
    "category": "bail_bond",
    "category_display": "Bail Bond",
    "sequence": 3,
    "content_structure": {
      "template_type": "html_overlay",
      "html_filename": "forms_Bail Bond.html",
      "page_size": "A4",
      "margins": { "top": 54, "left": 54, "right": 54, "bottom": 54 },
      "sections": []
    },
    "default_field_mappings": {
      "court_name": "case.court_name",
      "case_number": "case.case_number",
      "accused_name": "client.full_name",
      "accused_address": "client.address"
    },
    "is_active": true
  },
  {
    "id": "12fcf768-8eef-427e-a625-b0cf8cd2a782",
    "name": "CA Form 7",
    "description": "Application for Certified Copies of Court Orders and Documents",
    "category": "application",
    "category_display": "Application",
    "sequence": 4,
    "content_structure": {
      "template_type": "html_overlay",
      "html_filename": "forms_CA form 7.html",
      "page_size": "A4",
      "margins": { "top": 50, "left": 50, "right": 50, "bottom": 50 },
      "sections": []
    },
    "default_field_mappings": {
      "district_officer": "Principal District Judge",
      "applicant_name": "client.full_name",
      "resident_of": "client.address",
      "case_number_desc": "case.case_number",
      "court_name": "case.court_name",
      "parties_name": "case.title"
    },
    "is_active": true
  },
  {
    "id": "57f6bd1c-17a6-4e0e-91f6-c044e6f1dfff",
    "name": "Case Information Format",
    "description": "Standard Case Information Format for Filing & Presentation",
    "category": "application",
    "category_display": "Application",
    "sequence": 5,
    "content_structure": {
      "template_type": "html_overlay",
      "html_filename": "forms_Case Information Format.html",
      "page_size": "A4",
      "margins": { "top": 50, "left": 50, "right": 50, "bottom": 50 },
      "sections": []
    },
    "default_field_mappings": {
      "district": "Aurangabad"
    },
    "is_active": true
  },
  {
    "id": "f64a8e86-a8bd-45af-b3de-4c7863f9eecd",
    "name": "Check List 138 NI Act Matters",
    "description": "Filing Checklist for Negotiable Instruments Act Section 138 Complaints",
    "category": "checklist",
    "category_display": "Checklist",
    "sequence": 6,
    "content_structure": {
      "template_type": "html_overlay",
      "html_filename": "forms_Check List 138 NI Act Matters.html",
      "page_size": "A4",
      "margins": { "top": 50, "left": 50, "right": 50, "bottom": 50 },
      "sections": []
    },
    "default_field_mappings": {
      "case_details": "case.title",
      "cheque_amount": "case.claim_amount",
      "complainant_details": "client.full_name",
      "police_station": "case.police_station"
    },
    "is_active": true
  },
  {
    "id": "fc2fe125-380e-4c07-b186-bfd1ee76166e",
    "name": "Filing Check List",
    "description": "General Court Filing Compliance Checklist",
    "category": "checklist",
    "category_display": "Checklist",
    "sequence": 7,
    "content_structure": {
      "template_type": "html_overlay",
      "html_filename": "forms_Check List.html",
      "page_size": "A4",
      "margins": { "top": 50, "left": 50, "right": 50, "bottom": 50 },
      "sections": []
    },
    "default_field_mappings": {
      "advocate_details": "advocate.full_name",
      "suit_nature": "case.case_type",
      "valuation_jurisdiction": "case.claim_amount"
    },
    "is_active": true
  },
  {
    "id": "5293f034-003a-4464-a3aa-a848954d4183",
    "name": "Commercial Court Rules and Forms",
    "description": "Pre-Institution Mediation and Settlement Application under Commercial Courts Act",
    "category": "application",
    "category_display": "Application",
    "sequence": 8,
    "content_structure": {
      "template_type": "html_overlay",
      "html_filename": "forms_Commercial Court Rules and Forms.html",
      "page_size": "A4",
      "margins": { "top": 50, "left": 50, "right": 50, "bottom": 50 },
      "sections": []
    },
    "default_field_mappings": {},
    "is_active": true
  },
  {
    "id": "ebf10339-5130-48bb-b533-a42209e8bae0",
    "name": "E-Court Fee Receipt Application",
    "description": "SHCIL e-Court Fee Receipt Application Form",
    "category": "application",
    "category_display": "Application",
    "sequence": 9,
    "content_structure": {
      "template_type": "html_overlay",
      "html_filename": "forms_E-Court Fee.html",
      "page_size": "A4",
      "margins": { "top": 50, "left": 50, "right": 50, "bottom": 50 },
      "sections": []
    },
    "default_field_mappings": {},
    "is_active": true
  },
  {
    "id": "9a2c7949-3e0e-4915-a805-6118071051a7",
    "name": "Civil Case Filing Form",
    "description": "Official Presentation Form for Civil Suits and Petitions",
    "category": "application",
    "category_display": "Application",
    "sequence": 10,
    "content_structure": {
      "template_type": "html_overlay",
      "html_filename": "forms_Filing Form.html",
      "page_size": "A4",
      "margins": { "top": 50, "left": 50, "right": 50, "bottom": 50 },
      "sections": []
    },
    "default_field_mappings": {
      "court_name": "case.court_name",
      "case_type": "case.case_type",
      "plaintiff_name": "client.full_name",
      "plaintiff_address": "client.address",
      "plaintiff_mobile": "client.phone_number",
      "plaintiff_email": "client.email",
      "advocate_name": "advocate.full_name",
      "advocate_code": "advocate.bar_enrollment_number",
      "subject": "case.title",
      "defendant_name": "case.opposite_party"
    },
    "is_active": true
  },
  {
    "id": "17fa56ab-0bcb-4bcf-810e-1ec54ada1215",
    "name": "Form No 45 Bail Bond (Detailed)",
    "description": "Detailed Bail Bond and Affidavit for Attendance (Section 436, 437, 441)",
    "category": "bail_bond",
    "category_display": "Bail Bond",
    "sequence": 11,
    "content_structure": {
      "template_type": "html_overlay",
      "html_filename": "forms_Form No 45 Bail Bond_0.html",
      "page_size": "A4",
      "margins": { "top": 50, "left": 50, "right": 50, "bottom": 50 },
      "sections": []
    },
    "default_field_mappings": {
      "court_name": "case.court_name",
      "police_station": "case.police_station",
      "fir_no": "case.fir_number",
      "under_section": "case.sections_acts",
      "ndoh": "case.next_hearing_date",
      "accused_name": "client.full_name",
      "accused_address": "client.address"
    },
    "is_active": true
  },
  {
    "id": "0fbd29e5-207a-4110-8614-1281da403dac",
    "name": "Index Form",
    "description": "Case Paper Index for Civil Appeals, Revisions & Petitions",
    "category": "index",
    "category_display": "Index",
    "sequence": 12,
    "content_structure": {
      "template_type": "html_overlay",
      "html_filename": "forms_Index form.html",
      "page_size": "A4",
      "margins": { "top": 50, "left": 50, "right": 50, "bottom": 50 },
      "sections": []
    },
    "default_field_mappings": {
      "case_number": "case.case_number",
      "plaintiff_name": "client.full_name",
      "defendant_name": "case.opposite_party"
    },
    "is_active": true
  },
  {
    "id": "e325c153-4687-44b4-9f4d-6ad240c38291",
    "name": "Inspection Form",
    "description": "Application for Inspection of Court Records and Case Files",
    "category": "application",
    "category_display": "Application",
    "sequence": 13,
    "content_structure": {
      "template_type": "html_overlay",
      "html_filename": "forms_Inspection form.html",
      "page_size": "A4",
      "margins": { "top": 50, "left": 50, "right": 50, "bottom": 50 },
      "sections": []
    },
    "default_field_mappings": {
      "court_name": "case.court_name",
      "case_number": "case.case_number",
      "plaintiff_name": "client.full_name",
      "defendant_name": "case.opposite_party",
      "fir_case_no": "case.fir_number",
      "ndoh": "case.next_hearing_date",
      "hearing_date": "case.next_hearing_date"
    },
    "is_active": true
  },
  {
    "id": "f3335881-e5fb-45db-8a49-c66972f56d54",
    "name": "List of Documents",
    "description": "List of Documents Produced by Plaintiff/Defendant (Order XIII Rule 1 CPC)",
    "category": "index",
    "category_display": "Index",
    "sequence": 14,
    "content_structure": {
      "template_type": "html_overlay",
      "html_filename": "forms_List of documents.html",
      "page_size": "A4",
      "margins": { "top": 50, "left": 50, "right": 50, "bottom": 50 },
      "sections": []
    },
    "default_field_mappings": {
      "court_name": "case.court_name",
      "suit_number": "case.case_number",
      "plaintiff_name": "client.full_name",
      "defendant_name": "case.opposite_party"
    },
    "is_active": true
  },
  {
    "id": "66ef6124-d1bc-4292-b7f3-dbf517dcab1f",
    "name": "Litigant SMS & Email Details Form",
    "description": "Mobile & Email Details Collection Form for Litigants (e-Courts)",
    "category": "application",
    "category_display": "Application",
    "sequence": 15,
    "content_structure": {
      "template_type": "html_overlay",
      "html_filename": "forms_Litigant Form.html",
      "page_size": "A4",
      "margins": { "top": 50, "left": 50, "right": 50, "bottom": 50 },
      "sections": []
    },
    "default_field_mappings": {
      "court_complex": "case.court_name",
      "first_name": "client.first_name",
      "surname": "client.last_name",
      "email": "client.email",
      "mobile_no": "client.phone",
      "address": "client.address"
    },
    "is_active": true
  },
  {
    "id": "ba5aafc6-784a-4ceb-bb98-2a8d1c2aa2de",
    "name": "Memo of Appearance",
    "description": "Standard Memorandum of Appearance for Advocates",
    "category": "advocate_form",
    "category_display": "Advocate Form",
    "sequence": 16,
    "content_structure": {
      "template_type": "html_overlay",
      "html_filename": "forms_Memo of Appearance.html",
      "page_size": "A4",
      "margins": { "top": 50, "left": 50, "right": 50, "bottom": 50 },
      "sections": []
    },
    "default_field_mappings": {
      "court_name": "case.court_name",
      "plaintiff_name": "client.full_name",
      "defendant_name": "case.opposite_party",
      "party_represented_line1": "client.full_name"
    },
    "is_active": true
  },
  {
    "id": "cb30699f-a020-4a5e-813b-968dee17468e",
    "name": "Memorandum of Appearance Form 6",
    "description": "Official Form No. 6 Memorandum of Appearance for Pleaders",
    "category": "advocate_form",
    "category_display": "Advocate Form",
    "sequence": 17,
    "content_structure": {
      "template_type": "html_overlay",
      "html_filename": "forms_Memorandum of Appearance form_6.html",
      "page_size": "A4",
      "margins": { "top": 50, "left": 50, "right": 50, "bottom": 50 },
      "sections": []
    },
    "default_field_mappings": {
      "court_name": "case.court_name",
      "plaintiff_name": "client.full_name",
      "defendant_name": "case.opposite_party",
      "party_represented_line1": "client.full_name"
    },
    "is_active": true
  },
  {
    "id": "b31b73de-3678-4e71-b4bd-55e5eb07733b",
    "name": "Notice to Produce Documents",
    "description": "Notice to Produce Documents under Order XII Rule 8 CPC",
    "category": "application",
    "category_display": "Application",
    "sequence": 18,
    "content_structure": {
      "template_type": "html_overlay",
      "html_filename": "forms_Notice to produce documents.html",
      "page_size": "A4",
      "margins": { "top": 50, "left": 50, "right": 50, "bottom": 50 },
      "sections": []
    },
    "default_field_mappings": {
      "court_name": "case.court_name",
      "case_number": "case.case_number",
      "hearing_date": "case.next_hearing_date",
      "plaintiff_name": "client.full_name",
      "defendant_name": "case.opposite_party"
    },
    "is_active": true
  },
  {
    "id": "58ef3640-1b77-45ce-91b5-f9ddcc65882a",
    "name": "Personal Bail Bond Form",
    "description": "Personal Bail Bond and Undertaking under Section 437-A Cr.P.C.",
    "category": "bail_bond",
    "category_display": "Bail Bond",
    "sequence": 19,
    "content_structure": {
      "template_type": "html_overlay",
      "html_filename": "forms_Personal bail bond form.html",
      "page_size": "A4",
      "margins": { "top": 50, "left": 50, "right": 50, "bottom": 50 },
      "sections": []
    },
    "default_field_mappings": {
      "court_name": "case.court_name",
      "accused_name": "client.full_name",
      "accused_address": "client.address",
      "police_station": "case.police_station",
      "under_section": "case.under_section",
      "fir_no": "case.fir_no"
    },
    "is_active": true
  },
  {
    "id": "6f4b4c7f-e9f4-497a-8e54-74414cca839e",
    "name": "Process Fee Form (Talbana)",
    "description": "Process Fee and Service Form for Issuance of Court Summons",
    "category": "process_fee",
    "category_display": "Process Fee",
    "sequence": 20,
    "content_structure": {
      "template_type": "html_overlay",
      "html_filename": "forms_Process fee form.html",
      "page_size": "A4",
      "margins": { "top": 50, "left": 50, "right": 50, "bottom": 50 },
      "sections": []
    },
    "default_field_mappings": {
      "court_name": "case.court_name",
      "case_number": "case.case_number",
      "plaintiff_name": "client.full_name",
      "defendant_name": "case.opposite_party",
      "ndoh": "case.next_hearing_date"
    },
    "is_active": true
  },
  {
    "id": "de838f2e-629d-40ec-ae0c-4a6a84240cf2",
    "name": "Process Fee (Compact)",
    "description": "Compact Process Fee Form for Service of Notices",
    "category": "process_fee",
    "category_display": "Process Fee",
    "sequence": 21,
    "content_structure": {
      "template_type": "html_overlay",
      "html_filename": "forms_Process fee.html",
      "page_size": "A4",
      "margins": { "top": 50, "left": 50, "right": 50, "bottom": 50 },
      "sections": []
    },
    "default_field_mappings": {
      "court_name": "case.court_name",
      "case_number": "case.case_number",
      "plaintiff_name": "client.full_name",
      "defendant_name": "case.opposite_party",
      "suit_number": "case.case_number",
      "hearing_date": "case.next_hearing_date"
    },
    "is_active": true
  },
  {
    "id": "94e3d7b0-6df3-490f-9d46-6c73b902962f",
    "name": "Surety Bond",
    "description": "Surety Bond for Appearance and Attendance of Accused",
    "category": "bail_bond",
    "category_display": "Bail Bond",
    "sequence": 22,
    "content_structure": {
      "template_type": "html_overlay",
      "html_filename": "forms_Suriety bond.html",
      "page_size": "A4",
      "margins": { "top": 50, "left": 50, "right": 50, "bottom": 50 },
      "sections": []
    },
    "default_field_mappings": {
      "court_name": "case.court_name",
      "accused_name": "client.full_name",
      "accused_address": "client.address"
    },
    "is_active": true
  },
  {
    "id": "ffcab68a-7dd2-4737-9dc1-d9a110715c9d",
    "name": "Vakalatnama Form (Detailed)",
    "description": "Standard High Court & Subordinate Court Vakalatnama Form",
    "category": "advocate_form",
    "category_display": "Advocate Form",
    "sequence": 23,
    "content_structure": {
      "template_type": "html_overlay",
      "html_filename": "forms_Vakalatnama form.html",
      "page_size": "A4",
      "margins": { "top": 50, "left": 50, "right": 50, "bottom": 50 },
      "sections": []
    },
    "default_field_mappings": {
      "court_name": "case.court_name",
      "case_number": "case.case_number",
      "plaintiff_name": "client.full_name",
      "defendant_name": "case.opposite_party",
      "client_name_decl": "client.full_name",
      "client_address_decl": "client.address"
    },
    "is_active": true
  },
  {
    "id": "58c15f7d-97de-422d-a979-21e418869d61",
    "name": "Vakalatnama (Standard)",
    "description": "Advocate Appointment Power of Attorney / Vakalatnama",
    "category": "advocate_form",
    "category_display": "Advocate Form",
    "sequence": 24,
    "content_structure": {
      "template_type": "html_overlay",
      "html_filename": "forms_Vakalatnama.html",
      "page_size": "A4",
      "margins": { "top": 50, "left": 50, "right": 50, "bottom": 50 },
      "sections": []
    },
    "default_field_mappings": {
      "court_name": "case.court_name",
      "case_number": "case.case_number",
      "plaintiff_name": "client.full_name",
      "defendant_name": "case.opposite_party",
      "client_name_decl": "client.full_name",
      "client_address_decl": "client.address"
    },
    "is_active": true
  }
];
