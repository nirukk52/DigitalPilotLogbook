/**
 * Flight Data Aggregation Module - SINGLE SOURCE OF TRUTH
 * 
 * This module contains ALL calculation logic for flight data.
 * Every dashboard, report, and verification script MUST use these functions.
 * 
 * CRITICAL DEFINITIONS (per TCCA/FAA/EASA standards):
 * 
 * 1. TOTAL FLIGHT HOURS = Single-Engine + Multi-Engine time ONLY
 *    - Simulator time is ALWAYS tracked separately
 *    - This is the number that goes on your licence application
 * 
 * 2. TOTAL FLIGHTS = All logbook entries (including simulator sessions)
 * 
 * 3. AIRCRAFT FLIGHTS = Flights with actual aircraft time (excludes simulator-only)
 * 
 * 4. SIMULATOR FLIGHTS = Sessions with only simulator time, no aircraft time
 * 
 * 5. XC TIME = Cross-country time is a QUALIFIER (subset of PIC/Dual), not additive
 */

import type { ParsedFlight } from "@/lib/import/types";

// ============================================================================
// Types - Core interfaces used throughout the application
// ============================================================================

/**
 * Common interface for flight data with time buckets
 * Works with both ParsedFlight and DB Flight records
 */
export interface FlightWithBuckets {
  flightDate: Date | string;
  aircraftMakeModel: string;
  registration: string;
  flightHours: number;
  // Single-engine
  seDayDual: number | null;
  seDayPic: number | null;
  seDayCopilot: number | null;
  seNightDual: number | null;
  seNightPic: number | null;
  seNightCopilot: number | null;
  // Multi-engine
  meDayDual: number | null;
  meDayPic: number | null;
  meDayCopilot: number | null;
  meNightDual: number | null;
  meNightPic: number | null;
  meNightCopilot: number | null;
  // Cross-country
  xcDayDual: number | null;
  xcDayPic: number | null;
  xcDayCopilot: number | null;
  xcNightDual: number | null;
  xcNightPic: number | null;
  xcNightCopilot: number | null;
  // Takeoffs/Landings
  dayTakeoffsLandings: number | null;
  nightTakeoffsLandings: number | null;
  // Instrument
  actualImc: number | null;
  hood: number | null;
  simulator: number | null;
  ifrApproaches: number | null;
  holding: number | null;
  // Instructor/Dual
  asFlightInstructor: number | null;
  dualReceived: number | null;
}

/**
 * Grand totals - matches Excel Dashboard "TOTALS" row exactly
 * 
 * IMPORTANT: This structure matches what pilots expect to see on their logbook summary
 */
export interface FlightTotals {
  // ========== COUNT METRICS ==========
  /** All logbook entries (aircraft + simulator) */
  totalFlights: number;
  /** Flights with actual aircraft time (excludes simulator-only) */
  aircraftFlights: number;
  /** Simulator-only sessions */
  simulatorFlights: number;
  
  // ========== PRIMARY HOURS (what goes on licence applications) ==========
  /** SE + ME time only (NO simulator) - THIS IS YOUR TOTAL TIME */
  totalHours: number;
  /** All PIC time (SE + ME) */
  totalPic: number;
  /** All Dual time (SE + ME) */
  totalDual: number;
  /** All Copilot/SIC time */
  totalCopilot: number;
  /** All night time */
  totalNight: number;
  /** All cross-country time (qualifier, subset of PIC/Dual) */
  totalXC: number;
  /** Actual IMC + Hood time (NOT simulator) */
  totalInstrument: number;
  /** Simulator time (tracked separately) */
  totalSimulator: number;
  
  // ========== SINGLE-ENGINE BREAKDOWN ==========
  seDayDual: number;
  seDayPic: number;
  seDayCopilot: number;
  seNightDual: number;
  seNightPic: number;
  seNightCopilot: number;
  /** SE Day subtotal */
  seDayTotal: number;
  /** SE Night subtotal */
  seNightTotal: number;
  /** SE Total (Day + Night) */
  seTotal: number;
  
  // ========== MULTI-ENGINE BREAKDOWN ==========
  meDayDual: number;
  meDayPic: number;
  meDayCopilot: number;
  meNightDual: number;
  meNightPic: number;
  meNightCopilot: number;
  /** ME Day subtotal */
  meDayTotal: number;
  /** ME Night subtotal */
  meNightTotal: number;
  /** ME Total (Day + Night) */
  meTotal: number;
  
