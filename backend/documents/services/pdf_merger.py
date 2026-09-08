import os
import io
import tempfile
import threading
from PIL import Image
import pypdf
from reportlab.lib.pagesizes import letter, A4, landscape
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
from reportlab.pdfgen import canvas

from django.core.files.base import ContentFile
from django.utils import timezone
from cases.models import Case
from documents.models import UserDocument
from documents.models_templates import FilledCourtForm


class NumberedCanvas(canvas.Canvas):
    """Canvas for adding page numbers and running header/footer"""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 9)
        self.setFillColor(colors.HexColor("#6B7280"))
        
        # Header
        self.drawString(54, 800, "CASE FILING COMPILATION PACK")
        self.setStrokeColor(colors.HexColor("#E5E7EB"))
        self.setLineWidth(0.5)
        self.line(54, 792, 541, 792)
        
        # Footer
        self.line(54, 45, 541, 45)
        self.drawString(54, 32, f"Generated on {timezone.now().strftime('%Y-%m-%d %H:%M')}")
        self.drawRightString(541, 32, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()


def generate_attachment_placeholder_pdf(doc):
    """
    Generates a formal A4 Exhibit Reference Sheet for non-PDF digital files (e.g. dmg, zip, audio, doc, etc.).
    """
    try:
        buffer = io.BytesIO()
        doc_template = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=54,
            rightMargin=54,
            topMargin=54,
            bottomMargin=54
        )
        styles = getSampleStyleSheet()
        elements = []

        title_style = ParagraphStyle(
            'AttTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=15,
            leading=19,
            textColor=colors.HexColor('#1E1B4B'),
            alignment=1,
            spaceAfter=12
        )

        sub_style = ParagraphStyle(
            'AttSub',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=10.5,
            leading=14,
            textColor=colors.HexColor('#4C1D95'),
            alignment=1,
            spaceAfter=15
        )

        label_style = ParagraphStyle(
            'AttLabel',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=9.5,
            leading=13,
            textColor=colors.HexColor('#374151')
        )

        val_style = ParagraphStyle(
            'AttVal',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9.5,
            leading=13,
            textColor=colors.HexColor('#111827')
        )

        elements.append(Spacer(1, 30))
        elements.append(Paragraph("DIGITAL EXHIBIT REFERENCE SHEET", sub_style))
        elements.append(Paragraph(f"DOCUMENT ATTACHMENT: {doc.document_title or 'Untitled'}", title_style))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#6D28D9'), spaceAfter=20))

        file_name = os.path.basename(doc.document_file.name) if doc.document_file else 'No file binary attached'
        file_ext = os.path.splitext(file_name)[1].upper().replace('.', '') or 'BINARY'

        table_data = [
            [Paragraph("Document Title:", label_style), Paragraph(doc.document_title or 'Untitled', val_style)],
            [Paragraph("Document Type:", label_style), Paragraph(doc.get_document_type_display() if hasattr(doc, 'get_document_type_display') else doc.document_type, val_style)],
            [Paragraph("Original Format:", label_style), Paragraph(f"<b>.{file_ext}</b> (Non-PDF Digital Attachment)", val_style)],
            [Paragraph("Attached File:", label_style), Paragraph(file_name, val_style)],
            [Paragraph("Uploaded Date:", label_style), Paragraph(doc.uploaded_at.strftime('%Y-%m-%d %H:%M') if doc.uploaded_at else 'N/A', val_style)],
            [Paragraph("Vault Reference ID:", label_style), Paragraph(str(doc.id), val_style)],
        ]

        t = Table(table_data, colWidths=[140, 340])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('PADDING', (0, 0), (-1, -1), 8),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 20))

        notice_style = ParagraphStyle(
            'NoticeText',
            parent=styles['Normal'],
            fontName='Helvetica-Oblique',
            fontSize=9,
            leading=13,
            textColor=colors.HexColor('#475569')
        )
        notice_p = Paragraph(
            "<b>Note:</b> This item was uploaded as a non-PDF digital file archive. The raw original file is securely preserved in the case document vault and is referenced in this master filing compilation index.",
            notice_style
        )
        notice_box = Table([[notice_p]], colWidths=[480])
        notice_box.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#FEF3C7')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#FCD34D')),
            ('PADDING', (0, 0), (-1, -1), 10),
        ]))
        elements.append(notice_box)

        doc_template.build(elements, canvasmaker=NumberedCanvas)
        buffer.seek(0)
        return buffer.getvalue()
    except Exception as e:
        print(f"Error generating attachment placeholder PDF: {e}")
        return None


