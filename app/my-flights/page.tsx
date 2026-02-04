"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { QuickEntryForm } from "@/app/components/flights/QuickEntryForm";
import type { FlightRole, FlightTag } from "@/lib/flights/types";

/**
 * Full flights listing page with pagination
 * Displays all flights in groups of 50 with "Load More" functionality
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

const FLIGHTS_PER_PAGE = 50;

export default function MyFlightsPage() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
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

  // Load initial flights
  const loadFlights = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const offset = reset ? 0 : flights.length;
      const response = await fetch(`/api/flights/list?limit=${FLIGHTS_PER_PAGE}&offset=${offset}`);
      
      if (response.ok) {
        const data = await response.json();
        const newFlights = data.flights || [];
        
        if (reset) {
          setFlights(newFlights);
        } else {
          setFlights(prev => [...prev, ...newFlights]);
        }
        
        setHasMore(newFlights.length === FLIGHTS_PER_PAGE);
      }

      // Also fetch total count
      const countResponse = await fetch('/api/flights/defaults');
      if (countResponse.ok) {
        const countData = await countResponse.json();
        setTotalCount(countData.flightCount || 0);
      }
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [flights.length]);

  useEffect(() => {
    loadFlights(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      loadFlights(false);
    }
  }, [isLoadingMore, hasMore, loadFlights]);

  const handleFlightSaved = useCallback(() => {
    setShowEditModal(false);
    setEditFlightId(null);
    setEditFlightData(null);
    setSuccessMessage("Flight saved successfully!");
    loadFlights(true);
    setTimeout(() => setSuccessMessage(null), 3000);
  }, [loadFlights]);

  const handleEditFlight = useCallback((flight: Flight) => {
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
        loadFlights(true);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch {
      // Silent fail
    }
  }, [loadFlights]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#101922] font-sans antialiased">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-[#101922]/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="text-sm font-medium">Back to Home</span>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-[#137fec]">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">My Flights</span>
            </div>
            <div className="w-[140px]" /> {/* Spacer for centering */}
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

          {/* Stats Bar */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing <span className="font-semibold text-gray-900 dark:text-white">{flights.length}</span> of{" "}
              <span className="font-semibold text-gray-900 dark:text-white">{totalCount}</span> flights
            </div>
            <Link
              href="/"
              className="flex items-center justify-center px-4 py-2 text-sm font-bold text-white bg-[#137fec] hover:bg-blue-600 rounded-lg transition-colors shadow-sm hover:shadow-md"
            >
              Add Flight
            </Link>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <svg className="w-8 h-8 text-[#137fec] animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          )}

          {/* Flights Table */}
          {!isLoading && flights.length > 0 && (
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-left text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider px-4 py-3">Date</th>
                    <th className="text-left text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider px-4 py-3">Aircraft</th>
                    <th className="text-left text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider px-4 py-3">Route</th>
                    <th className="text-left text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider px-4 py-3">Time</th>
                    <th className="text-left text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider px-4 py-3 hidden md:table-cell">Remarks</th>
                    <th className="text-right text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {flights.map((flight) => (
                    <tr key={flight.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3 text-gray-900 dark:text-white text-sm font-medium">{flight.flightDate}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="text-gray-900 dark:text-white font-medium">{flight.aircraftMakeModel}</span>
                        <span className="text-gray-400 dark:text-gray-500 ml-1 text-xs">{flight.registration}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-sm">
                        {flight.departureAirport && flight.arrivalAirport 
                          ? `${flight.departureAirport} → ${flight.arrivalAirport}`
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white text-sm font-medium">{flight.flightHours}h</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm hidden md:table-cell max-w-[200px] truncate">
                        {flight.remarks || '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
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
          )}

          {/* Load More Button */}
          {!isLoading && hasMore && flights.length > 0 && (
            <div className="flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="flex items-center justify-center px-6 py-3 text-sm font-semibold text-[#137fec] bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors disabled:opacity-50"
              >
                {isLoadingMore ? (
                  <>
                    <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Loading...
                  </>
                ) : (
                  <>Load More ({Math.min(FLIGHTS_PER_PAGE, totalCount - flights.length)} more)</>
                )}
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && flights.length === 0 && (
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-8 text-center">
              <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No flights yet</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Add your first flight to get started</p>
              <Link
                href="/"
                className="inline-flex items-center justify-center px-4 py-2 bg-[#137fec] text-white text-sm font-bold rounded-lg hover:bg-blue-600 transition-colors"
              >
                Add First Flight
              </Link>
            </div>
          )}

          {/* All Loaded Message */}
          {!isLoading && !hasMore && flights.length > 0 && (
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              All {totalCount} flights loaded
            </div>
          )}
        </div>
      </main>

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
    </div>
  );
}
