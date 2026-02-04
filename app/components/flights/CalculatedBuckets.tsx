/**
 * CalculatedBuckets - Displays calculated time buckets as read-only chips
 * Shows pilots what TCCA buckets will be filled based on their inputs
 */

import type { TimeBuckets } from "@/lib/flights/types";

interface CalculatedBucketsProps {
  buckets: TimeBuckets;
  warnings?: string[];
}

/**
 * Formats a bucket name for display
 */
function formatBucketName(key: string): string {
  const names: Record<string, string> = {
    seDayDual: 'SE Day Dual',
    seDayPic: 'SE Day PIC',
    seDayCopilot: 'SE Day Copilot',
    seNightDual: 'SE Night Dual',
    seNightPic: 'SE Night PIC',
    seNightCopilot: 'SE Night Copilot',
    meDayDual: 'ME Day Dual',
    meDayPic: 'ME Day PIC',
    meDayCopilot: 'ME Day Copilot',
    meNightDual: 'ME Night Dual',
    meNightPic: 'ME Night PIC',
    meNightCopilot: 'ME Night Copilot',
    xcDayDual: 'XC Day Dual',
    xcDayPic: 'XC Day PIC',
    xcDayCopilot: 'XC Day Copilot',
    xcNightDual: 'XC Night Dual',
    xcNightPic: 'XC Night PIC',
    xcNightCopilot: 'XC Night Copilot',
    dayTakeoffsLandings: 'Day T/O & Ldg',
    nightTakeoffsLandings: 'Night T/O & Ldg',
    actualImc: 'Actual IMC',
    hood: 'Hood',
    simulator: 'Simulator',
    ifrApproaches: 'IFR Approaches',
    holding: 'Holding',
    asFlightInstructor: 'As Instructor',
    dualReceived: 'Dual Received',
  };
  return names[key] || key;
}

/**
 * Gets chip color based on bucket type
 */
function getChipColor(key: string): string {
  if (key.startsWith('se')) return 'bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30';
  if (key.startsWith('me')) return 'bg-green-50 dark:bg-green-500/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-500/30';
  if (key.startsWith('xc')) return 'bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30';
  if (key.includes('Takeoffs') || key.includes('Landings')) return 'bg-orange-50 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-500/30';
  if (key.includes('Imc') || key.includes('hood') || key.includes('simulator')) return 'bg-cyan-50 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/30';
  if (key.includes('Instructor') || key.includes('Dual')) return 'bg-pink-50 dark:bg-pink-500/20 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-500/30';
  return 'bg-gray-50 dark:bg-white/10 text-gray-700 dark:text-white/70 border-gray-200 dark:border-white/20';
}

export function CalculatedBuckets({ buckets, warnings = [] }: CalculatedBucketsProps) {
  // Filter to only show non-null, non-zero values
  const activeEntries = Object.entries(buckets).filter(
    ([, value]) => value !== null && value !== 0
  );

  if (activeEntries.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h4 className="text-gray-600 dark:text-gray-400 text-sm font-medium">Calculated Time Buckets</h4>
        <span className="text-gray-400 dark:text-gray-500 text-xs">(auto-calculated)</span>
      </div>
      
      {/* Bucket Chips */}
      <div className="flex flex-wrap gap-2">
        {activeEntries.map(([key, value]) => (
          <div
            key={key}
            className={`
              px-3 py-1.5 rounded-lg border text-sm
              ${getChipColor(key)}
            `}
          >
            <span className="font-medium">{formatBucketName(key)}:</span>{' '}
            <span>{typeof value === 'number' && key.includes('Takeoffs') ? value : value?.toFixed(1)}</span>
          </div>
        ))}
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="mt-2 space-y-1">
          {warnings.map((warning, i) => (
            <div key={i} className="flex items-start gap-2 text-yellow-600 dark:text-yellow-400 text-xs">
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
