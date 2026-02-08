/**
 * ExcelLogbookDashboard - Displays imported flight data matching Excel logbook format
 * 
 * This component is the primary verification view for imported flight data.
 * It uses ONLY functions from lib/flights/aggregations.ts (SSOT).
 * 
 * Display matches:
 * - Total Hours = SE + ME (no simulator) - matches Excel Dashboard
 * - Aircraft Flights vs Simulator Flights clearly separated
 * - All time buckets match Excel columns exactly
 */

import type { ParsedFlight } from "@/lib/import/types";
import {
  aggregateFlightTotals,
  aggregateByAircraft,
  calculateGrandTotalFromSummaries,
  getEarliestFlightDate,
  getLatestFlightDate,
  round1,
  type FlightTotals,
  type AircraftSummary,
} from "@/lib/flights/aggregations";

interface ExcelLogbookDashboardProps {
  flights: ParsedFlight[];
}

// ============================================================================
// Formatting Utilities
// ============================================================================

function formatNum(val: number | null): string {
  if (val === null || val === 0) return "";
  return val.toFixed(1);
}

function formatInt(val: number | null): string {
  if (val === null || val === 0) return "";
  return String(Math.round(val));
}

// ============================================================================
// Stat Card Component - Shows key metrics at the top
// ============================================================================

interface StatCardProps {
  label: string;
  value: number | string;
  unit?: string;
  variant?: "primary" | "default" | "success" | "warning";
  sublabel?: string;
}

function StatCard({ label, value, unit = "h", variant = "default", sublabel }: StatCardProps) {
  const variantStyles = {
    primary: "bg-blue-600 text-white",
    default: "bg-slate-100 dark:bg-slate-700",
    success: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
    warning: "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300",
  };
  
  return (
    <div className={`rounded-xl p-4 ${variantStyles[variant]}`}>
      <div className="text-xs uppercase tracking-wide opacity-70 mb-1">{label}</div>
      <div className="text-2xl font-bold">
        {typeof value === 'number' ? round1(value) : value}
        {unit && <span className="text-sm font-normal ml-0.5">{unit}</span>}
      </div>
      {sublabel && (
        <div className="text-xs opacity-60 mt-1">{sublabel}</div>
      )}
    </div>
  );
}

// ============================================================================
// Aircraft Row Component
// ============================================================================

