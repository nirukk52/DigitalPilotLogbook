/**
 * API Contracts for Quick Flight Entry
 * Feature: 002-quick-flight-entry
 * 
 * These types define the request/response shapes for all API endpoints
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * Flight role determines primary bucket allocation
 */
export type FlightRole = 'Student' | 'PIC' | 'Instructor' | 'Simulator';

/**
 * Tags modify calculation behavior
 */
export type FlightTag = 'XC' | 'Night' | 'IFR' | 'Circuits' | 'Checkride';

/**
 * All 24 time bucket fields
 */
export interface TimeBuckets {
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
}

// ============================================================================
// POST /api/flights - Create Flight
// ============================================================================

/**
 * Request body for creating a new flight
 */
export interface CreateFlightRequest {
  // Required fields (the 6-7 from quick entry)
  flightDate: string;          // ISO date string: "2026-02-03"
  aircraftMakeModel: string;   // e.g., "C172"
  registration: string;        // e.g., "C-GHFH"
  role: FlightRole;
  flightTime: number;          // Decimal hours: 1.5
  
  // Optional fields
  route?: string;              // e.g., "CZBB-CYCW-CZBB"
  tags?: FlightTag[];
  remarks?: string;
  
  // Advanced mode overrides
  overrides?: Partial<TimeBuckets>;
}

/**
 * Response after creating a flight
 */
export interface CreateFlightResponse {
  success: boolean;
  flight: {
    id: number;
    flightDate: string;
    aircraftMakeModel: string;
    registration: string;
    flightHours: number;
    // Calculated buckets
    buckets: TimeBuckets;
  };
  message: string;
}

// ============================================================================
// PUT /api/flights/[id] - Update Flight
// ============================================================================

/**
 * Request body for updating an existing flight
 */
export interface UpdateFlightRequest extends CreateFlightRequest {
  // Same as create - full replacement
}

/**
 * Response after updating a flight
 */
export interface UpdateFlightResponse extends CreateFlightResponse {
  // Same as create response
}

// ============================================================================
// GET /api/flights/defaults - Get Smart Defaults
// ============================================================================

/**
 * Response with smart defaults for form pre-fill
 */
export interface FlightDefaultsResponse {
  // From last flight
  defaults: {
    aircraft: string | null;
    registration: string | null;
    routePrefix: string | null;
    role: FlightRole | null;
  };
  
  // From profile
  profile: {
    pilotName: string | null;
    homeBase: string | null;
    defaultInstructor: string | null;
    hasProfile: boolean;  // false = needs setup
  };
  
  // Autocomplete data
  autocomplete: {
    aircraft: string[];
    registrationsByAircraft: Record<string, string[]>;
  };
  
  // Stats
  flightCount: number;
}

// ============================================================================
// POST /api/flights/calculate - Preview Calculation
// ============================================================================

/**
 * Request to preview calculated buckets without saving
 */
export interface CalculateRequest {
  aircraftMakeModel: string;
  role: FlightRole;
  flightTime: number;
  tags?: FlightTag[];
  overrides?: Partial<TimeBuckets>;
}

/**
 * Response with calculated buckets
 */
export interface CalculateResponse {
  buckets: TimeBuckets;
  flightHours: number;
  warnings: string[];  // e.g., "XC time duplicated in SE PIC"
}

// ============================================================================
// POST /api/profile - Save Pilot Profile
// ============================================================================

/**
 * Request to save pilot profile (one-time setup)
 */
export interface SaveProfileRequest {
  pilotName: string;
  homeBase: string;
  defaultInstructor?: string;
}

/**
 * Response after saving profile
 */
export interface SaveProfileResponse {
  success: boolean;
  message: string;
}

// ============================================================================
// DELETE /api/flights/[id] - Delete Flight
// ============================================================================

/**
 * Response after deleting a flight
 */
export interface DeleteFlightResponse {
  success: boolean;
  message: string;
}

// ============================================================================
// Error Response
// ============================================================================

/**
 * Standard error response shape
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: Record<string, string[]>;  // Field-level validation errors
}
