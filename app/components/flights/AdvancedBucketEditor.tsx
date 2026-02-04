"use client";

import { useCallback, useMemo } from "react";
import type { TimeBuckets } from "@/lib/flights/types";

/**
 * AdvancedBucketEditor - Manual override for all 24 time buckets
 * For power users who need to handle edge cases not covered by auto-calculation
 */

interface AdvancedBucketEditorProps {
  buckets: TimeBuckets;
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
      <label className="text-white/50 text-xs w-24 truncate" title={label}>
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
          w-20 bg-white/5 border rounded px-2 py-1 text-white text-sm
          focus:outline-none focus:border-purple-500
          ${isOverridden ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-white/10'}
        `}
      />
    </div>
  );
}

export function AdvancedBucketEditor({ buckets, overrides, onChange, flightTime }: AdvancedBucketEditorProps) {
  const handleFieldChange = useCallback((key: keyof TimeBuckets, value: number | null) => {
    const newOverrides = { ...overrides };
    if (value === null || value === buckets[key]) {
      delete newOverrides[key];
    } else {
      newOverrides[key] = value;
    }
    onChange(newOverrides);
  }, [overrides, onChange, buckets]);

  // Calculate total from overrides + calculated
  const totalTime = useMemo(() => {
    const timeFields: (keyof TimeBuckets)[] = [
      'seDayDual', 'seDayPic', 'seDayCopilot', 'seNightDual', 'seNightPic', 'seNightCopilot',
      'meDayDual', 'meDayPic', 'meDayCopilot', 'meNightDual', 'meNightPic', 'meNightCopilot',
      'simulator',
    ];
    
    let total = 0;
    for (const key of timeFields) {
      const val = overrides[key] !== undefined ? overrides[key] : buckets[key];
      if (typeof val === 'number') total += val;
    }
    return Math.round(total * 10) / 10;
  }, [buckets, overrides]);

  const hasOverrides = Object.keys(overrides).length > 0;
  const timeMismatch = Math.abs(totalTime - flightTime) > 0.01;

  return (
    <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
      <div className="flex items-center justify-between">
        <h4 className="text-white/70 text-sm font-medium">Manual Time Bucket Overrides</h4>
        {hasOverrides && (
          <button
            type="button"
            onClick={() => onChange({})}
            className="text-xs text-white/40 hover:text-white/60 transition-colors"
          >
            Reset All
          </button>
        )}
      </div>

      {/* Warning about overrides */}
      {hasOverrides && (
        <div className="text-xs text-yellow-400/80 bg-yellow-500/10 px-2 py-1 rounded">
          ⚠️ Manual overrides active - highlighted fields differ from auto-calculation
        </div>
      )}

      {/* Time mismatch warning */}
      {timeMismatch && (
        <div className="text-xs text-red-400/80 bg-red-500/10 px-2 py-1 rounded">
          ⚠️ Sum ({totalTime}h) ≠ Flight Time ({flightTime}h) - adjust buckets or flight time
        </div>
      )}

      {/* Bucket Groups */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Single Engine */}
        <div className="space-y-2">
          <h5 className="text-white/50 text-xs font-medium uppercase tracking-wider">Single Engine</h5>
          <BucketField label="Day Dual" fieldKey="seDayDual" value={buckets.seDayDual} override={overrides.seDayDual} onChange={handleFieldChange} />
          <BucketField label="Day PIC" fieldKey="seDayPic" value={buckets.seDayPic} override={overrides.seDayPic} onChange={handleFieldChange} />
          <BucketField label="Day Copilot" fieldKey="seDayCopilot" value={buckets.seDayCopilot} override={overrides.seDayCopilot} onChange={handleFieldChange} />
          <BucketField label="Night Dual" fieldKey="seNightDual" value={buckets.seNightDual} override={overrides.seNightDual} onChange={handleFieldChange} />
          <BucketField label="Night PIC" fieldKey="seNightPic" value={buckets.seNightPic} override={overrides.seNightPic} onChange={handleFieldChange} />
          <BucketField label="Night Copilot" fieldKey="seNightCopilot" value={buckets.seNightCopilot} override={overrides.seNightCopilot} onChange={handleFieldChange} />
        </div>

        {/* Multi Engine */}
        <div className="space-y-2">
          <h5 className="text-white/50 text-xs font-medium uppercase tracking-wider">Multi Engine</h5>
          <BucketField label="Day Dual" fieldKey="meDayDual" value={buckets.meDayDual} override={overrides.meDayDual} onChange={handleFieldChange} />
          <BucketField label="Day PIC" fieldKey="meDayPic" value={buckets.meDayPic} override={overrides.meDayPic} onChange={handleFieldChange} />
          <BucketField label="Day Copilot" fieldKey="meDayCopilot" value={buckets.meDayCopilot} override={overrides.meDayCopilot} onChange={handleFieldChange} />
          <BucketField label="Night Dual" fieldKey="meNightDual" value={buckets.meNightDual} override={overrides.meNightDual} onChange={handleFieldChange} />
          <BucketField label="Night PIC" fieldKey="meNightPic" value={buckets.meNightPic} override={overrides.meNightPic} onChange={handleFieldChange} />
          <BucketField label="Night Copilot" fieldKey="meNightCopilot" value={buckets.meNightCopilot} override={overrides.meNightCopilot} onChange={handleFieldChange} />
        </div>

        {/* Cross Country & Other */}
        <div className="space-y-2">
          <h5 className="text-white/50 text-xs font-medium uppercase tracking-wider">Cross-Country</h5>
          <BucketField label="Day Dual" fieldKey="xcDayDual" value={buckets.xcDayDual} override={overrides.xcDayDual} onChange={handleFieldChange} />
          <BucketField label="Day PIC" fieldKey="xcDayPic" value={buckets.xcDayPic} override={overrides.xcDayPic} onChange={handleFieldChange} />
          <BucketField label="Night Dual" fieldKey="xcNightDual" value={buckets.xcNightDual} override={overrides.xcNightDual} onChange={handleFieldChange} />
          <BucketField label="Night PIC" fieldKey="xcNightPic" value={buckets.xcNightPic} override={overrides.xcNightPic} onChange={handleFieldChange} />
          
          <h5 className="text-white/50 text-xs font-medium uppercase tracking-wider pt-2">Instrument</h5>
          <BucketField label="Actual IMC" fieldKey="actualImc" value={buckets.actualImc} override={overrides.actualImc} onChange={handleFieldChange} />
          <BucketField label="Hood" fieldKey="hood" value={buckets.hood} override={overrides.hood} onChange={handleFieldChange} />
          <BucketField label="Simulator" fieldKey="simulator" value={buckets.simulator} override={overrides.simulator} onChange={handleFieldChange} />
        </div>
      </div>

      {/* Takeoffs/Landings and Instructor Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/10">
        <div className="space-y-2">
          <h5 className="text-white/50 text-xs font-medium uppercase tracking-wider">Takeoffs/Landings</h5>
          <BucketField label="Day T/O & Ldg" fieldKey="dayTakeoffsLandings" value={buckets.dayTakeoffsLandings} override={overrides.dayTakeoffsLandings} onChange={handleFieldChange} isInteger />
          <BucketField label="Night T/O & Ldg" fieldKey="nightTakeoffsLandings" value={buckets.nightTakeoffsLandings} override={overrides.nightTakeoffsLandings} onChange={handleFieldChange} isInteger />
          <BucketField label="IFR Approaches" fieldKey="ifrApproaches" value={buckets.ifrApproaches} override={overrides.ifrApproaches} onChange={handleFieldChange} isInteger />
          <BucketField label="Holding" fieldKey="holding" value={buckets.holding} override={overrides.holding} onChange={handleFieldChange} isInteger />
        </div>

        <div className="space-y-2">
          <h5 className="text-white/50 text-xs font-medium uppercase tracking-wider">Instructor/Dual</h5>
          <BucketField label="As Instructor" fieldKey="asFlightInstructor" value={buckets.asFlightInstructor} override={overrides.asFlightInstructor} onChange={handleFieldChange} />
          <BucketField label="Dual Received" fieldKey="dualReceived" value={buckets.dualReceived} override={overrides.dualReceived} onChange={handleFieldChange} />
        </div>
      </div>
    </div>
  );
}