function AircraftRow({ s }: { s: AircraftSummary }) {
  const typeDisplay = s.isSimulator ? "SIM" : 
    (s.meDayDual > 0 || s.meNightDual > 0 || s.meDayPic > 0 || s.meNightPic > 0) ? "ME" : "SE";

  const rowBg = s.isSimulator 
    ? "bg-cyan-50/50 dark:bg-cyan-900/10" 
    : "hover:bg-slate-50 dark:hover:bg-slate-700/50";

  return (
    <tr className={rowBg}>
      <td className="px-2 py-1.5 font-medium text-slate-800 dark:text-white sticky left-0 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
        {s.aircraftType}
        {s.isSimulator && <span className="ml-1 text-xs text-cyan-600 dark:text-cyan-400">(SIM)</span>}
      </td>
      <td className="px-2 py-1.5 text-center text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700">{typeDisplay}</td>
      <td className="px-2 py-1.5 text-right font-semibold text-slate-800 dark:text-white border-r border-slate-200 dark:border-slate-700">
        {s.isSimulator ? <span className="text-cyan-600 dark:text-cyan-400">{formatNum(s.simulator)}</span> : formatNum(s.totalHours)}
      </td>
      <td className="px-2 py-1.5 text-center text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700">{s.numFlights}</td>
      <td className="px-2 py-1.5 text-center text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700">{s.daysSinceLastFlight}</td>
      {/* SE Day */}
      <td className="px-1 py-1.5 text-right text-slate-600 dark:text-slate-300">{formatNum(s.seDayDual)}</td>
      <td className="px-1 py-1.5 text-right text-slate-600 dark:text-slate-300">{formatNum(s.seDayPic)}</td>
      <td className="px-1 py-1.5 text-right text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700">{formatNum(s.seDayCopilot)}</td>
      {/* SE Night */}
      <td className="px-1 py-1.5 text-right text-slate-600 dark:text-slate-300">{formatNum(s.seNightDual)}</td>
      <td className="px-1 py-1.5 text-right text-slate-600 dark:text-slate-300">{formatNum(s.seNightPic)}</td>
      <td className="px-1 py-1.5 text-right text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700">{formatNum(s.seNightCopilot)}</td>
      {/* ME Day */}
      <td className="px-1 py-1.5 text-right text-slate-600 dark:text-slate-300">{formatNum(s.meDayDual)}</td>
      <td className="px-1 py-1.5 text-right text-slate-600 dark:text-slate-300">{formatNum(s.meDayPic)}</td>
      <td className="px-1 py-1.5 text-right text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700">{formatNum(s.meDayCopilot)}</td>
      {/* ME Night */}
      <td className="px-1 py-1.5 text-right text-slate-600 dark:text-slate-300">{formatNum(s.meNightDual)}</td>
      <td className="px-1 py-1.5 text-right text-slate-600 dark:text-slate-300">{formatNum(s.meNightPic)}</td>
      <td className="px-1 py-1.5 text-right text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700">{formatNum(s.meNightCopilot)}</td>
      {/* XC Day */}
      <td className="px-1 py-1.5 text-right text-slate-600 dark:text-slate-300">{formatNum(s.xcDayDual)}</td>
      <td className="px-1 py-1.5 text-right text-slate-600 dark:text-slate-300">{formatNum(s.xcDayPic)}</td>
      <td className="px-1 py-1.5 text-right text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700">{formatNum(s.xcDayCopilot)}</td>
      {/* XC Night */}
      <td className="px-1 py-1.5 text-right text-slate-600 dark:text-slate-300">{formatNum(s.xcNightDual)}</td>
      <td className="px-1 py-1.5 text-right text-slate-600 dark:text-slate-300">{formatNum(s.xcNightPic)}</td>
      <td className="px-1 py-1.5 text-right text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700">{formatNum(s.xcNightCopilot)}</td>
      {/* Takeoffs/Landings */}
      <td className="px-1 py-1.5 text-right text-slate-600 dark:text-slate-300">{formatInt(s.dayTakeoffsLandings)}</td>
      <td className="px-1 py-1.5 text-right text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700">{formatInt(s.nightTakeoffsLandings)}</td>
      {/* Instrument */}
      <td className="px-1 py-1.5 text-right text-slate-600 dark:text-slate-300">{formatNum(s.actualImc)}</td>
      <td className="px-1 py-1.5 text-right text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700">{formatNum(s.hood)}</td>
      {/* Simulator */}
      <td className="px-1 py-1.5 text-right text-cyan-600 dark:text-cyan-400 border-r border-slate-200 dark:border-slate-700 font-medium">{formatNum(s.simulator)}</td>
      {/* IFR */}
      <td className="px-1 py-1.5 text-right text-slate-600 dark:text-slate-300">{formatInt(s.ifrApproaches)}</td>
      <td className="px-1 py-1.5 text-right text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700">{formatInt(s.holding)}</td>
      {/* Instructor/Dual */}
      <td className="px-1 py-1.5 text-right text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700">{formatNum(s.asFlightInstructor)}</td>
      <td className="px-1 py-1.5 text-right text-slate-600 dark:text-slate-300">{formatNum(s.dualReceived)}</td>
    </tr>
  );
}

// ============================================================================
// Totals Row Component
// ============================================================================

