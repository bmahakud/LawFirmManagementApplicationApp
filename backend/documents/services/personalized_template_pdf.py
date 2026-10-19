"""
Service to generate clean, professional A4 PDF documents from Personalized Templates.
Preserves original Word document HTML layout, tables, headings, and formatting.
"""
import io
import os
import re
import sys
import logging
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
from django.core.files.base import ContentFile
from django.utils import timezone

logger = logging.getLogger(__name__)


def substitute_template_variables(content: str, template) -> str:
    """
    Substitutes case, client, firm, and custom variables into the template content.
    Supported placeholders: {{case_number}}, {{court_name}}, {{client_name}}, {{advocate_name}}, {{date}}, etc.
    """
    if not content:
        return ''

    case = template.case
    client = template.client or (case.client if case else None)
    advocate = getattr(case, 'assigned_advocate', None) or getattr(case, 'solo_advocate', None) if case else None

    # Base replacements dictionary
    now_str = datetime.now().strftime('%d/%m/%Y')
    vars_map = {
        'case_number': getattr(case, 'case_number', '') or '',
        'case_title': getattr(case, 'title', '') or getattr(case, 'case_title', '') or '',
        'court_name': getattr(case, 'court_name', '') or getattr(case, 'court', '') or '',
        'client_name': getattr(client, 'full_name', '') or '',
        'advocate_name': advocate.get_full_name() if advocate else '',
        'firm_name': getattr(template.firm, 'name', '') or getattr(getattr(advocate, 'firm', None), 'name', '') or '',
        'date': now_str,
        'current_date': now_str,
        'today': now_str,
    }

    # Add custom field values
    if isinstance(template.field_values, dict):
        for k, v in template.field_values.items():
            if v is not None:
                vars_map[str(k).lower().strip()] = str(v)

    # Replace placeholders: {{key}} and {key}
    def replacer(match):
        key = match.group(1).lower().strip()
        return vars_map.get(key, match.group(0))

    rendered = re.sub(r'\{\{\s*([a-zA-Z0-9_\-\.]+)\s*\}\}', replacer, content)
    return rendered


