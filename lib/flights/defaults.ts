/**
 * Smart Defaults Logic for Quick Flight Entry
 * Provides intelligent pre-fill values based on flight history and user profile
 */

import {
  getLastFlight,
  getFlightAutocompleteData,
  getUserSettings,
  getFlightCount,
} from "@/lib/db/queries";
import type { FlightRole, FlightDefaults } from "./types";

/**
 * Infers flight role from time bucket values
 * Used to determine what role was likely used on the last flight
 */
export function inferRoleFromFlight(flight: {
  dualReceived: number | null;
  asFlightInstructor: number | null;
  simulator: number | null;
}): FlightRole | null {
  if (flight.simulator && flight.simulator > 0) {
    return 'Simulator';
  }
  if (flight.asFlightInstructor && flight.asFlightInstructor > 0) {
    return 'Instructor';
  }
  if (flight.dualReceived && flight.dualReceived > 0) {
    return 'Student';
  }
  // Default to PIC if no specific markers
  return 'PIC';
}

/**
 * Gets smart defaults for the quick entry form
 * Combines data from last flight, user profile, and autocomplete options
 */
export async function getSmartDefaults(
  userId: string = "default"
): Promise<FlightDefaults> {
  // Fetch data in parallel
  const [lastFlight, autocompleteData, settings, flightCount] = await Promise.all([
    getLastFlight(userId),
    getFlightAutocompleteData(userId),
    getUserSettings(userId),
    getFlightCount(userId),
  ]);

  // Build route prefix from last arrival
  let routePrefix: string | null = null;
  if (lastFlight?.arrivalAirport) {
    routePrefix = `${lastFlight.arrivalAirport}-`;
  } else if (settings?.homeBase) {
    routePrefix = `${settings.homeBase}-`;
  }

  // Infer last role
  const lastRole = lastFlight ? inferRoleFromFlight(lastFlight) : null;

  // Check if profile is set up
  const hasProfile = !!(settings?.pilotName && settings?.homeBase);

  return {
    // From last flight
    aircraft: lastFlight?.aircraftMakeModel ?? null,
    registration: lastFlight?.registration ?? null,
    routePrefix,
    role: lastRole,

    // From profile
    pilotName: settings?.pilotName ?? null,
    homeBase: settings?.homeBase ?? null,
    defaultInstructor: settings?.defaultInstructor ?? null,
    hasProfile,

    // Autocomplete data
    aircraftOptions: autocompleteData.aircraft,
    registrationsByAircraft: autocompleteData.registrationsByAircraft,

    // Stats
    flightCount,
  };
}
