/**
 * Excel column mapping constants for TCCA logbook format
 * Maps Excel column indices to Flight entity field names
 * Handles multi-row headers (rows 1-3 are headers, row 4+ is data)
 */

/**
 * Column index to field name mapping
 * Based on TCCA Excel format from knowledge-base/01-calculation-mapping-spec.md
 */
export const COLUMN_MAPPING: Record<number, string> = {
  0: 'flightDate',
  1: 'aircraftMakeModel',
  2: 'registration',
  3: 'pilotInCommand',
  4: 'copilotOrStudent',
  5: 'departureAirport',
  6: 'arrivalAirport',
  7: 'remarks',
  // Single-engine time
  8: 'seDayDual',
  9: 'seDayPic',
  10: 'seDayCopilot',
  11: 'seNightDual',
  12: 'seNightPic',
  13: 'seNightCopilot',
  // Multi-engine time
  14: 'meDayDual',
  15: 'meDayPic',
  16: 'meDayCopilot',
  17: 'meNightDual',
  18: 'meNightPic',
  19: 'meNightCopilot',
  // Cross-country time
  20: 'xcDayDual',
  21: 'xcDayPic',
  22: 'xcDayCopilot',
  23: 'xcNightDual',
  24: 'xcNightPic',
  25: 'xcNightCopilot',
  // Takeoffs/Landings
  26: 'dayTakeoffsLandings',
  27: 'nightTakeoffsLandings',
  // Instrument
  28: 'actualImc',
  29: 'hood',
  30: 'simulator',
  31: 'ifrApproaches',
  32: 'holding',
  // Instructor/Dual
  33: 'asFlightInstructor',
  34: 'dualReceived',
};

/**
 * Fields that contain decimal time values (hours)
 */
export const TIME_FIELDS = [
  'seDayDual', 'seDayPic', 'seDayCopilot',
  'seNightDual', 'seNightPic', 'seNightCopilot',
  'meDayDual', 'meDayPic', 'meDayCopilot',
  'meNightDual', 'meNightPic', 'meNightCopilot',
  'xcDayDual', 'xcDayPic', 'xcDayCopilot',
  'xcNightDual', 'xcNightPic', 'xcNightCopilot',
  'actualImc', 'hood', 'simulator',
  'asFlightInstructor', 'dualReceived',
  'totalDuty', 'flightHours',
];

/**
 * Fields that contain integer counts
 */
export const COUNT_FIELDS = [
  'dayTakeoffsLandings', 'nightTakeoffsLandings',
  'ifrApproaches', 'holding',
];

/**
 * Fields that contain text values
 */
export const TEXT_FIELDS = [
  'aircraftMakeModel', 'registration',
  'pilotInCommand', 'copilotOrStudent',
  'departureAirport', 'arrivalAirport',
  'remarks', 'timeOn', 'timeOff',
];

/**
 * Number of header rows in TCCA Excel format
 * Data starts at row 4 (0-indexed: row 3)
 */
export const HEADER_ROW_COUNT = 3;

/**
 * Required columns that must have values for a valid flight
 */
export const REQUIRED_COLUMNS = [
  'flightDate',
  'aircraftMakeModel',
  'registration',
];

/**
 * Get the field name for a given column index
 */
export function getFieldName(columnIndex: number): string | undefined {
  return COLUMN_MAPPING[columnIndex];
}

/**
 * Check if a field contains time data (decimal hours)
 */
export function isTimeField(fieldName: string): boolean {
  return TIME_FIELDS.includes(fieldName);
}

/**
 * Check if a field contains count data (integers)
 */
export function isCountField(fieldName: string): boolean {
  return COUNT_FIELDS.includes(fieldName);
}

/**
 * Check if a field contains text data
 */
export function isTextField(fieldName: string): boolean {
  return TEXT_FIELDS.includes(fieldName);
}

/**
 * Get all column indices that should be summed for total flight hours
 */
export const FLIGHT_HOURS_COLUMNS = [
  8, 9, 10,    // SE Day
  11, 12, 13,  // SE Night
  14, 15, 16,  // ME Day
  17, 18, 19,  // ME Night
  28, 29, 30,  // Instrument (IMC, Hood, Simulator)
  33, 34,      // Instructor, Dual Received
];

/**
 * PIC time columns (for XC validation)
 */
export const PIC_COLUMNS = [9, 12, 15, 18]; // seDayPic, seNightPic, meDayPic, meNightPic

/**
 * XC PIC columns (subset of PIC)
 */
export const XC_PIC_COLUMNS = [21, 24]; // xcDayPic, xcNightPic