def generate_pdf_via_weasyprint(raw_content: str, template, show_signature_block: bool, is_custom_or_imported: bool) -> bytes:
    """
    Renders HTML content to A4 PDF using WeasyPrint for pixel-perfect preservation of
    Word document layout, tables, fonts, headings, and alignments.
    """
    if sys.platform == 'darwin':
        current_ld = os.environ.get('DYLD_FALLBACK_LIBRARY_PATH', '')
        if '/opt/homebrew/lib' not in current_ld:
            os.environ['DYLD_FALLBACK_LIBRARY_PATH'] = f"/opt/homebrew/lib:{current_ld}".rstrip(':')

        import ctypes.util
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

    date_now = datetime.now().strftime('%d/%m/%Y')

    # Split content by PAGE_BREAK markers
    pages_raw = re.split(r'\s*---PAGE_BREAK---\s*', raw_content)
    pages_raw = [p.strip() for p in pages_raw if p.strip()] or ['']
    total_pages = len(pages_raw)

    # Header box for non-imported templates (if case is present)
    header_html = ""
    case = template.case
    if not is_custom_or_imported and case:
        doc_title = template.title or 'LEGAL DOCUMENT'
        type_display = getattr(template, 'custom_type_name', '') or getattr(template, 'template_type', '')
        clean_type = type_display.replace('_', ' ').upper() if type_display and type_display != 'custom' else 'LEGAL DOCUMENT'
        court = getattr(case, 'court_name', '') or getattr(case, 'court', '')
        case_num = getattr(case, 'case_number', '')
        client = template.client or (case.client if case else None)
        client_name = getattr(client, 'full_name', '')
        advocate = getattr(case, 'assigned_advocate', None) or getattr(case, 'solo_advocate', None) if case else None
        advocate_name = advocate.get_full_name() if advocate else 'Counsel'

        header_html = f'''
        <div class="template-header">
            <div class="template-subtype">{clean_type}</div>
            <h1 class="template-title">{doc_title.upper()}</h1>
            <table class="case-meta-table">
                <tr>
                    <td><b>Court / Authority:</b> {court or "District Court"}</td>
                    <td><b>Case Reference:</b> {case_num or "MURD999"}</td>
                </tr>
                <tr>
                    <td><b>Client / Deponent:</b> {client_name or "Client"}</td>
                    <td><b>Advocate / Counsel:</b> {advocate_name}</td>
                </tr>
            </table>
            <div class="header-divider"></div>
        </div>
        '''

    pages_html = []
    for idx, page_content in enumerate(pages_raw):
        is_first = (idx == 0)
        is_last = (idx == total_pages - 1)

        page_header = header_html if is_first else ""

        sig_html = ""
        if is_last and show_signature_block:
            sig_html = f'''
            <table class="sig-table">
              <tr>
                <td class="sig-left">
                  <b>Date:</b> {date_now}<br/>
                  <b>Place:</b> Bhubaneswar / District
                </td>
                <td class="sig-right">
                  <b>Advocate / Deponent Signature</b><br/><br/>
                  <div class="sig-line"></div>
                  <span class="sig-auth">Authorized Signatory</span>
                </td>
              </tr>
            </table>
            '''

        # If page_content is plain text without HTML tags, wrap lines in <p>
        if not re.search(r'<(p|div|table|h[1-6]|b|i|u|span|ul|ol|li|br|hr)[^>]*>', page_content, re.IGNORECASE):
            lines = page_content.split('\n')
            page_content = ''.join(f'<p>{line}</p>' if line.strip() else '<p><br/></p>' for line in lines)

        pages_html.append(f'<div class="doc-page">{page_header}{page_content}{sig_html}</div>')

    body_content = '\n'.join(pages_html)

    complete_html = f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{template.title or "Legal Document"}</title>
  <style>
    @page {{
      size: A4;
      margin: 20mm 20mm 20mm 20mm;
      @bottom-right {{
        content: counter(page);
        font-family: 'Times New Roman', Times, serif;
        font-size: 9pt;
        color: #64748b;
      }}
    }}

    *, *:before, *:after {{
      box-sizing: border-box;
    }}

    body {{
      font-family: 'Times New Roman', 'Liberation Serif', Georgia, serif;
      font-size: 11.5pt;
      line-height: 1.5;
      color: #0f172a;
      margin: 0;
      padding: 0;
    }}

    .doc-page {{
      width: 100%;
      min-height: 100%;
    }}

    .doc-page:not(:last-child) {{
      page-break-after: always;
      break-after: page;
    }}

    .template-header {{
      text-align: center;
      margin-bottom: 12pt;
    }}

    .template-subtype {{
      font-size: 8.5pt;
      font-weight: bold;
      color: #6b21a8;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      margin-bottom: 4pt;
    }}

    .template-title {{
      font-size: 15pt;
      font-weight: bold;
      color: #0f172a;
      margin: 0 0 8pt 0;
      text-transform: uppercase;
    }}

    .case-meta-table {{
      width: 100%;
      border-collapse: collapse;
      background-color: #f8fafc;
      border: 0.75pt solid #cbd5e1;
      margin: 6pt 0;
    }}

    .case-meta-table td {{
      padding: 4pt 8pt;
      font-size: 8.5pt;
      color: #334155;
      border: 0.5pt solid #e2e8f0;
      width: 50%;
    }}

    .header-divider {{
      border-bottom: 1.5pt solid #1e293b;
      margin: 6pt 0 12pt 0;
    }}

    h1, h2, h3, h4, h5, h6 {{
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #0f172a;
      margin-top: 12pt;
      margin-bottom: 6pt;
      font-weight: bold;
      page-break-after: avoid;
    }}
    h1 {{ font-size: 16pt; text-align: center; }}
    h2 {{ font-size: 13.5pt; }}
    h3 {{ font-size: 12pt; }}

    p {{
      margin-top: 0;
      margin-bottom: 7pt;
      text-align: justify;
    }}

    table:not(.sig-table):not(.case-meta-table) {{
      width: 100%;
      border-collapse: collapse;
      margin: 10pt 0;
      page-break-inside: auto;
    }}

    table:not(.sig-table):not(.case-meta-table) th, 
    table:not(.sig-table):not(.case-meta-table) td {{
      border: 0.75pt solid #64748b;
      padding: 5pt 7pt;
      font-size: 10pt;
      vertical-align: top;
    }}

    table:not(.sig-table):not(.case-meta-table) th {{
      background-color: #f1f5f9;
      font-weight: bold;
      text-align: left;
    }}

    ul, ol {{
      margin-top: 0;
      margin-bottom: 7pt;
      padding-left: 20pt;
    }}

    li {{
      margin-bottom: 3pt;
    }}

    .sig-table {{
      width: 100%;
      border: none !important;
      margin-top: 24pt;
      border-top: 1.5pt solid #94a3b8 !important;
      padding-top: 10pt;
      page-break-inside: avoid;
    }}

    .sig-table td {{
      border: none !important;
      padding: 0 !important;
      vertical-align: bottom;
    }}

    .sig-left {{
      width: 50%;
      text-align: left;
      font-size: 9.5pt;
      color: #1e293b;
      line-height: 1.4;
    }}

    .sig-right {{
      width: 50%;
      text-align: right;
      font-size: 9.5pt;
      color: #1e293b;
      line-height: 1.4;
    }}

    .sig-line {{
      border-bottom: 1pt dashed #64748b;
      width: 160pt;
      margin-left: auto;
      height: 18pt;
      margin-bottom: 3pt;
    }}

    .sig-auth {{
      font-size: 8.5pt;
      color: #475569;
      font-weight: 600;
    }}
  </style>
