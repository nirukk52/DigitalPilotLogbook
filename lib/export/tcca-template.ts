/**
 * TCCA logbook PDF template constants
 * Defines page layout, column widths, fonts, and styling for TCCA-compliant output
 */

/**
 * Page dimensions (Letter size landscape in points)
 * 1 point = 1/72 inch
 */
export const PAGE = {
  WIDTH: 792,   // 11 inches
  HEIGHT: 612,  // 8.5 inches
  MARGIN_TOP: 40,
  MARGIN_BOTTOM: 60,
  MARGIN_LEFT: 20,
  MARGIN_RIGHT: 20,
} as const;

/**
 * Number of data rows per page (TCCA standard)
 */
export const ROWS_PER_PAGE = 18;

/**
 * Row heights in points
 */
export const ROW_HEIGHT = {
  HEADER: 30,
  DATA: 22,
  TOTALS: 24,
} as const;

/**
 * Font sizes in points
 */
export const FONT_SIZE = {
  HEADER: 8,
  DATA: 7,
  TOTALS: 7,
  PAGE_NUMBER: 8,
} as const;

/**
 * Colors (RGB values 0-1)
 */
export const COLORS = {
  BLACK: { r: 0, g: 0, b: 0 },
  GRAY: { r: 0.5, g: 0.5, b: 0.5 },
  LIGHT_GRAY: { r: 0.9, g: 0.9, b: 0.9 },
  WHITE: { r: 1, g: 1, b: 1 },
} as const;

/**
 * Column definitions for TCCA logbook
 * Width is percentage of available page width
 */
export interface ColumnDef {
  key: string;
  header: string;
  width: number;  // percentage
  align: 'left' | 'center' | 'right';
  group?: string;
}

/**
 * Left page columns (flight details)
 */
export const LEFT_PAGE_COLUMNS: ColumnDef[] = [
  { key: 'flightDate', header: 'DATE', width: 7, align: 'center' },
  { key: 'aircraftMakeModel', header: 'MAKE/MODEL', width: 8, align: 'left' },
  { key: 'registration', header: 'REG', width: 6, align: 'left' },
  { key: 'pilotInCommand', header: 'PIC', width: 10, align: 'left' },
  { key: 'copilotOrStudent', header: 'CO-PILOT', width: 10, align: 'left' },
  { key: 'departureAirport', header: 'FROM', width: 5, align: 'center' },
  { key: 'arrivalAirport', header: 'TO', width: 5, align: 'center' },
  { key: 'remarks', header: 'REMARKS', width: 12, align: 'left' },
  // Single-engine day
  { key: 'seDayDual', header: 'DUAL', width: 4, align: 'right', group: 'SE DAY' },
  { key: 'seDayPic', header: 'PIC', width: 4, align: 'right', group: 'SE DAY' },
  { key: 'seDayCopilot', header: 'COP', width: 4, align: 'right', group: 'SE DAY' },
  // Single-engine night
  { key: 'seNightDual', header: 'DUAL', width: 4, align: 'right', group: 'SE NGT' },
  { key: 'seNightPic', header: 'PIC', width: 4, align: 'right', group: 'SE NGT' },
  { key: 'seNightCopilot', header: 'COP', width: 4, align: 'right', group: 'SE NGT' },
  // Multi-engine day
  { key: 'meDayDual', header: 'DUAL', width: 4, align: 'right', group: 'ME DAY' },
  { key: 'meDayPic', header: 'PIC', width: 4, align: 'right', group: 'ME DAY' },
  { key: 'meDayCopilot', header: 'COP', width: 4, align: 'right', group: 'ME DAY' },
];

/**
 * Right page columns (additional categories)
 */
export const RIGHT_PAGE_COLUMNS: ColumnDef[] = [
  // Multi-engine night
  { key: 'meNightDual', header: 'DUAL', width: 4, align: 'right', group: 'ME NGT' },
  { key: 'meNightPic', header: 'PIC', width: 4, align: 'right', group: 'ME NGT' },
  { key: 'meNightCopilot', header: 'COP', width: 4, align: 'right', group: 'ME NGT' },
  // Cross-country day
  { key: 'xcDayDual', header: 'DUAL', width: 4, align: 'right', group: 'XC DAY' },
  { key: 'xcDayPic', header: 'PIC', width: 4, align: 'right', group: 'XC DAY' },
  { key: 'xcDayCopilot', header: 'COP', width: 4, align: 'right', group: 'XC DAY' },
  // Cross-country night
  { key: 'xcNightDual', header: 'DUAL', width: 4, align: 'right', group: 'XC NGT' },
  { key: 'xcNightPic', header: 'PIC', width: 4, align: 'right', group: 'XC NGT' },
  { key: 'xcNightCopilot', header: 'COP', width: 4, align: 'right', group: 'XC NGT' },
  // Takeoffs/Landings
  { key: 'dayTakeoffsLandings', header: 'DAY', width: 4, align: 'right', group: 'T/O LDG' },
  { key: 'nightTakeoffsLandings', header: 'NGT', width: 4, align: 'right', group: 'T/O LDG' },
  // Instrument
  { key: 'actualImc', header: 'IMC', width: 4, align: 'right', group: 'INST' },
  { key: 'hood', header: 'HOOD', width: 4, align: 'right', group: 'INST' },
  { key: 'simulator', header: 'SIM', width: 4, align: 'right', group: 'INST' },
  { key: 'ifrApproaches', header: 'APP', width: 3, align: 'right', group: 'INST' },
  { key: 'holding', header: 'HLD', width: 3, align: 'right', group: 'INST' },
  // Other
  { key: 'asFlightInstructor', header: 'INST', width: 5, align: 'right', group: 'OTHER' },
  { key: 'dualReceived', header: 'DUAL', width: 5, align: 'right', group: 'OTHER' },
];

