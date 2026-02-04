"use client";

import { useState, useCallback, useEffect } from "react";
import type { FlightRole, FlightTag, TimeBuckets, FlightDefaults } from "@/lib/flights/types";
import { CalculatedBuckets } from "./CalculatedBuckets";
import { AircraftAutocomplete } from "./AircraftAutocomplete";
import { RegistrationAutocomplete } from "./RegistrationAutocomplete";
import { PilotProfileSetup } from "./PilotProfileSetup";
import { AdvancedBucketEditor } from "./AdvancedBucketEditor";

/**
 * QuickEntryForm - 7-field form for rapid flight entry
 * Allows pilots to add flights in under 30 seconds
 * Auto-calculates all TCCA time buckets from minimal inputs
 * Includes smart defaults from flight history and profile setup
 */

interface QuickEntryFormProps {
  onSave: () => void;
  onCancel: () => void;
  flightId?: number;  // For edit mode
  initialData?: {
    flightDate?: string;
    aircraft?: string;
    registration?: string;
    role?: FlightRole;
    route?: string;
    flightTime?: number;
    tags?: FlightTag[];
    remarks?: string;
  };
}

const ROLES: FlightRole[] = ['Student', 'PIC', 'Instructor', 'Simulator'];
const TAGS: FlightTag[] = ['XC', 'Night', 'IFR', 'Circuits', 'Checkride'];