</head>
<body>
  {body_content}
</body>
</html>'''

    return weasyprint.HTML(string=complete_html).write_pdf()


def generate_pdf_via_reportlab(raw_content: str, template, show_signature_block: bool, is_custom_or_imported: bool) -> bytes:
    """
    Fallback renderer using ReportLab Platypus.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    normal_style = styles['Normal']

    title_style = ParagraphStyle(
        'DocTitle',
        parent=normal_style,
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        alignment=1,  # Center
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=normal_style,
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        alignment=1,  # Center
        textColor=colors.HexColor('#6B21A8'),
        spaceAfter=6
    )

    meta_style = ParagraphStyle(
        'DocMeta',
        parent=normal_style,
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor('#334155')
    )

    body_style = ParagraphStyle(
        'DocBody',
        parent=normal_style,
        fontName='Helvetica',
        fontSize=10.5,
        leading=16.5,
        alignment=0,  # Left
        textColor=colors.HexColor('#1E293B'),
        spaceAfter=0
    )

    bullet_style = ParagraphStyle(
        'DocBullet',
        parent=body_style,
        leftIndent=12,
        firstLineIndent=-8
    )

    story = []

    # 1. Document Title & Subheader (only if not an imported/custom doc)
    if not is_custom_or_imported:
        doc_title = template.title or 'LEGAL DOCUMENT'
        type_display = getattr(template, 'custom_type_name', '') or getattr(template, 'template_type', '')
        if type_display and type_display != 'custom':
            clean_type = type_display.replace('_', ' ').upper()
            story.append(Paragraph(clean_type, subtitle_style))
        story.append(Paragraph(doc_title.upper(), title_style))
        story.append(Spacer(1, 4))

        case = template.case
        if case:
            court = getattr(case, 'court_name', '') or getattr(case, 'court', '')
            case_num = getattr(case, 'case_number', '')
            client = template.client or (case.client if case else None)
            client_name = getattr(client, 'full_name', '')
            advocate = getattr(case, 'assigned_advocate', None) or getattr(case, 'solo_advocate', None) if case else None
            advocate_name = advocate.get_full_name() if advocate else 'Counsel'

            meta_rows = []
            row1 = []
            if court:
                row1.append(Paragraph(f'<b>Court / Authority:</b> {court}', meta_style))
            if case_num:
                row1.append(Paragraph(f'<b>Case Reference:</b> {case_num}', meta_style))
            if row1:
                while len(row1) < 2:
                    row1.append(Paragraph('', meta_style))
                meta_rows.append(row1)

            row2 = []
            if client_name:
                row2.append(Paragraph(f'<b>Client / Deponent:</b> {client_name}', meta_style))
            if advocate_name:
                row2.append(Paragraph(f'<b>Advocate / Counsel:</b> {advocate_name}', meta_style))
            if row2:
                while len(row2) < 2:
                    row2.append(Paragraph('', meta_style))
                meta_rows.append(row2)

            if meta_rows:
                meta_table = Table(meta_rows, colWidths=[260, 260])
                meta_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
                    ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
                    ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
                    ('TOPPADDING', (0, 0), (-1, -1), 3),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
                    ('LEFTPADDING', (0, 0), (-1, -1), 6),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
                ]))
                story.append(meta_table)
                story.append(Spacer(1, 6))

        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#1E293B'), spaceBefore=2, spaceAfter=8))

    # Split pages cleanly by PAGE_BREAK
    pages_raw = re.split(r'\s*---PAGE_BREAK---\s*', raw_content)
    pages_raw = [p.strip() for p in pages_raw if p.strip()] or ['']

    for p_idx, page_chunk in enumerate(pages_raw):
        if p_idx > 0:
            story.append(PageBreak())

        clean_chunk = page_chunk.replace('<br>', '<br/>').replace('</br>', '')
        clean_chunk = re.sub(r'<(div|p)[^>]*>', '\n', clean_chunk, flags=re.IGNORECASE)
        clean_chunk = re.sub(r'</(div|p)>', '\n', clean_chunk, flags=re.IGNORECASE)
        clean_chunk = re.sub(r'<h[1-6][^>]*>(.*?)</h[1-6]>', r'<b>\1</b>\n', clean_chunk, flags=re.IGNORECASE)
        clean_chunk = re.sub(r'<li[^>]*>(.*?)</li>', r'• \1\n', clean_chunk, flags=re.IGNORECASE)
        clean_chunk = re.sub(r'</?(ul|ol)[^>]*>', '\n', clean_chunk, flags=re.IGNORECASE)
        clean_chunk = re.sub(r'<(?!/?(b|i|u|font|br/|a))[^>]+>', '', clean_chunk, flags=re.IGNORECASE)

        lines = clean_chunk.split('\n')
        for line in lines:
            line_str = line.strip()
            if not line_str:
                story.append(Spacer(1, 6))
                continue
            if line_str.startswith('•'):
                story.append(Paragraph(line_str, bullet_style))
            else:
                story.append(Paragraph(line_str, body_style))

    # Signature Block (only if show_signature_block is True)
    if show_signature_block:
        story.append(Spacer(1, 14))
        date_now = datetime.now().strftime('%d/%m/%Y')
        sig_data = [
            [
                Paragraph(f"<b>Date:</b> {date_now}<br/><b>Place:</b> Bhubaneswar / District", meta_style),
                Paragraph("<b>Advocate / Deponent Signature</b><br/><br/>___________________________<br/>Authorized Signatory", ParagraphStyle('SigRight', parent=meta_style, alignment=2))
            ]
        ]
        sig_table = Table(sig_data, colWidths=[260, 260])
        sig_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ]))
        story.append(sig_table)

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes


def generate_pdf_for_personalized_template(template) -> bytes:
    """
    Renders a PersonalizedTemplate into high-quality A4 PDF bytes matching the web editor pages 1-to-1.
    Uses WeasyPrint for rich HTML layout fidelity, with ReportLab as robust fallback.
    """
    raw_content = substitute_template_variables(template.content or '', template)

    show_signature_block = False
    if isinstance(template.field_values, dict):
        show_signature_block = bool(template.field_values.get('show_signature_block', False))

    is_custom_or_imported = (
        getattr(template, 'template_type', '') == 'custom' or
        'Imported' in (getattr(template, 'custom_type_name', '') or '')
    )

    # 1. Primary: WeasyPrint (pixel-perfect layout, tables, fonts, formatting)
    try:
        return generate_pdf_via_weasyprint(raw_content, template, show_signature_block, is_custom_or_imported)
    except Exception as e:
        logger.warning(f"WeasyPrint rendering failed for template {template.id}: {e}. Falling back to ReportLab.", exc_info=True)

    # 2. Fallback: ReportLab Platypus
    return generate_pdf_via_reportlab(raw_content, template, show_signature_block, is_custom_or_imported)