/**
 * All columns combined for single-page layout (simplified)
 * Used when generating compact PDF
 */
export const ALL_COLUMNS: ColumnDef[] = [
  { key: 'flightDate', header: 'DATE', width: 6, align: 'center' },
  { key: 'aircraftMakeModel', header: 'A/C', width: 5, align: 'left' },
  { key: 'registration', header: 'REG', width: 5, align: 'left' },
  { key: 'pilotInCommand', header: 'PIC', width: 7, align: 'left' },
  { key: 'copilotOrStudent', header: 'SIC', width: 7, align: 'left' },
  { key: 'departureAirport', header: 'FROM', width: 4, align: 'center' },
  { key: 'arrivalAirport', header: 'TO', width: 4, align: 'center' },
  // SE
  { key: 'seDayDual', header: 'DD', width: 3, align: 'right', group: 'SE' },
  { key: 'seDayPic', header: 'DP', width: 3, align: 'right', group: 'SE' },
  { key: 'seNightPic', header: 'NP', width: 3, align: 'right', group: 'SE' },
  // ME
  { key: 'meDayPic', header: 'DP', width: 3, align: 'right', group: 'ME' },
  { key: 'meNightPic', header: 'NP', width: 3, align: 'right', group: 'ME' },
  // XC
  { key: 'xcDayPic', header: 'XC', width: 3, align: 'right' },
  // T/O
  { key: 'dayTakeoffsLandings', header: 'DL', width: 3, align: 'right' },
  { key: 'nightTakeoffsLandings', header: 'NL', width: 3, align: 'right' },
  // Inst
  { key: 'actualImc', header: 'IMC', width: 3, align: 'right' },
  { key: 'hood', header: 'HD', width: 3, align: 'right' },
  { key: 'simulator', header: 'SIM', width: 3, align: 'right' },
  { key: 'ifrApproaches', header: 'AP', width: 2, align: 'right' },
  // Other
  { key: 'asFlightInstructor', header: 'FI', width: 3, align: 'right' },
  { key: 'dualReceived', header: 'DR', width: 3, align: 'right' },
  // Total
  { key: 'flightHours', header: 'TTL', width: 4, align: 'right' },
];

/**
 * Time columns that need to be summed for totals
 */
export const SUMMABLE_COLUMNS = [
  'seDayDual', 'seDayPic', 'seDayCopilot',
  'seNightDual', 'seNightPic', 'seNightCopilot',
  'meDayDual', 'meDayPic', 'meDayCopilot',
  'meNightDual', 'meNightPic', 'meNightCopilot',
  'xcDayDual', 'xcDayPic', 'xcDayCopilot',
  'xcNightDual', 'xcNightPic', 'xcNightCopilot',
  'dayTakeoffsLandings', 'nightTakeoffsLandings',
  'actualImc', 'hood', 'simulator',
  'ifrApproaches', 'holding',
  'asFlightInstructor', 'dualReceived',
  'flightHours',
];

/**
 * Labels for totals rows
 */
export const TOTALS_LABELS = {
  PAGE_TOTALS: 'PAGE TOTALS',
  TOTALS_FORWARDED: 'TOTALS FORWARDED',
  TOTALS_TO_DATE: 'TOTALS TO DATE',
} as const;

/**
 * Format a time value for display (decimal hours)
 */
export function formatTime(value: number | null | undefined): string {
  if (value === null || value === undefined || value === 0) {
    return '';
  }
  return value.toFixed(1);
}

/**
 * Format a count value for display (integers)
 */
export function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined || value === 0) {
    return '';
  }
  return value.toString();
}

/**
 * Format a date for display
 */
export function formatDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(-2);
  return `${day}/${month}/${year}`;
}
