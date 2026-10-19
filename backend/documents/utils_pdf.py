import io
import logging
from django.conf import settings
from django.template.loader import render_to_string
from xhtml2pdf import pisa
from pypdf import PdfWriter, PdfReader
from django.db import models

logger = logging.getLogger(__name__)


def get_letter_label(idx):
    """
    Converts 0 -> 'A', 25 -> 'Z', 26 -> 'AA', 27 -> 'AB', etc.
    Safely handles any index without list index out of range.
    """
    if idx < 0:
        return 'A'
    result = ""
    while True:
        result = chr(ord('A') + (idx % 26)) + result
        idx = (idx // 26) - 1
        if idx < 0:
            break
    return result


def safe_file_url(field):
    """
    Safely extracts the URL from a Django FileField / ImageField.
    Returns None if field has no file or if storage/url access fails.
    """
    if not field:
        return None
    try:
        if getattr(field, 'name', None) and hasattr(field, 'url'):
            return field.url
    except Exception:
        pass
    return None


class PDFService:
    @staticmethod
    def link_callback(uri, rel):
        """
        Convert HTML URIs to absolute system paths so xhtml2pdf can find those files.
        Safely downloads remote URLs (S3 / DigitalOcean Spaces) to temporary files.
        """
        import os
        import tempfile
        import requests
        from django.conf import settings
        
        try:
            # Handle remote HTTP / HTTPS URLs (e.g. DigitalOcean Spaces / S3 media URLs)
            if uri.startswith(('http://', 'https://')):
                try:
                    res = requests.get(uri, timeout=3, verify=False)
                    if res.status_code == 200:
                        suffix = os.path.splitext(uri.split('?')[0])[1] or '.png'
                        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
                        tmp.write(res.content)
                        tmp.close()
                        return tmp.name
                except Exception as req_err:
                    logger.warning(f"Failed to fetch remote image {uri}: {req_err}")
                    return ""

            media_url = getattr(settings, 'MEDIA_URL', '')
            media_root = getattr(settings, 'MEDIA_ROOT', '')
            static_url = getattr(settings, 'STATIC_URL', '')
            static_root = getattr(settings, 'STATIC_ROOT', '')

            path = None
            # Handle media files
            if media_url and uri.startswith(media_url) and media_root:
                relative_path = uri.replace(media_url, "", 1)
                path = os.path.join(media_root, relative_path)
            # Handle static files
            elif static_url and uri.startswith(static_url) and static_root:
                relative_path = uri.replace(static_url, "", 1)
                path = os.path.join(static_root, relative_path)
            else:
                # Check if it's already an absolute path
                if os.path.isabs(uri):
                    path = uri
                else:
                    base_dir = getattr(settings, 'BASE_DIR', '')
                    if base_dir:
                        path = os.path.join(base_dir, uri)

            # make sure that file exists
            if path and os.path.exists(path) and os.path.isfile(path):
                return path
        except Exception as e:
            logger.warning(f"Error resolving path in link_callback for uri {uri}: {e}")

        return uri

    @staticmethod
    def render_to_pdf(filled_form, override_sections=None, override_values=None, override_template=None):
        """
        Renders a single FilledCourtForm to PDF bytes.
        Supports the JSON-based layout structure.
        """
        try:
            # Resolve placeholders in field_values if they contain {key}
            values = (override_values if override_values is not None else getattr(filled_form, 'field_values', {})) or {}
            template = override_template or getattr(filled_form, 'template', None)
            structure = getattr(template, 'content_structure', {}) if template else {}
            filled_content = getattr(filled_form, 'filled_content', {}) or {}
            sections = override_sections if override_sections is not None else (filled_content.get('sections') or (structure or {}).get('sections', []))
            
            context = {
                'form': filled_form,
                'structure': structure,
                'values': values,
                'sections': sections
            }
            
            # Build the HTML
            html_string = render_to_string('documents/pdf_base.html', context)
            
            result = io.BytesIO()
            # Ensure we use UTF-8 and handle images via link_callback
            pdf = pisa.pisaDocument(
                io.BytesIO(html_string.encode("UTF-8")), 
                result,
                encoding='UTF-8',
                link_callback=PDFService.link_callback
            )
            
            if not pdf.err:
                return result.getvalue()
            else:
                logger.error(f"pisaDocument error while rendering PDF for form {getattr(filled_form, 'id', None)}: {pdf.err}")
        except Exception as e:
            logger.error(f"Exception rendering PDF for form {getattr(filled_form, 'id', None)}: {e}", exc_info=True)
        return None

    @staticmethod
    def _get_sorted_forms(case):
        """
        Fetches and sorts all drafting forms for a case.
        This is the SINGLE SOURCE OF TRUTH for document ordering.
        Both preview and download MUST use this method.
        
        Sort logic:
          primary: custom_sequence (if > 0), else template.sequence
          tie-breaker: updated_at descending (newer first)
          Index form is ALWAYS first.
        """
        from .models_templates import FilledCourtForm
        
        forms_queryset = FilledCourtForm.objects.filter(
            case=case,
            template__category='drafting'
        ).exclude(status='draft').select_related('template').order_by('-updated_at')
        
        all_forms = list(forms_queryset)
        if not all_forms:
            return []

        def get_seq(f):
            cs = getattr(f, 'custom_sequence', None)
            if cs is not None and cs > 0:
                return cs
            tmpl = getattr(f, 'template', None)
            return tmpl.sequence if (tmpl and getattr(tmpl, 'sequence', None)) else 0

        # Stable sort preserves the '-updated_at' relative order for tied sequences
        all_forms.sort(key=lambda f: get_seq(f))

        # Index is ALWAYS first
        index_form = next((f for f in all_forms if f.template and f.template.name and 'INDEX' in f.template.name.upper()), None)
        if index_form:
            all_forms = [index_form] + [f for f in all_forms if f.id != index_form.id]
        
        return all_forms

    @staticmethod
    def get_preview_data(case):
        """
        Returns the sorted form list with full content and calculated index data.
        Used by the frontend preview to ensure it matches the download exactly.
        """
        all_forms = PDFService._get_sorted_forms(case)
        if not all_forms:
            return None

        index_form = next((f for f in all_forms if f.template and f.template.name and 'INDEX' in f.template.name.upper()), None)
        
        index_data = []
        form_pages = {}
        forms_data = []
        
        front_idx = 0
        
        # Index entry is always 1st in the index list
        index_data.append({
            'sl_no': '01',
            'desc': 'INDEX OF DOCUMENTS',
            'page': '1'
        })
        
        body_page = 2
        sl_no = 2
        
        for form in all_forms:
            template_name = form.template.name if form.template else ''
            case_id_str = str(form.case.id) if form.case else ''

            # Get basic data for preview
            data = {
                'id': str(form.id),
                'template_name': template_name,
                'field_values': form.field_values,
                'filled_content': form.filled_content,
                'case': case_id_str,
                'status': form.status,
                'advocate_signature_image': safe_file_url(form.advocate_signature_image),
                'client_signature_image': safe_file_url(form.client_signature_image),
            }
            
            if index_form and form.id == index_form.id:
                form_pages[data['id']] = {
                    'page_label': '1',
                    'num_pages': 1
                }
                forms_data.append(data)
                continue
            
            name = template_name.upper()
            is_front = any(kw in name for kw in ['INDEX', 'SYNOPSIS', 'LIST OF DATES'])
            
            pdf_bytes = PDFService.render_to_pdf(form)
            num_pages = 1
            if pdf_bytes:
                try:
                    reader = PdfReader(io.BytesIO(pdf_bytes))
                    num_pages = max(1, len(reader.pages))
                except Exception as e:
                    logger.warning(f"Failed to read PDF pages for form {form.id}: {e}")
            
            page_label = ""
            if is_front:
                start_label = get_letter_label(front_idx)
                if num_pages > 1:
                    end_label = get_letter_label(front_idx + num_pages - 1)
                    page_label = f"{start_label} TO {end_label}"
                else:
                    page_label = start_label
                front_idx += num_pages
            else:
                page_label = str(body_page)
                if num_pages > 1:
                    page_label = f"{body_page} TO {body_page + num_pages - 1}"
                body_page += num_pages
            
            f_annex = getattr(form, 'annexure', '') or ''
            if not f_annex and form.field_values and isinstance(form.field_values, dict):
                f_annex = str(form.field_values.get('annexure_no', '') or '').strip()

            index_data.append({
                'sl_no': f"{sl_no:02d}",
                'annexure': f_annex,
                'desc': name,
                'page': page_label
            })
            
            data['annexure'] = f_annex
            
            form_pages[data['id']] = {
                'page_label': page_label,
                'num_pages': num_pages
            }
            forms_data.append(data)
            sl_no += 1
        
        return {
            'forms': forms_data,
            'index_data': index_data,
            'form_pages': form_pages
        }

    @staticmethod
    def merge_case_forms(case):
        """
        Merges all forms for a case into a single Master PDF.
        Uses _get_sorted_forms() for consistent ordering with preview.
        """
        all_forms = PDFService._get_sorted_forms(case)
        if not all_forms:
            return None

        # Prepare Index Data
        index_data = []
        front_idx = 0
        
        # Determine index form
        index_form = next((f for f in all_forms if f.template and f.template.name and 'INDEX' in f.template.name.upper()), None)
        
        # Prepare for merging
        rendered_docs = []
        page_labels = [] 
        sl_no = 2
        body_page = 2
        
        # 1. Handle Index
        index_data.append({
            'sl_no': '01',
            'desc': 'INDEX OF DOCUMENTS',
            'page': '1'
        })
        page_labels.append("1")
        
        # 2. Process all other forms
        for form in all_forms:
            if index_form and form.id == index_form.id:
                continue
                
            name = form.template.name.upper() if form.template else ''
            is_front = any(kw in name for kw in ['INDEX', 'SYNOPSIS', 'LIST OF DATES'])
            
            pdf_bytes = PDFService.render_to_pdf(form)
            if not pdf_bytes:
                continue
                
            try:
                reader = PdfReader(io.BytesIO(pdf_bytes))
                num_pages = max(1, len(reader.pages))
            except Exception as e:
                logger.warning(f"Failed to read PDF pages for form {form.id}: {e}")
                continue
            
            # Label for Index
            page_label = ""
            if is_front:
                start_label = get_letter_label(front_idx)
                if num_pages > 1:
                    end_label = get_letter_label(front_idx + num_pages - 1)
                    page_label = f"{start_label} TO {end_label}"
                else:
                    page_label = start_label
            else:
                page_label = str(body_page)
                if num_pages > 1:
                    page_label = f"{body_page} TO {body_page + num_pages - 1}"
            
            # Record individual page labels for the overlay
            for p_idx in range(num_pages):
                if is_front:
                    page_labels.append(get_letter_label(front_idx + p_idx))
                else:
                    page_labels.append(str(body_page + p_idx))
            
            if is_front:
                front_idx += num_pages
            else:
                body_page += num_pages
                
            f_annex = getattr(form, 'annexure', '') or ''
            if not f_annex and form.field_values and isinstance(form.field_values, dict):
                f_annex = str(form.field_values.get('annexure_no', '') or '').strip()

            index_data.append({
                'sl_no': f"{sl_no:02d}",
                'annexure': f_annex,
                'desc': name,
                'page': page_label
            })
            sl_no += 1
            rendered_docs.append(pdf_bytes)

        # GENERATE FINAL INDEX PDF
        # Render the actual filled INDEX form with index_data injected into its values
        # This ensures the download matches what the user sees in the editor
        index_form_obj = index_form if index_form else all_forms[0]
        
        index_values = dict(index_form_obj.field_values or {})
        index_values['index_data'] = index_data
        
        index_pdf_bytes = PDFService.render_to_pdf(
            index_form_obj,
            override_values=index_values
        )

        # FINAL MERGE
        final_writer = PdfWriter()
        if index_pdf_bytes:
            try:
                idx_reader = PdfReader(io.BytesIO(index_pdf_bytes))
                for p in idx_reader.pages:
                    final_writer.add_page(p)
            except Exception as e:
                logger.error(f"Error reading index pdf bytes: {e}")
        
        for doc_bytes in rendered_docs:
            try:
                reader = PdfReader(io.BytesIO(doc_bytes))
                for p in reader.pages:
                    final_writer.add_page(p)
            except Exception as e:
                logger.error(f"Error adding pages to final_writer: {e}")
                 
        output_intermediate = io.BytesIO()
        final_writer.write(output_intermediate)
        output_intermediate.seek(0)
        
        try:
            final_reader = PdfReader(output_intermediate)
            numbered_writer = PdfWriter()
            
            from reportlab.pdfgen import canvas
            from reportlab.lib.pagesizes import A4
            
            for i, page in enumerate(final_reader.pages):
                packet = io.BytesIO()
                can = canvas.Canvas(packet, pagesize=A4)
                
                # Match frontend style: Bordered box at top right
                box_w, box_h = 45, 35
                x, y = A4[0] - 72 - box_w, A4[1] - 35 - box_h
                
                # Draw box border
                can.setStrokeColorRGB(0, 0, 0)
                can.setLineWidth(1)
                can.rect(x, y, box_w, box_h, stroke=1, fill=0)
                
                # "PAGE" text
                can.setFont("Helvetica-Bold", 7)
                can.drawCentredString(x + box_w/2, y + box_h - 10, "PAGE")
                
                # Page label (Letter or Number)
                label = page_labels[i] if i < len(page_labels) else str(i + 1)
                can.setFont("Helvetica-Bold", 14)
                can.drawCentredString(x + box_w/2, y + 8, str(label).upper())
                
                can.save()
                packet.seek(0)
                
                overlay = PdfReader(packet).pages[0]
                page.merge_page(overlay)
                numbered_writer.add_page(page)

            final_output = io.BytesIO()
            numbered_writer.write(final_output)
            return final_output.getvalue()
        except Exception as e:
            logger.error(f"Error adding page number overlays: {e}")
            return output_intermediate.getvalue()
