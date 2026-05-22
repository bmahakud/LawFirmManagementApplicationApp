'use client';

import { useState, useEffect } from 'react';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';
import { 
  FileText, Plus, Search, Filter, Eye, Edit, Share2, 
  CheckCircle, Clock, Send, Download, Loader2, X, Save
} from 'lucide-react';
import { toast } from 'react-hot-toast';

type Template = {
  id: string;
  name: string;
  description: string;
  category: string;
  category_display: string;
  template_fields: Record<string, string>;
  is_active: boolean;
};

type FilledTemplate = {
  id: string;
  template: string;
  template_name: string;
  template_category: string;
  case: string;
  client: string;
  filled_data: Record<string, any>;
  status: 'draft' | 'completed' | 'shared' | 'signed' | 'filed';
  status_display: string;
  is_shared_with_client: boolean;
  client_signed: boolean;
  advocate_signed: boolean;
  created_at: string;
  updated_at: string;
};

type Props = {
  caseId: string;
  clientId: string;
  role: string;
  accent?: string;
};

export default function CourtFormsManager({ caseId, clientId, role, accent = '#4a1c40' }: Props) {
  const [view, setView] = useState<'list' | 'templates' | 'fill' | 'view'>('list');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filledTemplates, setFilledTemplates] = useState<FilledTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedFilled, setSelectedFilled] = useState<FilledTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Form data for filling template
  const [filledData, setFilledData] = useState<Record<string, any>>({});

  const isAdvocateRole = role === 'advocate' || role === 'super-admin' || role === 'firm-admin';
  const isClientRole = role === 'client';

  useEffect(() => {
    fetchData();
  }, [caseId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Fetching templates from:', API.DOCUMENTS.TEMPLATES);
      console.log('Fetching filled templates from:', API.DOCUMENTS.FILLED_TEMPLATES.BY_CASE(caseId));
      
      const [templatesRes, filledRes] = await Promise.all([
        customFetch(API.DOCUMENTS.TEMPLATES),
        customFetch(API.DOCUMENTS.FILLED_TEMPLATES.BY_CASE(caseId))
      ]);

      console.log('Templates response status:', templatesRes.status);
      console.log('Filled templates response status:', filledRes.status);

      const templatesData = await templatesRes.json();
      const filledData = await filledRes.json();

      console.log('Templates data:', templatesData);
      console.log('Filled data:', filledData);

      if (templatesRes.ok) {
        const templatesList = Array.isArray(templatesData) ? templatesData : templatesData.results || [];
        console.log('Setting templates:', templatesList.length, 'templates');
        setTemplates(templatesList);
      } else {
        console.error('Templates fetch failed:', templatesData);
        toast.error('Failed to load templates: ' + (templatesData.detail || 'Unknown error'));
      }
      
      if (filledRes.ok) {
        setFilledTemplates(Array.isArray(filledData) ? filledData : filledData.results || []);
      } else {
        console.error('Filled templates fetch failed:', filledData);
      }
    } catch (err: any) {
      console.error('Error fetching templates:', err);
      toast.error('Failed to load templates: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setFilledData({});
    setView('fill');
  };

  const handleSaveDraft = async () => {
    if (!selectedTemplate) return;
    
    setSaving(true);
    try {
      const response = await customFetch(API.DOCUMENTS.FILLED_TEMPLATES.CREATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: selectedTemplate.id,
          case: caseId,
          client: clientId,
          filled_data: filledData,
          status: 'draft'
        })
      });

      if (!response.ok) throw new Error('Failed to save');

      toast.success('Draft saved successfully');
      await fetchData();
      setView('list');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleShareWithClient = async (id: string) => {
    try {
      const response = await customFetch(API.DOCUMENTS.FILLED_TEMPLATES.SHARE(id), {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to share');

      toast.success('Shared with client');
      await fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { color: 'bg-gray-100 text-gray-700', icon: Clock },
      completed: { color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
      shared: { color: 'bg-purple-100 text-purple-700', icon: Share2 },
      signed: { color: 'bg-green-100 text-green-700', icon: CheckCircle },
      filed: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
    };
    
    const badge = badges[status as keyof typeof badges] || badges.draft;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg ${badge.color} text-xs font-semibold`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    return matchesSearch && matchesCategory && t.is_active;
  });

  const categories = [...new Set(templates.map(t => t.category))];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Template Library View
  if (view === 'templates') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Legal Document Templates</h3>
            <p className="text-sm text-gray-500 mt-1">
              {templates.length} templates available • {filteredTemplates.length} matching filters
            </p>
          </div>
          <button
            onClick={() => setView('list')}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-900 hover:bg-gray-50 flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Close
          </button>
        </div>

        {/* Debug Info */}
        {templates.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Debug:</strong> No templates loaded. Check browser console for errors.
            </p>
          </div>
        )}

        {/* Search and Filter */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
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

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No templates found</p>
          </div>
        )}
      </div>
    );
  }

  // Fill Template View
  if (view === 'fill' && selectedTemplate) {
    const renderField = (fieldName: string, fieldConfig: any) => {
      // Handle new structure (object with type) or old structure (string)
      const fieldType = typeof fieldConfig === 'string' ? fieldConfig : fieldConfig.type;
      const fieldLabel = typeof fieldConfig === 'object' ? fieldConfig.label : 
                        fieldName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const fieldDefault = typeof fieldConfig === 'object' ? fieldConfig.default : '';

      // Static content (non-editable text)
      if (fieldType === 'static') {
        return (
          <div key={fieldName} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-sm font-semibold text-gray-700 text-center">
              {fieldConfig.content}
            </p>
          </div>
        );
      }

      // Paragraph with template text
      if (fieldType === 'paragraph') {
        return (
          <div key={fieldName} className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              {fieldLabel}
            </label>
            <p className="text-sm text-gray-600 italic mb-2">{fieldConfig.template}</p>
            <textarea
              value={filledData[fieldName] || ''}
              onChange={(e) => setFilledData({...filledData, [fieldName]: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={3}
              placeholder="Fill in the details..."
            />
          </div>
        );
      }

      // Table field
      if (fieldType === 'table') {
        const tableData = filledData[fieldName] || [{}];
        const columns = fieldConfig.columns || [];
        
        return (
          <div key={fieldName} className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">
              {fieldLabel}
            </label>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    {columns.map((col: any) => (
                      <th key={col.key} className="border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-700">
                        {col.label}
                      </th>
                    ))}
                    <th className="border border-gray-300 px-2 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row: any, rowIndex: number) => (
                    <tr key={rowIndex}>
                      {columns.map((col: any) => (
                        <td key={col.key} className="border border-gray-300 p-1">
                          <input
                            type="text"
                            value={row[col.key] || ''}
                            onChange={(e) => {
                              const newTableData = [...tableData];
                              newTableData[rowIndex] = {...newTableData[rowIndex], [col.key]: e.target.value};
                              setFilledData({...filledData, [fieldName]: newTableData});
                            }}
                            className="w-full px-2 py-1 text-xs text-gray-900 bg-white border-none focus:outline-none focus:ring-1 focus:ring-purple-300"
                          />
                        </td>
                      ))}
                      <td className="border border-gray-300 p-1 text-center">
                        {tableData.length > (fieldConfig.min_rows || 1) && (
                          <button
                            onClick={() => {
                              const newTableData = tableData.filter((_: any, i: number) => i !== rowIndex);
                              setFilledData({...filledData, [fieldName]: newTableData});
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {tableData.length < (fieldConfig.max_rows || 10) && (
              <button
                onClick={() => {
                  const newTableData = [...tableData, {}];
                  setFilledData({...filledData, [fieldName]: newTableData});
                }}
                className="text-sm text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Row
              </button>
            )}
          </div>
        );
      }

      // Regular fields
      return (
        <div key={fieldName}>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {fieldLabel}
          </label>
          {fieldType === 'textarea' ? (
            <textarea
              value={filledData[fieldName] || fieldDefault}
              onChange={(e) => setFilledData({...filledData, [fieldName]: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={3}
            />
          ) : fieldType === 'date' ? (
            <input
              type="date"
              value={filledData[fieldName] || fieldDefault}
              onChange={(e) => setFilledData({...filledData, [fieldName]: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          ) : fieldType === 'signature' ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500">Signature will be added later</p>
            </div>
          ) : (
            <input
              type="text"
              value={filledData[fieldName] || fieldDefault}
              onChange={(e) => setFilledData({...filledData, [fieldName]: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          )}
        </div>
      );
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{selectedTemplate.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{selectedTemplate.description}</p>
          </div>
          <button
            onClick={() => setView('templates')}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-900 hover:bg-gray-50 flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>

        {/* Dynamic Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          {Object.entries(selectedTemplate.template_fields).map(([fieldName, fieldConfig]) => 
            renderField(fieldName, fieldConfig)
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="px-6 py-2 rounded-lg bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Draft
          </button>
        </div>
      </div>
    );
  }

  // List View (Default)
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Court Forms & Templates</h3>
          <p className="text-sm text-gray-500 mt-1">
            {filledTemplates.length > 0 
              ? `${filledTemplates.length} form${filledTemplates.length !== 1 ? 's' : ''} created`
              : 'Select a template to get started'}
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

      {/* Show Templates if no filled templates exist */}
      {filledTemplates.length === 0 ? (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>{templates.length} templates</strong> available. {filteredTemplates.length} matching your search.
            </p>
          </div>
          
          {/* Search and Filter */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
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

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No templates found</p>
            </div>
          )}
        </div>
      ) : (
        /* Filled Templates List */
        <div className="space-y-3">
          {filledTemplates.map(filled => (
            <div
              key={filled.id}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:border-purple-300 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-gray-900">{filled.template_name}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Created {new Date(filled.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {getStatusBadge(filled.status)}
                  
                  {filled.client_signed && (
                    <span className="text-xs text-green-600 font-semibold">Client Signed</span>
                  )}
                  {filled.advocate_signed && (
                    <span className="text-xs text-blue-600 font-semibold">Advocate Signed</span>
                  )}
                  
                  {isAdvocateRole && filled.status === 'draft' && (
                    <button
                      onClick={() => handleShareWithClient(filled.id)}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700"
                    >
                      <Share2 className="w-3 h-3 inline mr-1" />
                      Share
                    </button>
                  )}
                  
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Eye className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
