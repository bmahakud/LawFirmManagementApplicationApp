'use client';

import { useState, useEffect, useRef } from 'react';
import { customFetch } from '@/lib/fetch';
import { API, API_BASE_URL } from '@/lib/api';
import {
  FileText, Plus, Search, X, Save, Loader2, Eye,
  Download, Share2, CheckCircle, Edit, ArrowLeft, RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import SignaturePad from './SignaturePad';

// A4 dimensions in pixels at 96 DPI
const A4_WIDTH = 794; // 210mm
const A4_HEIGHT = 1123; // 297mm

type CourtFormTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  category_display: string;
  content_structure: {
    page_size: string;
    margins: { top: number; right: number; bottom: number; left: number };
    sections: any[];
  };
  default_field_mappings: Record<string, string>;
  is_active: boolean;
};

type FilledCourtForm = {
  id: string;
  template: string;
  template_name: string;
  case: string;
  client: string;
  filled_content: any;
  field_values: Record<string, any>;
  status: string;
  status_display: string;
  advocate_signed: boolean;
  client_signed: boolean;
  is_shared_with_client: boolean;
  advocate_signature_image?: string;
  client_signature_image?: string;
  advocate_signature_date?: string;
  client_signature_date?: string;
  created_at: string;
};

type Props = {
  caseId: string;
  clientId: string;
  role: string;
  accent?: string;
  categoryFilter?: string;
  initialFormId?: string | null;
  newBlank?: boolean;
};

