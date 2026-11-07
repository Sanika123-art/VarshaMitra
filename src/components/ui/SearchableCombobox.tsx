"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search, X, Check } from "lucide-react";

export interface ComboboxOption {
  value: string;
  label: string;
  labelMr?: string;
  subLabel?: string;
  icon?: React.ReactNode;
}

interface SearchableComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  isMarathi?: boolean;
}

export function SearchableCombobox({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Type to search...",
  className = "",
  disabled = false,
  isMarathi = false,
}: SearchableComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find currently selected option
  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value);
  }, [options, value]);

  // Sync display label when selection or language changes
  const displayLabel = useMemo(() => {
    if (!selectedOption) return "";
    return isMarathi && selectedOption.labelMr ? selectedOption.labelMr : selectedOption.label;
  }, [selectedOption, isMarathi]);

  // Filter options based on typed search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const q = searchTerm.toLowerCase().trim();
    return options.filter((opt) => {
      const matchLabel = opt.label.toLowerCase().includes(q);
      const matchMr = opt.labelMr ? opt.labelMr.toLowerCase().includes(q) : false;
      const matchSub = opt.subLabel ? opt.subLabel.toLowerCase().includes(q) : false;
      const matchVal = opt.value.toLowerCase().includes(q);
      return matchLabel || matchMr || matchSub || matchVal;
    });
  }, [options, searchTerm]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleOpen = () => {
    if (disabled) return;
    setIsOpen(true);
    setSearchTerm("");
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* ── Main Input / Display Button ── */}
      <div
        onClick={handleOpen}
        className={`flex w-full min-h-[40px] cursor-pointer items-center justify-between rounded-lg border-2 bg-white px-3 py-2 font-sans text-xs transition ${
          isOpen
            ? "border-[#123C32] ring-1 ring-[#123C32]"
            : "border-[#123C32]/35 hover:border-[#123C32]"
        } ${disabled ? "cursor-not-allowed bg-[#252923]/10 opacity-60" : ""}`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-1.5 truncate">
          {selectedOption?.icon && (
            <span className="shrink-0">{selectedOption.icon}</span>
          )}
          <span className="truncate font-bold text-[#123C32]">
            {displayLabel || <span className="font-normal text-[#252923]/50">{placeholder}</span>}
          </span>
        </div>

        <div className="flex items-center gap-1 pl-1 text-[#123C32]/60 shrink-0">
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {/* ── Searchable Dropdown Menu ── */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-full sm:min-w-[230px] max-w-[340px] max-h-64 overflow-hidden rounded-lg border-2 border-[#123C32] bg-white shadow-[4px_4px_0px_#123C32] animate-in fade-in zoom-in-95 duration-100">
          
          {/* Search Box Header */}
          <div className="flex items-center gap-1.5 border-b border-[#123C32]/20 bg-[#F4F0E5]/70 p-2">
            <Search size={13} className="shrink-0 text-[#123C32]/60" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent font-sans text-xs font-semibold text-[#123C32] placeholder:text-[#252923]/40 outline-none"
              onClick={(e) => e.stopPropagation()}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchTerm("");
                  inputRef.current?.focus();
                }}
                className="rounded p-0.5 text-[#252923]/50 hover:bg-[#252923]/10"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* List Options */}
          <div className="max-h-48 overflow-y-auto p-1 font-sans text-xs">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center font-mono text-[11px] text-[#252923]/60">
                {isMarathi ? "कोणतेही पर्याय जुळले नाहीत" : "No matches found"}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                const optText = isMarathi && opt.labelMr ? opt.labelMr : opt.label;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(opt.value);
                    }}
                    className={`flex w-full items-center justify-between rounded px-2.5 py-1.5 text-left transition ${
                      isSelected
                        ? "bg-[#123C32] font-bold text-[#F4F0E5]"
                        : "text-[#252923] hover:bg-[#123C32]/10"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                      <span className="font-medium">{optText}</span>
                    </div>
                    {isSelected && (
                      <Check size={13} className="shrink-0 text-[#E6A52E] ml-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Quick Counter Footer */}
          <div className="border-t border-[#123C32]/15 bg-[#F4F0E5]/50 px-2.5 py-1 font-mono text-[9px] text-[#252923]/60 flex justify-between">
            <span>
              {isMarathi
                ? `${filteredOptions.length} पर्याय`
                : `${filteredOptions.length} options`}
            </span>
            <span className="italic">{isMarathi ? "शोधण्यासाठी अक्षरे टाईप करा" : "Type to filter"}</span>
          </div>

        </div>
      )}
    </div>
  );
}

