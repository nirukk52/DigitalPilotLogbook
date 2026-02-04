"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Portfolio stats structure from API
 * Matches the database-calculated stats
 */
interface PortfolioStats {
  totalFlightHours: number;
  picHours: number;
  instructorHours: number;
  dualReceivedHours: number;
  singleEngineDayHours: number;
  singleEngineNightHours: number;
  multiEngineDayHours: number;
  multiEngineNightHours: number;
  crossCountryHours: number;
  nightFlyingHours: number;
  actualImcHours: number;
  hoodHours: number;
  simulatorHours: number;
  ifrApproaches: number;
  totalFlights: number;
  dayTakeoffsLandings: number;
  nightTakeoffsLandings: number;
  aircraftTypes: Map<string, number>;
  firstFlightDate: Date | null;
  lastFlightDate: Date | null;
}

/**
 * Portfolio Page - Displays pilot portfolio with flight statistics
 * Uses the frontend-landing-design skill patterns for consistent UI
 * Fetches data from database API for consistency with Recent Flights
 * Falls back to sessionStorage for import preview mode
 */
export default function PortfolioPage() {
  const [stats, setStats] = useState<PortfolioStats | null>(null);
  const [pilotName, setPilotName] = useState<string>("Pilot");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  useEffect(() => {
    async function loadPortfolioData() {
      try {
        // First, try to fetch from database API (source of truth)
        // Use cache: 'no-store' to always get fresh data from database
        const response = await fetch('/api/portfolio', { cache: 'no-store' });
        
        if (response.ok) {
          const data = await response.json();
          
          // Check if there are any flights in the database
          if (data.totalFlights > 0) {
            // Convert dates and aircraftTypes from API response
            const parsedStats: PortfolioStats = {
              ...data,
              firstFlightDate: data.firstFlightDate ? new Date(data.firstFlightDate) : null,
              lastFlightDate: data.lastFlightDate ? new Date(data.lastFlightDate) : null,
              aircraftTypes: new Map(data.aircraftTypes || []),
            };
            setStats(parsedStats);
            setPilotName(data.pilotName || "Pilot");
            setLoading(false);
            return;
          }
        }

        // Fallback: Check sessionStorage for import preview mode
        // This allows previewing portfolio before saving to database
        const storedData = sessionStorage.getItem("portfolioData");
        if (storedData) {
          const data = JSON.parse(storedData);
          // Convert date strings back to Date objects
          if (data.stats.firstFlightDate) {
            data.stats.firstFlightDate = new Date(data.stats.firstFlightDate);
          }
          if (data.stats.lastFlightDate) {
            data.stats.lastFlightDate = new Date(data.stats.lastFlightDate);
          }
          // Convert aircraftTypes from array back to Map
          if (data.stats.aircraftTypes) {
            data.stats.aircraftTypes = new Map(data.stats.aircraftTypes);
          }
          setStats(data.stats);
          setPilotName(data.pilotName || "Pilot");
          setIsPreviewMode(true);
          setLoading(false);
          return;
        }

        // No data available
        setStats(null);
      } catch (e) {
        console.error("Failed to load portfolio data:", e);
        setError("Failed to load portfolio data");
      } finally {
        setLoading(false);
      }
    }

    loadPortfolioData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#101922] flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading portfolio...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#101922] flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error}</p>
        <Link
          href="/home"
          className="flex items-center justify-center px-6 py-3 bg-[#137fec] text-white font-bold rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
        >
          Go to Home
        </Link>
      </div>
    );
  }

  if (!stats || stats.totalFlights === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#101922] flex flex-col items-center justify-center gap-6">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300 text-lg mb-2">No flight data found</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Add flights or import your logbook to see your portfolio</p>
        </div>
        <div className="flex gap-4 mt-4">
          <Link
            href="/home"
            className="flex items-center justify-center px-6 py-3 bg-[#137fec] text-white font-bold rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
          >
            Go to Home
          </Link>
          <Link
            href="/import"
            className="flex items-center justify-center px-6 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[#111418] dark:text-white font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Import Logbook
          </Link>
        </div>
      </div>
    );
  }

  const formatHours = (hours: number) => hours.toFixed(1);

  // Sort aircraft by hours (descending)
  const sortedAircraft = Array.from(stats.aircraftTypes.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-white dark:bg-[#101922] font-sans antialiased">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-[#101922]/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/home"
                className="flex items-center gap-2 text-gray-600 hover:text-[#137fec] dark:text-gray-300 dark:hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm font-medium">Back to Home</span>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#137fec]">
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                </svg>
              </span>
              <span className="text-xl font-bold tracking-tight text-[#111418] dark:text-white">Pilot Portfolio</span>
            </div>
            <div className="flex items-center gap-3">
              {isPreviewMode && (
                <span className="px-3 py-1 text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full">
                  Preview Mode
                </span>
              )}
              <Link
                href="/import"
                className="flex items-center justify-center px-4 py-2 text-sm font-bold text-white bg-[#137fec] hover:bg-blue-600 rounded-lg transition-colors shadow-sm hover:shadow-md"
              >
                Export PDF
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Preview Mode Banner */}
      {isPreviewMode && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800/30 px-4 sm:px-6 lg:px-8 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-yellow-700 dark:text-yellow-400 text-sm font-medium">
                This is a preview from your import. Save to logbook to make it permanent.
              </p>
            </div>
            <Link
              href="/import"
              className="text-yellow-700 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300 text-sm font-semibold flex items-center gap-1"
            >
              Go to Import
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-blue-100 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full blur-3xl -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#137fec] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#137fec]"></span>
              </span>
              <span className="text-xs font-semibold text-[#137fec] uppercase tracking-wide">Verified Flight Record</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-[#111418] dark:text-white leading-tight tracking-tight mb-4">
              {pilotName.toUpperCase()}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">Professional Pilot Portfolio</p>
            {stats.firstFlightDate && stats.lastFlightDate && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Flight history: {stats.firstFlightDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })} - {stats.lastFlightDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </p>
            )}
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-6">
              <div className="flex items-center gap-1">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span>{stats.totalFlights} Flights Logged</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span>{formatHours(stats.totalFlightHours)} Total Hours</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Stats Grid */}
      <section className="py-12 bg-[#f8fafc] dark:bg-[#1e293b]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard
              icon={<svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>}
              label="Total Flight Hours"
              value={formatHours(stats.totalFlightHours)}
              subtitle={`${stats.totalFlights} flights logged`}
              color="blue"
            />
            <StatCard
              icon={<svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>}
              label="PIC Hours"
              value={formatHours(stats.picHours)}
              subtitle="Pilot in command"
              color="purple"
            />
            <StatCard
              icon={<svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/></svg>}
              label="Instructor Hours"
              value={formatHours(stats.instructorHours)}
              subtitle="As flight instructor"
              color="orange"
            />
            <StatCard
              icon={<svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>}
              label="Cross-Country"
              value={formatHours(stats.crossCountryHours)}
              subtitle="Navigation hours"
              color="green"
            />
          </div>
        </div>
      </section>

      {/* Flight Experience Overview */}
      <section className="py-16 bg-white dark:bg-[#101922]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-[#111418] dark:text-white mb-4">Flight Experience Overview</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">Comprehensive breakdown of flight time categories and qualifications</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <SummaryCard 
              title="Flight Time Categories" 
              icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>}
              color="blue"
            >
              <SummaryItem label="Single-Engine Day" value={`${formatHours(stats.singleEngineDayHours)} hrs`} />
              <SummaryItem label="Multi-Engine Day" value={`${formatHours(stats.multiEngineDayHours)} hrs`} />
              <SummaryItem label="Night Flying" value={`${formatHours(stats.nightFlyingHours)} hrs`} />
              <SummaryItem label="Instrument (Actual IMC)" value={`${formatHours(stats.actualImcHours)} hrs`} />
            </SummaryCard>

            <SummaryCard 
              title="Instrument & Advanced" 
              icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/></svg>}
              color="purple"
            >
              <SummaryItem label="Hood Time" value={`${formatHours(stats.hoodHours)} hrs`} />
              <SummaryItem label="Simulator" value={`${formatHours(stats.simulatorHours)} hrs`} />
              <SummaryItem label="IFR Approaches" value={String(stats.ifrApproaches)} />
              <SummaryItem label="Day Takeoffs/Landings" value={String(stats.dayTakeoffsLandings)} />
            </SummaryCard>

            <SummaryCard 
              title="Training & Experience" 
              icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/></svg>}
              color="orange"
            >
              <SummaryItem label="Dual Received" value={`${formatHours(stats.dualReceivedHours)} hrs`} />
              <SummaryItem label="As Flight Instructor" value={`${formatHours(stats.instructorHours)} hrs`} />
              <SummaryItem label="Night Takeoffs/Landings" value={String(stats.nightTakeoffsLandings)} />
              <SummaryItem label="Cross-Country PIC" value={`${formatHours(stats.crossCountryHours)} hrs`} />
            </SummaryCard>
          </div>
        </div>
      </section>

      {/* Aircraft Experience */}
      {sortedAircraft.length > 0 && (
        <section className="py-16 bg-[#f8fafc] dark:bg-[#1e293b]/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl font-bold text-[#111418] dark:text-white mb-4">Aircraft Experience</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">Hours logged by aircraft type</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {sortedAircraft.map(([name, hours]) => (
                <div
                  key={name}
                  className="relative p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all group text-center"
                >
                  <div className="w-12 h-12 mx-auto rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-4 text-[#137fec] group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                    </svg>
                  </div>
                  <p className="text-[#137fec] font-bold text-sm mb-1">{name}</p>
                  <p className="text-[#111418] dark:text-white text-2xl font-black">{formatHours(hours)}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">hours</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#137fec] rounded-3xl p-8 sm:p-12 text-center text-white relative overflow-hidden shadow-xl">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            <h2 className="relative text-3xl sm:text-4xl font-black mb-4 tracking-tight">Export Your Official Logbook</h2>
            <p className="relative text-blue-100 text-lg mb-8 max-w-2xl mx-auto">Generate a TCCA/EASA compliant PDF or share your digital portfolio with recruiters.</p>
            <div className="relative flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/import"
                className="w-full sm:w-auto px-8 py-3 bg-white text-[#137fec] font-bold rounded-lg hover:bg-gray-100 transition-colors shadow-lg text-center"
              >
                Download PDF
              </Link>
              <button
                onClick={() => navigator.clipboard.writeText(window.location.href)}
                className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-bold rounded-lg border border-blue-400 hover:bg-blue-500 transition-colors text-center"
              >
                Share Portfolio Link
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-[#101922] border-t border-gray-200 dark:border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[#137fec]">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                </svg>
              </span>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Generated by Digital Pilot Logbook</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-sm text-gray-400">Data Verified</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * Stat card component for key metrics
 * Uses the skill's card patterns with icon, hover effects, and color variants
 */
function StatCard({ 
  icon, 
  label, 
  value, 
  subtitle, 
  color 
}: { 
  icon: React.ReactNode;
  label: string; 
  value: string; 
  subtitle: string;
  color: 'blue' | 'purple' | 'orange' | 'green';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/30 text-[#137fec]',
    purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    green: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  };

  return (
    <div className="relative p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all group">
      <div className={`w-14 h-14 rounded-xl ${colorClasses[color]} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider font-medium mb-1">{label}</p>
      <p className="text-[#111418] dark:text-white text-3xl font-black mb-1">{value}</p>
      <p className="text-gray-500 dark:text-gray-400 text-sm">{subtitle}</p>
    </div>
  );
}

/**
 * Summary card container component
 * Uses the skill's feature card pattern with icon header
 */
function SummaryCard({ 
  title, 
  icon, 
  color, 
  children 
}: { 
  title: string; 
  icon: React.ReactNode;
  color: 'blue' | 'purple' | 'orange';
  children: React.ReactNode;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/30 text-[#137fec]',
    purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  };

  return (
    <div className="relative p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all group">
      <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-lg font-bold text-[#111418] dark:text-white mb-4">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

/**
 * Summary item row component
 * Clean row layout with label and value
 */
function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <span className="text-gray-600 dark:text-gray-400 text-sm">{label}</span>
      <span className="text-[#111418] dark:text-white font-semibold text-sm">{value}</span>
    </div>
  );
}
