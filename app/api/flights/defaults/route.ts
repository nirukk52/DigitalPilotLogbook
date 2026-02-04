/**
 * API route for getting smart defaults for quick flight entry
 * GET /api/flights/defaults - Returns pre-fill values and autocomplete data
 */

import { NextResponse } from "next/server";
import { getSmartDefaults } from "@/lib/flights/defaults";

export async function GET() {
  try {
    const defaults = await getSmartDefaults("default");

    return NextResponse.json({
      success: true,
      ...defaults,
    });
  } catch (error) {
    console.error("Error getting flight defaults:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to get defaults" 
      },
      { status: 500 }
    );
  }
}
