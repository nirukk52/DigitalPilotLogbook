/**
 * Calculation Engine for Quick Flight Entry
 * Implements TCCA-compliant time bucket allocation based on role, tags, and aircraft type
 * 
 * Key rules from research.md:
 * - Role determines primary bucket (Student→Dual, PIC→PIC, Instructor→PIC+Instructor, Sim→Simulator)
 * - Aircraft type determines SE vs ME vs SIM routing
 * - Night tag routes to night buckets instead of day
 * - XC tag duplicates time to XC buckets (qualifier, not additive)
 * - IFR tag allocates to actualImc bucket
 * - Circuits tag sets default takeoffs/landings to 4
 */

import type {
  QuickEntryInput,
  CalculatedFlight,
  TimeBuckets,
  CalculationResult,
  FlightRole,
  FlightTag,
  AircraftEngineType,
} from './types';

// ============================================================================
// Aircraft Type Detection
// ============================================================================

/**
 * Multi-engine aircraft patterns from research.md
 */
const MULTI_ENGINE_PATTERNS = ['PA44', 'BE76', 'DA42', 'PA34', 'C310', 'BE58', 'PA-44', 'BE-76'];

/**
 * Simulator patterns from research.md
 */
const SIMULATOR_PATTERNS = ['Redbird', 'ALSIM', 'AL250', 'FMX', 'SIM', 'FRASCA', 'SIMULATOR'];

/**
 * Detects aircraft engine type from make/model string
 */
export function detectAircraftType(aircraftMakeModel: string): AircraftEngineType {
  const upper = aircraftMakeModel.toUpperCase();
  
  // Check for simulator first (most specific)
  for (const pattern of SIMULATOR_PATTERNS) {
    if (upper.includes(pattern.toUpperCase())) {
      return 'SIM';
    }
  }
  
  // Check for multi-engine
  for (const pattern of MULTI_ENGINE_PATTERNS) {
    if (upper.includes(pattern.toUpperCase())) {
      return 'ME';
    }
  }
  
  // Default to single-engine
  return 'SE';
}

// ============================================================================
// Route Parsing
// ============================================================================

/**
 * Parses route string (e.g., "CZBB-CYCW-CZBB") into departure and arrival
 */
export function parseRoute(route: string | undefined): { from: string | null; to: string | null } {
  if (!route || route.trim() === '') {
    return { from: null, to: null };
  }
  
  // Split by common separators
  const parts = route.split(/[-–—>/\s]+/).filter(p => p.trim().length > 0);
  
  if (parts.length === 0) {
    return { from: null, to: null };
  }
  
  if (parts.length === 1) {
    return { from: parts[0].toUpperCase(), to: parts[0].toUpperCase() };
  }
  
  return {
    from: parts[0].toUpperCase(),
    to: parts[parts.length - 1].toUpperCase(),
  };
}

// ============================================================================
// Time Bucket Calculation
// ============================================================================

/**
 * Creates empty time buckets with all values null
 */
function createEmptyBuckets(): TimeBuckets {
  return {
    seDayDual: null,
    seDayPic: null,
    seDayCopilot: null,
    seNightDual: null,
    seNightPic: null,
    seNightCopilot: null,
    meDayDual: null,
    meDayPic: null,
    meDayCopilot: null,
    meNightDual: null,
    meNightPic: null,
    meNightCopilot: null,
    xcDayDual: null,
    xcDayPic: null,
    xcDayCopilot: null,
    xcNightDual: null,
    xcNightPic: null,
    xcNightCopilot: null,
    dayTakeoffsLandings: null,
    nightTakeoffsLandings: null,
    actualImc: null,
    hood: null,
    simulator: null,
    ifrApproaches: null,
    holding: null,
    asFlightInstructor: null,
    dualReceived: null,
  };
}

/**
 * Main calculation function - converts 7 inputs into full time bucket allocation
 */
