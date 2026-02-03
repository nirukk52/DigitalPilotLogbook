"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { PilotPortfolioStats } from "@/lib/export/portfolio-generator";

/**
 * Portfolio Page - Displays pilot portfolio with flight statistics
 * Reads data from sessionStorage set by the import page
 */
export default function PortfolioPage() {
  const [stats, setStats] = useState<PilotPortfolioStats | null>(null);
  const [pilotName, setPilotName] = useState<string>("Pilot");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Read portfolio data from sessionStorage
    const storedData = sessionStorage.getItem("portfolioData");
    if (storedData) {
      try {
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
      } catch (e) {
        console.error("Failed to parse portfolio data:", e);
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#16213e] to-[#1a1a2e] flex items-center justify-center">
        <div className="text-white/60">Loading portfolio...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#16213e] to-[#1a1a2e] flex flex-col items-center justify-center gap-4">
        <p className="text-white/60">No portfolio data found</p>
        <Link
          href="/import"
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          Go to Import
        </Link>
      </div>
    );
  }

  const formatHours = (hours: number) => hours.toFixed(1);

  // Sort aircraft by hours (descending)
  const sortedAircraft = Array.from(stats.aircraftTypes.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#16213e] to-[#1a1a2e]">
      {/* Header */}
      <header className="h-14 border-b border-white/5 flex items-center px-6">
        <Link
          href="/import"
          className="text-white/60 hover:text-white/80 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Import
        </Link>
        <h1 className="text-white text-lg font-medium ml-4">Pilot Portfolio</h1>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto py-8 px-6">
        {/* Hero Section */}
        <div className="text-center py-12 px-8 bg-gradient-to-br from-purple-600/15 to-purple-400/5 rounded-3xl border border-white/10 mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(147,51,234,0.15),transparent_70%)] pointer-events-none" />
          <div className="relative z-10">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-purple-300 bg-clip-text text-transparent mb-2">
              {pilotName.toUpperCase()}
            </h1>
            <p className="text-white/70 text-lg">Professional Pilot Portfolio</p>
            {stats.firstFlightDate && stats.lastFlightDate && (
              <p className="text-white/50 text-sm mt-3">
                Flight history: {stats.firstFlightDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })} - {stats.lastFlightDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </p>
            )}
          </div>
        </div>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Flight Hours"
            value={formatHours(stats.totalFlightHours)}
            subtitle={`${stats.totalFlights} flights logged`}
          />
          <StatCard
            label="PIC Hours"
            value={formatHours(stats.picHours)}
            subtitle="Pilot in command"
          />
          <StatCard
            label="Instructor Hours"
            value={formatHours(stats.instructorHours)}
            subtitle="As flight instructor"
          />
          <StatCard
            label="Cross-Country"
            value={formatHours(stats.crossCountryHours)}
            subtitle="Navigation hours"
          />
        </div>

        {/* Flight Experience Overview */}
        <h2 className="text-xl font-semibold text-white mb-4 pl-4 border-l-4 border-gradient-to-b from-purple-500 to-purple-300 border-purple-500">
          Flight Experience Overview
        </h2>
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <SummaryCard title="Flight Time Categories">
            <SummaryItem label="Single-Engine Day" value={`${formatHours(stats.singleEngineDayHours)} hrs`} />
            <SummaryItem label="Multi-Engine Day" value={`${formatHours(stats.multiEngineDayHours)} hrs`} />
            <SummaryItem label="Night Flying" value={`${formatHours(stats.nightFlyingHours)} hrs`} />
            <SummaryItem label="Instrument (Actual IMC)" value={`${formatHours(stats.actualImcHours)} hrs`} />
          </SummaryCard>

          <SummaryCard title="Instrument & Advanced">
            <SummaryItem label="Hood Time" value={`${formatHours(stats.hoodHours)} hrs`} />
            <SummaryItem label="Simulator" value={`${formatHours(stats.simulatorHours)} hrs`} />
            <SummaryItem label="IFR Approaches" value={String(stats.ifrApproaches)} />
            <SummaryItem label="Day Takeoffs/Landings" value={String(stats.dayTakeoffsLandings)} />
          </SummaryCard>

          <SummaryCard title="Training & Experience">
            <SummaryItem label="Dual Received" value={`${formatHours(stats.dualReceivedHours)} hrs`} />
            <SummaryItem label="As Flight Instructor" value={`${formatHours(stats.instructorHours)} hrs`} />
            <SummaryItem label="Night Takeoffs/Landings" value={String(stats.nightTakeoffsLandings)} />
            <SummaryItem label="Cross-Country PIC" value={`${formatHours(stats.crossCountryHours)} hrs`} />
          </SummaryCard>
        </div>

        {/* Aircraft Experience */}
        {sortedAircraft.length > 0 && (
          <>
            <h2 className="text-xl font-semibold text-white mb-4 pl-4 border-l-4 border-purple-500">
              Aircraft Experience
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
              {sortedAircraft.map(([name, hours]) => (
                <div
                  key={name}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 text-center hover:border-purple-500/50 transition-colors"
                >
                  <p className="text-purple-400 font-semibold text-sm mb-1">{name}</p>
                  <p className="text-white text-xl font-bold">{formatHours(hours)}</p>
                  <p className="text-white/50 text-xs">hours</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="text-center py-8 text-white/40 text-sm">
          Generated by Digital Pilot Logbook
        </div>
      </main>
    </div>
  );
}

/**
 * Stat card component for key metrics
 */
function StatCard({ label, value, subtitle }: { label: string; value: string; subtitle: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5 relative overflow-hidden group hover:border-purple-500/50 transition-all hover:-translate-y-1">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-purple-400" />
      <p className="text-white/50 text-xs uppercase tracking-wider mb-1">{label}</p>
      <p className="text-purple-400 text-3xl font-bold mb-1">{value}</p>
      <p className="text-white/60 text-xs">{subtitle}</p>
    </div>
  );
}

/**
 * Summary card container component
 */
function SummaryCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
      <p className="text-white/50 text-xs uppercase tracking-wider mb-4">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

/**
 * Summary item row component
 */
function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-white/5 last:border-0">
      <span className="text-white/70 text-sm">{label}</span>
      <span className="text-purple-400 font-semibold text-sm">{value}</span>
    </div>
  );
}
