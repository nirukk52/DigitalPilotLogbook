"use client";

import { useCallback, useMemo } from "react";
import type { TimeBuckets } from "@/lib/flights/types";

/**
 * AdvancedBucketEditor - Manual override for all 24 time buckets
 * For power users who need to handle edge cases not covered by auto-calculation
 */

interface AdvancedBucketEditorProps {
  buckets: TimeBuckets | null;
  overrides: Partial<TimeBuckets>;
  onChange: (overrides: Partial<TimeBuckets>) => void;
  flightTime: number;
}

interface BucketFieldProps {
  label: string;
  fieldKey: keyof TimeBuckets;
  value: number | null;
  override: number | null | undefined;
  onChange: (key: keyof TimeBuckets, value: number | null) => void;
  isInteger?: boolean;
}

function BucketField({ label, fieldKey, value, override, onChange, isInteger = false }: BucketFieldProps) {
  const displayValue = override !== undefined ? override : value;
  const isOverridden = override !== undefined;

  return (
    <div className="flex items-center gap-2">
      <label className="text-gray-500 dark:text-gray-400 text-xs w-24 truncate" title={label}>
        {label}
      </label>
      <input
        type="number"
        value={displayValue ?? ''}
        onChange={(e) => {
          const val = e.target.value === '' ? null : 
            isInteger ? parseInt(e.target.value, 10) : parseFloat(e.target.value);
          onChange(fieldKey, val);
        }}
        step={isInteger ? 1 : 0.1}
        min={0}
        className={`
          w-20 border rounded px-2 py-1 text-gray-900 dark:text-white text-sm
          focus:outline-none focus:ring-2 focus:ring-[#137fec] focus:border-transparent
          ${isOverridden 
            ? 'border-yellow-400 dark:border-yellow-500/50 bg-yellow-50 dark:bg-yellow-500/10' 
            : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'}
        `}
      />
    </div>
  );
}

/**
 * Default empty buckets for when no calculated values exist yet
 * Allows Advanced Mode to work even before flight time is entered
 */
const emptyBuckets: TimeBuckets = {
  seDayDual: null, seDayPic: null, seDayCopilot: null,
  seNightDual: null, seNightPic: null, seNightCopilot: null,
  meDayDual: null, meDayPic: null, meDayCopilot: null,
  meNightDual: null, meNightPic: null, meNightCopilot: null,
  xcDayDual: null, xcDayPic: null, xcDayCopilot: null,
  xcNightDual: null, xcNightPic: null, xcNightCopilot: null,
  actualImc: null, hood: null, simulator: null,
  dayTakeoffsLandings: null, nightTakeoffsLandings: null,
  ifrApproaches: null, holding: null,
  asFlightInstructor: null, dualReceived: null,
};