function TotalsRow({ grandTotal, totals }: { grandTotal: AircraftSummary; totals: FlightTotals }) {
  return (
    <tr className="bg-slate-700 text-white font-bold">
      <td className="px-2 py-2 sticky left-0 bg-slate-700 z-10 border-r border-slate-600">TOTALS</td>
      <td className="px-2 py-2 border-r border-slate-600"></td>
      <td className="px-2 py-2 text-right border-r border-slate-600">{formatNum(totals.totalHours)}</td>
      <td className="px-2 py-2 text-center border-r border-slate-600">{totals.totalFlights}</td>
      <td className="px-2 py-2 border-r border-slate-600"></td>
      {/* SE Day */}
      <td className="px-1 py-2 text-right">{formatNum(grandTotal.seDayDual)}</td>
      <td className="px-1 py-2 text-right">{formatNum(grandTotal.seDayPic)}</td>
      <td className="px-1 py-2 text-right border-r border-slate-600">{formatNum(grandTotal.seDayCopilot)}</td>
      {/* SE Night */}
      <td className="px-1 py-2 text-right">{formatNum(grandTotal.seNightDual)}</td>
      <td className="px-1 py-2 text-right">{formatNum(grandTotal.seNightPic)}</td>
      <td className="px-1 py-2 text-right border-r border-slate-600">{formatNum(grandTotal.seNightCopilot)}</td>
      {/* ME Day */}
      <td className="px-1 py-2 text-right">{formatNum(grandTotal.meDayDual)}</td>
      <td className="px-1 py-2 text-right">{formatNum(grandTotal.meDayPic)}</td>
      <td className="px-1 py-2 text-right border-r border-slate-600">{formatNum(grandTotal.meDayCopilot)}</td>
      {/* ME Night */}
      <td className="px-1 py-2 text-right">{formatNum(grandTotal.meNightDual)}</td>
      <td className="px-1 py-2 text-right">{formatNum(grandTotal.meNightPic)}</td>
      <td className="px-1 py-2 text-right border-r border-slate-600">{formatNum(grandTotal.meNightCopilot)}</td>
      {/* XC Day */}
      <td className="px-1 py-2 text-right">{formatNum(grandTotal.xcDayDual)}</td>
      <td className="px-1 py-2 text-right">{formatNum(grandTotal.xcDayPic)}</td>
      <td className="px-1 py-2 text-right border-r border-slate-600">{formatNum(grandTotal.xcDayCopilot)}</td>
      {/* XC Night */}
      <td className="px-1 py-2 text-right">{formatNum(grandTotal.xcNightDual)}</td>
      <td className="px-1 py-2 text-right">{formatNum(grandTotal.xcNightPic)}</td>
      <td className="px-1 py-2 text-right border-r border-slate-600">{formatNum(grandTotal.xcNightCopilot)}</td>
      {/* Takeoffs/Landings */}
      <td className="px-1 py-2 text-right">{formatInt(grandTotal.dayTakeoffsLandings)}</td>
      <td className="px-1 py-2 text-right border-r border-slate-600">{formatInt(grandTotal.nightTakeoffsLandings)}</td>
      {/* Instrument */}
      <td className="px-1 py-2 text-right">{formatNum(grandTotal.actualImc)}</td>
      <td className="px-1 py-2 text-right border-r border-slate-600">{formatNum(grandTotal.hood)}</td>
      {/* Simulator */}
      <td className="px-1 py-2 text-right text-cyan-300 border-r border-slate-600">{formatNum(totals.totalSimulator)}</td>
      {/* IFR */}
      <td className="px-1 py-2 text-right">{formatInt(grandTotal.ifrApproaches)}</td>
      <td className="px-1 py-2 text-right border-r border-slate-600">{formatInt(grandTotal.holding)}</td>
      {/* Instructor/Dual */}
      <td className="px-1 py-2 text-right border-r border-slate-600">{formatNum(grandTotal.asFlightInstructor)}</td>
      <td className="px-1 py-2 text-right">{formatNum(grandTotal.dualReceived)}</td>
    </tr>
  );
}

// ============================================================================
// Main Dashboard Component
// ============================================================================

