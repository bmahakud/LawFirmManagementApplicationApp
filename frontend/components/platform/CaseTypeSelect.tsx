'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Scale, ChevronDown, Search, X, Check } from 'lucide-react';
import { CASE_TYPES } from '@/lib/caseTypes';

interface CaseTypeSelectProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export default function CaseTypeSelect({
  value,
  onChange,
  required = false,
  error,
  label = 'Case Type',
  disabled = false,
  className = '',
}: CaseTypeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Auto-focus search input when opened
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Combine standard list with current value if current value is custom/legacy
  const allOptions = useMemo(() => {
    if (value && !CASE_TYPES.includes(value)) {
      return [value, ...CASE_TYPES];
    }
    return CASE_TYPES;
  }, [value]);

  // Filtered options based on user search
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allOptions;
    return allOptions.filter(type => type.toLowerCase().includes(q));
  }, [allOptions, search]);

  const handleSelect = (selectedType: string) => {
    onChange(selectedType);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`} ref={containerRef}>
      {label && (
        <label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
          <span className="flex items-center gap-1">
            {label}
            {required && <span className="text-red-500 font-bold">*</span>}
          </span>
          <span className="text-[10px] text-gray-400 font-normal">
            161 court types available
          </span>
        </label>
      )}

      <div className="relative">
        {/* Main Trigger Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!disabled) {
              setIsOpen(prev => !prev);
              setSearch('');
            }
          }}
          className={`h-11 w-full rounded-xl border pl-11 pr-10 text-left text-sm font-semibold transition-all flex items-center justify-between cursor-pointer outline-none ${
            disabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
              : error
              ? 'border-red-200 bg-red-50/50 text-gray-900 focus:ring-4 focus:ring-red-100'
              : isOpen
              ? 'border-[#0e2340] bg-white ring-4 ring-[#0e2340]/5 shadow-sm text-gray-900'
              : 'border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:border-[#0e2340] focus:ring-4 focus:ring-[#0e2340]/5 text-gray-900'
          }`}
        >
          <Scale className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />

          <span className={value ? 'text-gray-900 font-bold truncate' : 'text-gray-400 font-normal'}>
            {value || 'Select Case Type...'}
          </span>

          <ChevronDown
            className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-transform pointer-events-none ${
              isOpen ? 'rotate-180 text-[#0e2340]' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            {/* Search Input Box */}
            <div className="p-3 border-b border-gray-100 bg-gray-50/70">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Type to filter e.g. BLAPL, WP(C), PIL..."
                  className="w-full h-9 pl-9 pr-8 text-xs font-semibold bg-white border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#0e2340] focus:ring-2 focus:ring-[#0e2340]/10"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Options List */}
            <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
              {filtered.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-xs text-gray-500 mb-2">No matching case type for &ldquo;{search}&rdquo;</p>
                  {search.trim() && (
                    <button
                      type="button"
                      onClick={() => handleSelect(search.trim())}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-800 transition-colors"
                    >
                      Use &ldquo;{search.trim()}&rdquo; as custom type
                    </button>
                  )}
                </div>
              ) : (
                filtered.map(type => {
                  const isSelected = value === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleSelect(type)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[#0e2340] text-white shadow-xs font-bold'
                          : 'text-gray-800 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <span className="truncate">{type}</span>
                      {isSelected && <Check className="w-4 h-4 text-white shrink-0 ml-2" />}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer with summary */}
            <div className="px-3.5 py-2 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-[11px] text-gray-500">
              <span>Showing {filtered.length} of {allOptions.length} case types</span>
              {value && (
                <span className="font-semibold text-gray-700">
                  Selected: <strong className="text-gray-900">{value}</strong>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-[10px] text-red-500 font-bold ml-1">{error}</p>}
    </div>
  );
}