// Internal component for the rich text drafting area
function DraftingArea({
  fieldName,
  initialValue,
  isEditing,
  style,
  onSync
}: {
  fieldName: string;
  initialValue: string;
  isEditing: boolean;
  style: any;
  onSync: (value: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeStyles, setActiveStyles] = useState({
    bold: false,
    underline: false,
    justifyLeft: true,
    justifyCenter: false,
    justifyRight: false
  });

  // Set initial content only once when component mounts or when template changes
  useEffect(() => {
    if (editorRef.current && initialValue !== undefined) {
      // Only update if current content is significantly different (to avoid clearing cursor)
      // or if it's the very first load
      if (editorRef.current.innerHTML !== initialValue) {
        editorRef.current.innerHTML = initialValue || (isEditing ? '<div><br></div>' : '');
      }
    }
  }, [fieldName]); // Re-run if we switch to a different field, but not on every initialValue change

  const updateActiveStyles = () => {
    if (!isEditing) return;
    setActiveStyles({
      bold: document.queryCommandState('bold'),
      underline: document.queryCommandState('underline'),
      justifyLeft: document.queryCommandState('justifyLeft'),
      justifyCenter: document.queryCommandState('justifyCenter'),
      justifyRight: document.queryCommandState('justifyRight')
    });
  };

  const handleExecCommand = (command: string, value: string | undefined = undefined) => {
    if (!isEditing || !editorRef.current) return;

    editorRef.current.focus();
    document.execCommand(command, false, value);
    updateActiveStyles();

    // Sync with parent state
    onSync(editorRef.current.innerHTML);
  };

  const buttonClass = (isActive: boolean, color: string = 'purple') => `
    w-10 h-10 flex items-center justify-center rounded transition-all duration-200
    ${isActive
      ? `bg-${color}-100 border-2 border-${color}-500 text-${color}-700 shadow-sm scale-105`
      : 'bg-white border border-gray-200 text-gray-900 hover:bg-gray-50 hover:border-gray-300'}
    font-bold
  `;

  return (
    <div className="w-full my-4 group">
      {isEditing && (
        <div className="flex gap-2 mb-2 p-2 bg-gray-50 border border-gray-200 rounded-xl flex-wrap items-center shadow-sm sticky top-0 z-20">
          <button
            onMouseDown={(e) => { e.preventDefault(); handleExecCommand('bold'); }}
            className={buttonClass(activeStyles.bold)}
            title="Bold (Ctrl+B)"
          >
            B
          </button>
          <button
            onMouseDown={(e) => { e.preventDefault(); handleExecCommand('underline'); }}
            className={buttonClass(activeStyles.underline)}
            title="Underline (Ctrl+U)"
          >
            U
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <button
            onMouseDown={(e) => { e.preventDefault(); handleExecCommand('justifyLeft'); }}
            className={buttonClass(activeStyles.justifyLeft, 'blue')}
            title="Align Left"
          >
            L
          </button>
          <button
            onMouseDown={(e) => { e.preventDefault(); handleExecCommand('justifyCenter'); }}
            className={buttonClass(activeStyles.justifyCenter, 'blue')}
            title="Align Center"
          >
            C
          </button>
          <button
            onMouseDown={(e) => { e.preventDefault(); handleExecCommand('justifyRight'); }}
            className={buttonClass(activeStyles.justifyRight, 'blue')}
            title="Align Right"
          >
            R
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <button
            onMouseDown={(e) => { e.preventDefault(); handleExecCommand('removeFormat'); }}
            className="px-3 h-10 flex items-center justify-center rounded text-xs text-gray-600 border border-gray-200 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all font-bold"
            title="Clear Formatting"
          >
            Clear
          </button>

          <span className="text-[10px] text-gray-400 ml-auto uppercase font-bold tracking-widest hidden sm:inline-block">Format</span>
        </div>
      )}

      <div
        ref={editorRef}
        id={`editor_${fieldName}`}
        contentEditable={isEditing}
        onInput={() => {
          if (isEditing && editorRef.current) {
            onSync(editorRef.current.innerHTML);
          }
        }}
        onKeyUp={(e) => {
          if (isEditing && editorRef.current) {
            onSync(editorRef.current.innerHTML);
            updateActiveStyles();
          }
        }}
        onMouseUp={() => isEditing && updateActiveStyles()}
        onBlur={() => {
          if (isEditing && editorRef.current) {
            onSync(editorRef.current.innerHTML);
          }
        }}
        onSelect={() => isEditing && updateActiveStyles()}
        className={`w-full p-10 outline-none bg-white text-gray-900 ${isEditing ? 'border border-gray-200 shadow-inner' : 'border-none'} rounded-lg mt-2 font-normal whitespace-normal overflow-auto`}
        style={{
          fontSize: style.size ? `${style.size + 2}px` : '18px',
          lineHeight: style.line_height || 1.8,
          textAlign: style.align || 'justify' as any,
          minHeight: '842px',
        }}
      />
    </div>
  );
}

export default function PDFCourtFormEditor({ caseId, clientId, role, accent = '#4a1c40', categoryFilter, initialFormId, newBlank }: Props) {
  const [view, setView] = useState<'list' | 'templates' | 'edit' | 'preview'>('list');
  const [templates, setTemplates] = useState<CourtFormTemplate[]>([]);
  const [filledForms, setFilledForms] = useState<FilledCourtForm[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<CourtFormTemplate | null>(null);
  const [selectedForm, setSelectedForm] = useState<FilledCourtForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signatureType, setSignatureType] = useState<'advocate' | 'client'>('advocate');

  // Field values for the form
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});

  const isAdvocateRole = role === 'advocate' || role === 'super-admin' || role === 'firm-admin';
  const isClientRole = role === 'client';

  useEffect(() => {
    fetchData();
  }, [caseId]);

  const formatSignatureUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL}${url.startsWith('/') ? url : '/' + url}`;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [templatesRes, formsRes] = await Promise.all([
        customFetch('/api/documents/court-form-templates/'),
        customFetch(`/api/documents/filled-court-forms/?case=${caseId}`)
      ]);

      if (templatesRes.ok) {
        const data = await templatesRes.json();
        let fetchedTemplates = Array.isArray(data) ? data : data.results || [];

        // Filter by category if provided
        if (categoryFilter) {
          fetchedTemplates = fetchedTemplates.filter((t: any) => t.category === categoryFilter);
        }

        // Sort by sequence then name
        fetchedTemplates.sort((a: any, b: any) => {
          if (a.sequence !== b.sequence) return a.sequence - b.sequence;
          return a.name.localeCompare(b.name);
        });

        setTemplates(fetchedTemplates);
      }

      if (formsRes.ok) {
        const data = await formsRes.json();
        const fetchedForms = Array.isArray(data) ? data : data.results || [];
        setFilledForms(fetchedForms);

        // Auto-open form if initialFormId is provided
        if (initialFormId) {
          const formToOpen = fetchedForms.find((f: any) => String(f.id) === String(initialFormId));
          if (formToOpen) {
            setSelectedForm(formToOpen);
            setFieldValues(formToOpen.field_values || {});

            // Find the template
            const templatesData = await (await customFetch(`/api/documents/court-form-templates/${formToOpen.template}/`)).json();
            setSelectedTemplate(templatesData);

            setView('edit');
            return; // Stop here if we've opened a form
          }
        }

        // New Blank Logic
        if (newBlank) {
          const fetchedTemplatesResponse = await customFetch('/api/documents/court-form-templates/');
          if (fetchedTemplatesResponse.ok) {
            const temps = await fetchedTemplatesResponse.json();
            const tempArray = Array.isArray(temps) ? temps : temps.results || [];
            const blankTemp = tempArray.find((t: any) => t.name.includes('BLANK A4'));
            if (blankTemp) {
              handleSelectTemplate(blankTemp);
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      toast.error('Failed to load forms');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = async (template: CourtFormTemplate) => {
    setSelectedTemplate(template);
    setFieldValues({});
    setSelectedForm(null); // Don't create a form yet, just show the template
    setView('edit');
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;

    setSaving(true);
    try {
      // If no form exists yet, create it. Otherwise update it.
      if (!selectedForm) {
        // Create new form
        const response = await customFetch('/api/documents/filled-court-forms/create_from_template/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            template_id: selectedTemplate.id,
            case_id: caseId
          })
        });

        if (!response.ok) throw new Error('Failed to create form');

        const newForm = await response.json();

        // Now update it with field values
        const updateResponse = await customFetch(`/api/documents/filled-court-forms/${newForm.id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            field_values: fieldValues,
            status: 'completed'
          })
        });

        if (!updateResponse.ok) throw new Error('Failed to save');

        const updatedForm = await updateResponse.json();
        setSelectedForm(updatedForm);
        toast.success('Form saved successfully');

        // Switch to preview mode after saving
        setView('preview');
      } else {
        // Update existing form
        const response = await customFetch(`/api/documents/filled-court-forms/${selectedForm.id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            field_values: fieldValues,
            status: 'completed'
          })
        });

        if (!response.ok) throw new Error('Failed to save');

        const updatedForm = await response.json();
        setSelectedForm(updatedForm);
        toast.success('Form saved successfully');

        // Switch to preview mode after saving
        setView('preview');
      }

      await fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleShareWithClient = async (formId: string) => {
    try {
      const response = await customFetch(`/api/documents/filled-court-forms/${formId}/share_with_client/`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to share');

      toast.success('Shared with client');
      await fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSign = async (formId: string, signatureData?: string) => {
    try {
      // If signature data is provided, upload it first
      if (signatureData) {
        // Convert base64 to blob
        const response = await fetch(signatureData);
        const blob = await response.blob();

        // Create form data
        const formData = new FormData();
        formData.append('signature', blob, 'signature.png');

        // Upload signature
        const uploadResponse = await customFetch(`/api/documents/filled-court-forms/${formId}/sign/`, {
          method: 'POST',
          body: formData
        });

        if (!uploadResponse.ok) throw new Error('Failed to sign');
      } else {
        // Sign without signature image (just mark as signed)
        const response = await customFetch(`/api/documents/filled-court-forms/${formId}/sign/`, {
          method: 'POST'
        });

        if (!response.ok) throw new Error('Failed to sign');
      }

      toast.success('Form signed successfully');
      setShowSignaturePad(false);
      await fetchData();

      // Refresh the selected form
      if (selectedForm && selectedForm.id === formId) {
        const updatedResponse = await customFetch(`/api/documents/filled-court-forms/${formId}/`);
        if (updatedResponse.ok) {
          const updatedForm = await updatedResponse.json();
          setSelectedForm(updatedForm);
        }
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const openSignaturePad = (type: 'advocate' | 'client') => {
    setSignatureType(type);
    setShowSignaturePad(true);
  };

  const handleSaveSignature = (signatureData: string) => {
    if (selectedForm) {
      handleSign(selectedForm.id, signatureData);
    }
  };

  const handleDeleteForm = async (formId: string) => {
    if (!confirm('Are you sure you want to delete this form?')) return;

    try {
      const response = await customFetch(`/api/documents/filled-court-forms/${formId}/`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete');

      toast.success('Form deleted successfully');
      await fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const renderField = (fieldName: string, placeholder: string) => {
    return (
      <input
        type="text"
        value={fieldValues[fieldName] || ''}
        onChange={(e) => setFieldValues({ ...fieldValues, [fieldName]: e.target.value })}
        placeholder={placeholder}
        className="inline-block border-b-2 border-gray-800 focus:border-purple-600 outline-none bg-transparent px-1 min-w-[200px] text-gray-900 font-medium text-base"
        style={{ fontSize: '14px' }}
      />
    );
  };

  const renderSection = (section: any, index: number) => {
    const { type, content, style = {} } = section;

    // Apply styles
    const styleClasses = [
      style.align === 'center' ? 'text-center' : style.align === 'right' ? 'text-right' : 'text-left',
      style.bold ? 'font-bold' : 'font-normal',
      style.italic ? 'italic' : '',
      style.underline ? 'underline' : '',
      style.uppercase ? 'uppercase' : '',
      'text-gray-900'  // Always use dark text
    ].filter(Boolean).join(' ');

    const fontSize = style.size ? `${style.size + 2}px` : '14px';  // Increased base from 11px to 14px, add 2px to all sizes
    const lineHeight = style.line_height || 1.4;

    switch (type) {
      case 'header':
        return (
          <h1 key={index} className="text-black font-bold uppercase mb-2" style={{
            fontSize: section.style?.size || 16,
            textAlign: section.style?.align || 'left',
            textDecoration: section.style?.underline ? 'underline' : 'none'
          }}>
            {renderContentWithFields(section.content)}
          </h1>
        );

      case 'stamp_box':
        return (
          <div key={index} className="flex justify-center my-4">
            <div className="w-[250px] h-[100px] border-2 border-gray-800 flex items-center justify-center text-gray-300 font-bold uppercase tracking-widest text-xs">
              Affix Stamp Here
            </div>
          </div>
        );

      case 'paragraph':
        const pContent = renderContentWithFields(section.content);
        const pLower = section.content?.toLowerCase() || '';
        const isPSign = pLower.includes('signature') || pLower.includes('hand of') || pLower.includes('yours faithfully');
        const pAdvSign = isPSign && (pLower.includes('advocate') || pLower.includes('counsel'));
        const pCliSign = isPSign && (pLower.includes('client') || pLower.includes('deponent') || pLower.includes('party'));

        const pSigImg = pAdvSign ? selectedForm?.advocate_signature_image : pCliSign ? selectedForm?.client_signature_image : null;

        return (
          <div key={index} className="mb-4">
            {pSigImg && (
              <div className={style.align === 'center' ? 'flex justify-center' : style.align === 'right' ? 'flex justify-end' : 'flex justify-start'}>
                <img src={formatSignatureUrl(pSigImg)} alt="Signature" className="h-14 object-contain mb-[-10px] relative z-10" />
              </div>
            )}
            <p className={styleClasses} style={{
              fontSize: section.style?.size || 12,
              textAlign: section.style?.align || 'left',
              lineHeight: section.style?.line_height || 1.4,
              fontWeight: section.style?.bold ? 'bold' : 'normal',
              fontStyle: section.style?.italic ? 'italic' : 'normal'
            }}>
              {pContent}
            </p>
          </div>
        );

      case 'spacer':
        return <div key={index} style={{ height: `${section.height || 10}px` }} />;

      case 'field_group':
        return (
          <div key={index} className="flex gap-6">
            {section.fields?.map((field: any, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <span className="font-bold text-gray-900 text-base">{field.label}:</span>
                {field.type === 'date' ? (
                  <input
                    type="date"
                    value={fieldValues[field.name] || ''}
                    onChange={(e) => setFieldValues({ ...fieldValues, [field.name]: e.target.value })}
                    className="border-b-2 border-gray-800 focus:border-purple-600 outline-none bg-transparent px-1 text-gray-900 font-medium text-base"
                    style={{ fontSize: '14px' }}
                  />
                ) : (
                  <input
                    type="text"
                    value={fieldValues[field.name] || ''}
                    onChange={(e) => setFieldValues({ ...fieldValues, [field.name]: e.target.value })}
                    className="border-b-2 border-gray-800 focus:border-purple-600 outline-none bg-transparent px-1 min-w-[150px] text-gray-900 font-medium text-base"
                    style={{ fontSize: '14px' }}
                  />
                )}
              </div>
            ))}
          </div>
        );

      case 'signature_block':
        const sigLower = content.toLowerCase();
        const isAdvocateSig = sigLower.includes('advocate') || sigLower.includes('mediator') || sigLower.includes('counsel');
        const isClientSig = sigLower.includes('client') || sigLower.includes('applicant') || sigLower.includes('party') || sigLower.includes('deponent');
        const sigImg = isAdvocateSig ? selectedForm?.advocate_signature_image : isClientSig ? selectedForm?.client_signature_image : null;

        return (
          <div key={index} className={styleClasses + " my-4"}>
            <div className="flex flex-col items-center">
              {sigImg ? (
                <img src={formatSignatureUrl(sigImg)} alt="Signature" className="h-16 object-contain mb-1" />
              ) : (
                <div className="h-16" /> // Spacer for unsigned
              )}
              <div className="inline-block border-t-2 border-gray-900 pt-2 min-w-[200px] text-gray-900 font-semibold text-base">
                {content}
              </div>
            </div>
          </div>
        );

      case 'table_inline':
        return (
          <div key={index} className="flex justify-center">
            <table className="border-collapse" style={{ fontSize: style?.size ? `${style.size + 2}px` : '14px' }}>
              <tbody>
                {section.rows?.map((row: any[], rowIndex: number) => (
                  <tr key={rowIndex}>
                    {row.map((cell: any, cellIndex: number) => (
                      <td
                        key={cellIndex}
                        className={`px-4 py-2 ${cell.align === 'right' ? 'text-right' : cell.align === 'center' ? 'text-center' : 'text-left'} ${cell.bold ? 'font-bold' : ''} text-gray-900`}
                        style={{ width: cell.width || 'auto' }}
                      >
                        {cell.field ? (
                          <input
                            type="text"
                            value={fieldValues[cell.content.replace(/[{}]/g, '')] || cell.content}
                            onChange={(e) => {
                              const fieldName = cell.content.replace(/[{}]/g, '');
                              setFieldValues({ ...fieldValues, [fieldName]: e.target.value });
                            }}
                            className="border-b-2 border-gray-800 focus:border-purple-600 outline-none bg-transparent px-1 text-gray-900 font-bold text-base min-w-[150px]"
                            style={{ fontSize: '16px' }}
                          />
                        ) : (
                          cell.content
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'two_column_table':
        const tableSize = style?.size ? `${style.size + 2}px` : '16px';
        return (
          <div key={index} className="flex justify-center">
            <div className="inline-block">
              <table className="border-collapse" style={{ borderSpacing: 0 }}>
                <tbody>
                  {section.left_column?.map((leftText: string, idx: number) => {
                    const rightValue = section.right_column?.[idx] || '';
                    const isField = rightValue.startsWith('{') && rightValue.endsWith('}');
                    const fieldName = isField ? rightValue.slice(1, -1) : '';

                    return (
                      <tr key={idx}>
                        <td className="text-right pr-12 py-1 text-gray-900" style={{ fontSize: tableSize, minWidth: '150px' }}>
                          {leftText}
                        </td>
                        <td className="text-left pl-12 py-1 text-gray-900 font-bold relative" style={{ fontSize: tableSize, minWidth: '200px' }}>
                          {isField ? (
                            <input
                              type="text"
                              value={fieldValues[fieldName] || rightValue}
                              onChange={(e) => setFieldValues({ ...fieldValues, [fieldName]: e.target.value })}
                              className="border-b-2 border-gray-900 focus:border-purple-600 outline-none bg-transparent px-1 text-gray-900 font-bold min-w-[200px]"
                              style={{ fontSize: tableSize }}
                            />
                          ) : (
                            <span className="inline-block" style={{ borderBottom: '2px solid #000', paddingBottom: '2px', minWidth: '200px' }}>
                              {rightValue}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'editable_line':
        const editLineSize = style?.size ? `${style.size + 2}px` : '14px';
        const fieldName = section.field || 'unnamed_field';
        return (
          <div key={index} className="text-gray-900 flex items-baseline" style={{ fontSize: editLineSize }}>
            {section.prefix && <span className="font-normal mr-1">{section.prefix}</span>}
            <input
              type="text"
              value={fieldValues[fieldName] || ''}
              onChange={(e) => setFieldValues({ ...fieldValues, [fieldName]: e.target.value })}
              className="flex-1 border-b-2 border-gray-800 focus:border-purple-600 outline-none bg-transparent px-1 text-gray-900"
              style={{ fontSize: editLineSize }}
            />
          </div>
        );

      case 'grid_row':
        return (
          <div key={index} className="flex flex-wrap gap-4 mb-2 py-1" style={section.style?.border ? { border: '1px solid black', padding: '8px' } : {}}>
            {section.columns.map((col: any, i: number) => {
              const colPrefixLower = col.prefix?.toLowerCase() || '';
              const isColSign = colPrefixLower.includes('signature') || colPrefixLower.includes('advocate') || colPrefixLower.includes('client');
              const colAdvSign = isColSign && (colPrefixLower.includes('advocate') || colPrefixLower.includes('counsel'));
              const colCliSign = isColSign && (colPrefixLower.includes('client') || colPrefixLower.includes('party') || colPrefixLower.includes('deponent'));
              const colSigImg = colAdvSign ? selectedForm?.advocate_signature_image : colCliSign ? selectedForm?.client_signature_image : null;

              return (
                <div key={i} className="flex-1 min-w-[50px] flex flex-col pt-4" style={{
                  flex: col.flex || 1,
                  alignItems: col.align === 'center' ? 'center' : col.align === 'right' ? 'flex-end' : 'flex-start'
                }}>
                  {colSigImg && (
                    <img src={formatSignatureUrl(colSigImg)} alt="Signature" className="h-12 object-contain mb-[-8px] relative z-10" />
                  )}
                  <div className="w-full flex items-center">
                    {col.prefix && <span className="text-black font-medium mr-1 text-[11px] whitespace-nowrap">{col.prefix}</span>}
                    <div className="flex-1 border-b border-dotted border-black min-h-[20px]">
                      {col.field && renderField(col.field, '')}
                    </div>
                    {col.suffix && <span className="text-black font-medium ml-1 text-[11px] whitespace-nowrap">{col.suffix}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        );

      case 'dynamic_table':
        return (
          <div key={index} className="w-full overflow-hidden border border-black my-2">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {section.columns?.map((col: any, j: number) => (
                    <th
                      key={j}
                      className="border border-black p-2 text-[10px] font-bold text-black uppercase text-center align-middle bg-gray-100"
                      style={{ width: col.width, height: '60px' }}
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(section.rows || 1)].map((_, rIdx) => (
                  <tr key={rIdx}>
                    {section.columns?.map((col: any, cIdx: number) => {
                      const fName = `${col.field}_${rIdx}`;
                      const rH = section.row_height ? `${section.row_height}px` : (rIdx === 0 && section.columns.length > 5 ? '400px' : '40px');
                      return (
                        <td key={cIdx} className="border border-black p-0" style={{ height: rH }}>
                          <textarea
                            value={fieldValues[fName] || ''}
                            onChange={(e) => setFieldValues({ ...fieldValues, [fName]: e.target.value })}
                            className="w-full h-full p-2 outline-none bg-transparent text-sm text-black resize-none font-bold"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'form_grid':
        return (
          <div key={index} className="border border-black w-full my-2">
            {section.rows.map((row: any, rowIndex: number) => (
              <div key={rowIndex} className="flex border-b border-black last:border-b-0 min-h-[35px]">
                {row.cells.map((cell: any, cellIndex: number) => (
                  <div key={cellIndex}
                    className="p-1 px-2 border-r border-black last:border-r-0 flex items-center bg-white"
                    style={{ flex: cell.flex || 1, background: cell.background ? '#f3f4f6' : 'white' }}
                  >
                    {cell.label && (
                      <span className={`text-[10px] text-black font-bold mr-2 flex-shrink-0 ${cell.field ? 'w-[120px]' : ''}`}>
                        {cell.label}
                      </span>
                    )}
                    {cell.field ? (
                      <input
                        type="text"
                        placeholder={cell.placeholder}
                        className="flex-1 outline-none bg-transparent text-[11px] text-black font-bold"
                        value={fieldValues[cell.field] || ''}
                        onChange={(e) => setFieldValues({ ...fieldValues, [cell.field]: e.target.value })}
                      />
                    ) : (
                      cell.text && <span className="text-[10px] text-black flex-1 text-center font-bold uppercase">{cell.text}</span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        );

      case 'character_boxes':
        return (
          <div key={index} className="flex border border-gray-800 w-full mb-[-1px]">
            <div className="w-[180px] p-2 border-r border-gray-800 text-[10px] font-bold flex flex-col justify-center bg-gray-50 flex-shrink-0">
              {section.label}
              {section.sublabel && <span className="font-normal text-[8px] italic mt-1">{section.sublabel}</span>}
            </div>
            <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${section.cols || 25}, minmax(0, 1fr))` }}>
              {[...Array((section.cols || 25) * (section.rows || 1))].map((_, i) => (
                <div key={i} className="aspect-square border-r border-b border-gray-800 last:border-r-0">
                  <input
                    type="text"
                    maxLength={1}
                    className="w-full h-full text-center text-xs outline-none bg-transparent font-medium uppercase"
                    value={fieldValues[`${section.field}_${i}`] || ''}
                    onChange={(e) => {
                      const val = e.target.value.slice(-1).toUpperCase();
                      setFieldValues({ ...fieldValues, [`${section.field}_${i}`]: val });
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case 'textarea':
        const taFieldName = section.field || 'document_content';
        const isEditing = view === 'edit';

        return (
          <DraftingArea
            key={index}
            fieldName={taFieldName}
            initialValue={fieldValues[taFieldName]}
            isEditing={isEditing}
            style={style}
            onSync={(value: string) => {
              setFieldValues(prev => ({ ...prev, [taFieldName]: value }));
            }}
          />
        );

      case 'dotted_line':
        // Deprecated: Use editable_line instead
        // This is kept for backward compatibility with old forms
        return null;

      default:
        return null;
    }
  };

  const renderContentWithFields = (content: string) => {
    if (!content) return null;

    // Find all {field_name} patterns
    const parts = content.split(/(\{[^}]+\})/g);

    return parts.map((part, i) => {
      if (part.startsWith('{') && part.endsWith('}')) {
        const fieldName = part.slice(1, -1);
        return (
          <span key={i} className="inline-block">
            {renderField(fieldName, part)}
          </span>
        );
      }

      // Handle simple markdown bold **text** and underline __text__
      // This allows bolding only specific words
      const subParts = part.split(/(\*\*[^*]+\*\*|__[^*]+__)/g);
      return subParts.map((sub, j) => {
        if (sub.startsWith('**') && sub.endsWith('**')) {
          return <strong key={j}>{sub.slice(2, -2)}</strong>;
        }
        if (sub.startsWith('__') && sub.endsWith('__')) {
          return <u key={j}>{sub.slice(2, -2)}</u>;
        }
        return <span key={j}>{sub}</span>;
      });
    });
  };

  const renderActiveView = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      );
    }

    // Template Selection View
    if (view === 'templates') {
      const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
      );

      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Select Court Form Template</h3>
              <p className="text-sm text-gray-500 mt-1">
                {filteredTemplates.length} templates available
              </p>
            </div>
            <button
              onClick={() => setView('list')}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-900 hover:bg-gray-50 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            />
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map(template => (
              <div
                key={template.id}
                className="border border-gray-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer bg-white"
                onClick={() => handleSelectTemplate(template)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-900">{template.name}</h4>
                    <p className="text-xs text-gray-700 mt-1 line-clamp-2">{template.description}</p>
                    <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded font-semibold">
                      {template.category_display}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Preview View (Read-only)
    if (view === 'preview' && selectedTemplate && selectedForm) {
      const { content_structure } = selectedTemplate;
      const margins = content_structure.margins || { top: 72, right: 72, bottom: 72, left: 72 };

      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{selectedTemplate.name}</h3>
              <p className="text-sm text-gray-500 mt-1">Preview Mode - Read Only</p>
            </div>
            <div className="flex gap-2">
              {isAdvocateRole && (
                <>
                  <button
                    onClick={() => setView('edit')}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-900 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => openSignaturePad('advocate')}
                    className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-700 flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {selectedForm.advocate_signed ? 'Change Signature' : 'Sign as Advocate'}
                  </button>
                  {!selectedForm.is_shared_with_client && (
                    <button
                      onClick={() => handleShareWithClient(selectedForm.id)}
                      className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 flex items-center gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      Share with Client
                    </button>
                  )}
                </>
              )}
              {isClientRole && !selectedForm.client_signed && (
                <button
                  onClick={() => openSignaturePad('client')}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-700 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Sign Form
                </button>
              )}
              <button
                onClick={() => {
                  setView('list');
                  setSelectedTemplate(null);
                  setSelectedForm(null);
                  setFieldValues({});
                }}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-900 hover:bg-gray-50 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Close
              </button>
            </div>
          </div>

          {/* Signature Status */}
          {(selectedForm.advocate_signed || selectedForm.client_signed) && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-4">
                {selectedForm.advocate_signed && (
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-semibold">
                      Advocate Signed on {selectedForm.advocate_signature_date ? new Date(selectedForm.advocate_signature_date).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                )}
                {selectedForm.client_signed && (
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-semibold">
                      Client Signed on {selectedForm.client_signature_date ? new Date(selectedForm.client_signature_date).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* A4 Document Container - Read Only */}
          <div className="flex justify-center bg-gray-100 p-8 rounded-lg">
            <div
              className="bg-white shadow-2xl overflow-hidden"
              style={{
                width: `${A4_WIDTH}px`,
                minHeight: `${A4_HEIGHT}px`,
                padding: `${margins.top}px ${margins.right}px ${margins.bottom}px ${margins.left}px`,
                boxSizing: 'border-box'
              }}
            >
              <div className="space-y-4 pointer-events-none">
                {content_structure.sections?.map((section, index) => renderSection(section, index))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // PDF Editor View
    if (view === 'edit' && selectedTemplate) {
      const { content_structure } = selectedTemplate;
      const margins = content_structure.margins || { top: 72, right: 72, bottom: 72, left: 72 };

      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{selectedTemplate.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{selectedTemplate.description}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
              {selectedForm && isAdvocateRole && (
                <>
                  <button
                    onClick={() => handleShareWithClient(selectedForm.id)}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                  <button
                    onClick={() => openSignaturePad('advocate')}
                    className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-700 flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {selectedForm.advocate_signed ? 'Change Signature' : 'Sign'}
                  </button>
                </>
              )}
              <button
                onClick={() => setView('preview')}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-900 hover:bg-gray-50 flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
              {selectedForm && selectedTemplate.name.toUpperCase().includes('INDEX') && (
                <button
                  onClick={async () => {
                    try {
                      const response = await customFetch(`/api/documents/filled-court-forms/${selectedForm.id}/refresh_index/`, {
                        method: 'POST'
                      });
                      if (response.ok) {
                        const updatedForm = await response.json();
                        setFieldValues(updatedForm.field_values);
                        toast.success('Index refreshed with case documents');
                      }
                    } catch (err) {
                      toast.error('Failed to refresh index');
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Index
                </button>
              )}
              <button
                onClick={() => {
                  setView('list');
                  setSelectedTemplate(null);
                  setSelectedForm(null);
                  setFieldValues({});
                }}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-900 hover:bg-gray-50 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Close
              </button>
            </div>
          </div>

          {/* A4 Document Container */}
          <div className="flex justify-center bg-gray-100 p-8 rounded-lg">
            <div
              className="bg-white shadow-2xl overflow-hidden"
              style={{
                width: `${A4_WIDTH}px`,
                minHeight: `${A4_HEIGHT}px`,
                padding: `${margins.top}px ${margins.right}px ${margins.bottom}px ${margins.left}px`,
                boxSizing: 'border-box'
              }}
            >
              <div className="space-y-4">
                {content_structure.sections?.map((section, index) => renderSection(section, index))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // List View (Default)
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Court Forms</h3>
            <p className="text-sm text-gray-500 mt-1">
              {filledForms.length > 0
                ? `${filledForms.length} form${filledForms.length !== 1 ? 's' : ''} created`
                : 'Create professional court forms with pre-written legal content'}
            </p>
          </div>
          {isAdvocateRole && (
            <button
              onClick={() => setView('templates')}
              className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Form
            </button>
          )}
        </div>

        {/* Filled Forms List */}
        {filledForms.length > 0 ? (
          <div className="space-y-3">
            {filledForms.map(form => (
              <div
                key={form.id}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:border-purple-300 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-gray-900">{form.template_name}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Created {new Date(form.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${form.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                      form.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                        form.status === 'signed' ? 'bg-green-100 text-green-700' :
                          'bg-purple-100 text-purple-700'
                      }`}>
                      {form.status_display}
                    </span>

                    {form.client_signed && (
                      <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Client Signed
                      </span>
                    )}
                    {form.advocate_signed && (
                      <span className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Advocate Signed
                      </span>
                    )}

                    {isAdvocateRole && form.status === 'draft' && (
                      <button
                        onClick={() => handleShareWithClient(form.id)}
                        className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 flex items-center gap-1"
                      >
                        <Share2 className="w-3 h-3" />
                        Share
                      </button>
                    )}

                    <button
                      onClick={async () => {
                        // Find the template for this form
                        const template = templates.find(t => t.id === form.template);
                        if (template) {
                          // Always use the latest template structure, not the saved filled_content
                          setSelectedTemplate(template);
                          setSelectedForm(form);
                          setFieldValues(form.field_values || {});
                          setView('preview');
                        } else {
                          // If template not in list, fetch it
                          try {
                            const response = await customFetch(`/api/documents/court-form-templates/${form.template}/`);
                            if (response.ok) {
                              const templateData = await response.json();
                              setSelectedTemplate(templateData);
                              setSelectedForm(form);
                              setFieldValues(form.field_values || {});
                              setView('preview');
                            }
                          } catch (err) {
                            toast.error('Failed to load template');
                          }
                        }
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      title="View/Edit Form"
                    >
                      <Eye className="w-4 h-4 text-gray-400" />
                    </button>

                    {isAdvocateRole && (
                      <button
                        onClick={() => handleDeleteForm(form.id)}
                        className="p-2 hover:bg-red-50 rounded-lg"
                        title="Delete Form"
                      >
                        <X className="w-4 h-4 text-red-400 hover:text-red-600" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No forms created yet</p>
            {isAdvocateRole && (
              <button
                onClick={() => setView('templates')}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Your First Form
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative">
      {renderActiveView()}

      {/* Signature Pad Modal - Rendered at top level to ensure visibility */}
      {showSignaturePad && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <SignaturePad
            onSave={handleSaveSignature}
            onCancel={() => setShowSignaturePad(false)}
            title={signatureType === 'advocate' ? 'Sign as Advocate' : 'Sign as Client'}
            saving={saving}
          />
        </div>
      )}
    </div>
  );
}
