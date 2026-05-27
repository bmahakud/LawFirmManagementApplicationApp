import io
from django.conf import settings
from django.template.loader import render_to_string
from xhtml2pdf import pisa
from PyPDF2 import PdfWriter, PdfReader
from django.db import models

class PDFService:
    @staticmethod
    def render_to_pdf(filled_form):
        """
        Renders a single FilledCourtForm to PDF bytes.
        Supports the JSON-based layout structure.
        """
        # Convert JSON structure to simple HTML
        context = {
            'form': filled_form,
            'structure': filled_form.template.content_structure,
            'values': filled_form.field_values or {},
            'sections': filled_form.template.content_structure.get('sections', [])
        }
        
        # We'll use a generic template for all forms
        html_string = render_to_string('documents/pdf_base.html', context)
        
        result = io.BytesIO()
        pdf = pisa.pisaDocument(io.BytesIO(html_string.encode("UTF-8")), result)
        
        if not pdf.err:
            return result.getvalue()
        return None

    @staticmethod
    def merge_case_forms(case):
        """
        Merges all forms for a case into a single Master PDF based on custom_priority.
        """
        from .models_templates import FilledCourtForm
        
        # Get documents in priority order
        forms = FilledCourtForm.objects.filter(
            case=case,
            template__category='drafting'
        ).select_related('template').annotate(
            effective_sequence=models.Case(
                models.When(custom_sequence__gt=0, then=models.F('custom_sequence')),
                default=models.F('template__sequence'),
                output_field=models.IntegerField()
            )
        ).order_by('effective_sequence', 'template__name')
        
        writer = PdfWriter()
        
        for form in forms:
            pdf_bytes = PDFService.render_to_pdf(form)
            if pdf_bytes:
                reader = PdfReader(io.BytesIO(pdf_bytes))
                for page in reader.pages:
                    writer.add_page(page)
                    
        output = io.BytesIO()
        writer.write(output)
        return output.getvalue()