def convert_image_to_pdf_bytes(image_source):
    """
    Converts an image (file path, bytes, or PIL Image) into A4 PDF bytes.
    Preserves aspect ratio and centers the image cleanly on the page.
    """
    try:
        if isinstance(image_source, (str, bytes, io.BytesIO)):
            img = Image.open(image_source if not isinstance(image_source, bytes) else io.BytesIO(image_source))
        else:
            img = image_source

        # Convert RGBA / P to RGB for PDF compatibility
        if img.mode in ("RGBA", "P", "LA"):
            background = Image.new("RGB", img.size, (255, 255, 255))
            if img.mode == "RGBA":
                background.paste(img, mask=img.split()[3])
            else:
                background.paste(img)
            img = background
        elif img.mode != "RGB":
            img = img.convert("RGB")

        pdf_buffer = io.BytesIO()
        
        # Target A4 page dimensions in points (72 DPI)
        a4_w, a4_h = A4
        margin = 36 # 0.5 inch margin
        max_w = a4_w - (margin * 2)
        max_h = a4_h - (margin * 2)

        img_w, img_h = img.size
        ratio = min(max_w / img_w, max_h / img_h)
        new_w = img_w * ratio
        new_h = img_h * ratio

        x = (a4_w - new_w) / 2
        y = (a4_h - new_h) / 2

        c = canvas.Canvas(pdf_buffer, pagesize=A4)
        
        # Draw clean border around image page
        c.setStrokeColor(colors.HexColor("#E5E7EB"))
        c.setLineWidth(1)
        c.rect(margin / 2, margin / 2, a4_w - margin, a4_h - margin)
        
        # Save temp image for canvas drawing
        temp_img_io = io.BytesIO()
        img.save(temp_img_io, format="JPEG", quality=95)
        temp_img_io.seek(0)
        
        from reportlab.lib.utils import ImageReader
        c.drawImage(ImageReader(temp_img_io), x, y, width=new_w, height=new_h)
        c.showPage()
        c.save()

        pdf_buffer.seek(0)
        return pdf_buffer.getvalue()
    except Exception as e:
        print(f"Error converting image to PDF: {e}")
        return None


def _get_field_val(field_name, field_values):
    if not field_name:
        return ''
    val = field_values.get(field_name)
    if val is None or val == '':
        return ''
    return str(val)


def _parse_form_cell(cell, field_values, base_style):
    parts = []
    
    if cell.get('label'):
        parts.append(f"<b>{cell['label']}</b>")
        
    if cell.get('prefix'):
        parts.append(str(cell['prefix']))
        
    field_name = cell.get('field')
    field_val = _get_field_val(field_name, field_values)
    cell_type = cell.get('type')
    
    if field_val:
        parts.append(f'<font color="#0E2340"><b><u>{field_val}</u></b></font>')
    elif cell_type == 'editable_line' or field_name:
        parts.append('<u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u>')
        
    if cell.get('text'):
        parts.append(str(cell['text']))
        
    if cell.get('suffix'):
        parts.append(str(cell['suffix']))
        
    if cell.get('columns'):
        sub_parts = []
        for sub_c in cell['columns']:
            sub_parts.append(_parse_form_cell(sub_c, field_values, base_style).text)
        parts.append(' '.join(sub_parts))
        
    raw_text = ' '.join([p for p in parts if p]).strip()
    
    align = 0
    if cell.get('align') == 'center' or cell.get('style', {}).get('align') == 'center':
        align = 1
    elif cell.get('align') == 'right' or cell.get('style', {}).get('align') == 'right':
        align = 2
        
    style = ParagraphStyle('CellSt', parent=base_style, alignment=align)
    return Paragraph(raw_text or '&nbsp;', style)


