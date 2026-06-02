import io
from django.conf import settings
from django.template.loader import render_to_string
from xhtml2pdf import pisa
from pypdf import PdfWriter, PdfReader
from django.db import models

class PDFService:
    @staticmethod
    def render_to_pdf(filled_form, override_sections=None, override_values=None):
        """
        Renders a single FilledCourtForm to PDF bytes.
        Supports the JSON-based layout structure.
        """
        # Resolve placeholders in field_values if they contain {key}
        values = (override_values if override_values is not None else filled_form.field_values) or {}
        sections = override_sections if override_sections is not None else (filled_form.filled_content.get('sections') or filled_form.template.content_structure.get('sections', []))
        
        context = {
            'form': filled_form,
            'structure': filled_form.template.content_structure,
            'values': values,
            'sections': sections
        }
        
        # Build the HTML
        html_string = render_to_string('documents/pdf_base.html', context)
        
        result = io.BytesIO()
        # Ensure we use UTF-8 and handle images
        pdf = pisa.pisaDocument(
            io.BytesIO(html_string.encode("UTF-8")), 
            result,
            encoding='UTF-8'
        )
        
        if not pdf.err:
            return result.getvalue()
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
        ).select_related('template').order_by('-updated_at')
        
        all_forms = list(forms_queryset)
        if not all_forms:
            return []

        def get_seq(f):
            cs = f.custom_sequence
            if cs is not None and cs > 0:
                return cs
            return f.template.sequence if f.template.sequence else 0

        # Stable sort preserves the '-updated_at' relative order for tied sequences
        all_forms.sort(key=lambda f: get_seq(f))

        # Index is ALWAYS first
        index_form = next((f for f in all_forms if 'INDEX' in f.template.name.upper()), None)
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

        index_form = next((f for f in all_forms if 'INDEX' in f.template.name.upper()), None)
        
        index_data = []
        form_pages = {}
        forms_data = []
        
        front_letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
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
            # Get basic data for preview
            data = {
                'id': str(form.id),
                'template_name': form.template.name,
                'field_values': form.field_values,
                'filled_content': form.filled_content,
                'case': str(form.case.id),
                'status': form.status
            }
            
            if index_form and form.id == index_form.id:
                form_pages[data['id']] = {
                    'page_label': '1',
                    'num_pages': 1
                }
                forms_data.append(data)
                continue
            
            name = form.template.name.upper()
            is_front = any(kw in name for kw in ['INDEX', 'SYNOPSIS', 'LIST OF DATES'])
            
            pdf_bytes = PDFService.render_to_pdf(form)
            if not pdf_bytes:
                num_pages = 1
            else:
                reader = PdfReader(io.BytesIO(pdf_bytes))
                num_pages = len(reader.pages)
            
            page_label = ""
            if is_front:
                page_label = front_letters[front_idx]
                if num_pages > 1:
                    page_label = f"{front_letters[front_idx]} TO {front_letters[front_idx + num_pages - 1]}"
                front_idx += num_pages
            else:
                page_label = str(body_page)
                if num_pages > 1:
                    page_label = f"{body_page} TO {body_page + num_pages - 1}"
                body_page += num_pages
            
            index_data.append({
                'sl_no': f"{sl_no:02d}",
                'desc': name,
                'page': page_label
            })
            
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

        index_form = next((f for f in all_forms if 'INDEX' in f.template.name.upper()), None)
        
        # Calculate page numbers and render documents
        rendered_docs = []
        index_data = []
        
        front_letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
        front_idx = 0
        body_page = 1
        
        # Index is always SL. NO. 01, PAGE 1
        index_data.append({
            'sl_no': '01',
            'desc': 'INDEX OF DOCUMENTS',
            'page': '1'
        })
        
        body_page = 2
        sl_no = 2
        
        for form in all_forms:
            if index_form and form.id == index_form.id:
                continue
                
            name = form.template.name.upper()
            is_front = any(kw in name for kw in ['INDEX', 'SYNOPSIS', 'LIST OF DATES'])
            
            pdf_bytes = PDFService.render_to_pdf(form)
            if not pdf_bytes:
                continue
                
            reader = PdfReader(io.BytesIO(pdf_bytes))
            num_pages = len(reader.pages)
            
            page_label = ""
            if is_front:
                page_label = front_letters[front_idx]
                if num_pages > 1:
                    page_label = f"{front_letters[front_idx]} TO {front_letters[front_idx + num_pages - 1]}"
                front_idx += num_pages
            else:
                page_label = str(body_page)
                if num_pages > 1:
                    page_label = f"{body_page} TO {body_page + num_pages - 1}"
                body_page += num_pages
                
            index_data.append({
                'sl_no': f"{sl_no:02d}",
                'desc': name,
                'page': page_label
            })
            
            rendered_docs.append(pdf_bytes)
            sl_no += 1

        # Generate the Index Sheet
        index_sections = [
            {
                "type": "header",
                "content": "INDEX OF DOCUMENTS",
                "style": {"align": "center", "bold": True, "size": 16}
            },
            {
                "type": "auto_index_table",
                "fields": []
            }
        ]
        index_values = {"index_data": index_data}
        index_pdf_bytes = PDFService.render_to_pdf(all_forms[0], override_sections=index_sections, override_values=index_values)

        # FINAL MERGE
        final_writer = PdfWriter()
        
        # Prepend Index
        if index_pdf_bytes:
            idx_reader = PdfReader(io.BytesIO(index_pdf_bytes))
            for p in idx_reader.pages:
                final_writer.add_page(p)
        
        # Append all docs
        for doc_bytes in rendered_docs:
            reader = PdfReader(io.BytesIO(doc_bytes))
            for p in reader.pages:
                final_writer.add_page(p)
                
        # Add Page Numbers Overlay
        output_intermediate = io.BytesIO()
        final_writer.write(output_intermediate)
        output_intermediate.seek(0)
        
        final_reader = PdfReader(output_intermediate)
        numbered_writer = PdfWriter()
        
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import A4
        
        for i, page in enumerate(final_reader.pages):
            packet = io.BytesIO()
            can = canvas.Canvas(packet, pagesize=A4)
            can.setFont("Helvetica-Bold", 10)
            can.drawRightString(A4[0] - 40, A4[1] - 40, f"PAGE {i + 1}")
            can.save()
            packet.seek(0)
            
            number_reader = PdfReader(packet)
            page.merge_page(number_reader.pages[0])
            numbered_writer.add_page(page)

        output = io.BytesIO()
        numbered_writer.write(output)
        return output.getvalue()
