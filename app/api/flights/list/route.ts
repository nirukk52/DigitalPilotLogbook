/**
 * API route for listing flights
 * GET /api/flights/list - Returns paginated list of flights
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { flights } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Fetch flights ordered by date descending (most recent first)
    const result = await db
      .select()
      .from(flights)
      .where(eq(flights.userId, "default"))
      .orderBy(desc(flights.flightDate), desc(flights.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      flights: result,
      count: result.length,
    });
  } catch (error) {
    console.error("Error listing flights:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to list flights",
        flights: [],
      },
      { status: 500 }
    );
  }
}