export function AdvancedBucketEditor({ buckets, overrides, onChange, flightTime }: AdvancedBucketEditorProps) {
  // Use empty buckets if none provided (allows editing before calculation)
  const effectiveBuckets = buckets ?? emptyBuckets;

  const handleFieldChange = useCallback((key: keyof TimeBuckets, value: number | null) => {
    const newOverrides = { ...overrides };
    if (value === null || value === effectiveBuckets[key]) {
      delete newOverrides[key];
    } else {
      newOverrides[key] = value;
    }
    onChange(newOverrides);
  }, [overrides, onChange, effectiveBuckets]);

  // Calculate total from overrides + calculated
  const totalTime = useMemo(() => {
    const timeFields: (keyof TimeBuckets)[] = [
      'seDayDual', 'seDayPic', 'seDayCopilot', 'seNightDual', 'seNightPic', 'seNightCopilot',
      'meDayDual', 'meDayPic', 'meDayCopilot', 'meNightDual', 'meNightPic', 'meNightCopilot',
      'simulator',
    ];
    
    let total = 0;
    for (const key of timeFields) {
      const val = overrides[key] !== undefined ? overrides[key] : effectiveBuckets[key];
      if (typeof val === 'number') total += val;
    }
    return Math.round(total * 10) / 10;
  }, [effectiveBuckets, overrides]);

  const hasOverrides = Object.keys(overrides).length > 0;
  const timeMismatch = Math.abs(totalTime - flightTime) > 0.01;

  return (
    <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
      <div className="flex items-center justify-between">
        <h4 className="text-gray-700 dark:text-gray-300 text-sm font-medium">Manual Time Bucket Overrides</h4>
        {hasOverrides && (
          <button
            type="button"
            onClick={() => onChange({})}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            Reset All
          </button>
        )}
      </div>

      {/* Warning about overrides */}
      {hasOverrides && (
        <div className="text-xs text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-500/10 px-2 py-1 rounded border border-yellow-200 dark:border-yellow-500/30">
          Manual overrides active - highlighted fields differ from auto-calculation
        </div>
      )}

      {/* Time mismatch warning */}
      {timeMismatch && (
        <div className="text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded border border-red-200 dark:border-red-500/30">
          Sum ({totalTime}h) ≠ Flight Time ({flightTime}h) - adjust buckets or flight time
        </div>
      )}

      {/* Bucket Groups */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Single Engine */}
        <div className="space-y-2">
          <h5 className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">Single Engine</h5>
          <BucketField label="Day Dual" fieldKey="seDayDual" value={effectiveBuckets.seDayDual} override={overrides.seDayDual} onChange={handleFieldChange} />
          <BucketField label="Day PIC" fieldKey="seDayPic" value={effectiveBuckets.seDayPic} override={overrides.seDayPic} onChange={handleFieldChange} />
          <BucketField label="Day Copilot" fieldKey="seDayCopilot" value={effectiveBuckets.seDayCopilot} override={overrides.seDayCopilot} onChange={handleFieldChange} />
          <BucketField label="Night Dual" fieldKey="seNightDual" value={effectiveBuckets.seNightDual} override={overrides.seNightDual} onChange={handleFieldChange} />
          <BucketField label="Night PIC" fieldKey="seNightPic" value={effectiveBuckets.seNightPic} override={overrides.seNightPic} onChange={handleFieldChange} />
          <BucketField label="Night Copilot" fieldKey="seNightCopilot" value={effectiveBuckets.seNightCopilot} override={overrides.seNightCopilot} onChange={handleFieldChange} />
        </div>

        {/* Multi Engine */}
        <div className="space-y-2">
          <h5 className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">Multi Engine</h5>
          <BucketField label="Day Dual" fieldKey="meDayDual" value={effectiveBuckets.meDayDual} override={overrides.meDayDual} onChange={handleFieldChange} />
          <BucketField label="Day PIC" fieldKey="meDayPic" value={effectiveBuckets.meDayPic} override={overrides.meDayPic} onChange={handleFieldChange} />
          <BucketField label="Day Copilot" fieldKey="meDayCopilot" value={effectiveBuckets.meDayCopilot} override={overrides.meDayCopilot} onChange={handleFieldChange} />
          <BucketField label="Night Dual" fieldKey="meNightDual" value={effectiveBuckets.meNightDual} override={overrides.meNightDual} onChange={handleFieldChange} />
          <BucketField label="Night PIC" fieldKey="meNightPic" value={effectiveBuckets.meNightPic} override={overrides.meNightPic} onChange={handleFieldChange} />
          <BucketField label="Night Copilot" fieldKey="meNightCopilot" value={effectiveBuckets.meNightCopilot} override={overrides.meNightCopilot} onChange={handleFieldChange} />
        </div>

        {/* Cross Country & Other */}
        <div className="space-y-2">
          <h5 className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">Cross-Country</h5>
          <BucketField label="Day Dual" fieldKey="xcDayDual" value={effectiveBuckets.xcDayDual} override={overrides.xcDayDual} onChange={handleFieldChange} />
          <BucketField label="Day PIC" fieldKey="xcDayPic" value={effectiveBuckets.xcDayPic} override={overrides.xcDayPic} onChange={handleFieldChange} />
          <BucketField label="Night Dual" fieldKey="xcNightDual" value={effectiveBuckets.xcNightDual} override={overrides.xcNightDual} onChange={handleFieldChange} />
          <BucketField label="Night PIC" fieldKey="xcNightPic" value={effectiveBuckets.xcNightPic} override={overrides.xcNightPic} onChange={handleFieldChange} />
          
          <h5 className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider pt-2">Instrument</h5>
          <BucketField label="Actual IMC" fieldKey="actualImc" value={effectiveBuckets.actualImc} override={overrides.actualImc} onChange={handleFieldChange} />
          <BucketField label="Hood" fieldKey="hood" value={effectiveBuckets.hood} override={overrides.hood} onChange={handleFieldChange} />
          <BucketField label="Simulator" fieldKey="simulator" value={effectiveBuckets.simulator} override={overrides.simulator} onChange={handleFieldChange} />
        </div>
      </div>

      {/* Takeoffs/Landings and Instructor Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200 dark:border-gray-600">
        <div className="space-y-2">
          <h5 className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">Takeoffs/Landings</h5>
          <BucketField label="Day T/O & Ldg" fieldKey="dayTakeoffsLandings" value={effectiveBuckets.dayTakeoffsLandings} override={overrides.dayTakeoffsLandings} onChange={handleFieldChange} isInteger />
          <BucketField label="Night T/O & Ldg" fieldKey="nightTakeoffsLandings" value={effectiveBuckets.nightTakeoffsLandings} override={overrides.nightTakeoffsLandings} onChange={handleFieldChange} isInteger />
          <BucketField label="IFR Approaches" fieldKey="ifrApproaches" value={effectiveBuckets.ifrApproaches} override={overrides.ifrApproaches} onChange={handleFieldChange} isInteger />
          <BucketField label="Holding" fieldKey="holding" value={effectiveBuckets.holding} override={overrides.holding} onChange={handleFieldChange} isInteger />
        </div>

        <div className="space-y-2">
          <h5 className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">Instructor/Dual</h5>
          <BucketField label="As Instructor" fieldKey="asFlightInstructor" value={effectiveBuckets.asFlightInstructor} override={overrides.asFlightInstructor} onChange={handleFieldChange} />
          <BucketField label="Dual Received" fieldKey="dualReceived" value={effectiveBuckets.dualReceived} override={overrides.dualReceived} onChange={handleFieldChange} />
        </div>
      </div>
    </div>
  );
}
