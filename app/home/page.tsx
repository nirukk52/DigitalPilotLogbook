"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { QuickEntryForm } from "@/app/components/flights/QuickEntryForm";
import { PilotProfileSetup } from "@/app/components/flights/PilotProfileSetup";
import type { FlightRole, FlightTag } from "@/lib/flights/types";

/**
 * Main app home page shown after onboarding
 * Full-width dashboard with getting started options for new users
 * Includes quick flight entry modal, profile setup, and recent flights
 */

interface Flight {
  id: number;
  flightDate: string;
  aircraftMakeModel: string;
  registration: string;
  departureAirport: string | null;
  arrivalAirport: string | null;
  flightHours: number;
  remarks: string | null;
  dualReceived: number | null;
  asFlightInstructor: number | null;
  simulator: number | null;
}

export default function HomePage() {
  const [showAddFlightModal, setShowAddFlightModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFlightId, setEditFlightId] = useState<number | null>(null);
  const [editFlightData, setEditFlightData] = useState<{
    flightDate?: string;
    aircraft?: string;
    registration?: string;
    role?: FlightRole;
    route?: string;
    flightTime?: number;
    tags?: FlightTag[];
    remarks?: string;
  } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [recentFlights, setRecentFlights] = useState<Flight[]>([]);
  const [flightCount, setFlightCount] = useState(0);
  const [isLoadingFlights, setIsLoadingFlights] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [copiedSession, setCopiedSession] = useState(false);

  // Load recent flights and session ID
  const loadFlights = useCallback(async () => {
    try {
      const response = await fetch('/api/flights/defaults');
      if (response.ok) {
        const data = await response.json();
        setFlightCount(data.flightCount || 0);
      }
      
      // Also fetch recent flights for display (limited to 3 for overview)
      const flightsRes = await fetch('/api/flights/list?limit=3');
      if (flightsRes.ok) {
        const flightsData = await flightsRes.json();
        setRecentFlights(flightsData.flights || []);
      }

      // Fetch session ID
      const profileRes = await fetch('/api/profile');
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setSessionId(profileData.sessionId);
      }
    } catch {
      // Silent fail
    } finally {
      setIsLoadingFlights(false);
    }
  }, []);

  useEffect(() => {
    loadFlights();
  }, [loadFlights]);

  const handleFlightSaved = useCallback(() => {
    setShowAddFlightModal(false);
    setShowEditModal(false);
    setEditFlightId(null);
    setEditFlightData(null);
    setSuccessMessage("Flight saved successfully!");
    loadFlights();
    setTimeout(() => setSuccessMessage(null), 3000);
  }, [loadFlights]);

  const handleProfileComplete = useCallback(() => {
    setShowProfileModal(false);
    setSuccessMessage("Profile saved successfully!");
    setTimeout(() => setSuccessMessage(null), 3000);
  }, []);

  const copySessionId = useCallback(() => {
    if (sessionId) {
      navigator.clipboard.writeText(sessionId);
      setCopiedSession(true);
      setTimeout(() => setCopiedSession(false), 2000);
    }
  }, [sessionId]);

  const handleEditFlight = useCallback(async (flight: Flight) => {
    // Infer role from flight data
    let role: FlightRole = 'PIC';
    if (flight.simulator && flight.simulator > 0) {
      role = 'Simulator';
    } else if (flight.asFlightInstructor && flight.asFlightInstructor > 0) {
      role = 'Instructor';
    } else if (flight.dualReceived && flight.dualReceived > 0) {
      role = 'Student';
    }

    setEditFlightId(flight.id);
    setEditFlightData({
      flightDate: flight.flightDate,
      aircraft: flight.aircraftMakeModel,
      registration: flight.registration,
      role,
      route: flight.departureAirport && flight.arrivalAirport 
        ? `${flight.departureAirport}-${flight.arrivalAirport}` 
        : undefined,
      flightTime: flight.flightHours,
      remarks: flight.remarks || undefined,
    });
    setShowEditModal(true);
  }, []);

  const handleDeleteFlight = useCallback(async (flightId: number) => {
    if (!confirm('Are you sure you want to delete this flight?')) return;
    
    try {
      const response = await fetch(`/api/flights/${flightId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setSuccessMessage("Flight deleted successfully!");
        loadFlights();
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch {
      // Silent fail
    }
  }, [loadFlights]);

  const handleExportPdf = useCallback(async () => {
    if (flightCount === 0) {
      setSuccessMessage("No flights to export. Add flights first.");
      setTimeout(() => setSuccessMessage(null), 3000);
      return;
    }

    setIsExporting(true);
    try {
      // Fetch all flights for export
      const flightsRes = await fetch('/api/flights/list?limit=10000');
      if (!flightsRes.ok) throw new Error('Failed to fetch flights');
      
      const flightsData = await flightsRes.json();
      const flights = flightsData.flights || [];
      
      if (flights.length === 0) {
        setSuccessMessage("No flights to export.");
        setTimeout(() => setSuccessMessage(null), 3000);
        return;
      }

      // Convert to ParsedFlight format for the PDF API
      const parsedFlights = flights.map((f: Flight) => ({
        flightDate: f.flightDate,
        aircraftMakeModel: f.aircraftMakeModel,
        registration: f.registration,
        departureAirport: f.departureAirport || '',
        arrivalAirport: f.arrivalAirport || '',
        flightHours: f.flightHours,
        dualReceived: f.dualReceived || 0,
        pilotInCommand: f.dualReceived ? 0 : f.flightHours, // If not dual, assume PIC
        asFlightInstructor: f.asFlightInstructor || 0,
        simulator: f.simulator || 0,
        remarks: f.remarks || '',
      }));

      // Call PDF export API
      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flights: parsedFlights }),
      });

      if (!response.ok) throw new Error('PDF generation failed');

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Logbook_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setSuccessMessage(`PDF exported with ${flights.length} flights!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Export error:', error);
      setSuccessMessage("Failed to export PDF. Please try again.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } finally {
      setIsExporting(false);
    }
  }, [flightCount]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#101922] font-sans antialiased">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-[#101922]/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="text-[#137fec]">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Digital Pilot Logbook</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/import" className="text-sm font-medium text-gray-600 hover:text-[#137fec] dark:text-gray-300 dark:hover:text-white transition-colors">
                Import
              </Link>
              <Link href="/portfolio" className="text-sm font-medium text-gray-600 hover:text-[#137fec] dark:text-gray-300 dark:hover:text-white transition-colors">
                Portfolio
              </Link>
            </nav>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowProfileModal(true)}
                className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Profile
              </button>
              <button 
                onClick={() => setShowAddFlightModal(true)}
                className="flex items-center justify-center px-4 py-2 text-sm font-bold text-white bg-[#137fec] hover:bg-blue-600 rounded-lg transition-colors shadow-sm hover:shadow-md"
              >
                Add Flight
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Success Message */}
          {successMessage && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-lg text-green-700 dark:text-green-400 text-center text-sm font-medium">
              {successMessage}
            </div>
          )}

          {/* Stats Row */}
          {flightCount > 0 && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-[#137fec]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Flights</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{flightCount}</div>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Last Flight</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {recentFlights.length > 0 ? recentFlights[0].flightDate : '-'}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Status</div>
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">Active</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Cards */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button 
                onClick={() => setShowAddFlightModal(true)}
                className="relative p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all group text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-3 text-[#137fec] group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Add Flight</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Quick 30-second entry</p>
              </button>

              <Link
                href="/import"
                className="relative p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all group text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center mb-3 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Import Excel</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Bulk import flights</p>
              </Link>

              <button 
                onClick={() => setShowProfileModal(true)}
                className="relative p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all group text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center mb-3 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Profile</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Name & settings</p>
              </button>

              <button
                onClick={handleExportPdf}
                disabled={isExporting}
                className="relative p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all group text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center mb-3 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
                  {isExporting ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                  {isExporting ? 'Exporting...' : 'Export PDF'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">TCCA/EASA format</p>
              </button>
            </div>
          </div>

          {/* Recent Flights */}
          {!isLoadingFlights && recentFlights.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Flights</h2>
                <Link href="/my-flights" className="text-xs font-medium text-[#137fec] hover:text-blue-600 transition-colors">
                  View all →
                </Link>
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                      <th className="text-left text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider px-4 py-2">Date</th>
                      <th className="text-left text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider px-4 py-2">Aircraft</th>
                      <th className="text-left text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider px-4 py-2">Route</th>
                      <th className="text-left text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider px-4 py-2">Time</th>
                      <th className="text-right text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {recentFlights.map((flight) => (
                      <tr key={flight.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-4 py-2.5 text-gray-900 dark:text-white text-sm font-medium">{flight.flightDate}</td>
                        <td className="px-4 py-2.5 text-sm">
                          <span className="text-gray-900 dark:text-white font-medium">{flight.aircraftMakeModel}</span>
                          <span className="text-gray-400 dark:text-gray-500 ml-1 text-xs">{flight.registration}</span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300 text-sm">
                          {flight.departureAirport && flight.arrivalAirport 
                            ? `${flight.departureAirport} → ${flight.arrivalAirport}`
                            : '-'}
                        </td>
                        <td className="px-4 py-2.5 text-gray-900 dark:text-white text-sm font-medium">{flight.flightHours}h</td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            onClick={() => handleEditFlight(flight)}
                            className="text-gray-400 hover:text-[#137fec] transition-colors p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteFlight(flight.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ml-0.5"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoadingFlights && flightCount === 0 && (
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-8 text-center">
              <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No flights yet</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Add your first flight or import from Excel</p>
              <div className="flex flex-row gap-3 justify-center">
                <button
                  onClick={() => setShowAddFlightModal(true)}
                  className="flex items-center justify-center px-4 py-2 bg-[#137fec] text-white text-sm font-bold rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Add First Flight
                </button>
                <Link
                  href="/import"
                  className="flex items-center justify-center px-4 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-white text-sm font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Import Excel
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Session ID - subtle footer */}
        {sessionId && (
          <div className="mt-8 text-center">
            <button
              onClick={copySessionId}
              className="text-gray-400/60 dark:text-gray-500/60 hover:text-gray-500 dark:hover:text-gray-400 text-[10px] font-mono transition-colors"
              title="Click to copy session ID"
            >
              {copiedSession ? "Copied!" : sessionId}
            </button>
          </div>
        )}
      </main>

      {/* Add Flight Modal */}
      {showAddFlightModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Add Flight</h2>
              <button
                onClick={() => setShowAddFlightModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5">
              <QuickEntryForm
                onSave={handleFlightSaved}
                onCancel={() => setShowAddFlightModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Flight Modal */}
      {showEditModal && editFlightId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Edit Flight</h2>
              <button
                onClick={() => { setShowEditModal(false); setEditFlightId(null); setEditFlightData(null); }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5">
              <QuickEntryForm
                onSave={handleFlightSaved}
                onCancel={() => { setShowEditModal(false); setEditFlightId(null); setEditFlightData(null); }}
                flightId={editFlightId}
                initialData={editFlightData || undefined}
              />
            </div>
          </div>
        </div>
      )}

      {/* Profile Setup Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Profile Setup</h2>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5">
              <PilotProfileSetup
                onComplete={handleProfileComplete}
                onSkip={() => setShowProfileModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
