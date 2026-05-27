# PDF-Style Court Forms Implementation

## Overview

I've implemented a comprehensive **PDF-style court forms system** that transforms the previous simple form-based approach into a professional document editor with A4-sized templates containing pre-written legal content.

## Key Features

### 1. **A4 Document Layout**
- Forms are displayed in actual A4 size (794x1123 pixels at 96 DPI)
- Professional margins (72px = 1 inch on all sides by default)
- Looks and feels like editing a real legal document

### 2. **Pre-Written Legal Content**
- Templates come with complete legal text already written
- Advocates only need to fill in specific values (names, dates, amounts, etc.)
- Content is structured with proper formatting (headers, paragraphs, spacing)

### 3. **Dynamic Field Insertion**
- Fields are embedded within the text using `{field_name}` syntax
- Auto-population from case/client data
- Inline editing directly in the document

### 4. **Rich Document Structure**
Templates support multiple section types:
- **Headers**: Centered, bold, customizable size
- **Paragraphs**: Justified text with line height control
- **Spacers**: Precise vertical spacing control
- **Field Groups**: Multiple fields in a row (e.g., Date and Place)
- **Signature Blocks**: Professional signature areas
- **Styling**: Bold, italic, underline, uppercase, alignment, font size

### 5. **Smart Auto-Population**
- Templates define field mappings (e.g., `court_name` → `case.court_name`)
- When creating a form, values are automatically filled from case/client data
- Reduces manual data entry and errors

## Backend Implementation

### Models (`backend/documents/models_templates.py`)

#### `CourtFormTemplate`
- Stores template definitions with complete document structure
- JSON-based content structure for flexibility
- Default field mappings for auto-population
- Category-based organization (bail_bond, vakalatnama, etc.)

#### `FilledCourtForm`
- Instance of a filled form for a specific case
- Stores field values and filled content
- Status tracking (draft, completed, reviewed, signed, filed)
- Signature tracking for both advocate and client
- Sharing capabilities with clients

### API Endpoints

```
GET    /api/documents/court-form-templates/          # List all templates
POST   /api/documents/court-form-templates/          # Create template
GET    /api/documents/court-form-templates/{id}/     # Get template
PATCH  /api/documents/court-form-templates/{id}/     # Update template
POST   /api/documents/court-form-templates/{id}/duplicate/  # Duplicate template

GET    /api/documents/filled-court-forms/            # List filled forms
POST   /api/documents/filled-court-forms/create_from_template/  # Create from template
GET    /api/documents/filled-court-forms/{id}/       # Get filled form
PATCH  /api/documents/filled-court-forms/{id}/       # Update filled form
POST   /api/documents/filled-court-forms/{id}/share_with_client/  # Share with client
POST   /api/documents/filled-court-forms/{id}/sign/  # Sign the form
POST   /api/documents/filled-court-forms/{id}/generate_pdf/  # Generate PDF
```

### Seeded Templates

Three professional templates are included:

1. **Form No 45 Bail Bond**
   - Complete bail bond format as per CrPC Section 436-450
   - Fields: accused name, father name, age, address, bond amount, FIR number, etc.
   - Professional court format with signature blocks

2. **Vakalatnama**
   - Standard power of attorney for legal representation
   - Fields: client name, advocate name, enrollment number, case details
   - Acceptance section for advocate signature

3. **Memorandum of Appearance**
   - Court appearance memorandum
   - Fields: case details, advocate details, address for service
   - Professional format with party information

## Frontend Implementation

### Component (`frontend/components/platform/PDFCourtFormEditor.tsx`)

#### Features:
- **Template Selection**: Browse and search available templates
- **A4 Document View**: Realistic document editing experience
- **Inline Field Editing**: Edit fields directly within the document text
- **Auto-Save**: Save drafts as you work
- **Status Management**: Track form status (draft, completed, signed, filed)
- **Sharing**: Share forms with clients
- **Signature Tracking**: Visual indicators for signed forms

#### Views:
1. **List View**: Shows all created forms for the case
2. **Template Selection**: Grid of available templates with search
3. **Editor View**: A4-sized document with inline editing
4. **Preview View**: (Future) Read-only preview of completed forms

## Template Structure Example

```json
{
  "page_size": "A4",
  "margins": {"top": 72, "right": 72, "bottom": 72, "left": 72},
  "sections": [
    {
      "type": "header",
      "content": "IN THE COURT OF {court_name}",
      "style": {"align": "center", "bold": true, "size": 14}
    },
    {
      "type": "spacer",
      "height": 20
    },
    {
      "type": "paragraph",
      "content": "I, {accused_name}, son/daughter of {father_name}, aged {age} years...",
      "style": {"align": "justify", "size": 11, "line_height": 1.5}
    },
    {
      "type": "field_group",
      "fields": [
        {"name": "date", "label": "Date", "type": "date"},
        {"name": "place", "label": "Place", "type": "text"}
      ]
    },
    {
      "type": "signature_block",
      "content": "Signature of the Accused",
      "style": {"align": "right"}
    }
  ]
}
```

