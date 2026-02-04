/**
 * PDF Export API Route
 * Generates TCCA-compliant PDF from flight data
 */

import { NextRequest, NextResponse } from "next/server";
import { generateTCCAPdf, getPdfPageCount } from "@/lib/export/pdf-generator";
import type { ParsedFlight } from "@/lib/import/types";

/**
 * POST /api/export/pdf
 * Generate PDF from flight data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { flights } = body as { flights: ParsedFlight[] };
    
    if (!flights || !Array.isArray(flights) || flights.length === 0) {
      return NextResponse.json(
        { error: "No flight data provided" },
        { status: 400 }
      );
    }
    
    // Convert date strings back to Date objects
    const parsedFlights: ParsedFlight[] = flights.map((f) => ({
      ...f,
      flightDate: new Date(f.flightDate),
    }));
    
    // Generate PDF
    const pdfBytes = await generateTCCAPdf(parsedFlights);
    
    // Generate filename
    const dateStr = new Date().toISOString().split("T")[0];
    const fileName = `Logbook_${dateStr}.pdf`;
    
    // Return PDF as download
    return new Response(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "X-Total-Pages": String(getPdfPageCount(parsedFlights.length)),
        "X-Total-Flights": String(parsedFlights.length),
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
