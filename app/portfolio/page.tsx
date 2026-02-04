"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Advanced Portfolio Stats from the new API endpoint
 * Contains pre-aggregated data for intuitive display
 */
interface AdvancedPortfolioStats {
  pilotName: string;
  summary: {
    totalHours: number;
    totalFlights: number;
    firstFlightDate: string | null;
    lastFlightDate: string | null;
    uniqueAircraft: number;
    airportsVisited: number;
    averageFlightDuration: number;
  };
  timeDistribution: {
    singleEngine: number;
    multiEngine: number;
    night: number;
    instrument: number;
    crossCountry: number;
    pic: number;
    dual: number;
    instructor: number;
  };
  monthlyTrend: Array<{
    month: string;
    hours: number;
    flights: number;
  }>;
  yearlyProgression: Array<{
    year: number;
    totalHours: number;
    flights: number;
    picHours: number;
    dualHours: number;
  }>;
  topAircraft: Array<{
    aircraft: string;
    flights: number;
    hours: number;
    avgDuration: number;
  }>;
  topAirports: Array<{
    airport: string;
    departures: number;
    aircraftUsed: number;
  }>;
  counts: {
    dayTakeoffsLandings: number;
    nightTakeoffsLandings: number;
    ifrApproaches: number;
    simulatorHours: number;
  };
}

/**
 * Portfolio Page - Modern one-pager pilot portfolio
 * Displays flight statistics in a clean, intuitive format
 * Uses advanced SQL aggregations for performance
 */
