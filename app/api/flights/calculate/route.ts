/**
 * API route for calculating time buckets without saving
 * POST /api/flights/calculate - Returns calculated buckets for preview
 */

import { NextRequest, NextResponse } from "next/server";
import { calculateBuckets } from "@/lib/flights/calculation-engine";
import type { FlightRole, FlightTag } from "@/lib/flights/types";

interface CalculateRequest {
  aircraftMakeModel: string;
  role: FlightRole;
  flightTime: number;
  tags?: FlightTag[];
}

export async function POST(request: NextRequest) {
  try {
    const body: CalculateRequest = await request.json();
    
    // Validate required fields
    if (!body.aircraftMakeModel) {
      return NextResponse.json(
        { success: false, error: "Aircraft is required" },
        { status: 400 }
      );
    }
    if (!body.flightTime || body.flightTime <= 0) {
      return NextResponse.json(
        { success: false, error: "Flight time must be greater than 0" },
        { status: 400 }
      );
    }

    // Calculate buckets
    const result = calculateBuckets({
      flightDate: new Date(),  // Not used for calculation
      aircraftMakeModel: body.aircraftMakeModel,
      registration: "",  // Not used for calculation
      role: body.role,
      flightTime: body.flightTime,
      tags: body.tags,
    });

    return NextResponse.json({
      success: true,
      buckets: result.buckets,
      flightHours: result.flightHours,
      warnings: result.warnings,
    });
  } catch (error) {
    console.error("Error calculating buckets:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to calculate buckets" 
      },
      { status: 500 }
    );
  }
}