def generate_court_form_pdf(form):
    """
    Generates a formal A4 PDF for a FilledCourtForm.
    1. First attempts pixel-perfect HTML template rendering via WeasyPrint.
    2. Falls back to ReportLab flowables.
    """
    try:
        from .court_form_html_engine import generate_pdf_from_html_template
        html_pdf = generate_pdf_from_html_template(form)
        if html_pdf:
            return html_pdf
    except Exception as ex:
        print(f"HTML PDF generation exception, falling back: {ex}")

    try:
        buffer = io.BytesIO()
        content = getattr(form, 'filled_content', None) or (getattr(form.template, 'content_structure', {}) if getattr(form, 'template', None) else {})
        field_values = getattr(form, 'field_values', {}) or {}
        sections = content.get('sections', []) if isinstance(content, dict) else []
        content_margins = content.get('margins', {}) if isinstance(content, dict) else {}


        # Precise scale conversion from 96 DPI CSS px (794x1123) to 72 DPI PDF pt (595.27x841.89)
        scale_x = 595.27 / 794.0 # 0.74971
        scale_y = 841.89 / 1123.0 # 0.74968

        left_m = float(content_margins.get('left', 50)) * scale_x
        right_m = float(content_margins.get('right', 50)) * scale_x
        top_m = float(content_margins.get('top', 50)) * scale_y
        bottom_m = float(content_margins.get('bottom', 50)) * scale_y
        page_w = 595.27 - (left_m + right_m)

        is_landscape = False
        if isinstance(content, dict) and (content.get('orientation') == 'landscape' or content.get('page_size') == 'A4_LANDSCAPE'):
            is_landscape = True
        template_name = getattr(form.template, 'name', '') if getattr(form, 'template', None) else ''
        if any(w in template_name.lower() for w in ['ca form 7', 'form c.a.i', 'ca_form_7']):
            is_landscape = True

        p_size = landscape(A4) if is_landscape else A4
        doc = SimpleDocTemplate(buffer, pagesize=p_size, leftMargin=left_m, rightMargin=right_m, topMargin=top_m, bottomMargin=bottom_m)
        styles = getSampleStyleSheet()
        story = []

        base_style = ParagraphStyle('BaseStyle', fontName='Helvetica', fontSize=8.5, leading=11.5, textColor=colors.HexColor('#0F172A'))

        if not sections:
            template_name = getattr(form.template, 'name', 'Court Form') if getattr(form, 'template', None) else 'Court Form'
            story.append(Paragraph(f"<b>COURT FORM: {template_name.upper()}</b>", ParagraphStyle('THead', parent=base_style, fontSize=14, leading=18, alignment=1)))
            story.append(Spacer(1, 10))

            if field_values:
                table_rows = [[Paragraph('<b>Field Name</b>', base_style), Paragraph('<b>Entered Value</b>', base_style)]]
                for k, v in field_values.items():
                    clean_k = str(k).replace('_', ' ').title()
                    table_rows.append([Paragraph(clean_k, base_style), Paragraph(str(v), base_style)])
                t = Table(table_rows, colWidths=[200, 322])
                t.setStyle(TableStyle([
                    ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#334155')),
                    ('PADDING', (0,0), (-1,-1), 5),
                ]))
                story.append(t)

        for sec in sections:
            st_type = sec.get('type')
            if st_type == 'header':
                align = 1 if sec.get('style', {}).get('align') == 'center' else (2 if sec.get('style', {}).get('align') == 'right' else 0)
                size = float(sec.get('style', {}).get('size', 14)) * scale_y
                h_style = ParagraphStyle('HSt', parent=base_style, fontName='Helvetica-Bold', fontSize=size, leading=size+3.5, alignment=align, textColor=colors.HexColor('#000000'))
                story.append(Paragraph(sec.get('content', ''), h_style))
                story.append(Spacer(1, 3))

            elif st_type == 'paragraph':
                align = 1 if sec.get('style', {}).get('align') == 'center' else (2 if sec.get('style', {}).get('align') == 'right' else 0)
                size = float(sec.get('style', {}).get('size', 10)) * scale_y
                p_style = ParagraphStyle('PSt', parent=base_style, fontSize=size, leading=size+3, alignment=align, textColor=colors.HexColor('#000000'))
                story.append(Paragraph(sec.get('content', ''), p_style))
                story.append(Spacer(1, 3))

            elif st_type == 'spacer':
                story.append(Spacer(1, float(sec.get('height', 15)) * scale_y))

            elif st_type == 'grid_row':
                cols = sec.get('columns', [])
                if cols:
                    tot_flex = sum([float(c.get('flex', 1)) for c in cols]) or 1.0
                    col_widths = [(float(c.get('flex', 1)) / tot_flex) * page_w for c in cols]
                    row_cells = [_parse_form_cell(c, field_values, base_style) for c in cols]
                    
                    bg_color = colors.HexColor('#F1F5F9') if sec.get('style', {}).get('background') else colors.white
                    t = Table([row_cells], colWidths=col_widths, rowHeights=[24.0])
                    t.setStyle(TableStyle([
                        ('BACKGROUND', (0,0), (-1,-1), bg_color),
                        ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
                        ('TOPPADDING', (0,0), (-1,-1), 2),
                        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
                        ('LEFTPADDING', (0,0), (-1,-1), 2),
                        ('RIGHTPADDING', (0,0), (-1,-1), 2),
                    ]))
                    story.append(t)
                    story.append(Spacer(1, 4))

            elif 'rows' in sec or st_type == 'form_grid':
                for r in sec.get('rows', []):
                    cells = r.get('cells', [])
                    if not cells:
                        continue
                    tot_flex = sum([float(c.get('flex', 1)) for c in cells]) or 1.0
                    col_widths = [(float(c.get('flex', 1)) / tot_flex) * page_w for c in cells]
                    row_flowables = [_parse_form_cell(c, field_values, base_style) for c in cells]
                    
                    # 35px height in HTML scaled by 0.75 is 26.25pt
                    t = Table([row_flowables], colWidths=col_widths, rowHeights=[26.25])
                    t.setStyle(TableStyle([
                        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#000000')),
                        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                        ('TOPPADDING', (0,0), (-1,-1), 3),
                        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
                        ('LEFTPADDING', (0,0), (-1,-1), 5),
                        ('RIGHTPADDING', (0,0), (-1,-1), 5),
                    ]))
                    story.append(t)
                story.append(Spacer(1, 6))

            elif st_type == 'textarea' or st_type == 'rich_text':
                field_name = sec.get('field')
                txt_val = _get_field_val(field_name, field_values) or sec.get('content', '') or sec.get('placeholder', '')
                if txt_val:
                    for paragraph_line in str(txt_val).split('\n'):
                        if paragraph_line.strip():
                            p_st = ParagraphStyle('TextAreaP', parent=base_style, fontSize=10, leading=14, textColor=colors.HexColor('#000000'))
                            story.append(Paragraph(paragraph_line.strip(), p_st))
                            story.append(Spacer(1, 3))
                story.append(Spacer(1, 6))

        # Stamp placed signatures onto canvas
        placed_signatures = field_values.get('placed_signatures', []) if isinstance(field_values, dict) else []
        
        if not placed_signatures:
            adv_sig = getattr(form, 'advocate_signature_image', None)
            cli_sig = getattr(form, 'client_signature_image', None)
            if adv_sig:
                sig_url = adv_sig.url if hasattr(adv_sig, 'url') else str(adv_sig)
                adv_offset = field_values.get('signature_offsets', {}).get('advocate', {'x': 520, 'y': 640}) if isinstance(field_values, dict) else {'x': 520, 'y': 640}
                placed_signatures.append({
                    'image_url': sig_url,
                    'x': adv_offset.get('x', 520),
                    'y': adv_offset.get('y', 640),
                    'width': 140,
                    'height': 55
                })
            if cli_sig:
                sig_url = cli_sig.url if hasattr(cli_sig, 'url') else str(cli_sig)
                cli_offset = field_values.get('signature_offsets', {}).get('client', {'x': 80, 'y': 640}) if isinstance(field_values, dict) else {'x': 80, 'y': 640}
                placed_signatures.append({
                    'image_url': sig_url,
                    'x': cli_offset.get('x', 80),
                    'y': cli_offset.get('y', 640),
                    'width': 140,
                    'height': 55
                })

        def draw_signatures_on_canvas(canvas_obj, document):
            from reportlab.lib.utils import ImageReader
            from django.conf import settings
            import os
            import base64

            # 0-indexed current page in ReportLab
            current_page_idx = getattr(canvas_obj, '_pageNumber', 1) - 1

            for sig in placed_signatures:
                img_path_or_url = sig.get('image_url')
                if not img_path_or_url:
                    continue

                sig_page = int(sig.get('page', 0))
                if sig_page != current_page_idx:
                    continue

                try:
                    fx = float(sig.get('x', 520))
                    fy = float(sig.get('y', 640))
                    fw = float(sig.get('width', 140))
                    fh = float(sig.get('height', 55))

                    pdf_x = fx * scale_x
                    pdf_w = fw * scale_x
                    pdf_h = fh * scale_y
                    pdf_y = 841.89 - ((fy + fh) * scale_y)

                    if img_path_or_url.startswith('data:image'):
                        header, base64_data = img_path_or_url.split(',', 1)
                        img_bytes = base64.b64decode(base64_data)
                        img_reader = ImageReader(io.BytesIO(img_bytes))
                        canvas_obj.drawImage(img_reader, pdf_x, pdf_y, width=pdf_w, height=pdf_h, mask='auto')
                    elif '/media/' in img_path_or_url:
                        rel_path = img_path_or_url.split('/media/', 1)[1]
                        abs_path = os.path.join(settings.MEDIA_ROOT, rel_path)
                        if os.path.exists(abs_path):
                            canvas_obj.drawImage(abs_path, pdf_x, pdf_y, width=pdf_w, height=pdf_h, mask='auto')
                    elif img_path_or_url.startswith('http'):
                        import urllib.request
                        req = urllib.request.urlopen(img_path_or_url, timeout=5)
                        img_reader = ImageReader(io.BytesIO(req.read()))
                        canvas_obj.drawImage(img_reader, pdf_x, pdf_y, width=pdf_w, height=pdf_h, mask='auto')
                except Exception as ex:
                    print(f"Error drawing signature on canvas: {ex}")

        doc.build(story, onFirstPage=draw_signatures_on_canvas, onLaterPages=draw_signatures_on_canvas)
        buffer.seek(0)
        return buffer.getvalue()
    except Exception as e:
        print(f"Error rendering court form PDF: {e}")
        return None