export default function PortfolioPage() {
  const [stats, setStats] = useState<AdvancedPortfolioStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const response = await fetch('/api/portfolio/stats', { cache: 'no-store' });
        
        if (!response.ok) {
          throw new Error('Failed to fetch portfolio data');
        }
        
        const data = await response.json();
        
        // Check for API error response
        if (data.error) {
          throw new Error(data.error);
        }
        
        setStats(data);
      } catch (e) {
        console.error("Failed to load portfolio:", e);
        setError(e instanceof Error ? e.message : "Failed to load portfolio data");
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-500 dark:text-slate-400">Loading portfolio...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-red-500 text-center">{error}</p>
        <Link
          href="/home"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Home
        </Link>
      </div>
    );
  }

  if (!stats || stats.summary.totalFlights === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center gap-6 p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">No Flight Data</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Import your logbook to see your portfolio</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/home"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </Link>
          <Link
            href="/import"
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-white text-sm font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Import Logbook
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  // Calculate career duration
  const getCareerDuration = () => {
    if (!stats.summary.firstFlightDate || !stats.summary.lastFlightDate) return null;
    const first = new Date(stats.summary.firstFlightDate);
    const last = new Date(stats.summary.lastFlightDate);
    const years = Math.floor((last.getTime() - first.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    const months = Math.floor(((last.getTime() - first.getTime()) % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000));
    if (years > 0) return `${years}y ${months}m`;
    return `${months} months`;
  };

  // Get max for bar charts
  const maxMonthlyHours = Math.max(...stats.monthlyTrend.map(m => m.hours), 1);
  const maxYearlyHours = Math.max(...stats.yearlyProgression.map(y => y.totalHours), 1);
  const maxAircraftHours = Math.max(...stats.topAircraft.map(a => a.hours), 1);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Compact Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/home" className="flex items-center gap-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
            </svg>
            <span className="font-bold text-slate-800 dark:text-white">Portfolio</span>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(window.location.href)}
            className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            Share
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Hero - Pilot Name & Key Stats */}
        <section className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          </div>
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
                  {stats.pilotName.charAt(0).toUpperCase()}
                </div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">{stats.pilotName}</h1>
              </div>
              <p className="text-blue-100 text-sm mt-2 flex items-center gap-2">
                <span className="inline-flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDate(stats.summary.firstFlightDate)} — {formatDate(stats.summary.lastFlightDate)}
                </span>
                {getCareerDuration() && (
                  <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">{getCareerDuration()}</span>
                )}
              </p>
            </div>
            <div className="flex gap-8">
              <div className="text-center">
                <p className="text-4xl md:text-5xl font-black tabular-nums">{stats.summary.totalHours.toLocaleString()}</p>
                <p className="text-blue-100 text-xs uppercase tracking-wider mt-1">Total Hours</p>
              </div>
              <div className="text-center">
                <p className="text-4xl md:text-5xl font-black tabular-nums">{stats.summary.totalFlights.toLocaleString()}</p>
                <p className="text-blue-100 text-xs uppercase tracking-wider mt-1">Flights</p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Stats Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickStat label="PIC Hours" value={stats.timeDistribution.pic} icon="👨‍✈️" />
          <QuickStat label="Cross Country" value={stats.timeDistribution.crossCountry} icon="🧭" />
          <QuickStat label="Night Hours" value={stats.timeDistribution.night} icon="🌙" />
          <QuickStat label="Instrument" value={stats.timeDistribution.instrument} icon="☁️" />
        </section>

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Time Distribution */}
          <section className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-white mb-4 uppercase tracking-wide">Time Distribution</h2>
            <div className="space-y-3">
              <TimeBar label="Single Engine" hours={stats.timeDistribution.singleEngine} total={stats.summary.totalHours} color="bg-blue-500" />
              <TimeBar label="Multi Engine" hours={stats.timeDistribution.multiEngine} total={stats.summary.totalHours} color="bg-indigo-500" />
              <TimeBar label="Dual Received" hours={stats.timeDistribution.dual} total={stats.summary.totalHours} color="bg-emerald-500" />
              <TimeBar label="Instructor" hours={stats.timeDistribution.instructor} total={stats.summary.totalHours} color="bg-amber-500" />
            </div>
          </section>

          {/* Top Aircraft */}
          <section className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-white mb-4 uppercase tracking-wide">Aircraft Flown</h2>
            <div className="space-y-2.5">
              {stats.topAircraft.slice(0, 5).map((aircraft, i) => (
                <div key={aircraft.aircraft} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-800 dark:text-white truncate">{aircraft.aircraft}</span>
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400 ml-2">{aircraft.hours}h</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mt-1">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all" 
                        style={{ width: `${(aircraft.hours / maxAircraftHours) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Monthly Trend Chart */}
        {stats.monthlyTrend.length > 0 && (
          <section className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-white mb-4 uppercase tracking-wide">Recent Activity</h2>
            <div className="flex items-end gap-1 h-24">
              {stats.monthlyTrend.map((month, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-default group relative"
                    style={{ height: `${Math.max((month.hours / maxMonthlyHours) * 100, 4)}%` }}
                    title={`${month.month}: ${month.hours}h, ${month.flights} flights`}
                  >
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {month.hours}h
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 truncate w-full text-center">{month.month.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Yearly Progression & Airports */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Yearly Progression */}
          <section className="md:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-white mb-4 uppercase tracking-wide">Yearly Progression</h2>
            <div className="space-y-2">
              {stats.yearlyProgression.map(year => (
                <div key={year.year} className="flex items-center gap-3">
                  <span className="w-12 text-sm font-medium text-slate-500 dark:text-slate-400">{year.year}</span>
                  <div className="flex-1 flex gap-0.5 h-5">
                    <div 
                      className="bg-blue-500 rounded-l hover:bg-blue-600 transition-colors" 
                      style={{ width: `${(year.picHours / maxYearlyHours) * 100}%` }}
                      title={`PIC: ${year.picHours}h`}
                    />
                    <div 
                      className="bg-emerald-500 rounded-r hover:bg-emerald-600 transition-colors" 
                      style={{ width: `${(year.dualHours / maxYearlyHours) * 100}%` }}
                      title={`Dual: ${year.dualHours}h`}
                    />
                  </div>
                  <span className="w-16 text-right text-sm font-bold text-slate-800 dark:text-white">{year.totalHours}h</span>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-blue-500 rounded" />
                <span className="text-xs text-slate-500 dark:text-slate-400">PIC</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-emerald-500 rounded" />
                <span className="text-xs text-slate-500 dark:text-slate-400">Dual</span>
              </div>
            </div>
          </section>

          {/* Airports */}
          <section className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-white mb-4 uppercase tracking-wide">Airports</h2>
            <div className="space-y-3">
              {stats.topAirports.slice(0, 4).map((airport, i) => (
                <div key={airport.airport} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-lg ${i === 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                      {i === 0 ? '🏠' : '✈️'}
                    </span>
                    <span className="text-sm font-mono font-bold text-slate-800 dark:text-white">{airport.airport}</span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{airport.departures} dep</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Total Airports</span>
                <span className="font-bold text-slate-800 dark:text-white">{stats.summary.airportsVisited}</span>
              </div>
            </div>
          </section>
        </div>

        {/* Counts Row */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <CountCard label="Day Landings" value={stats.counts.dayTakeoffsLandings} icon="☀️" />
          <CountCard label="Night Landings" value={stats.counts.nightTakeoffsLandings} icon="🌙" />
          <CountCard label="IFR Approaches" value={stats.counts.ifrApproaches} icon="📡" />
          <CountCard label="Simulator" value={`${stats.counts.simulatorHours}h`} icon="🖥️" />
        </section>

        {/* Footer Stats */}
        <footer className="text-center py-4 text-xs text-slate-400 dark:text-slate-500">
          <p>{stats.summary.uniqueAircraft} unique aircraft · Avg flight: {stats.summary.averageFlightDuration}h</p>
          <p className="mt-1">Generated by Digital Pilot Logbook</p>
        </footer>
      </main>
    </div>
  );
}

/**
 * Quick stat card for key metrics
 */
function QuickStat({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between">
        <span className="text-lg">{icon}</span>
        <span className="text-xl font-bold text-slate-800 dark:text-white">{value}</span>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</p>
    </div>
  );
}

/**
 * Count card for integer counts
 */
function CountCard({ label, value, icon }: { label: string; value: number | string; icon: string }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-3 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-3">
      <span className="text-lg">{icon}</span>
      <div>
        <p className="text-lg font-bold text-slate-800 dark:text-white">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">{label}</p>
      </div>
    </div>
  );
}

/**
 * Time distribution bar
 */
function TimeBar({ label, hours, total, color }: { label: string; hours: number; total: number; color: string }) {
  const percentage = total > 0 ? (hours / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-600 dark:text-slate-300">{label}</span>
        <span className="text-xs font-bold text-slate-800 dark:text-white">{hours}h</span>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
