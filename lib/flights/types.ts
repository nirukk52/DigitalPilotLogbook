/**
 * Types for Quick Flight Entry feature
 * Defines input/output shapes for the 7-field quick entry form
 * and calculated TCCA time bucket fields
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * Flight role determines primary bucket allocation
 * - Student: Time goes to Dual buckets
 * - PIC: Time goes to PIC buckets
 * - Instructor: Time goes to PIC + asFlightInstructor buckets
 * - Simulator: Time goes to simulator bucket only
 */
export type FlightRole = 'Student' | 'PIC' | 'Instructor' | 'Simulator';

/**
 * Tags modify calculation behavior
 * - XC: Duplicates time to cross-country buckets (qualifier, not additive)
 * - Night: Routes time to night buckets instead of day
 * - IFR: Allocates time to actualImc bucket
 * - Circuits: Sets default takeoffs/landings to 4
 * - Checkride: For flight tests (informational only)
 */
export type FlightTag = 'XC' | 'Night' | 'IFR' | 'Circuits' | 'Checkride';

/**
 * All 24 time bucket fields required by TCCA logbook format
 */
export interface TimeBuckets {
  // Single-engine time
  seDayDual: number | null;
  seDayPic: number | null;
  seDayCopilot: number | null;
  seNightDual: number | null;
  seNightPic: number | null;
  seNightCopilot: number | null;
  
  // Multi-engine time
  meDayDual: number | null;
  meDayPic: number | null;
  meDayCopilot: number | null;
  meNightDual: number | null;
  meNightPic: number | null;
  meNightCopilot: number | null;
  
  // Cross-country time (subset of SE/ME, not additive)
  xcDayDual: number | null;
  xcDayPic: number | null;
  xcDayCopilot: number | null;
  xcNightDual: number | null;
  xcNightPic: number | null;
  xcNightCopilot: number | null;
  
  // Takeoffs/Landings (counts, not hours)
  dayTakeoffsLandings: number | null;
  nightTakeoffsLandings: number | null;
  
  // Instrument time
  actualImc: number | null;
  hood: number | null;
  simulator: number | null;
  ifrApproaches: number | null;
  holding: number | null;
  
  // Instructor/Dual
  asFlightInstructor: number | null;
  dualReceived: number | null;
}

// ============================================================================
// Quick Entry Input/Output
// ============================================================================

/**
 * Input from the quick entry form - the 6-7 fields user provides
 */
export interface QuickEntryInput {
  // Required fields
  flightDate: Date;
  aircraftMakeModel: string;
  registration: string;
  role: FlightRole;
  flightTime: number;  // Decimal hours (e.g., 1.5)
  
  // Optional fields
  route?: string;      // Smart-parsed: "CZBB-CYCW-CZBB"
  tags?: FlightTag[];  // Multi-select chips
  remarks?: string;    // Free text
  
  // For editing existing flights
  flightId?: number;
  
  // Advanced overrides (optional)
  overrides?: Partial<TimeBuckets>;
}

/**
 * Fully calculated flight ready for database insert
 */
export interface CalculatedFlight {
  // From input
  flightDate: Date;
  aircraftMakeModel: string;
  registration: string;
  pilotInCommand: string | null;
  copilotOrStudent: string | null;
  departureAirport: string | null;
  arrivalAirport: string | null;
  remarks: string | null;
  
  // Calculated time buckets
  seDayDual: number | null;
  seDayPic: number | null;
  seDayCopilot: number | null;
  seNightDual: number | null;
  seNightPic: number | null;
  seNightCopilot: number | null;
  
  meDayDual: number | null;
  meDayPic: number | null;
  meDayCopilot: number | null;
  meNightDual: number | null;
  meNightPic: number | null;
  meNightCopilot: number | null;
  
  xcDayDual: number | null;
  xcDayPic: number | null;
  xcDayCopilot: number | null;
  xcNightDual: number | null;
  xcNightPic: number | null;
  xcNightCopilot: number | null;
  
  dayTakeoffsLandings: number | null;
  nightTakeoffsLandings: number | null;
  
  actualImc: number | null;
  hood: number | null;
  simulator: number | null;
  ifrApproaches: number | null;
  holding: number | null;
  
  asFlightInstructor: number | null;
  dualReceived: number | null;
  
  flightHours: number;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Smart defaults for pre-filling the quick entry form
 */
export interface FlightDefaults {
  // From last flight
  aircraft: string | null;
  registration: string | null;
  routePrefix: string | null;  // Last arrival + "-"
  role: FlightRole | null;
  
  // From profile
  pilotName: string | null;
  homeBase: string | null;
  defaultInstructor: string | null;
  hasProfile: boolean;  // false = needs setup
  
  // Autocomplete data
  aircraftOptions: string[];
  registrationsByAircraft: Record<string, string[]>;
  
  // Stats
  flightCount: number;
}

/**
 * Response from calculation preview endpoint
 */
export interface CalculationResult {
  buckets: TimeBuckets;
  flightHours: number;
  warnings: string[];  // e.g., "XC time duplicated in SE PIC"
}

/**
 * Aircraft engine type for calculation routing
 */
export type AircraftEngineType = 'SE' | 'ME' | 'SIM';
