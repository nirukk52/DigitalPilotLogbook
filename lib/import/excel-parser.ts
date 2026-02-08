/**
 * Excel parser for TCCA logbook format
 * Parses .xlsx files with multi-row headers and maps to ParsedFlight objects
 */

import * as XLSX from "xlsx";
import type { ParsedFlight, ExcelRow } from "./types";
import {
  COLUMN_MAPPING,
  HEADER_ROW_COUNT,
  isTimeField,
  isCountField,
} from "./column-mapper";

/**
 * Parse an Excel file buffer and extract flight data
 */
export function parseExcelFile(arrayBuffer: ArrayBuffer): ParsedFlight[] {
  const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: true });
  
  // Get the first sheet
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  // Convert to array of arrays (rows)
  const rows: ExcelRow[] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
    raw: false,
    dateNF: "yyyy-mm-dd",
  });
  
  // Skip header rows and parse data rows
  const dataRows = rows.slice(HEADER_ROW_COUNT);
  
  const flights: ParsedFlight[] = [];
  
  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const rowNumber = i + HEADER_ROW_COUNT + 1; // 1-indexed Excel row number
    
    // Skip empty rows
    if (!row || row.length === 0 || isRowEmpty(row)) {
      continue;
    }
    
    const flight = mapRowToFlight(row, rowNumber);
    if (flight) {
      flights.push(flight);
    }
  }
  
  return flights;
}

/**
 * Check if a row is empty (all cells null or empty string)
 */
function isRowEmpty(row: ExcelRow): boolean {
  return row.every(
    (cell) => cell === null || cell === undefined || cell === ""
  );
}

/**
 * Map a single Excel row to a ParsedFlight object
 */
function mapRowToFlight(row: ExcelRow, rowNumber: number): ParsedFlight | null {
  // Parse date from first column
  const dateValue = row[0];
  const flightDate = parseDate(dateValue);
  
  if (!flightDate) {
    // Skip rows without valid date (probably not a flight row)
    return null;
  }
  
  // Skip header rows that got parsed (e.g., "MAKE / MODEL" in column 1)
  const makeModel = parseString(row[1]);
  if (makeModel && (
    makeModel.toUpperCase().includes("MAKE") ||
    makeModel.toUpperCase().includes("MODEL") ||
    makeModel.toUpperCase() === "TYPE"
  )) {
    return null;
  }
  
  // Initialize flight with defaults
  const flight: ParsedFlight = {
    rowNumber,
    flightDate,
    aircraftMakeModel: parseString(row[1]) || "",
    registration: parseString(row[2]) || "",
    pilotInCommand: parseString(row[3]),
    copilotOrStudent: parseString(row[4]),
    departureAirport: parseString(row[5]),
    arrivalAirport: parseString(row[6]),
    remarks: parseString(row[7]),
    // Time fields - initialized to null
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
    timeOn: null,
    timeOff: null,
    totalDuty: null,
    flightHours: 0,
  };
  
  // Map remaining columns
  for (let colIndex = 8; colIndex < row.length; colIndex++) {
    const fieldName = COLUMN_MAPPING[colIndex];
    if (!fieldName) continue;
    
    const cellValue = row[colIndex];
    
    if (isTimeField(fieldName)) {
      const numValue = parseNumber(cellValue);
      (flight as unknown as Record<string, unknown>)[fieldName] = numValue;
    } else if (isCountField(fieldName)) {
      const intValue = parseInteger(cellValue);
      (flight as unknown as Record<string, unknown>)[fieldName] = intValue;
    }
  }
  
  // Calculate flight hours from time buckets
  flight.flightHours = calculateFlightHours(flight);
  
  return flight;
}

/**
 * Parse a cell value as a Date
 */
function parseDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  
  // Already a Date object
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  
  // String date
  if (typeof value === "string") {
    // Try parsing various formats
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date;
    }
    
    // Try DD/MM/YYYY format
    const parts = value.split(/[\/\-\.]/);
    if (parts.length === 3) {
      const [day, month, year] = parts.map(Number);
      const parsed = new Date(year < 100 ? 2000 + year : year, month - 1, day);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  }
  
  // Excel serial number
  if (typeof value === "number") {
    // Excel dates are days since 1900-01-01 (with a bug for 1900 leap year)
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  return null;
}

/**
 * Parse a cell value as a string
 */
function parseString(value: unknown): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  return String(value).trim();
}

/**
 * Parse a cell value as a number (decimal hours)
 */
function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  
  const num = typeof value === "number" ? value : parseFloat(String(value));
  
  if (isNaN(num)) {
    return null;
  }
  
  // Round to 1 decimal place
  return Math.round(num * 10) / 10;
}

/**
 * Parse a cell value as an integer
 */
function parseInteger(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  
  const num = typeof value === "number" ? value : parseInt(String(value), 10);
  
  if (isNaN(num)) {
    return null;
  }
  
  return Math.round(num);
}

/**
 * Calculate total AIRCRAFT flight hours from time bucket fields
 * 
 * IMPORTANT: Per TCCA/FAA/EASA standards, simulator time is NOT included
 * in total flight hours. Simulator is tracked separately.
 * Total Hours = SE + ME time only (no simulator)
 */
function calculateFlightHours(flight: ParsedFlight): number {
  const values = [
    // Single-engine (aircraft time)
    flight.seDayDual,
    flight.seDayPic,
    flight.seDayCopilot,
    flight.seNightDual,
    flight.seNightPic,
    flight.seNightCopilot,
    // Multi-engine (aircraft time)
    flight.meDayDual,
    flight.meDayPic,
    flight.meDayCopilot,
    flight.meNightDual,
    flight.meNightPic,
    flight.meNightCopilot,
    // NOTE: Simulator is intentionally EXCLUDED from total flight hours
    // It is tracked separately in the simulator column
  ];
  
  const total = values.reduce<number>((sum, val) => sum + (val ?? 0), 0);
  
  // Round to 1 decimal place
  return Math.round(total * 10) / 10;
}

/**
 * Get row count from Excel file (without full parsing)
 */
export function getExcelRowCount(arrayBuffer: ArrayBuffer): number {
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1");
  return range.e.r - HEADER_ROW_COUNT;
}