def generate_cover_and_index_pdf(case_obj, document_summary_list):
    """
    Generates a formal Cover Page and Table of Contents (Index) PDF bytes using ReportLab.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#1E1B4B'), # Deep purple
        alignment=1, # Center
        spaceAfter=15
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#4C1D95'),
        alignment=1,
        spaceAfter=25
    )
    
    label_style = ParagraphStyle(
        'MetaLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#374151')
    )
    
    val_style = ParagraphStyle(
        'MetaVal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#111827')
    )
    
    h2_style = ParagraphStyle(
        'IndexHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#1E1B4B'),
        spaceBefore=20,
        spaceAfter=10
    )

    elements = []

    # Title & Subtitle
    elements.append(Spacer(1, 20))
    elements.append(Paragraph("IN THE COURT OF LAW", subtitle_style))
    elements.append(Paragraph("MASTER CASE FILING COMPILATION", title_style))
    elements.append(Paragraph(f"CASE TITLE: {case_obj.case_title.upper()}", subtitle_style))
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#6D28D9'), spaceAfter=20))

    # Case Details Table
    client_name = "N/A"
    if case_obj.client:
        client_name = getattr(case_obj.client, 'get_full_name', lambda: str(case_obj.client))()

    advocate_name = "N/A"
    if case_obj.assigned_advocate:
        advocate_name = getattr(case_obj.assigned_advocate, 'get_full_name', lambda: str(case_obj.assigned_advocate))()
    elif case_obj.solo_advocate:
        advocate_name = getattr(case_obj.solo_advocate, 'get_full_name', lambda: str(case_obj.solo_advocate))()

    case_data = [
        [Paragraph("Case Number:", label_style), Paragraph(case_obj.case_number or "N/A", val_style),
         Paragraph("Court Name:", label_style), Paragraph(getattr(case_obj, 'court_name', 'District Court') or "District Court", val_style)],
        [Paragraph("Case Type:", label_style), Paragraph(case_obj.case_type or "General", val_style),
         Paragraph("Filing Date:", label_style), Paragraph(str(getattr(case_obj, 'filing_date', 'N/A') or "N/A"), val_style)],
        [Paragraph("Petitioner:", label_style), Paragraph(getattr(case_obj, 'petitioner_name', 'N/A') or "N/A", val_style),
         Paragraph("Respondent:", label_style), Paragraph(getattr(case_obj, 'respondent_name', 'N/A') or "N/A", val_style)],
        [Paragraph("Client Name:", label_style), Paragraph(client_name, val_style),
         Paragraph("Advocate:", label_style), Paragraph(advocate_name, val_style)],
    ]

    t_case = Table(case_data, colWidths=[90, 150, 90, 150])
    t_case.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F9FAFB')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#E5E7EB')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#F3F4F6')),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(t_case)
    elements.append(Spacer(1, 25))

    # Table of Contents / Document Index
    elements.append(Paragraph("TABLE OF CONTENTS / DOCUMENT INDEX", h2_style))
    
    headers = [
        Paragraph("<b>S.No</b>", label_style),
        Paragraph("<b>Document Title</b>", label_style),
        Paragraph("<b>Type</b>", label_style),
        Paragraph("<b>Format</b>", label_style),
        Paragraph("<b>Page No</b>", label_style),
        Paragraph("<b>Date</b>", label_style)
    ]
    
    table_rows = [headers]
    for idx, item in enumerate(document_summary_list, 1):
        page_num_str = f"Page {item.get('start_page', idx + 1)}"
        row = [
            Paragraph(str(idx), val_style),
            Paragraph(item['title'], val_style),
            Paragraph(item['type_display'], val_style),
            Paragraph(item['format'].upper(), val_style),
            Paragraph(f"<b>{page_num_str}</b>", val_style),
            Paragraph(item['date'], val_style)
        ]
        table_rows.append(row)

    t_index = Table(table_rows, colWidths=[30, 180, 95, 55, 60, 60])
    t_index.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#EEF2FF')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#312E81')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#C7D2FE')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E0E7FF')),
        ('PADDING', (0, 0), (-1, -1), 5),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    
    elements.append(t_index)

    doc.build(elements, canvasmaker=NumberedCanvas)
    buffer.seek(0)
    return buffer.getvalue()


_case_compile_locks = {}
_case_compile_mutex = threading.Lock()

def _get_case_lock(case_id):
    with _case_compile_mutex:
        if case_id not in _case_compile_locks:
            _case_compile_locks[case_id] = threading.Lock()
        return _case_compile_locks[case_id]


def generate_merged_case_filing_pdf(case_id, user=None):
    """
    Main Compilation Function (Thread-Safe):
    Acquires a per-case lock and delegates to compilation.
    """
    with _get_case_lock(str(case_id)):
        return _generate_merged_case_filing_pdf_locked(case_id, user)


def _generate_merged_case_filing_pdf_locked(case_id, user=None):
    from pypdf import PdfReader, PdfWriter

    case_obj = Case.objects.get(id=case_id)
    
    # 1. Fetch Filled Court Forms
    filled_forms = FilledCourtForm.objects.filter(
        case_id=case_id
    ).order_by('created_at')

    # 2. Fetch Case Documents (PDFs and Evidence Photos)
    # Exclude master doc, .ltproj drafting project files, and unverified client requests
    documents = UserDocument.objects.filter(
        case_id=case_id,
        is_deleted=False,
        is_in_all_documents=True
    ).exclude(
        document_title__icontains="Master Case Filing Pack"
    ).exclude(
        document_title__icontains=".ltproj"
    ).exclude(
        document_file__icontains=".ltproj"
    ).exclude(
        fulfills_request__status__in=['pending', 'uploaded', 'rejected']
    ).order_by('uploaded_at')

    court_form_entries = []
    for form in filled_forms:
        form_title = getattr(form.template, 'name', f"Court Form #{str(form.id)[:8]}") if getattr(form, 'template', None) else f"Court Form #{str(form.id)[:8]}"
        pdf_bytes = None
        page_count = 1
        try:
            form_file = getattr(form, 'generated_pdf', None)
            if form_file and form_file.name:
                form_file.open('rb')
                pdf_bytes = form_file.read()
                form_file.close()
            else:
                pdf_bytes = generate_court_form_pdf(form)
            
            if pdf_bytes:
                r = PdfReader(io.BytesIO(pdf_bytes))
                page_count = len(r.pages)
        except Exception as e:
            print(f"Error processing court form {form.id}: {e}")

        if pdf_bytes:
            court_form_entries.append({
                'id': str(form.id),
                'item_type': 'court_form',
                'title': form_title,
                'type_display': 'Court Form',
                'format': 'FORM',
                'sequence': int(getattr(form, 'custom_sequence', 0) or 0),
                'created_sort_key': form.created_at.isoformat() if hasattr(form, 'created_at') and form.created_at else '',
                'date': form.created_at.strftime('%Y-%m-%d') if hasattr(form, 'created_at') and form.created_at else 'N/A',
                'pdf_bytes': pdf_bytes,
                'page_count': page_count
            })

    document_entries = []
    for doc in documents:
        file_ext = os.path.splitext(doc.document_file.name)[1].lower() if doc.document_file else ''
        item_type = 'PDF'
        if file_ext in ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif']:
            item_type = 'PHOTO'
        elif file_ext in ['.doc', '.docx', '.txt']:
            item_type = 'DOC'
        elif file_ext:
            item_type = file_ext.replace('.', '').upper()
        else:
            item_type = 'FILE'

        pdf_bytes = None
        page_count = 1
        try:
            if doc.document_file:
                doc.document_file.open('rb')
                raw_bytes = doc.document_file.read()
                doc.document_file.close()

                if file_ext in ['.pdf']:
                    pdf_bytes = raw_bytes
                elif file_ext in ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif']:
                    pdf_bytes = convert_image_to_pdf_bytes(raw_bytes)
                else:
                    pdf_bytes = generate_attachment_placeholder_pdf(doc)

            if not pdf_bytes:
                pdf_bytes = generate_attachment_placeholder_pdf(doc)

            if pdf_bytes:
                r = PdfReader(io.BytesIO(pdf_bytes))
                page_count = len(r.pages)
        except Exception as e:
            print(f"Error processing document {doc.id}: {e}")
            pdf_bytes = generate_attachment_placeholder_pdf(doc)
            page_count = 1

        if pdf_bytes:
            document_entries.append({
                'id': str(doc.id),
                'item_type': 'document',
                'title': doc.document_title,
                'type_display': doc.get_document_type_display() if hasattr(doc, 'get_document_type_display') else doc.document_type,
                'format': item_type,
                'sequence': int(getattr(doc, 'custom_sequence', 0) or 0),
                'created_sort_key': doc.uploaded_at.isoformat() if doc.uploaded_at else '',
                'date': doc.uploaded_at.strftime('%Y-%m-%d') if doc.uploaded_at else 'N/A',
                'pdf_bytes': pdf_bytes,
                'page_count': page_count
            })

    # Sort all items by custom sequence if specified, else fallback to creation time
    all_raw_items = court_form_entries + document_entries
    
    # Check if any custom sequence exists (> 0)
    has_custom_ordering = any(int(item.get('sequence', 0) or 0) > 0 for item in all_raw_items)
    
    if has_custom_ordering:
        summary_list = sorted(
            all_raw_items,
            key=lambda x: (
                int(x.get('sequence') or 0) if int(x.get('sequence') or 0) > 0 else 999990,
                x.get('created_sort_key', '')
            )
        )
    else:
        # Default order: Court Forms first, then Evidence Documents
        summary_list = court_form_entries + document_entries

    # Dynamic 2-Pass Cover & Table of Contents Calculation:
    # Pass 1: Estimate cover page count based on items
    total_items = len(summary_list)
    cover_page_count = 1 if total_items <= 10 else (2 if total_items <= 25 else 3)

    current_page_counter = cover_page_count + 1
    for item in summary_list:
        item['start_page'] = current_page_counter
        current_page_counter += item['page_count']

    cover_pdf_bytes = generate_cover_and_index_pdf(case_obj, summary_list)
    actual_cover_pages = len(PdfReader(io.BytesIO(cover_pdf_bytes)).pages)

    # Pass 2: If actual cover pages differ, re-index and re-generate cover so
    # the printed Table of Contents matches physical pages with 100% precision.
    if actual_cover_pages != cover_page_count:
        cover_page_count = actual_cover_pages
        current_page_counter = cover_page_count + 1
        for item in summary_list:
            item['start_page'] = current_page_counter
            current_page_counter += item['page_count']
        cover_pdf_bytes = generate_cover_and_index_pdf(case_obj, summary_list)

    # Use PyPDF Writer to assemble final PDF with rich, synchronized bookmarks
    writer = PdfWriter()
    
    # Enable automatic Bookmarks/Outlines panel opening in all PDF viewers
    writer.page_mode = "/UseOutlines"
    
    # 1. Append Cover Page & Table of Contents
    cover_reader = PdfReader(io.BytesIO(cover_pdf_bytes))
    writer.append(cover_reader, import_outline=False)
    writer.add_outline_item("📑 Case Overview & Table of Contents", writer.pages[0])

    # 2. Append All Items in Custom Sorted Sequence with Outlines
    filing_parent = None
    for idx, item in enumerate(summary_list, 1):
        try:
            reader = PdfReader(io.BytesIO(item['pdf_bytes']))
            start_page = len(writer.pages)
            # import_outline=False prevents rogue sub-PDF bookmarks from polluting master outline
            writer.append(reader, import_outline=False)
            
            if filing_parent is None:
                filing_parent = writer.add_outline_item(
                    "📁 Case Filings & Evidence Pack", 
                    writer.pages[start_page],
                    is_open=True
                )
                
            badge_icon = "🏛️" if item['format'] == 'FORM' else ("🖼️" if item['format'] == 'PHOTO' else "📄")
            bookmark_title = f"{idx}. {badge_icon} {item['title']} (Page {start_page + 1})"
            writer.add_outline_item(bookmark_title, writer.pages[start_page], parent=filing_parent)
        except Exception as e:
            print(f"Error appending item {item['title']}: {e}")

    # 4. Stamp Running Continuous Page Numbers on ALL pages (Page X of Total)
    total_compiled_pages = len(writer.pages)
    for i, page in enumerate(writer.pages, 1):
        try:
            pw = float(page.mediabox.width)
            ph = float(page.mediabox.height)
            stamp_packet = io.BytesIO()
            stamp_canvas = canvas.Canvas(stamp_packet, pagesize=(pw, ph))
            
            # Semi-transparent white pill backdrop to ensure 100% legibility on any document scan
            stamp_canvas.setFillColor(colors.HexColor('#FFFFFF'))
            stamp_canvas.setFillAlpha(0.92)
            stamp_canvas.roundRect(24, 8, pw - 48, 22, 4, fill=1, stroke=0)
            
            stamp_canvas.setFillAlpha(1.0)
            # Thin divider line above footer
            stamp_canvas.setStrokeColor(colors.HexColor('#CBD5E1'))
            stamp_canvas.setLineWidth(0.5)
            stamp_canvas.line(30, 26, pw - 30, 26)
            
            # Left: Case Filing Pack title
            stamp_canvas.setFont('Helvetica', 7.5)
            stamp_canvas.setFillColor(colors.HexColor('#475569'))
            short_case = (case_obj.case_title[:40] + '...') if len(case_obj.case_title) > 40 else case_obj.case_title
            stamp_canvas.drawString(32, 13, f"CASE FILING PACK • {short_case.upper()}")
            
            # Right: Page X of Total
            stamp_canvas.setFont('Helvetica-Bold', 8.5)
            stamp_canvas.setFillColor(colors.HexColor('#0F172A'))
            stamp_canvas.drawRightString(pw - 32, 13, f"Page {i} of {total_compiled_pages}")
            
            stamp_canvas.save()
            stamp_packet.seek(0)
            
            stamp_reader = PdfReader(stamp_packet)
            page.merge_page(stamp_reader.pages[0])
        except Exception as stamp_err:
            print(f"Error stamping page {i}: {stamp_err}")

    # Write merged result to buffer
    output_buffer = io.BytesIO()
    writer.write(output_buffer)
    writer.close()
    output_buffer.seek(0)
    merged_bytes = output_buffer.getvalue()

    # Save as a UserDocument in case documents
    filename = f"Master_Filing_Pack_{case_obj.case_number or case_id[:8]}.pdf"
    master_title = f"Master Case Filing Pack ({case_obj.case_title})"

    # Update existing or create new master document
    uploader = user or case_obj.assigned_advocate or case_obj.solo_advocate
    master_doc, created = UserDocument.objects.update_or_create(
        case_id=case_id,
        document_title=master_title,
        defaults={
            'document_type': 'drafting',
            'document_category': 'case_filing_pack',
            'uploaded_by': uploader,
            'verification_status': 'verified',
            'is_in_all_documents': True,
            'is_in_other_documents': False,
            'is_deleted': False,
            'description': f"Compiled Master PDF filing pack containing {len(summary_list)} case documents and photos with auto-bookmarks."
        }
    )
    
    # Save content file
    master_doc.document_file.save(filename, ContentFile(merged_bytes), save=True)

    # Ensure no other duplicate master filing pack records remain for this case
    UserDocument.objects.filter(
        case_id=case_id,
        document_title__icontains="Master Case Filing Pack"
    ).exclude(id=master_doc.id).delete()

    return master_doc


def trigger_auto_recompile_master_pack(case_id, user=None):
    """
    Triggers automatic background recompilation of the Master Case Filing Pack PDF
    whenever case documents or court forms are added, modified, moved, or deleted.
    """
    if not case_id:
        return
    import threading
    def _run():
        try:
            generate_merged_case_filing_pdf(str(case_id), user)
        except Exception as e:
            print(f"[AutoRecompile] Error compiling Master PDF for case {case_id}: {e}")
    
    t = threading.Thread(target=_run)
    t.daemon = True
    t.start()