export function QuickEntryForm({ onSave, onCancel, flightId, initialData }: QuickEntryFormProps) {
  // Form state for the 7 input fields
  const [flightDate, setFlightDate] = useState<string>(
    initialData?.flightDate ?? new Date().toISOString().split('T')[0]
  );
  const [aircraft, setAircraft] = useState(initialData?.aircraft ?? '');
  const [registration, setRegistration] = useState(initialData?.registration ?? '');
  const [role, setRole] = useState<FlightRole>(initialData?.role ?? 'PIC');
  const [route, setRoute] = useState(initialData?.route ?? '');
  const [flightTime, setFlightTime] = useState<string>(
    initialData?.flightTime ? String(initialData.flightTime) : ''
  );
  const [selectedTags, setSelectedTags] = useState<FlightTag[]>(initialData?.tags ?? []);
  const [remarks, setRemarks] = useState(initialData?.remarks ?? '');
  
  // Smart defaults state
  const [defaults, setDefaults] = useState<FlightDefaults | null>(null);
  const [isLoadingDefaults, setIsLoadingDefaults] = useState(true);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  
  // Advanced mode state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [manualOverrides, setManualOverrides] = useState<Partial<TimeBuckets>>({});
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculatedBuckets, setCalculatedBuckets] = useState<TimeBuckets | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Load smart defaults on mount
  useEffect(() => {
    if (flightId) {
      // Edit mode - don't load defaults
      setIsLoadingDefaults(false);
      return;
    }

    const loadDefaults = async () => {
      try {
        const response = await fetch('/api/flights/defaults');
        if (response.ok) {
          const data = await response.json();
          setDefaults(data);
          
          // Check if profile setup is needed (no flights and no profile)
          if (data.flightCount === 0 && !data.hasProfile) {
            setNeedsProfileSetup(true);
          } else {
            // Pre-fill from defaults if no initial data
            if (!initialData) {
              if (data.aircraft) setAircraft(data.aircraft);
              if (data.registration) setRegistration(data.registration);
              if (data.routePrefix) setRoute(data.routePrefix);
              if (data.role) setRole(data.role);
            }
          }
        }
      } catch {
        // Silent fail - defaults are optional
      } finally {
        setIsLoadingDefaults(false);
      }
    };

    loadDefaults();
  }, [flightId, initialData]);

  // Calculate buckets when inputs change
  useEffect(() => {
    if (!aircraft || !flightTime || parseFloat(flightTime) <= 0) {
      setCalculatedBuckets(null);
      return;
    }

    const calculatePreview = async () => {
      try {
        const response = await fetch('/api/flights/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            aircraftMakeModel: aircraft,
            role,
            flightTime: parseFloat(flightTime),
            tags: selectedTags,
            overrides: Object.keys(manualOverrides).length > 0 ? manualOverrides : undefined,
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          setCalculatedBuckets(data.buckets);
          setWarnings(data.warnings || []);
        }
      } catch {
        // Silent fail for preview
      }
    };

    const debounce = setTimeout(calculatePreview, 300);
    return () => clearTimeout(debounce);
  }, [aircraft, role, flightTime, selectedTags, manualOverrides]);

  const toggleTag = useCallback((tag: FlightTag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  }, []);

  const handleProfileComplete = useCallback(() => {
    setNeedsProfileSetup(false);
    // Reload defaults after profile setup
    fetch('/api/flights/defaults')
      .then(res => res.json())
      .then(data => {
        setDefaults(data);
        if (data.homeBase) setRoute(`${data.homeBase}-`);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!aircraft.trim()) {
        throw new Error('Aircraft is required');
      }
      if (!registration.trim()) {
        throw new Error('Registration is required');
      }
      if (!flightTime || parseFloat(flightTime) <= 0) {
        throw new Error('Flight time must be greater than 0');
      }

      const payload = {
        flightDate,
        aircraftMakeModel: aircraft.trim(),
        registration: registration.trim(),
        role,
        flightTime: parseFloat(flightTime),
        route: route.trim() || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        remarks: remarks.trim() || undefined,
        overrides: Object.keys(manualOverrides).length > 0 ? manualOverrides : undefined,
      };

      const url = flightId ? `/api/flights/${flightId}` : '/api/flights';
      const method = flightId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save flight');
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save flight');
    } finally {
      setIsSubmitting(false);
    }
  }, [flightDate, aircraft, registration, role, route, flightTime, selectedTags, remarks, manualOverrides, flightId, onSave]);

  // Show loading state
  if (isLoadingDefaults) {
    return (
      <div className="flex items-center justify-center py-12">
        <svg className="w-8 h-8 animate-spin text-purple-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  // Show profile setup if needed
  if (needsProfileSetup) {
    return (
      <PilotProfileSetup
        onComplete={handleProfileComplete}
        onSkip={() => setNeedsProfileSetup(false)}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Row 1: Date, Aircraft, Registration, Role */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Date */}
        <div>
          <label className="block text-white/60 text-sm mb-1">Date</label>
          <input
            type="date"
            value={flightDate}
            onChange={(e) => setFlightDate(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
            required
          />
        </div>

        {/* Aircraft with Autocomplete */}
        <AircraftAutocomplete
          value={aircraft}
          onChange={setAircraft}
          options={defaults?.aircraftOptions ?? []}
          required
        />

        {/* Registration with Autocomplete */}
        <RegistrationAutocomplete
          value={registration}
          onChange={setRegistration}
          registrationsByAircraft={defaults?.registrationsByAircraft ?? {}}
          selectedAircraft={aircraft}
          required
        />

        {/* Role */}
        <div>
          <label className="block text-white/60 text-sm mb-1">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as FlightRole)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
          >
            {ROLES.map(r => (
              <option key={r} value={r} className="bg-[#1a1a2e]">{r}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: Route, Flight Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Route */}
        <div>
          <label className="block text-white/60 text-sm mb-1">Route</label>
          <input
            type="text"
            value={route}
            onChange={(e) => setRoute(e.target.value.toUpperCase())}
            placeholder="CZBB-CYCW-CZBB"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Flight Time */}
        <div>
          <label className="block text-white/60 text-sm mb-1">Flight Time (hours)</label>
          <input
            type="number"
            value={flightTime}
            onChange={(e) => setFlightTime(e.target.value)}
            placeholder="1.5"
            step="0.1"
            min="0.1"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-purple-500"
            required
          />
        </div>
      </div>

      {/* Row 3: Tags */}
      <div>
        <label className="block text-white/60 text-sm mb-2">Tags</label>
        <div className="flex flex-wrap gap-2">
          {TAGS.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`
                px-3 py-1 rounded-full text-sm transition-colors
                ${selectedTags.includes(tag)
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'}
              `}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Row 4: Remarks */}
      <div>
        <label className="block text-white/60 text-sm mb-1">Remarks (optional)</label>
        <input
          type="text"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Training notes..."
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Calculated Buckets Preview */}
      {calculatedBuckets && !showAdvanced && (
        <CalculatedBuckets buckets={calculatedBuckets} warnings={warnings} />
      )}

      {/* Advanced Mode Toggle */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-white/40 hover:text-white/60 transition-colors flex items-center gap-1"
        >
          <svg 
            className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          {showAdvanced ? 'Hide Advanced' : 'Advanced Mode'}
        </button>
        {showAdvanced && (
          <span className="text-xs text-white/30">Manual bucket overrides</span>
        )}
      </div>

      {/* Advanced Bucket Editor */}
      {showAdvanced && calculatedBuckets && (
        <AdvancedBucketEditor
          buckets={calculatedBuckets}
          overrides={manualOverrides}
          onChange={setManualOverrides}
          flightTime={parseFloat(flightTime) || 0}
        />
      )}

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-white/60 hover:text-white transition-colors"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </>
          ) : (
            flightId ? 'Update Flight' : 'Save Flight'
          )}
        </button>
      </div>
    </form>
  );
}