export function calculateBuckets(
  input: QuickEntryInput,
  pilotName?: string | null,
  defaultInstructor?: string | null
): CalculationResult {
  const buckets = createEmptyBuckets();
  const warnings: string[] = [];
  
  const { role, flightTime, tags = [], overrides } = input;
  const aircraftType = detectAircraftType(input.aircraftMakeModel);
  const isNight = tags.includes('Night');
  const isXC = tags.includes('XC');
  const isIFR = tags.includes('IFR');
  const isCircuits = tags.includes('Circuits');
  
  // -------------------------------------------------------------------------
  // Primary allocation based on role and aircraft type
  // -------------------------------------------------------------------------
  
  if (role === 'Simulator' || aircraftType === 'SIM') {
    // Simulator flights - all time to simulator bucket
    buckets.simulator = flightTime;
  } else if (role === 'Student') {
    // Student - time to DUAL buckets
    if (aircraftType === 'ME') {
      if (isNight) {
        buckets.meNightDual = flightTime;
      } else {
        buckets.meDayDual = flightTime;
      }
    } else {
      if (isNight) {
        buckets.seNightDual = flightTime;
      } else {
        buckets.seDayDual = flightTime;
      }
    }
    buckets.dualReceived = flightTime;
  } else if (role === 'PIC') {
    // PIC - time to PIC buckets
    if (aircraftType === 'ME') {
      if (isNight) {
        buckets.meNightPic = flightTime;
      } else {
        buckets.meDayPic = flightTime;
      }
    } else {
      if (isNight) {
        buckets.seNightPic = flightTime;
      } else {
        buckets.seDayPic = flightTime;
      }
    }
  } else if (role === 'Instructor') {
    // Instructor - time to PIC + instructor buckets
    if (aircraftType === 'ME') {
      if (isNight) {
        buckets.meNightPic = flightTime;
      } else {
        buckets.meDayPic = flightTime;
      }
    } else {
      if (isNight) {
        buckets.seNightPic = flightTime;
      } else {
        buckets.seDayPic = flightTime;
      }
    }
    buckets.asFlightInstructor = flightTime;
  }
  
  // -------------------------------------------------------------------------
  // XC time (qualifier - duplicates to XC buckets)
  // -------------------------------------------------------------------------
  
  if (isXC && aircraftType !== 'SIM') {
    if (role === 'Student') {
      if (isNight) {
        buckets.xcNightDual = flightTime;
      } else {
        buckets.xcDayDual = flightTime;
      }
    } else {
      // PIC or Instructor
      if (isNight) {
        buckets.xcNightPic = flightTime;
      } else {
        buckets.xcDayPic = flightTime;
      }
    }
    warnings.push('XC time duplicated as qualifier (not additive to total)');
  }
  
  // -------------------------------------------------------------------------
  // IFR time
  // -------------------------------------------------------------------------
  
  if (isIFR && aircraftType !== 'SIM') {
    buckets.actualImc = flightTime;
    warnings.push('IFR tag allocated full time to Actual IMC. Use Advanced mode for partial IMC.');
  }
  
  // -------------------------------------------------------------------------
  // Takeoffs/Landings
  // -------------------------------------------------------------------------
  
  if (aircraftType !== 'SIM') {
    const defaultLandings = isCircuits ? 4 : 1;
    if (isNight) {
      buckets.nightTakeoffsLandings = defaultLandings;
    } else {
      buckets.dayTakeoffsLandings = defaultLandings;
    }
  }
  
  // -------------------------------------------------------------------------
  // Apply manual overrides if provided
  // -------------------------------------------------------------------------
  
  if (overrides) {
    for (const [key, value] of Object.entries(overrides)) {
      if (value !== undefined && key in buckets) {
        (buckets as unknown as Record<string, number | null>)[key] = value;
      }
    }
    warnings.push('Manual overrides applied - calculation may not follow standard rules');
  }
  
  // Calculate total flight hours from buckets
  const flightHours = calculateFlightHoursFromBuckets(buckets);
  
  return {
    buckets,
    flightHours,
    warnings,
  };
}

/**
 * Calculates total AIRCRAFT flight hours from time bucket values
 * 
 * IMPORTANT: Per TCCA/FAA/EASA standards:
 * - Simulator time is NOT included in total flight hours
 * - XC, IMC, hood are qualifiers (subsets of primary time, not additive)
 * - Instructor, dualReceived are role-based (not additive)
 * 
 * Total Hours = SE + ME time only
 */