## Usage Workflow

### For Advocates:

1. **Navigate to Case** → **Court Forms** tab
2. **Click "Create Form"**
3. **Select a template** (e.g., "Form No 45 Bail Bond")
4. **System auto-creates form** with pre-filled data from case/client
5. **Edit fields inline** directly in the A4 document
6. **Save as draft** or mark as completed
7. **Share with client** for review/signature
8. **Generate PDF** for filing (future feature)

### For Clients:

1. **View shared forms** in their case dashboard
2. **Review the document** in A4 format
3. **Sign electronically** (future feature)
4. **Download PDF** (future feature)

## Advantages Over Previous System

### Before (Old CourtFormsManager):
- ❌ Simple form fields without context
- ❌ No visual representation of final document
- ❌ Manual formatting required
- ❌ No pre-written legal content
- ❌ Difficult to visualize final output

### After (New PDFCourtFormEditor):
- ✅ A4-sized document view
- ✅ Pre-written legal content
- ✅ Professional formatting built-in
- ✅ Inline field editing
- ✅ WYSIWYG experience
- ✅ Auto-population from case data
- ✅ Easy to add/remove rows (future)
- ✅ PDF generation ready (future)

## Future Enhancements

### Planned Features:

1. **Dynamic Tables**
   - Add/remove rows for lists (e.g., list of documents, witnesses)
   - Configurable columns
   - Auto-numbering

2. **PDF Generation**
   - Generate actual PDF files using ReportLab or WeasyPrint
   - Preserve exact formatting
   - Include signatures

3. **Digital Signatures**
   - E-signature integration
   - Signature verification
   - Timestamp tracking

4. **Template Builder**
   - Visual template editor for admins
   - Drag-and-drop sections
   - Field configuration UI

5. **Multi-Page Support**
   - Automatic page breaks
   - Page numbers
   - Headers/footers

6. **Conditional Sections**
   - Show/hide sections based on case type
   - Dynamic content based on field values

7. **Version History**
   - Track changes to forms
   - Restore previous versions
   - Compare versions

8. **Collaboration**
   - Multiple advocates can edit
   - Comments and annotations
   - Review workflow

## Database Migrations

Run these commands to apply the new models:

```bash
cd backend
python manage.py makemigrations documents
python manage.py migrate documents
python manage.py seed_pdf_court_forms
```

## Integration Points

The new system integrates with:
- **Cases**: Forms are linked to specific cases
- **Clients**: Auto-populate client information
- **Documents**: Can be saved as document records
- **Calendar**: Hearing dates from forms can create calendar events
- **Billing**: Track time spent on form preparation

## Technical Details

### Frontend Technologies:
- React with TypeScript
- Tailwind CSS for styling
- Lucide React for icons
- Custom A4 layout calculations

### Backend Technologies:
- Django REST Framework
- PostgreSQL JSON fields for flexible structure
- UUID primary keys
- Soft delete support

### Data Flow:
1. Template defines structure and field mappings
2. User selects template for a case
3. System creates FilledCourtForm with auto-populated values
4. User edits fields inline in A4 view
5. Changes saved to field_values JSON
6. Form can be shared, signed, and eventually converted to PDF

## Customization

### Adding New Templates:

1. Create template definition in `seed_pdf_court_forms.py`
2. Define content structure with sections
3. Map fields to case/client data
4. Run seeding command
5. Template appears in selection list

### Modifying Existing Templates:

1. Update template in database or seeding script
2. Changes apply to new forms only
3. Existing forms retain their structure

## Security Considerations

- ✅ Role-based access control
- ✅ Advocates can create/edit forms
- ✅ Clients can only view shared forms
- ✅ Soft delete for audit trail
- ✅ Signature tracking with timestamps
- ✅ Share tracking (who shared, when)

## Performance

- Efficient JSON storage for flexible structure
- Indexed queries for fast retrieval
- Lazy loading of templates
- Optimized A4 rendering

## Conclusion

This implementation provides a professional, user-friendly system for creating court forms that:
- Saves time with pre-written content
- Reduces errors with auto-population
- Provides a realistic document editing experience
- Maintains professional formatting
- Supports the complete workflow from creation to filing

The system is extensible and ready for future enhancements like PDF generation, digital signatures, and dynamic tables.
