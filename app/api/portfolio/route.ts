/**
 * Portfolio Stats API Route
 * Fetches pilot portfolio statistics from the database
 * Used by the Portfolio page to display consistent data with Recent Flights
 */

import { NextResponse } from "next/server";
import { getFlights, getUserSettings } from "@/lib/db/queries";
import { getSessionUserId } from "@/lib/session";
import type { Flight } from "@/lib/db/schema";

/**
 * Portfolio stats calculated from database flights
 * Matches the PilotPortfolioStats interface structure
 */
interface PortfolioStatsResponse {
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
  // Aircraft types as array of [name, hours] for JSON serialization
  aircraftTypes: [string, number][];
  firstFlightDate: string | null;
  lastFlightDate: string | null;
  pilotName: string;
}

/**
 * Calculate portfolio stats from database Flight records
 */
function calculateStatsFromFlights(flights: Flight[]): Omit<PortfolioStatsResponse, 'pilotName'> {
  const stats = {
    totalFlightHours: 0,
    picHours: 0,
    instructorHours: 0,
    dualReceivedHours: 0,
    singleEngineDayHours: 0,
    singleEngineNightHours: 0,
    multiEngineDayHours: 0,
    multiEngineNightHours: 0,
    crossCountryHours: 0,
    nightFlyingHours: 0,
    actualImcHours: 0,
    hoodHours: 0,
    simulatorHours: 0,
    ifrApproaches: 0,
    totalFlights: flights.length,
    dayTakeoffsLandings: 0,
    nightTakeoffsLandings: 0,
    aircraftTypes: new Map<string, number>(),
    firstFlightDate: null as Date | null,
    lastFlightDate: null as Date | null,
  };

  for (const flight of flights) {
    // Total hours
    stats.totalFlightHours += flight.flightHours;

    // PIC hours (sum of all PIC columns)
    stats.picHours += (flight.seDayPic ?? 0) + (flight.seNightPic ?? 0) +
      (flight.meDayPic ?? 0) + (flight.meNightPic ?? 0) +
      (flight.xcDayPic ?? 0) + (flight.xcNightPic ?? 0);

    // Instructor and dual
    stats.instructorHours += flight.asFlightInstructor ?? 0;
    stats.dualReceivedHours += flight.dualReceived ?? 0;

    // Single engine
    stats.singleEngineDayHours += (flight.seDayDual ?? 0) + (flight.seDayPic ?? 0) + (flight.seDayCopilot ?? 0);
    stats.singleEngineNightHours += (flight.seNightDual ?? 0) + (flight.seNightPic ?? 0) + (flight.seNightCopilot ?? 0);

    // Multi engine
    stats.multiEngineDayHours += (flight.meDayDual ?? 0) + (flight.meDayPic ?? 0) + (flight.meDayCopilot ?? 0);
    stats.multiEngineNightHours += (flight.meNightDual ?? 0) + (flight.meNightPic ?? 0) + (flight.meNightCopilot ?? 0);

    // Cross country
    stats.crossCountryHours += (flight.xcDayDual ?? 0) + (flight.xcDayPic ?? 0) + (flight.xcDayCopilot ?? 0) +
      (flight.xcNightDual ?? 0) + (flight.xcNightPic ?? 0) + (flight.xcNightCopilot ?? 0);

    // Night flying
    stats.nightFlyingHours += (flight.seNightDual ?? 0) + (flight.seNightPic ?? 0) + (flight.seNightCopilot ?? 0) +
      (flight.meNightDual ?? 0) + (flight.meNightPic ?? 0) + (flight.meNightCopilot ?? 0);

    // Instrument
    stats.actualImcHours += flight.actualImc ?? 0;
    stats.hoodHours += flight.hood ?? 0;
    stats.simulatorHours += flight.simulator ?? 0;
    stats.ifrApproaches += flight.ifrApproaches ?? 0;

    // Takeoffs/landings
    stats.dayTakeoffsLandings += flight.dayTakeoffsLandings ?? 0;
    stats.nightTakeoffsLandings += flight.nightTakeoffsLandings ?? 0;

    // Aircraft types
    if (flight.aircraftMakeModel) {
      const current = stats.aircraftTypes.get(flight.aircraftMakeModel) ?? 0;
      stats.aircraftTypes.set(flight.aircraftMakeModel, current + flight.flightHours);
    }

    // Date range - flight.flightDate is a string from the database
    const flightDate = new Date(flight.flightDate);
    if (!stats.firstFlightDate || flightDate < stats.firstFlightDate) {
      stats.firstFlightDate = flightDate;
    }
    if (!stats.lastFlightDate || flightDate > stats.lastFlightDate) {
      stats.lastFlightDate = flightDate;
    }
  }

  // Convert Map to array for JSON serialization, sorted by hours descending
  const aircraftArray = Array.from(stats.aircraftTypes.entries())
    .sort((a, b) => b[1] - a[1]);

  return {
    ...stats,
    aircraftTypes: aircraftArray,
    firstFlightDate: stats.firstFlightDate?.toISOString() ?? null,
    lastFlightDate: stats.lastFlightDate?.toISOString() ?? null,
  };
}

/**
 * GET /api/portfolio
 * Returns portfolio stats calculated from database flights
 */
export async function GET() {
  try {
    // Get user ID from session cookie
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "No session found" },
        { status: 401 }
      );
    }

    // Fetch flights from database for the session user
    const flights = await getFlights(userId);
    
    // Get pilot name from user settings
    const userSettings = await getUserSettings(userId);
    const pilotName = userSettings?.pilotName || "Pilot";

    // Calculate stats
    const stats = calculateStatsFromFlights(flights);

    const response: PortfolioStatsResponse = {
      ...stats,
      pilotName,
    };

    // Return with no-cache headers to ensure fresh data
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error("Portfolio stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch portfolio stats" },
      { status: 500 }
    );
  }
}
