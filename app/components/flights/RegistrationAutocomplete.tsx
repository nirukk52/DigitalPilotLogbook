"use client";

import { useState, useRef, useEffect, useMemo } from "react";

/**
 * RegistrationAutocomplete - Combobox for registration filtered by aircraft
 * Shows registrations used with the selected aircraft type
 */

interface RegistrationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  registrationsByAircraft: Record<string, string[]>;
  selectedAircraft: string;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

export function RegistrationAutocomplete({
  value,
  onChange,
  registrationsByAircraft,
  selectedAircraft,
  placeholder = "C-GHFH",
  label = "Registration",
  required = false,
}: RegistrationAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get registrations for selected aircraft, or all registrations if no aircraft selected
  const options = useMemo(() => {
    if (selectedAircraft && registrationsByAircraft[selectedAircraft]) {
      return registrationsByAircraft[selectedAircraft];
    }
    // Return all unique registrations
    const allRegs = new Set<string>();
    Object.values(registrationsByAircraft).forEach(regs => {
      regs.forEach(reg => allRegs.add(reg));
    });
    return Array.from(allRegs);
  }, [selectedAircraft, registrationsByAircraft]);

  // Filter options based on input
  const filteredOptions = useMemo(() => {
    if (value.trim() === '') {
      return options.slice(0, 10);
    }
    return options
      .filter(opt => opt.toLowerCase().includes(value.toLowerCase()))
      .slice(0, 10);
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
        onChange={(e) => onChange(e.target.value.toUpperCase())}
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
