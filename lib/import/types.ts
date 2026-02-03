/**
 * Shared TypeScript types for Excel to PDF Import feature
 * Defines data structures for parsing, validation, and export
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
  flightDate: Date;
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
  | 'idle'
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
  | 'idle'
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

export interface PDFExportOptions {
  dateRangeStart?: Date;
  dateRangeEnd?: Date;
  pilotName?: string;
  includePageNumbers?: boolean;
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
  flightCount: number;
  columnTotals: Record<string, number>;
}

/**
 * Running totals (cumulative across pages)
 */
export interface RunningTotals {
  pageNumber: number;
  totalsForwarded: Record<string, number>;
  pageTotals: Record<string, number>;
  totalsToDate: Record<string, number>;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Excel row as raw array of cell values
 */
export type ExcelRow = (string | number | Date | null | undefined)[];

/**
 * File upload state
 */
export interface FileUploadState {
  isDragging: boolean;
  isUploading: boolean;
  error: string | null;
}
