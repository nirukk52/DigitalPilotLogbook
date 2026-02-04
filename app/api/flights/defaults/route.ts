/**
 * API route for getting smart defaults for quick flight entry
 * GET /api/flights/defaults - Returns pre-fill values and autocomplete data for the current session user
 */

import { NextResponse } from "next/server";
import { getSmartDefaults } from "@/lib/flights/defaults";
import { getSessionUserId } from "@/lib/session";

export async function GET() {
  try {
    // Get user ID from session cookie
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "No session found" },
        { status: 401 }
      );
    }

    const defaults = await getSmartDefaults(userId);

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