  // ========== CROSS-COUNTRY BREAKDOWN ==========
  xcDayDual: number;
  xcDayPic: number;
  xcDayCopilot: number;
  xcNightDual: number;
  xcNightPic: number;
  xcNightCopilot: number;
  /** XC Day subtotal */
  xcDayTotal: number;
  /** XC Night subtotal */
  xcNightTotal: number;
  
  // ========== INSTRUMENT ==========
  actualImc: number;
  hood: number;
  
  // ========== INSTRUCTOR/DUAL ==========
  asFlightInstructor: number;
  dualReceived: number;
  
  // ========== COUNTS (not hours) ==========
  dayTakeoffsLandings: number;
  nightTakeoffsLandings: number;
  ifrApproaches: number;
  holding: number;
}

/**
 * Per-aircraft summary for dashboard display
 */
export interface AircraftSummary {
  aircraftType: string;
  /** SE + ME hours (no simulator) */
  totalHours: number;
  numFlights: number;
  daysSinceLastFlight: number | null;
  lastFlightDate: Date | null;
  /** Is this a simulator type? */
  isSimulator: boolean;
  
  // All bucket totals
  seDayDual: number;
  seDayPic: number;
  seDayCopilot: number;
  seNightDual: number;
  seNightPic: number;
  seNightCopilot: number;
  meDayDual: number;
  meDayPic: number;
  meDayCopilot: number;
  meNightDual: number;
  meNightPic: number;
  meNightCopilot: number;
  xcDayDual: number;
  xcDayPic: number;
  xcDayCopilot: number;
  xcNightDual: number;
  xcNightPic: number;
  xcNightCopilot: number;
  dayTakeoffsLandings: number;
  nightTakeoffsLandings: number;
  actualImc: number;
  hood: number;
  simulator: number;
  ifrApproaches: number;
  holding: number;
  asFlightInstructor: number;
  dualReceived: number;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Round a number to 1 decimal place
 * Standard rounding for all flight time calculations
 */
export function round1(value: number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return Math.round(value * 10) / 10;
}

/**
 * Safely get a numeric value, defaulting to 0 for null/undefined
 */
function safeNum(value: number | null | undefined): number {
  return value ?? 0;
}

// ============================================================================
// Single Flight Calculations - Building blocks
// ============================================================================

/**
 * Calculate SE (single-engine) time for a flight
 */
export function calculateSETime(flight: FlightWithBuckets): number {
  return safeNum(flight.seDayDual) + safeNum(flight.seDayPic) + safeNum(flight.seDayCopilot) +
         safeNum(flight.seNightDual) + safeNum(flight.seNightPic) + safeNum(flight.seNightCopilot);
}

/**
 * Calculate ME (multi-engine) time for a flight
 */
export function calculateMETime(flight: FlightWithBuckets): number {
  return safeNum(flight.meDayDual) + safeNum(flight.meDayPic) + safeNum(flight.meDayCopilot) +
         safeNum(flight.meNightDual) + safeNum(flight.meNightPic) + safeNum(flight.meNightCopilot);
}

/**
 * Calculate total AIRCRAFT hours for a single flight
 * 
 * FORMULA: SE + ME (NO simulator)
 * This is the standard used by TCCA/FAA/EASA
 */
export function calculateTotalHours(flight: FlightWithBuckets): number {
  return round1(calculateSETime(flight) + calculateMETime(flight));
}

/**
 * Calculate total PIC time for a single flight
 */
export function calculatePicTime(flight: FlightWithBuckets): number {
  return round1(
    safeNum(flight.seDayPic) + safeNum(flight.seNightPic) +
    safeNum(flight.meDayPic) + safeNum(flight.meNightPic)
  );
}

/**
 * Calculate total Dual time for a single flight
 */
export function calculateDualTime(flight: FlightWithBuckets): number {
  return round1(
    safeNum(flight.seDayDual) + safeNum(flight.seNightDual) +
    safeNum(flight.meDayDual) + safeNum(flight.meNightDual)
  );
}

/**
 * Calculate total Copilot/SIC time for a single flight
 */
export function calculateCopilotTime(flight: FlightWithBuckets): number {
  return round1(
    safeNum(flight.seDayCopilot) + safeNum(flight.seNightCopilot) +
    safeNum(flight.meDayCopilot) + safeNum(flight.meNightCopilot)
  );
}

/**
 * Calculate total night time for a single flight
 */
export function calculateNightTime(flight: FlightWithBuckets): number {
  return round1(
    safeNum(flight.seNightDual) + safeNum(flight.seNightPic) + safeNum(flight.seNightCopilot) +
    safeNum(flight.meNightDual) + safeNum(flight.meNightPic) + safeNum(flight.meNightCopilot)
  );
}

/**
 * Calculate total cross-country time for a single flight
 */
export function calculateXCTime(flight: FlightWithBuckets): number {
  return round1(
    safeNum(flight.xcDayDual) + safeNum(flight.xcDayPic) + safeNum(flight.xcDayCopilot) +
    safeNum(flight.xcNightDual) + safeNum(flight.xcNightPic) + safeNum(flight.xcNightCopilot)
  );
}

/**
 * Calculate total instrument time for a single flight
 * NOTE: This is ACTUAL instrument time (IMC + Hood), NOT simulator
 */
export function calculateInstrumentTime(flight: FlightWithBuckets): number {
  return round1(safeNum(flight.actualImc) + safeNum(flight.hood));
}

/**
 * Check if a flight is simulator-only (no actual aircraft time)
 * 
 * A simulator-only flight has:
 * - Zero SE + ME time
 * - Positive simulator time
 */
export function isSimulatorOnly(flight: FlightWithBuckets): boolean {
  const aircraftTime = calculateSETime(flight) + calculateMETime(flight);
  return aircraftTime === 0 && safeNum(flight.simulator) > 0;
}

// ============================================================================
// Aggregation Functions - Calculate totals from flight arrays
// ============================================================================

/**
 * Calculate grand totals across all flights
 * 
 * This is the main aggregation function - use this for dashboard totals
 */
export function aggregateFlightTotals(flights: FlightWithBuckets[]): FlightTotals {
  // Initialize all totals to 0
  const totals: FlightTotals = {
    totalFlights: flights.length,
    aircraftFlights: 0,
    simulatorFlights: 0,
    totalHours: 0,
    totalPic: 0,
    totalDual: 0,
    totalCopilot: 0,
    totalNight: 0,
    totalXC: 0,
    totalInstrument: 0,
    totalSimulator: 0,
    seDayDual: 0,
    seDayPic: 0,
    seDayCopilot: 0,
    seNightDual: 0,
    seNightPic: 0,
    seNightCopilot: 0,
    seDayTotal: 0,
    seNightTotal: 0,
    seTotal: 0,
    meDayDual: 0,
    meDayPic: 0,
    meDayCopilot: 0,
    meNightDual: 0,
    meNightPic: 0,
    meNightCopilot: 0,
    meDayTotal: 0,
    meNightTotal: 0,
    meTotal: 0,
    xcDayDual: 0,
    xcDayPic: 0,
    xcDayCopilot: 0,
    xcNightDual: 0,
    xcNightPic: 0,
    xcNightCopilot: 0,
    xcDayTotal: 0,
    xcNightTotal: 0,
    actualImc: 0,
    hood: 0,
    asFlightInstructor: 0,
    dualReceived: 0,
    dayTakeoffsLandings: 0,
    nightTakeoffsLandings: 0,
    ifrApproaches: 0,
    holding: 0,
  };
  
  // Accumulate values from all flights
  for (const f of flights) {
    // Count flight types
    if (isSimulatorOnly(f)) {
      totals.simulatorFlights++;
    } else {
      totals.aircraftFlights++;
    }
    
    // Single-engine buckets
    totals.seDayDual += safeNum(f.seDayDual);
    totals.seDayPic += safeNum(f.seDayPic);
    totals.seDayCopilot += safeNum(f.seDayCopilot);
    totals.seNightDual += safeNum(f.seNightDual);
    totals.seNightPic += safeNum(f.seNightPic);
    totals.seNightCopilot += safeNum(f.seNightCopilot);
    
    // Multi-engine buckets
    totals.meDayDual += safeNum(f.meDayDual);
    totals.meDayPic += safeNum(f.meDayPic);
    totals.meDayCopilot += safeNum(f.meDayCopilot);
    totals.meNightDual += safeNum(f.meNightDual);
    totals.meNightPic += safeNum(f.meNightPic);
    totals.meNightCopilot += safeNum(f.meNightCopilot);
    
    // Cross-country buckets
    totals.xcDayDual += safeNum(f.xcDayDual);
    totals.xcDayPic += safeNum(f.xcDayPic);
    totals.xcDayCopilot += safeNum(f.xcDayCopilot);
    totals.xcNightDual += safeNum(f.xcNightDual);
    totals.xcNightPic += safeNum(f.xcNightPic);
    totals.xcNightCopilot += safeNum(f.xcNightCopilot);
    
    // Instrument
    totals.actualImc += safeNum(f.actualImc);
    totals.hood += safeNum(f.hood);
    totals.totalSimulator += safeNum(f.simulator);
    
    // Instructor/Dual
    totals.asFlightInstructor += safeNum(f.asFlightInstructor);
    totals.dualReceived += safeNum(f.dualReceived);
    
    // Counts
    totals.dayTakeoffsLandings += safeNum(f.dayTakeoffsLandings);
    totals.nightTakeoffsLandings += safeNum(f.nightTakeoffsLandings);
    totals.ifrApproaches += safeNum(f.ifrApproaches);
    totals.holding += safeNum(f.holding);
  }
  
  // Calculate derived totals (subtotals and rollups)
  
  // SE subtotals
  totals.seDayTotal = totals.seDayDual + totals.seDayPic + totals.seDayCopilot;
  totals.seNightTotal = totals.seNightDual + totals.seNightPic + totals.seNightCopilot;
  totals.seTotal = totals.seDayTotal + totals.seNightTotal;
  
  // ME subtotals
  totals.meDayTotal = totals.meDayDual + totals.meDayPic + totals.meDayCopilot;
  totals.meNightTotal = totals.meNightDual + totals.meNightPic + totals.meNightCopilot;
  totals.meTotal = totals.meDayTotal + totals.meNightTotal;
  
  // XC subtotals
  totals.xcDayTotal = totals.xcDayDual + totals.xcDayPic + totals.xcDayCopilot;
  totals.xcNightTotal = totals.xcNightDual + totals.xcNightPic + totals.xcNightCopilot;
  
  // Primary totals (what goes on licence applications)
  totals.totalHours = totals.seTotal + totals.meTotal; // NO simulator!
  totals.totalPic = totals.seDayPic + totals.seNightPic + totals.meDayPic + totals.meNightPic;
  totals.totalDual = totals.seDayDual + totals.seNightDual + totals.meDayDual + totals.meNightDual;
  totals.totalCopilot = totals.seDayCopilot + totals.seNightCopilot + totals.meDayCopilot + totals.meNightCopilot;
  totals.totalNight = totals.seNightTotal + totals.meNightTotal;
  totals.totalXC = totals.xcDayTotal + totals.xcNightTotal;
  totals.totalInstrument = totals.actualImc + totals.hood;
  
  // Round all values to 1 decimal
  return roundAllTotals(totals);
}

/**
 * Round all numeric values in FlightTotals to 1 decimal place
 */
function roundAllTotals(totals: FlightTotals): FlightTotals {
  return {
    ...totals,
    totalHours: round1(totals.totalHours),
    totalPic: round1(totals.totalPic),
    totalDual: round1(totals.totalDual),
    totalCopilot: round1(totals.totalCopilot),
    totalNight: round1(totals.totalNight),
    totalXC: round1(totals.totalXC),
    totalInstrument: round1(totals.totalInstrument),
    totalSimulator: round1(totals.totalSimulator),
    seDayDual: round1(totals.seDayDual),
    seDayPic: round1(totals.seDayPic),
    seDayCopilot: round1(totals.seDayCopilot),
    seNightDual: round1(totals.seNightDual),
    seNightPic: round1(totals.seNightPic),
    seNightCopilot: round1(totals.seNightCopilot),
    seDayTotal: round1(totals.seDayTotal),
    seNightTotal: round1(totals.seNightTotal),
    seTotal: round1(totals.seTotal),
    meDayDual: round1(totals.meDayDual),
    meDayPic: round1(totals.meDayPic),
    meDayCopilot: round1(totals.meDayCopilot),
    meNightDual: round1(totals.meNightDual),
    meNightPic: round1(totals.meNightPic),
    meNightCopilot: round1(totals.meNightCopilot),
    meDayTotal: round1(totals.meDayTotal),
    meNightTotal: round1(totals.meNightTotal),
    meTotal: round1(totals.meTotal),
    xcDayDual: round1(totals.xcDayDual),
    xcDayPic: round1(totals.xcDayPic),
    xcDayCopilot: round1(totals.xcDayCopilot),
    xcNightDual: round1(totals.xcNightDual),
    xcNightPic: round1(totals.xcNightPic),
    xcNightCopilot: round1(totals.xcNightCopilot),
    xcDayTotal: round1(totals.xcDayTotal),
    xcNightTotal: round1(totals.xcNightTotal),
    actualImc: round1(totals.actualImc),
    hood: round1(totals.hood),
    asFlightInstructor: round1(totals.asFlightInstructor),
    dualReceived: round1(totals.dualReceived),
  };
}

/**
 * Aggregate flights by aircraft type
 */
export function aggregateByAircraft(flights: FlightWithBuckets[]): AircraftSummary[] {
  const byAircraft = new Map<string, FlightWithBuckets[]>();
  
  // Group flights by aircraft type
  for (const flight of flights) {
    const key = flight.aircraftMakeModel;
    const existing = byAircraft.get(key) || [];
    existing.push(flight);
    byAircraft.set(key, existing);
  }
  
  const summaries: AircraftSummary[] = [];
  const today = new Date();
  
  for (const [aircraftType, aircraftFlights] of byAircraft) {
    // Find most recent flight date
    let lastFlightDate: Date | null = null;
    for (const f of aircraftFlights) {
      const fDate = f.flightDate instanceof Date ? f.flightDate : new Date(f.flightDate);
      if (!lastFlightDate || fDate > lastFlightDate) {
        lastFlightDate = fDate;
      }
    }
    
    const daysSinceLastFlight = lastFlightDate 
      ? Math.floor((today.getTime() - lastFlightDate.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    
    // Initialize summary
    const summary: AircraftSummary = {
      aircraftType,
      totalHours: 0,
      numFlights: aircraftFlights.length,
      daysSinceLastFlight,
      lastFlightDate,
      isSimulator: false,
      seDayDual: 0,
      seDayPic: 0,
      seDayCopilot: 0,
      seNightDual: 0,
      seNightPic: 0,
      seNightCopilot: 0,
      meDayDual: 0,
      meDayPic: 0,
      meDayCopilot: 0,
      meNightDual: 0,
      meNightPic: 0,
      meNightCopilot: 0,
      xcDayDual: 0,
      xcDayPic: 0,
      xcDayCopilot: 0,
      xcNightDual: 0,
      xcNightPic: 0,
      xcNightCopilot: 0,
      dayTakeoffsLandings: 0,
      nightTakeoffsLandings: 0,
      actualImc: 0,
      hood: 0,
      simulator: 0,
      ifrApproaches: 0,
      holding: 0,
      asFlightInstructor: 0,
      dualReceived: 0,
    };
    
    // Accumulate values
    for (const f of aircraftFlights) {
      summary.seDayDual += safeNum(f.seDayDual);
      summary.seDayPic += safeNum(f.seDayPic);
      summary.seDayCopilot += safeNum(f.seDayCopilot);
      summary.seNightDual += safeNum(f.seNightDual);
      summary.seNightPic += safeNum(f.seNightPic);
      summary.seNightCopilot += safeNum(f.seNightCopilot);
      summary.meDayDual += safeNum(f.meDayDual);
      summary.meDayPic += safeNum(f.meDayPic);
      summary.meDayCopilot += safeNum(f.meDayCopilot);
      summary.meNightDual += safeNum(f.meNightDual);
      summary.meNightPic += safeNum(f.meNightPic);
      summary.meNightCopilot += safeNum(f.meNightCopilot);
      summary.xcDayDual += safeNum(f.xcDayDual);
      summary.xcDayPic += safeNum(f.xcDayPic);
      summary.xcDayCopilot += safeNum(f.xcDayCopilot);
      summary.xcNightDual += safeNum(f.xcNightDual);
      summary.xcNightPic += safeNum(f.xcNightPic);
      summary.xcNightCopilot += safeNum(f.xcNightCopilot);
      summary.dayTakeoffsLandings += safeNum(f.dayTakeoffsLandings);
      summary.nightTakeoffsLandings += safeNum(f.nightTakeoffsLandings);
      summary.actualImc += safeNum(f.actualImc);
      summary.hood += safeNum(f.hood);
      summary.simulator += safeNum(f.simulator);
      summary.ifrApproaches += safeNum(f.ifrApproaches);
      summary.holding += safeNum(f.holding);
      summary.asFlightInstructor += safeNum(f.asFlightInstructor);
      summary.dualReceived += safeNum(f.dualReceived);
    }
    
    // Calculate total hours (SE + ME, no simulator)
    const seTime = summary.seDayDual + summary.seDayPic + summary.seDayCopilot +
                   summary.seNightDual + summary.seNightPic + summary.seNightCopilot;
    const meTime = summary.meDayDual + summary.meDayPic + summary.meDayCopilot +
                   summary.meNightDual + summary.meNightPic + summary.meNightCopilot;
    summary.totalHours = round1(seTime + meTime);
    
    // Determine if this is a simulator-only type
    summary.isSimulator = summary.totalHours === 0 && summary.simulator > 0;
    
    // Round all values
    summary.seDayDual = round1(summary.seDayDual);
    summary.seDayPic = round1(summary.seDayPic);
    summary.seDayCopilot = round1(summary.seDayCopilot);
    summary.seNightDual = round1(summary.seNightDual);
    summary.seNightPic = round1(summary.seNightPic);
    summary.seNightCopilot = round1(summary.seNightCopilot);
    summary.meDayDual = round1(summary.meDayDual);
    summary.meDayPic = round1(summary.meDayPic);
    summary.meDayCopilot = round1(summary.meDayCopilot);
    summary.meNightDual = round1(summary.meNightDual);
    summary.meNightPic = round1(summary.meNightPic);
    summary.meNightCopilot = round1(summary.meNightCopilot);
    summary.xcDayDual = round1(summary.xcDayDual);
    summary.xcDayPic = round1(summary.xcDayPic);
    summary.xcDayCopilot = round1(summary.xcDayCopilot);
    summary.xcNightDual = round1(summary.xcNightDual);
    summary.xcNightPic = round1(summary.xcNightPic);
    summary.xcNightCopilot = round1(summary.xcNightCopilot);
    summary.actualImc = round1(summary.actualImc);
    summary.hood = round1(summary.hood);
    summary.simulator = round1(summary.simulator);
    summary.asFlightInstructor = round1(summary.asFlightInstructor);
    summary.dualReceived = round1(summary.dualReceived);
    
    summaries.push(summary);
  }
  
  // Sort: Aircraft first (by hours desc), then simulators (by hours desc)
  return summaries.sort((a, b) => {
    // Simulators go to the bottom
    if (a.isSimulator && !b.isSimulator) return 1;
    if (!a.isSimulator && b.isSimulator) return -1;
    // Within each group, sort by total hours (for aircraft) or simulator hours (for sims)
    if (a.isSimulator && b.isSimulator) {
      return b.simulator - a.simulator;
    }
    return b.totalHours - a.totalHours;
  });
}

/**
 * Calculate grand total from aircraft summaries (for dashboard TOTALS row)
 */
export function calculateGrandTotalFromSummaries(summaries: AircraftSummary[]): AircraftSummary {
  const grandTotal: AircraftSummary = {
    aircraftType: "TOTALS",
    totalHours: 0,
    numFlights: 0,
    daysSinceLastFlight: null,
    lastFlightDate: null,
    isSimulator: false,
    seDayDual: 0,
    seDayPic: 0,
    seDayCopilot: 0,
    seNightDual: 0,
    seNightPic: 0,
    seNightCopilot: 0,
    meDayDual: 0,
    meDayPic: 0,
    meDayCopilot: 0,
    meNightDual: 0,
    meNightPic: 0,
    meNightCopilot: 0,
    xcDayDual: 0,
    xcDayPic: 0,
    xcDayCopilot: 0,
    xcNightDual: 0,
    xcNightPic: 0,
    xcNightCopilot: 0,
    dayTakeoffsLandings: 0,
    nightTakeoffsLandings: 0,
    actualImc: 0,
    hood: 0,
    simulator: 0,
    ifrApproaches: 0,
    holding: 0,
    asFlightInstructor: 0,
    dualReceived: 0,
  };
  
  for (const s of summaries) {
    grandTotal.totalHours += s.totalHours;
    grandTotal.numFlights += s.numFlights;
    grandTotal.seDayDual += s.seDayDual;
    grandTotal.seDayPic += s.seDayPic;
    grandTotal.seDayCopilot += s.seDayCopilot;
    grandTotal.seNightDual += s.seNightDual;
    grandTotal.seNightPic += s.seNightPic;
    grandTotal.seNightCopilot += s.seNightCopilot;
    grandTotal.meDayDual += s.meDayDual;
    grandTotal.meDayPic += s.meDayPic;
    grandTotal.meDayCopilot += s.meDayCopilot;
    grandTotal.meNightDual += s.meNightDual;
    grandTotal.meNightPic += s.meNightPic;
    grandTotal.meNightCopilot += s.meNightCopilot;
    grandTotal.xcDayDual += s.xcDayDual;
    grandTotal.xcDayPic += s.xcDayPic;
    grandTotal.xcDayCopilot += s.xcDayCopilot;
    grandTotal.xcNightDual += s.xcNightDual;
    grandTotal.xcNightPic += s.xcNightPic;
    grandTotal.xcNightCopilot += s.xcNightCopilot;
    grandTotal.dayTakeoffsLandings += s.dayTakeoffsLandings;
    grandTotal.nightTakeoffsLandings += s.nightTakeoffsLandings;
    grandTotal.actualImc += s.actualImc;
    grandTotal.hood += s.hood;
    grandTotal.simulator += s.simulator;
    grandTotal.ifrApproaches += s.ifrApproaches;
    grandTotal.holding += s.holding;
    grandTotal.asFlightInstructor += s.asFlightInstructor;
    grandTotal.dualReceived += s.dualReceived;
  }
  
  // Round all values
  grandTotal.totalHours = round1(grandTotal.totalHours);
  grandTotal.seDayDual = round1(grandTotal.seDayDual);
  grandTotal.seDayPic = round1(grandTotal.seDayPic);
  grandTotal.seDayCopilot = round1(grandTotal.seDayCopilot);
  grandTotal.seNightDual = round1(grandTotal.seNightDual);
  grandTotal.seNightPic = round1(grandTotal.seNightPic);
  grandTotal.seNightCopilot = round1(grandTotal.seNightCopilot);
  grandTotal.meDayDual = round1(grandTotal.meDayDual);
  grandTotal.meDayPic = round1(grandTotal.meDayPic);
  grandTotal.meDayCopilot = round1(grandTotal.meDayCopilot);
  grandTotal.meNightDual = round1(grandTotal.meNightDual);
  grandTotal.meNightPic = round1(grandTotal.meNightPic);
  grandTotal.meNightCopilot = round1(grandTotal.meNightCopilot);
  grandTotal.xcDayDual = round1(grandTotal.xcDayDual);
  grandTotal.xcDayPic = round1(grandTotal.xcDayPic);
  grandTotal.xcDayCopilot = round1(grandTotal.xcDayCopilot);
  grandTotal.xcNightDual = round1(grandTotal.xcNightDual);
  grandTotal.xcNightPic = round1(grandTotal.xcNightPic);
  grandTotal.xcNightCopilot = round1(grandTotal.xcNightCopilot);
  grandTotal.actualImc = round1(grandTotal.actualImc);
  grandTotal.hood = round1(grandTotal.hood);
  grandTotal.simulator = round1(grandTotal.simulator);
  grandTotal.asFlightInstructor = round1(grandTotal.asFlightInstructor);
  grandTotal.dualReceived = round1(grandTotal.dualReceived);
  
  return grandTotal;
}

// ============================================================================
// Helper Functions for Date Ranges
// ============================================================================

/**
 * Get the earliest flight date from a list of flights
 */
export function getEarliestFlightDate(flights: FlightWithBuckets[]): Date | null {
  if (flights.length === 0) return null;
  
  let earliest: Date | null = null;
  for (const f of flights) {
    const fDate = f.flightDate instanceof Date ? f.flightDate : new Date(f.flightDate);
    if (!earliest || fDate < earliest) {
      earliest = fDate;
    }
  }
  return earliest;
}

/**
 * Get the latest flight date from a list of flights
 */
export function getLatestFlightDate(flights: FlightWithBuckets[]): Date | null {
  if (flights.length === 0) return null;
  
  let latest: Date | null = null;
  for (const f of flights) {
    const fDate = f.flightDate instanceof Date ? f.flightDate : new Date(f.flightDate);
    if (!latest || fDate > latest) {
      latest = fDate;
    }
  }
  return latest;
}
