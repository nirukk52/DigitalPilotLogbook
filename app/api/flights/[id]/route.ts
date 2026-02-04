/**
 * API route for individual flight operations
 * GET /api/flights/[id] - Get single flight
 * PUT /api/flights/[id] - Update existing flight
 * DELETE /api/flights/[id] - Delete flight
 */

import { NextRequest, NextResponse } from "next/server";
import { getFlightById, updateFlight, deleteFlight } from "@/lib/db/queries";
import { buildCalculatedFlight } from "@/lib/flights/calculation-engine";
import type { FlightRole, FlightTag } from "@/lib/flights/types";

interface UpdateFlightRequest {
  flightDate: string;
  aircraftMakeModel: string;
  registration: string;
  role: FlightRole;
  flightTime: number;
  route?: string;
  tags?: FlightTag[];
  remarks?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const flightId = parseInt(id, 10);
    
    if (isNaN(flightId)) {
      return NextResponse.json(
        { success: false, error: "Invalid flight ID" },
        { status: 400 }
      );
    }

    const flight = await getFlightById(flightId, "default");
    
    if (!flight) {
      return NextResponse.json(
        { success: false, error: "Flight not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      flight,
    });
  } catch (error) {
    console.error("Error getting flight:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to get flight" 
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const flightId = parseInt(id, 10);
    
    if (isNaN(flightId)) {
      return NextResponse.json(
        { success: false, error: "Invalid flight ID" },
        { status: 400 }
      );
    }

    const body: UpdateFlightRequest = await request.json();
    
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

    // Check flight exists
    const existing = await getFlightById(flightId, "default");
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Flight not found" },
        { status: 404 }
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

    // Convert Date to string for database
    const flightData = {
      ...calculatedFlight,
      flightDate: body.flightDate,
    };

    const updated = await updateFlight(flightId, flightData, "default");

    return NextResponse.json({
      success: true,
      flight: {
        id: updated.id,
        flightDate: updated.flightDate,
        aircraftMakeModel: updated.aircraftMakeModel,
        registration: updated.registration,
        flightHours: updated.flightHours,
      },
      message: `Flight ${flightId} updated successfully`,
    });
  } catch (error) {
    console.error("Error updating flight:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to update flight" 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const flightId = parseInt(id, 10);
    
    if (isNaN(flightId)) {
      return NextResponse.json(
        { success: false, error: "Invalid flight ID" },
        { status: 400 }
      );
    }

    // Check flight exists
    const existing = await getFlightById(flightId, "default");
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Flight not found" },
        { status: 404 }
      );
    }

    await deleteFlight(flightId, "default");

    return NextResponse.json({
      success: true,
      message: `Flight ${flightId} deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting flight:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to delete flight" 
      },
      { status: 500 }
    );
  }
}
