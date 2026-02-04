"use client";

import { useState, useRef, useEffect } from "react";

/**
 * AircraftAutocomplete - Combobox for aircraft selection with suggestions
 * Provides autocomplete from flight history for faster entry
 */

interface AircraftAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  label?: string;
  required?: boolean;
}

export function AircraftAutocomplete({
  value,
  onChange,
  options,
  placeholder = "C172",
  label = "Aircraft",
  required = false,
}: AircraftAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter options based on input
  useEffect(() => {
    if (value.trim() === '') {
      setFilteredOptions(options.slice(0, 10)); // Show first 10 when empty
    } else {
      const filtered = options.filter(opt =>
        opt.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredOptions(filtered.slice(0, 10));
    }
  }, [value, options]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div className="relative">
      <label className="block text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">{label}</label>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#137fec] focus:border-transparent"
        required={required}
        autoComplete="off"
      />
      
      {/* Dropdown */}
      {isOpen && filteredOptions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto"
        >
          {filteredOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleSelect(option)}
              className="w-full px-3 py-2 text-left text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
