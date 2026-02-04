/**
 * Pilot Name Determination Utility
 * Shared logic for determining the logbook owner from flight data
 * Used by both portfolio-generator (import preview) and API routes (database)
 */

import type { ParsedFlight } from "@/lib/import/types";
import type { Flight } from "@/lib/db/schema";

/**
 * Formats a name string to Title Case
 * E.g., "JOHN DOE" -> "John Doe"
 */
export function formatNameTitleCase(name: string): string {
  return name
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Flight data interface for pilot name calculation
 * Common fields needed from both ParsedFlight and Flight types
 */
interface FlightForNameCalc {
  pilotInCommand?: string | null;
  copilotOrStudent?: string | null;
  asFlightInstructor?: number | null;
  dualReceived?: number | null;
  seDayPic?: number | null;
  seNightPic?: number | null;
  meDayPic?: number | null;
  meNightPic?: number | null;
  xcDayPic?: number | null;
  xcNightPic?: number | null;
}

/**
 * Determines the logbook owner's name from flight data using weighted scoring
 * 
 * The logbook owner is identified by analyzing who accumulates hours:
 * 1. Instructor time (×3 weight) - strong signal they're building CFI hours
 * 2. PIC hours (×1 weight) - they're flying as pilot in command
 * 3. Dual received as copilot/student (×2 weight) - they're the student
 * 
 * @param flights - Array of flight records (ParsedFlight or Flight from DB)
 * @returns The determined pilot name in Title Case, or "Pilot" if no data
 */
export function determineLogbookOwner(flights: FlightForNameCalc[]): string {
  const nameScores = new Map<string, number>();
  
  for (const flight of flights) {
    // Instructor time - heavy weight (×3)
    // If someone logs instructor time, they're building their hours as instructor
    if (flight.asFlightInstructor && flight.asFlightInstructor > 0) {
      if (flight.pilotInCommand) {
        const name = flight.pilotInCommand.toUpperCase().trim();
        const current = nameScores.get(name) ?? 0;
        nameScores.set(name, current + (flight.asFlightInstructor * 3));
      }
    }
    
    // PIC time - standard weight (×1)
    // The person flying as PIC is building their hours
    const picHours = (flight.seDayPic ?? 0) + (flight.seNightPic ?? 0) +
      (flight.meDayPic ?? 0) + (flight.meNightPic ?? 0) +
      (flight.xcDayPic ?? 0) + (flight.xcNightPic ?? 0);
    
    if (picHours > 0 && flight.pilotInCommand) {
      const name = flight.pilotInCommand.toUpperCase().trim();
      const current = nameScores.get(name) ?? 0;
      nameScores.set(name, current + picHours);
    }
    
    // Dual received - medium weight (×2)
    // The student receiving instruction is the logbook owner
    if (flight.dualReceived && flight.dualReceived > 0) {
      if (flight.copilotOrStudent) {
        const name = flight.copilotOrStudent.toUpperCase().trim();
        const current = nameScores.get(name) ?? 0;
        nameScores.set(name, current + (flight.dualReceived * 2));
      }
    }
  }
  
  // Find the name with highest score
  let maxScore = 0;
  let owner = "Pilot";
  
  for (const [name, score] of nameScores.entries()) {
    if (score > maxScore && name.length > 0) {
      maxScore = score;
      owner = name;
    }
  }
  
  return formatNameTitleCase(owner);
}

// Re-export for backwards compatibility with existing imports
export type { FlightForNameCalc };
