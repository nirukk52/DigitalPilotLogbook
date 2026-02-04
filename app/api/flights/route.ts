/**
 * API route for creating individual flights via quick entry
 * POST /api/flights - Creates a single flight with calculated buckets for the current session user
 */

import { NextRequest, NextResponse } from "next/server";
import { insertFlight } from "@/lib/db/queries";
import { buildCalculatedFlight } from "@/lib/flights/calculation-engine";
import { getSessionUserId } from "@/lib/session";
import type { FlightRole, FlightTag } from "@/lib/flights/types";

interface CreateFlightRequest {
  flightDate: string;
  aircraftMakeModel: string;
  registration: string;
  role: FlightRole;
  flightTime: number;
  route?: string;
  tags?: FlightTag[];
  remarks?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get user ID from session cookie
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "No session found" },
        { status: 401 }
      );
    }

    const body: CreateFlightRequest = await request.json();
    
    // Validate required fields
    if (!body.flightDate) {
      return NextResponse.json(
        { success: false, error: "Flight date is required" },
        { status: 400 }
      );
    }
    if (!body.aircraftMakeModel) {
      return NextResponse.json(
        { success: false, error: "Aircraft is required" },
        { status: 400 }
      );
    }
    if (!body.registration) {
      return NextResponse.json(
        { success: false, error: "Registration is required" },
        { status: 400 }
      );
    }
    if (!body.flightTime || body.flightTime <= 0) {
      return NextResponse.json(
        { success: false, error: "Flight time must be greater than 0" },
        { status: 400 }
      );
    }

    // Build calculated flight from quick entry input
    const calculatedFlight = buildCalculatedFlight({
      flightDate: new Date(body.flightDate),
      aircraftMakeModel: body.aircraftMakeModel,
      registration: body.registration,
      role: body.role,
      flightTime: body.flightTime,
      route: body.route,
      tags: body.tags,
      remarks: body.remarks,
    });

    // Convert Date to string for database (drizzle expects string for date type)
    const flightData = {
      ...calculatedFlight,
      flightDate: body.flightDate,
    };

    // Insert single flight (not replace all)
    const saved = await insertFlight(flightData, userId);

    return NextResponse.json({
      success: true,
      flight: {
        id: saved.id,
        flightDate: saved.flightDate,
        aircraftMakeModel: saved.aircraftMakeModel,
        registration: saved.registration,
        flightHours: saved.flightHours,
      },
      message: `Flight saved successfully (ID: ${saved.id})`,
    });
  } catch (error) {
    console.error("Error creating flight:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to create flight" 
      },
      { status: 500 }
    );
  }
}