export function calculateFlightHoursFromBuckets(buckets: TimeBuckets): number {
  const values = [
    // Single-engine (aircraft time)
    buckets.seDayDual,
    buckets.seDayPic,
    buckets.seDayCopilot,
    buckets.seNightDual,
    buckets.seNightPic,
    buckets.seNightCopilot,
    // Multi-engine (aircraft time)
    buckets.meDayDual,
    buckets.meDayPic,
    buckets.meDayCopilot,
    buckets.meNightDual,
    buckets.meNightPic,
    buckets.meNightCopilot,
    // NOTE: Simulator is intentionally EXCLUDED from total flight hours
    // It is tracked separately per aviation standards
  ];
  
  // Note: XC, IMC, hood, instructor, dualReceived are NOT added
  // They are qualifiers/subsets of the primary time
  
  const total = values.reduce<number>((sum, val) => sum + (val ?? 0), 0);
  
  // Round to 1 decimal place
  return Math.round(total * 10) / 10;
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validates that calculated buckets match input flight time
 */
export function validateBucketSum(buckets: TimeBuckets, expectedFlightTime: number): {
  isValid: boolean;
  calculatedTotal: number;
  difference: number;
} {
  const calculatedTotal = calculateFlightHoursFromBuckets(buckets);
  const difference = Math.abs(calculatedTotal - expectedFlightTime);
  
  return {
    isValid: difference < 0.01,  // Within 0.01 hours tolerance
    calculatedTotal,
    difference,
  };
}

/**
 * Validates that XC time doesn't exceed total PIC/Dual time
 */
export function validateXCSubset(buckets: TimeBuckets): {
  isValid: boolean;
  message?: string;
} {
  const totalPIC = 
    (buckets.seDayPic ?? 0) + (buckets.seNightPic ?? 0) +
    (buckets.meDayPic ?? 0) + (buckets.meNightPic ?? 0);
  
  const totalDual = 
    (buckets.seDayDual ?? 0) + (buckets.seNightDual ?? 0) +
    (buckets.meDayDual ?? 0) + (buckets.meNightDual ?? 0);
  
  const totalXC = 
    (buckets.xcDayPic ?? 0) + (buckets.xcNightPic ?? 0) +
    (buckets.xcDayDual ?? 0) + (buckets.xcNightDual ?? 0) +
    (buckets.xcDayCopilot ?? 0) + (buckets.xcNightCopilot ?? 0);
  
  const maxXC = totalPIC + totalDual + 0.01;  // Tolerance
  
  if (totalXC > maxXC) {
    return {
      isValid: false,
      message: `Cross-country time (${totalXC}) exceeds total PIC+Dual time (${totalPIC + totalDual})`,
    };
  }
  
  return { isValid: true };
}

// ============================================================================
// Full Flight Builder
// ============================================================================

/**
 * Builds a complete CalculatedFlight from QuickEntryInput
 */
export function buildCalculatedFlight(
  input: QuickEntryInput,
  pilotName?: string | null,
  defaultInstructor?: string | null
): CalculatedFlight {
  const { buckets } = calculateBuckets(input, pilotName, defaultInstructor);
  const { from, to } = parseRoute(input.route);
  
  // Determine PIC name based on role
  let pic: string | null = null;
  let copilot: string | null = null;
  
  if (input.role === 'PIC' || input.role === 'Instructor') {
    pic = pilotName ?? null;
  } else if (input.role === 'Student') {
    pic = defaultInstructor ?? null;
    copilot = pilotName ?? null;
  }
  
  return {
    flightDate: input.flightDate,
    aircraftMakeModel: input.aircraftMakeModel,
    registration: input.registration,
    pilotInCommand: pic,
    copilotOrStudent: copilot,
    departureAirport: from,
    arrivalAirport: to,
    remarks: input.remarks ?? null,
    
    // Spread all calculated buckets
    ...buckets,
    
    flightHours: input.flightTime,
  };
}