export function ExcelLogbookDashboard({ flights }: ExcelLogbookDashboardProps) {
  // Use SSOT aggregation functions
  const totals = aggregateFlightTotals(flights);
  const summaries = aggregateByAircraft(flights);
  const grandTotal = calculateGrandTotalFromSummaries(summaries);
  const earliestDate = getEarliestFlightDate(flights);
  const latestDate = getLatestFlightDate(flights);
  
  if (flights.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center">
        <p className="text-slate-500 dark:text-slate-400">No flight data to display</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Primary Stats Row - Key licence totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard 
          label="Total Flight Hours" 
          value={totals.totalHours} 
          variant="primary"
          sublabel="SE + ME (no sim)"
        />
        <StatCard 
          label="Aircraft Flights" 
          value={totals.aircraftFlights} 
          unit=""
          sublabel={`of ${totals.totalFlights} total`}
        />
        <StatCard label="PIC Time" value={totals.totalPic} />
        <StatCard label="Night Time" value={totals.totalNight} />
        <StatCard label="Cross-Country" value={totals.totalXC} />
        <StatCard label="Instrument (IMC+Hood)" value={totals.totalInstrument} />
      </div>
      
      {/* Secondary Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard 
          label="Simulator Time" 
          value={totals.totalSimulator} 
          variant="warning"
          sublabel={`${totals.simulatorFlights} sessions`}
        />
        <StatCard label="As Instructor" value={totals.asFlightInstructor} />
        <StatCard label="Dual Received" value={totals.totalDual} />
        <StatCard label="Day Landings" value={totals.dayTakeoffsLandings} unit="" />
        <StatCard label="Night Landings" value={totals.nightTakeoffsLandings} unit="" />
        <StatCard label="IFR Approaches" value={totals.ifrApproaches} unit="" />
      </div>

      {/* Aircraft Breakdown Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white px-4 py-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider">Aircraft Breakdown</h3>
            <span className="text-sm">
              <span className="opacity-70">Period:</span>{" "}
              <span className="font-mono">
                {earliestDate?.toLocaleDateString('en-CA') || 'N/A'} - {latestDate?.toLocaleDateString('en-CA') || 'N/A'}
              </span>
            </span>
          </div>
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs whitespace-nowrap">
            <thead>
              {/* Top-level category headers */}
              <tr className="bg-slate-700 text-white text-center">
                <th rowSpan={2} className="px-2 py-1.5 text-left border-r border-slate-600 sticky left-0 bg-slate-700 z-10">Aircraft</th>
                <th rowSpan={2} className="px-2 py-1.5 border-r border-slate-600">Type</th>
                <th rowSpan={2} className="px-2 py-1.5 border-r border-slate-600">Total<br/>Hours</th>
                <th rowSpan={2} className="px-2 py-1.5 border-r border-slate-600">No. of<br/>Flights</th>
                <th rowSpan={2} className="px-2 py-1.5 border-r border-slate-600">Days Since<br/>Last Flight</th>
                <th colSpan={6} className="px-2 py-1 border-r border-slate-600 bg-blue-700">Single-Engine</th>
                <th colSpan={6} className="px-2 py-1 border-r border-slate-600 bg-indigo-700">Multi-Engine</th>
                <th colSpan={6} className="px-2 py-1 border-r border-slate-600 bg-emerald-700">Cross-Country</th>
                <th colSpan={2} className="px-2 py-1 border-r border-slate-600 bg-amber-700">Take-offs/Land</th>
                <th colSpan={2} className="px-2 py-1 border-r border-slate-600 bg-purple-700">Instrument</th>
                <th rowSpan={2} className="px-2 py-1.5 border-r border-slate-600 bg-cyan-700">Sim</th>
                <th rowSpan={2} className="px-2 py-1.5 border-r border-slate-600 bg-pink-700">IFR<br/>App</th>
                <th rowSpan={2} className="px-2 py-1.5 border-r border-slate-600 bg-pink-700">Hold</th>
                <th rowSpan={2} className="px-2 py-1.5 border-r border-slate-600 bg-orange-700">As Flt<br/>Instr</th>
                <th rowSpan={2} className="px-2 py-1.5 bg-teal-700">Dual<br/>Recv</th>
              </tr>
              {/* Sub-headers */}
              <tr className="bg-slate-600 text-white text-center text-[10px]">
                <th className="px-1 py-1 bg-blue-600">Dual</th>
                <th className="px-1 py-1 bg-blue-600">PIC</th>
                <th className="px-1 py-1 bg-blue-600 border-r border-blue-500">Co-P</th>
                <th className="px-1 py-1 bg-blue-800">Dual</th>
                <th className="px-1 py-1 bg-blue-800">PIC</th>
                <th className="px-1 py-1 bg-blue-800 border-r border-slate-500">Co-P</th>
                <th className="px-1 py-1 bg-indigo-600">Dual</th>
                <th className="px-1 py-1 bg-indigo-600">PIC</th>
                <th className="px-1 py-1 bg-indigo-600 border-r border-indigo-500">Co-P</th>
                <th className="px-1 py-1 bg-indigo-800">Dual</th>
                <th className="px-1 py-1 bg-indigo-800">PIC</th>
                <th className="px-1 py-1 bg-indigo-800 border-r border-slate-500">Co-P</th>
                <th className="px-1 py-1 bg-emerald-600">Dual</th>
                <th className="px-1 py-1 bg-emerald-600">PIC</th>
                <th className="px-1 py-1 bg-emerald-600 border-r border-emerald-500">Co-P</th>
                <th className="px-1 py-1 bg-emerald-800">Dual</th>
                <th className="px-1 py-1 bg-emerald-800">PIC</th>
                <th className="px-1 py-1 bg-emerald-800 border-r border-slate-500">Co-P</th>
                <th className="px-1 py-1 bg-amber-600">Day</th>
                <th className="px-1 py-1 bg-amber-800 border-r border-slate-500">Night</th>
                <th className="px-1 py-1 bg-purple-600">Act IMC</th>
                <th className="px-1 py-1 bg-purple-800 border-r border-slate-500">Hood</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {summaries.map((s) => (
                <AircraftRow key={s.aircraftType} s={s} />
              ))}
              <TotalsRow grandTotal={grandTotal} totals={totals} />
            </tbody>
          </table>
        </div>
        
        {/* Footer */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Total Hours</span> = SE + ME time only (simulator tracked separately per TCCA/FAA/EASA).{" "}
            <span className="text-cyan-600 dark:text-cyan-400">Simulator entries</span> shown with cyan highlighting.
          </p>
        </div>
      </div>
    </div>
  );
}
