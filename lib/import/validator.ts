/**
 * Validation rules engine for imported flight data
 * Enforces TCCA logbook calculation rules and data integrity
 * 
 * Key principle: Total Flight Hours = SE + ME only (simulator tracked separately)
 * This aligns with TCCA/FAA/EASA standards.
 */

import type { ParsedFlight, ValidationResult, ValidationIssue } from './types';
import { TIME_FIELDS } from './column-mapper';
import { calculateTotalHours as calcTotalHoursFromBuckets, isSimulatorOnly } from '@/lib/flights/aggregations';

/**
 * Validate a single flight against all TCCA rules
 */
export function validateFlight(flight: ParsedFlight): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  // Rule 1: Flight hours must match sum of time buckets (SE + ME, not simulator)
  // Simulator-only flights should have flightHours = 0 since simulator is tracked separately
  const calculatedAircraftHours = calcTotalHoursFromBuckets(flight);
  const isSimOnly = isSimulatorOnly(flight);
  
  // For simulator-only flights, flightHours should be 0 (or match sim time if using old format)
  // For aircraft flights, flightHours should match SE + ME buckets
  if (!isSimOnly && Math.abs(flight.flightHours - calculatedAircraftHours) > 0.1) {
    issues.push({
      rowNumber: flight.rowNumber,
      field: 'flightHours',
      severity: 'warning', // Changed to warning - often Excel formatting differences
      message: `Stored flight time (${flight.flightHours.toFixed(1)}) differs from bucket sum (${calculatedAircraftHours.toFixed(1)})`,
      actualValue: flight.flightHours,
      expectedValue: calculatedAircraftHours,
    });
  }
  
  // Rule 2: XC PIC must be <= Total PIC
  const totalPic = sumValues([
    flight.seDayPic, flight.seNightPic,
    flight.meDayPic, flight.meNightPic,
  ]);
  const xcPic = sumValues([flight.xcDayPic, flight.xcNightPic]);
  
  if (xcPic > totalPic + 0.01) {
    issues.push({
      rowNumber: flight.rowNumber,
      field: 'xcDayPic',
      severity: 'error',
      message: `Cross-country PIC time (${xcPic.toFixed(2)}) exceeds total PIC time (${totalPic.toFixed(2)})`,
      actualValue: xcPic,
      expectedValue: totalPic,
    });
  }
  
  // Rule 3: Instrument time must be <= flight hours (for non-sim flights)
  if (!flight.simulator || flight.simulator === 0) {
    const instrumentTime = sumValues([flight.actualImc, flight.hood]);
    if (instrumentTime > flight.flightHours + 0.01) {
      issues.push({
        rowNumber: flight.rowNumber,
        field: 'actualImc',
        severity: 'error',
        message: `Instrument time (${instrumentTime.toFixed(2)}) exceeds flight time (${flight.flightHours.toFixed(2)})`,
        actualValue: instrumentTime,
        expectedValue: flight.flightHours,
      });
    }
  }
  
  // Rule 4: Date should not be in the future
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (flight.flightDate > today) {
    issues.push({
      rowNumber: flight.rowNumber,
      field: 'flightDate',
      severity: 'warning',
      message: 'Flight dated in the future',
      actualValue: flight.flightDate.toISOString().split('T')[0],
    });
  }
  
  // Rule 5: Required fields must have values
  if (!flight.aircraftMakeModel) {
    issues.push({
      rowNumber: flight.rowNumber,
      field: 'aircraftMakeModel',
      severity: 'error',
      message: 'Aircraft make/model is required',
      actualValue: flight.aircraftMakeModel,
    });
  }
  
  if (!flight.registration) {
    issues.push({
      rowNumber: flight.rowNumber,
      field: 'registration',
      severity: 'error',
      message: 'Registration is required',
      actualValue: flight.registration,
    });
  }
  
  // Rule 6: Flight hours must be positive (except simulator-only flights)
  const isSimFlight = isSimulatorOnly(flight);
  if (flight.flightHours <= 0 && !isSimFlight) {
    issues.push({
      rowNumber: flight.rowNumber,
      field: 'flightHours',
      severity: 'error',
      message: 'Flight hours must be greater than zero for aircraft flights',
      actualValue: flight.flightHours,
    });
  }
  
  // Rule 7: No negative time values
  for (const field of TIME_FIELDS) {
    const value = flight[field as keyof ParsedFlight] as number | null;
    if (value !== null && value < 0) {
      issues.push({
        rowNumber: flight.rowNumber,
        field,
        severity: 'error',
        message: `${field} cannot be negative`,
        actualValue: value,
      });
    }
  }
  
  // Rule 8: Warn if both instructor and dual received are set
  if ((flight.asFlightInstructor ?? 0) > 0 && (flight.dualReceived ?? 0) > 0) {
    issues.push({
      rowNumber: flight.rowNumber,
      field: 'asFlightInstructor',
      severity: 'warning',
      message: 'Both instructor and dual received time logged - verify this is intentional',
      actualValue: { instructor: flight.asFlightInstructor, dual: flight.dualReceived },
    });
  }
  
  return issues;
}

/**
 * Validate all flights and return aggregated result
 */
export function validateFlights(flights: ParsedFlight[]): ValidationResult {
  const allIssues: ValidationIssue[] = [];
  let errorCount = 0;
  let warningCount = 0;
  
  for (const flight of flights) {
    const issues = validateFlight(flight);
    allIssues.push(...issues);
    
    for (const issue of issues) {
      if (issue.severity === 'error') {
        errorCount++;
      } else {
        warningCount++;
      }
    }
  }
  
  const successCount = flights.length - new Set(
    allIssues.filter(i => i.severity === 'error').map(i => i.rowNumber)
  ).size;
  
  return {
    isValid: errorCount === 0,
    totalFlights: flights.length,
    successCount,
    warningCount,
    errorCount,
    issues: allIssues,
  };
}

// Note: calculateTotalHours is imported from lib/flights/aggregations.ts for consistency
// The aggregations module is the single source of truth for all calculation formulas

/**
 * Sum array of nullable numbers
 */
function sumValues(values: (number | null | undefined)[]): number {
  return values.reduce((sum: number, val) => sum + (val ?? 0), 0);
}

/**
 * Get validation issues for a specific row
 */
export function getIssuesForRow(
  validation: ValidationResult,
  rowNumber: number
): ValidationIssue[] {
  return validation.issues.filter(i => i.rowNumber === rowNumber);
}

/**
 * Check if a specific row has errors (not just warnings)
 */
export function rowHasErrors(
  validation: ValidationResult,
  rowNumber: number
): boolean {
  return validation.issues.some(
    i => i.rowNumber === rowNumber && i.severity === 'error'
  );
}

/**
 * Check if a specific row has warnings
 */
export function rowHasWarnings(
  validation: ValidationResult,
  rowNumber: number
): boolean {
  return validation.issues.some(
    i => i.rowNumber === rowNumber && i.severity === 'warning'
  );
}
