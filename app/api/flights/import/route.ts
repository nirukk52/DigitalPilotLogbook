/**
 * API route for importing flights from parsed Excel data
 * Replaces all existing flights for the user with new import
 */
import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { saveFlights } from "@/lib/db/queries";
import type { ParsedFlight } from "@/lib/import/types";

/**
 * POST /api/flights/import
 * Saves parsed flight data to the database for the current user
 * Replaces all existing flights with the new import
 */
export async function POST(request: NextRequest) {
  try {
    // Get user session
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "No session found" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { flights } = body as { flights: ParsedFlight[] };

    if (!flights || !Array.isArray(flights)) {
      return NextResponse.json(
        { error: "Invalid request: flights array required" },
        { status: 400 }
      );
    }

    if (flights.length === 0) {
      return NextResponse.json(
        { error: "No flights to import" },
        { status: 400 }
      );
    }

    // Transform ParsedFlight to database format
    const flightData = flights.map((flight) => ({
      flightDate: new Date(flight.flightDate).toISOString().split("T")[0],
      aircraftMakeModel: flight.aircraftMakeModel,
      registration: flight.registration,
      pilotInCommand: flight.pilotInCommand,
      copilotOrStudent: flight.copilotOrStudent,
      departureAirport: flight.departureAirport,
      arrivalAirport: flight.arrivalAirport,
      remarks: flight.remarks,
      // Single-engine time
      seDayDual: flight.seDayDual,
      seDayPic: flight.seDayPic,
      seDayCopilot: flight.seDayCopilot,
      seNightDual: flight.seNightDual,
      seNightPic: flight.seNightPic,
      seNightCopilot: flight.seNightCopilot,
      // Multi-engine time
      meDayDual: flight.meDayDual,
      meDayPic: flight.meDayPic,
      meDayCopilot: flight.meDayCopilot,
      meNightDual: flight.meNightDual,
      meNightPic: flight.meNightPic,
      meNightCopilot: flight.meNightCopilot,
      // Cross-country time
      xcDayDual: flight.xcDayDual,
      xcDayPic: flight.xcDayPic,
      xcDayCopilot: flight.xcDayCopilot,
      xcNightDual: flight.xcNightDual,
      xcNightPic: flight.xcNightPic,
      xcNightCopilot: flight.xcNightCopilot,
      // Takeoffs/Landings
      dayTakeoffsLandings: flight.dayTakeoffsLandings,
      nightTakeoffsLandings: flight.nightTakeoffsLandings,
      // Instrument
      actualImc: flight.actualImc,
      hood: flight.hood,
      simulator: flight.simulator,
      ifrApproaches: flight.ifrApproaches,
      holding: flight.holding,
      // Instructor/Dual
      asFlightInstructor: flight.asFlightInstructor,
      dualReceived: flight.dualReceived,
      // Duty
      timeOn: flight.timeOn,
      timeOff: flight.timeOff,
      totalDuty: flight.totalDuty,
      // Computed
      flightHours: flight.flightHours,
    }));

    // Save to database (replaces existing flights)
    const result = await saveFlights(flightData, userId);

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${result.inserted} flights`,
      inserted: result.inserted,
      deleted: result.deleted,
    });
  } catch (error) {
    console.error("Flight import error:", error);
    return NextResponse.json(
      { error: "Failed to import flights" },
      { status: 500 }
    );
  }
}
