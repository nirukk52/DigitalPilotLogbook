/**
 * API Contract Types for Excel to PDF Import Feature
 * These types define the shape of data exchanged between client and server
 */

// ============================================================================
// Core Flight Types
// ============================================================================

/**
 * ParsedFlight - intermediate type from Excel parsing
 * Contains raw data before database persistence
 */
export interface ParsedFlight {
  rowNumber: number;                   // Excel row (1-indexed, for error reporting)
  
  // Basic flight info
  date: Date;
  aircraftMakeModel: string;
  registration: string;
  pilotInCommand: string | null;
  copilotOrStudent: string | null;
  departureAirport: string | null;
  arrivalAirport: string | null;
  remarks: string | null;
  
  // Single-engine time (decimal hours)
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
  
  // Cross-country time
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
  
  // Duty
  timeOn: string | null;
  timeOff: string | null;
  totalDuty: number | null;
  
  // Computed
  flightHours: number;
}

// ============================================================================
// Validation Types
// ============================================================================

export type ValidationSeverity = 'error' | 'warning';

export interface ValidationIssue {
  rowNumber: number;
  field: string;
  severity: ValidationSeverity;
  message: string;
  actualValue: unknown;
  expectedValue?: unknown;
}

export interface ValidationResult {
  isValid: boolean;                    // No errors (warnings OK)
  totalFlights: number;
  successCount: number;
  warningCount: number;
  errorCount: number;
  issues: ValidationIssue[];
}

// ============================================================================
// Import Job Types
// ============================================================================

export type ImportJobStatus = 
  | 'uploading' 
  | 'parsing' 
  | 'validating' 
  | 'ready' 
  | 'error';

export interface ImportJob {
  id: string;
  status: ImportJobStatus;
  fileName: string;
  fileSize: number;
  flights: ParsedFlight[];
  totalRows: number;
  validation: ValidationResult;
  startedAt: Date;
  completedAt: Date | null;
  error?: string;
}

// ============================================================================
// PDF Export Types
// ============================================================================

export type PDFExportStatus = 
  | 'pending' 
  | 'generating' 
  | 'complete' 
  | 'error';

export interface PDFExportJob {
  id: string;
  status: PDFExportStatus;
  totalPages: number;
  currentPage: number;
  progressPercent: number;
  downloadUrl: string | null;
  fileName: string;
  error: string | null;
}

/**
 * Request body for PDF generation endpoint
 */
export interface GeneratePDFRequest {
  flights: ParsedFlight[];
  options?: PDFExportOptions;
}

export interface PDFExportOptions {
  dateRangeStart?: Date;               // Optional filter
  dateRangeEnd?: Date;                 // Optional filter
  pilotName?: string;                  // For filename
  includePageNumbers?: boolean;        // Default: true
}

/**
 * Response from PDF generation endpoint
 * Binary PDF returned directly, these are metadata headers
 */
export interface GeneratePDFResponseHeaders {
  'Content-Type': 'application/pdf';
  'Content-Disposition': `attachment; filename="${string}"`;
  'X-Total-Pages': string;
  'X-Total-Flights': string;
}

// ============================================================================
// Summary/Totals Types
// ============================================================================

/**
 * Aggregated totals across all flights
 */
export interface FlightTotals {
  totalFlights: number;
  totalHours: number;
  
  // Time category totals
  seDayDualTotal: number;
  seDayPicTotal: number;
  seNightTotal: number;
  meDayTotal: number;
  meNightTotal: number;
  xcTotal: number;
  actualImcTotal: number;
  hoodTotal: number;
  simulatorTotal: number;
  asFlightInstructorTotal: number;
  dualReceivedTotal: number;
  
  // Count totals
  dayTakeoffsLandingsTotal: number;
  nightTakeoffsLandingsTotal: number;
  ifrApproachesTotal: number;
  holdingTotal: number;
}

/**
 * Page-level totals for PDF generation
 */
export interface PageTotals {
  pageNumber: number;
  flightCount: number;                 // Should be ≤ 18
  
  // Per-column sums (all time bucket columns)
  columnTotals: Record<string, number>;
}

/**
 * Running totals (cumulative across pages)
 */
export interface RunningTotals {
  pageNumber: number;
  totalsForwarded: Record<string, number>;  // From previous pages
  pageTotals: Record<string, number>;        // This page only
  totalsToDate: Record<string, number>;      // Cumulative
}

// ============================================================================
// API Endpoints Summary
// ============================================================================

/**
 * POST /api/export/pdf
 * 
 * Request: GeneratePDFRequest (JSON body)
 * Response: Binary PDF stream
 * 
 * Usage:
 * ```typescript
 * const response = await fetch('/api/export/pdf', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ flights, options }),
 * });
 * const blob = await response.blob();
 * ```
 */

// Note: Upload and parsing are client-side only (no API endpoints)
// Validation can be done client-side or optionally server-side
