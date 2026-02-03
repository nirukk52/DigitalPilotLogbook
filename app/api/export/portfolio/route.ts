/**
 * Portfolio Export API Route
 * Generates pilot portfolio HTML from flight data
 */

import { NextRequest, NextResponse } from "next/server";
import { calculatePortfolioStats, generatePortfolioHtml } from "@/lib/export/portfolio-generator";
import type { ParsedFlight } from "@/lib/import/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { flights, pilotName } = body as { flights: ParsedFlight[]; pilotName?: string };
    
    if (!flights || !Array.isArray(flights) || flights.length === 0) {
      return NextResponse.json(
        { error: "No flight data provided" },
        { status: 400 }
      );
    }
    
    // Convert date strings back to Date objects (JSON serialization converts them)
    const parsedFlights = flights.map((f) => ({
      ...f,
      flightDate: new Date(f.flightDate),
    }));
    
    // Calculate statistics
    const stats = calculatePortfolioStats(parsedFlights);
    
    // Generate HTML
    const html = generatePortfolioHtml(stats, pilotName || "Pilot");
    
    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Portfolio generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate portfolio" },
      { status: 500 }
    );
  }
}
