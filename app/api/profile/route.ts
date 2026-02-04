/**
 * API route for pilot profile management
 * POST /api/profile - Save pilot profile (name, home base, instructor)
 * GET /api/profile - Get current pilot profile
 */

import { NextRequest, NextResponse } from "next/server";
import { savePilotProfile, getUserSettings } from "@/lib/db/queries";
import { getSessionUserId } from "@/lib/session";

interface SaveProfileRequest {
  pilotName: string;
  homeBase: string;
  defaultInstructor?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SaveProfileRequest = await request.json();
    
    // Validate required fields
    if (!body.pilotName?.trim()) {
      return NextResponse.json(
        { success: false, error: "Pilot name is required" },
        { status: 400 }
      );
    }
    if (!body.homeBase?.trim()) {
      return NextResponse.json(
        { success: false, error: "Home base is required" },
        { status: 400 }
      );
    }

    // Save profile
    const saved = await savePilotProfile({
      pilotName: body.pilotName.trim(),
      homeBase: body.homeBase.trim().toUpperCase(),
      defaultInstructor: body.defaultInstructor?.trim(),
    }, "default");

    return NextResponse.json({
      success: true,
      profile: {
        pilotName: saved.pilotName,
        homeBase: saved.homeBase,
        defaultInstructor: saved.defaultInstructor,
      },
      message: "Profile saved successfully",
    });
  } catch (error) {
    console.error("Error saving profile:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to save profile" 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const sessionId = await getSessionUserId();
    const settings = await getUserSettings("default");
    
    if (!settings) {
      return NextResponse.json({
        success: true,
        profile: null,
        hasProfile: false,
        sessionId,
      });
    }

    return NextResponse.json({
      success: true,
      profile: {
        pilotName: settings.pilotName,
        homeBase: settings.homeBase,
        defaultInstructor: settings.defaultInstructor,
      },
      hasProfile: !!(settings.pilotName && settings.homeBase),
      sessionId,
    });
  } catch (error) {
    console.error("Error getting profile:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to get profile" 
      },
      { status: 500 }
    );
  }
}
