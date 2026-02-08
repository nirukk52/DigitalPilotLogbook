/**
 * Excel Import Verification Script
 * 
 * Purpose: Parse Excel file and calculate expected totals from raw data rows.
 * This creates the "source of truth" that all DB queries must match.
 * 
 * Note: Uses the same rounding logic as lib/flights/aggregations.ts to ensure consistency.
 * 
 * Usage: npx tsx scripts/verify-excel-import.ts
 */

import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";
import { round1 } from "../lib/flights/aggregations";

// Column indices based on column-mapper.ts
const COLUMNS = {
  DATE: 0,
  MAKE_MODEL: 1,
  REGISTRATION: 2,
  PIC: 3,
  COPILOT: 4,
  FROM: 5,
  TO: 6,
  REMARKS: 7,
  // Single-engine
  SE_DAY_DUAL: 8,
  SE_DAY_PIC: 9,
  SE_DAY_COPILOT: 10,
  SE_NIGHT_DUAL: 11,
  SE_NIGHT_PIC: 12,
  SE_NIGHT_COPILOT: 13,
  // Multi-engine
  ME_DAY_DUAL: 14,
  ME_DAY_PIC: 15,
  ME_DAY_COPILOT: 16,
  ME_NIGHT_DUAL: 17,
  ME_NIGHT_PIC: 18,
  ME_NIGHT_COPILOT: 19,
  // Cross-country
  XC_DAY_DUAL: 20,
  XC_DAY_PIC: 21,
  XC_DAY_COPILOT: 22,
  XC_NIGHT_DUAL: 23,
  XC_NIGHT_PIC: 24,
  XC_NIGHT_COPILOT: 25,
  // Takeoffs/Landings
  DAY_TL: 26,
  NIGHT_TL: 27,
  // Instrument
  ACTUAL_IMC: 28,
  HOOD: 29,
  SIMULATOR: 30,
  IFR_APPROACHES: 31,
  HOLDING: 32,
  // Other
  AS_INSTRUCTOR: 33,
  DUAL_RECEIVED: 34,
} as const;

const HEADER_ROWS = 3;

interface FlightRow {
  rowNumber: number;
  date: string | null;
  makeModel: string | null;
  registration: string | null;
  // Time values
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
  dayTL: number;
  nightTL: number;
  actualImc: number;
  hood: number;
  simulator: number;
  ifrApproaches: number;
  holding: number;
  asInstructor: number;
  dualReceived: number;
  // Computed
  flightHours: number;
  isSimulatorOnly: boolean;
}

interface ExpectedTotals {
  // Counts
  totalFlights: number;
  totalAircraftFlights: number; // Excluding simulator-only
  
  // Hours (1 decimal)
  totalHours: number; // SE + ME only (no sim)
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
  actualImc: number;
  hood: number;
  simulator: number;
  asFlightInstructor: number;
  dualReceived: number;
  
  // Integer counts
  dayTakeoffsLandings: number;
  nightTakeoffsLandings: number;
  ifrApproaches: number;
  holding: number;
  
  // Derived totals (for dashboard)
  seDayTotal: number;  // SE Day (Dual + PIC + Copilot)
  seNightTotal: number;
  meDayTotal: number;
  meNightTotal: number;
  xcDayTotal: number;
  xcNightTotal: number;
  totalPic: number;    // All PIC time
  totalDual: number;   // All Dual time
}

interface AircraftBreakdown {
  makeModel: string;
  flights: number;
  totalHours: number;
  seDayDual: number;
  seDayPic: number;
  seNightPic: number;
  xcDayPic: number;
  dayTL: number;
  nightTL: number;
  actualImc: number;
  hood: number;
  simulator: number;
  asInstructor: number;
  dualReceived: number;
}

function parseNumber(value: unknown): number {
  if (value === null || value === undefined || value === "") return 0;
  const num = typeof value === "number" ? value : parseFloat(String(value));
  return isNaN(num) ? 0 : num;
}

// round1 imported from lib/flights/aggregations.ts for consistency

function parseExcelRow(row: unknown[], rowNumber: number): FlightRow | null {
  const dateVal = row[COLUMNS.DATE];
  
  // Skip rows without date (not a flight row)
  if (dateVal === null || dateVal === undefined || dateVal === "") {
    return null;
  }
  
  // Skip header rows that got parsed (e.g., "MAKE / MODEL" in column 1)
  const makeModel = row[COLUMNS.MAKE_MODEL];
  if (makeModel && typeof makeModel === "string") {
    const upper = makeModel.toUpperCase();
    if (upper.includes("MAKE") || upper.includes("MODEL") || upper === "TYPE") {
      return null;
    }
  }
  
  const seDayDual = parseNumber(row[COLUMNS.SE_DAY_DUAL]);
  const seDayPic = parseNumber(row[COLUMNS.SE_DAY_PIC]);
  const seDayCopilot = parseNumber(row[COLUMNS.SE_DAY_COPILOT]);
  const seNightDual = parseNumber(row[COLUMNS.SE_NIGHT_DUAL]);
  const seNightPic = parseNumber(row[COLUMNS.SE_NIGHT_PIC]);
  const seNightCopilot = parseNumber(row[COLUMNS.SE_NIGHT_COPILOT]);
  const meDayDual = parseNumber(row[COLUMNS.ME_DAY_DUAL]);
  const meDayPic = parseNumber(row[COLUMNS.ME_DAY_PIC]);
  const meDayCopilot = parseNumber(row[COLUMNS.ME_DAY_COPILOT]);
  const meNightDual = parseNumber(row[COLUMNS.ME_NIGHT_DUAL]);
  const meNightPic = parseNumber(row[COLUMNS.ME_NIGHT_PIC]);
  const meNightCopilot = parseNumber(row[COLUMNS.ME_NIGHT_COPILOT]);
  const simulator = parseNumber(row[COLUMNS.SIMULATOR]);
  
  // Calculate aircraft time (SE + ME, no simulator)
  const aircraftTime = 
    seDayDual + seDayPic + seDayCopilot +
    seNightDual + seNightPic + seNightCopilot +
    meDayDual + meDayPic + meDayCopilot +
    meNightDual + meNightPic + meNightCopilot;
  
  const isSimulatorOnly = aircraftTime === 0 && simulator > 0;
  
  return {
    rowNumber,
    date: dateVal ? String(dateVal) : null,
    makeModel: row[COLUMNS.MAKE_MODEL] ? String(row[COLUMNS.MAKE_MODEL]).trim() : null,
    registration: row[COLUMNS.REGISTRATION] ? String(row[COLUMNS.REGISTRATION]).trim() : null,
    seDayDual,
    seDayPic,
    seDayCopilot,
    seNightDual,
    seNightPic,
    seNightCopilot,
    meDayDual,
    meDayPic,
    meDayCopilot,
    meNightDual,
    meNightPic,
    meNightCopilot,
    xcDayDual: parseNumber(row[COLUMNS.XC_DAY_DUAL]),
    xcDayPic: parseNumber(row[COLUMNS.XC_DAY_PIC]),
    xcDayCopilot: parseNumber(row[COLUMNS.XC_DAY_COPILOT]),
    xcNightDual: parseNumber(row[COLUMNS.XC_NIGHT_DUAL]),
    xcNightPic: parseNumber(row[COLUMNS.XC_NIGHT_PIC]),
    xcNightCopilot: parseNumber(row[COLUMNS.XC_NIGHT_COPILOT]),
    dayTL: parseNumber(row[COLUMNS.DAY_TL]),
    nightTL: parseNumber(row[COLUMNS.NIGHT_TL]),
    actualImc: parseNumber(row[COLUMNS.ACTUAL_IMC]),
    hood: parseNumber(row[COLUMNS.HOOD]),
    simulator,
    ifrApproaches: parseNumber(row[COLUMNS.IFR_APPROACHES]),
    holding: parseNumber(row[COLUMNS.HOLDING]),
    asInstructor: parseNumber(row[COLUMNS.AS_INSTRUCTOR]),
    dualReceived: parseNumber(row[COLUMNS.DUAL_RECEIVED]),
    flightHours: round1(aircraftTime), // Exclude simulator
    isSimulatorOnly,
  };
}

function calculateTotals(flights: FlightRow[]): ExpectedTotals {
  const totals: ExpectedTotals = {
    totalFlights: flights.length,
    totalAircraftFlights: flights.filter(f => !f.isSimulatorOnly).length,
    totalHours: 0,
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
    actualImc: 0,
    hood: 0,
    simulator: 0,
    asFlightInstructor: 0,
    dualReceived: 0,
    dayTakeoffsLandings: 0,
    nightTakeoffsLandings: 0,
    ifrApproaches: 0,
    holding: 0,
    seDayTotal: 0,
    seNightTotal: 0,
    meDayTotal: 0,
    meNightTotal: 0,
    xcDayTotal: 0,
    xcNightTotal: 0,
    totalPic: 0,
    totalDual: 0,
  };
  
  for (const f of flights) {
    totals.seDayDual += f.seDayDual;
    totals.seDayPic += f.seDayPic;
    totals.seDayCopilot += f.seDayCopilot;
    totals.seNightDual += f.seNightDual;
    totals.seNightPic += f.seNightPic;
    totals.seNightCopilot += f.seNightCopilot;
    totals.meDayDual += f.meDayDual;
    totals.meDayPic += f.meDayPic;
    totals.meDayCopilot += f.meDayCopilot;
    totals.meNightDual += f.meNightDual;
    totals.meNightPic += f.meNightPic;
    totals.meNightCopilot += f.meNightCopilot;
    totals.xcDayDual += f.xcDayDual;
    totals.xcDayPic += f.xcDayPic;
    totals.xcDayCopilot += f.xcDayCopilot;
    totals.xcNightDual += f.xcNightDual;
    totals.xcNightPic += f.xcNightPic;
    totals.xcNightCopilot += f.xcNightCopilot;
    totals.actualImc += f.actualImc;
    totals.hood += f.hood;
    totals.simulator += f.simulator;
    totals.asFlightInstructor += f.asInstructor;
    totals.dualReceived += f.dualReceived;
    totals.dayTakeoffsLandings += f.dayTL;
    totals.nightTakeoffsLandings += f.nightTL;
    totals.ifrApproaches += f.ifrApproaches;
    totals.holding += f.holding;
  }
  
  // Calculate derived totals
  totals.totalHours = round1(
    totals.seDayDual + totals.seDayPic + totals.seDayCopilot +
    totals.seNightDual + totals.seNightPic + totals.seNightCopilot +
    totals.meDayDual + totals.meDayPic + totals.meDayCopilot +
    totals.meNightDual + totals.meNightPic + totals.meNightCopilot
  );
  
  totals.seDayTotal = round1(totals.seDayDual + totals.seDayPic + totals.seDayCopilot);
  totals.seNightTotal = round1(totals.seNightDual + totals.seNightPic + totals.seNightCopilot);
  totals.meDayTotal = round1(totals.meDayDual + totals.meDayPic + totals.meDayCopilot);
  totals.meNightTotal = round1(totals.meNightDual + totals.meNightPic + totals.meNightCopilot);
  totals.xcDayTotal = round1(totals.xcDayDual + totals.xcDayPic + totals.xcDayCopilot);
  totals.xcNightTotal = round1(totals.xcNightDual + totals.xcNightPic + totals.xcNightCopilot);
  
  totals.totalPic = round1(
    totals.seDayPic + totals.seNightPic + totals.meDayPic + totals.meNightPic
  );
  totals.totalDual = round1(
    totals.seDayDual + totals.seNightDual + totals.meDayDual + totals.meNightDual
  );
  
  // Round all hour values
  totals.seDayDual = round1(totals.seDayDual);
  totals.seDayPic = round1(totals.seDayPic);
  totals.seDayCopilot = round1(totals.seDayCopilot);
  totals.seNightDual = round1(totals.seNightDual);
  totals.seNightPic = round1(totals.seNightPic);
  totals.seNightCopilot = round1(totals.seNightCopilot);
  totals.meDayDual = round1(totals.meDayDual);
  totals.meDayPic = round1(totals.meDayPic);
  totals.meDayCopilot = round1(totals.meDayCopilot);
  totals.meNightDual = round1(totals.meNightDual);
  totals.meNightPic = round1(totals.meNightPic);
  totals.meNightCopilot = round1(totals.meNightCopilot);
  totals.xcDayDual = round1(totals.xcDayDual);
  totals.xcDayPic = round1(totals.xcDayPic);
  totals.xcDayCopilot = round1(totals.xcDayCopilot);
  totals.xcNightDual = round1(totals.xcNightDual);
  totals.xcNightPic = round1(totals.xcNightPic);
  totals.xcNightCopilot = round1(totals.xcNightCopilot);
  totals.actualImc = round1(totals.actualImc);
  totals.hood = round1(totals.hood);
  totals.simulator = round1(totals.simulator);
  totals.asFlightInstructor = round1(totals.asFlightInstructor);
  totals.dualReceived = round1(totals.dualReceived);
  
  return totals;
}

function getAircraftBreakdown(flights: FlightRow[]): AircraftBreakdown[] {
  const byAircraft = new Map<string, AircraftBreakdown>();
  
  for (const f of flights) {
    const key = f.makeModel || "Unknown";
    
    if (!byAircraft.has(key)) {
      byAircraft.set(key, {
        makeModel: key,
        flights: 0,
        totalHours: 0,
        seDayDual: 0,
        seDayPic: 0,
        seNightPic: 0,
        xcDayPic: 0,
        dayTL: 0,
        nightTL: 0,
        actualImc: 0,
        hood: 0,
        simulator: 0,
        asInstructor: 0,
        dualReceived: 0,
      });
    }
    
    const ac = byAircraft.get(key)!;
    ac.flights++;
    ac.totalHours += f.flightHours;
    ac.seDayDual += f.seDayDual;
    ac.seDayPic += f.seDayPic;
    ac.seNightPic += f.seNightPic;
    ac.xcDayPic += f.xcDayPic;
    ac.dayTL += f.dayTL;
    ac.nightTL += f.nightTL;
    ac.actualImc += f.actualImc;
    ac.hood += f.hood;
    ac.simulator += f.simulator;
    ac.asInstructor += f.asInstructor;
    ac.dualReceived += f.dualReceived;
  }
  
  // Round all values
  for (const ac of byAircraft.values()) {
    ac.totalHours = round1(ac.totalHours);
    ac.seDayDual = round1(ac.seDayDual);
    ac.seDayPic = round1(ac.seDayPic);
    ac.seNightPic = round1(ac.seNightPic);
    ac.xcDayPic = round1(ac.xcDayPic);
    ac.actualImc = round1(ac.actualImc);
    ac.hood = round1(ac.hood);
    ac.simulator = round1(ac.simulator);
    ac.asInstructor = round1(ac.asInstructor);
    ac.dualReceived = round1(ac.dualReceived);
  }
  
  return Array.from(byAircraft.values()).sort((a, b) => b.totalHours - a.totalHours);
}

async function main() {
  const excelPath = path.resolve(__dirname, "../Excel Log Canada.xlsx");
  
  console.log("=".repeat(60));
  console.log("EXCEL IMPORT VERIFICATION SCRIPT");
  console.log("=".repeat(60));
  console.log(`Reading: ${excelPath}\n`);
  
  if (!fs.existsSync(excelPath)) {
    console.error("ERROR: Excel file not found!");
    process.exit(1);
  }
  
  const buffer = fs.readFileSync(excelPath);
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  
  console.log("Sheets found:", workbook.SheetNames);
  
  // Parse first sheet (raw flight data)
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
    raw: true,
  }) as unknown[][];
  
  console.log(`Total rows in sheet: ${rows.length}`);
  console.log(`Header rows: ${HEADER_ROWS}`);
  console.log(`Data rows: ${rows.length - HEADER_ROWS}\n`);
  
  // Parse all flight rows
  const flights: FlightRow[] = [];
  const skippedRows: number[] = [];
  
  for (let i = HEADER_ROWS; i < rows.length; i++) {
    const row = rows[i];
    const flight = parseExcelRow(row, i + 1); // 1-indexed
    
    if (flight) {
      flights.push(flight);
    } else {
      skippedRows.push(i + 1);
    }
  }
  
  console.log(`Parsed flights: ${flights.length}`);
  console.log(`Skipped rows (no date): ${skippedRows.length}`);
  
  // Calculate totals
  const totals = calculateTotals(flights);
  const aircraftBreakdown = getAircraftBreakdown(flights);
  
  console.log("\n" + "=".repeat(60));
  console.log("EXPECTED TOTALS (from raw Excel data)");
  console.log("=".repeat(60));
  
  console.log("\n📊 SUMMARY:");
  console.log(`  Total Flights:          ${totals.totalFlights}`);
  console.log(`  Aircraft Flights:       ${totals.totalAircraftFlights}`);
  console.log(`  Simulator-Only:         ${totals.totalFlights - totals.totalAircraftFlights}`);
  console.log(`  Total Aircraft Hours:   ${totals.totalHours}h`);
  console.log(`  Simulator Hours:        ${totals.simulator}h`);
  
  console.log("\n🛩️ SINGLE-ENGINE TIME:");
  console.log(`  SE Day Dual:     ${totals.seDayDual}h`);
  console.log(`  SE Day PIC:      ${totals.seDayPic}h`);
  console.log(`  SE Day Copilot:  ${totals.seDayCopilot}h`);
  console.log(`  SE Night Dual:   ${totals.seNightDual}h`);
  console.log(`  SE Night PIC:    ${totals.seNightPic}h`);
  console.log(`  SE Night Copilot:${totals.seNightCopilot}h`);
  console.log(`  --- SE Day Total:  ${totals.seDayTotal}h`);
  console.log(`  --- SE Night Total:${totals.seNightTotal}h`);
  
  console.log("\n✈️ MULTI-ENGINE TIME:");
  console.log(`  ME Day Dual:     ${totals.meDayDual}h`);
  console.log(`  ME Day PIC:      ${totals.meDayPic}h`);
  console.log(`  ME Day Copilot:  ${totals.meDayCopilot}h`);
  console.log(`  ME Night Dual:   ${totals.meNightDual}h`);
  console.log(`  ME Night PIC:    ${totals.meNightPic}h`);
  console.log(`  ME Night Copilot:${totals.meNightCopilot}h`);
  
  console.log("\n🗺️ CROSS-COUNTRY TIME:");
  console.log(`  XC Day Dual:     ${totals.xcDayDual}h`);
  console.log(`  XC Day PIC:      ${totals.xcDayPic}h`);
  console.log(`  XC Day Copilot:  ${totals.xcDayCopilot}h`);
  console.log(`  XC Night Dual:   ${totals.xcNightDual}h`);
  console.log(`  XC Night PIC:    ${totals.xcNightPic}h`);
  console.log(`  XC Night Copilot:${totals.xcNightCopilot}h`);
  
  console.log("\n🛬 TAKEOFFS/LANDINGS:");
  console.log(`  Day T/O & Ldg:   ${totals.dayTakeoffsLandings}`);
  console.log(`  Night T/O & Ldg: ${totals.nightTakeoffsLandings}`);
  
  console.log("\n📡 INSTRUMENT TIME:");
  console.log(`  Actual IMC:      ${totals.actualImc}h`);
  console.log(`  Hood:            ${totals.hood}h`);
  console.log(`  Simulator:       ${totals.simulator}h`);
  console.log(`  IFR Approaches:  ${totals.ifrApproaches}`);
  console.log(`  Holding:         ${totals.holding}`);
  
  console.log("\n👨‍✈️ INSTRUCTOR/DUAL:");
  console.log(`  As Instructor:   ${totals.asFlightInstructor}h`);
  console.log(`  Dual Received:   ${totals.dualReceived}h`);
  
  console.log("\n" + "=".repeat(60));
  console.log("AIRCRAFT BREAKDOWN");
  console.log("=".repeat(60));
  
  for (const ac of aircraftBreakdown) {
    console.log(`\n${ac.makeModel}:`);
    console.log(`  Flights: ${ac.flights}, Total Hours: ${ac.totalHours}h`);
    console.log(`  SE Day Dual: ${ac.seDayDual}h, SE Day PIC: ${ac.seDayPic}h`);
    console.log(`  Simulator: ${ac.simulator}h, As Instructor: ${ac.asInstructor}h`);
  }
  
  // Save to JSON fixture
  const fixture = {
    generatedAt: new Date().toISOString(),
    sourceFile: "Excel Log Canada.xlsx",
    totals,
    aircraftBreakdown,
    simulatorOnlyFlights: flights.filter(f => f.isSimulatorOnly).map(f => ({
      row: f.rowNumber,
      date: f.date,
      makeModel: f.makeModel,
      simHours: f.simulator,
    })),
  };
  
  const fixturePath = path.resolve(__dirname, "../test-fixtures/expected-excel-totals.json");
  const fixtureDir = path.dirname(fixturePath);
  
  if (!fs.existsSync(fixtureDir)) {
    fs.mkdirSync(fixtureDir, { recursive: true });
  }
  
  fs.writeFileSync(fixturePath, JSON.stringify(fixture, null, 2));
  console.log(`\n✅ Fixture saved to: ${fixturePath}`);
  
  // Identify problematic rows
  console.log("\n" + "=".repeat(60));
  console.log("PROBLEMATIC ROWS ANALYSIS");
  console.log("=".repeat(60));
  
  // Find rows that might be invalid
  const invalidMakeModels = flights.filter(f => 
    !f.makeModel || 
    f.makeModel.includes("MAKE") || 
    f.makeModel.includes("MODEL") ||
    f.makeModel.trim() === ""
  );
  
  console.log(`\nRows with invalid Make/Model: ${invalidMakeModels.length}`);
  for (const f of invalidMakeModels) {
    console.log(`  Row ${f.rowNumber}: "${f.makeModel}" - date: ${f.date}`);
  }
  
  // Find rows with zero total time
  const zeroTimeRows = flights.filter(f => 
    f.flightHours === 0 && f.simulator === 0
  );
  console.log(`\nRows with zero total time (no hours, no sim): ${zeroTimeRows.length}`);
  for (const f of zeroTimeRows.slice(0, 10)) {
    console.log(`  Row ${f.rowNumber}: ${f.makeModel} - ${f.date}`);
  }
  
  // Calculate what Dashboard might be counting
  const validAircraftFlights = flights.filter(f => 
    f.makeModel && 
    !f.makeModel.includes("MAKE") && 
    f.flightHours > 0
  );
  const validSimFlights = flights.filter(f =>
    f.makeModel &&
    !f.makeModel.includes("MAKE") &&
    f.isSimulatorOnly
  );
  
  console.log(`\nValid aircraft flights (has hours): ${validAircraftFlights.length}`);
  console.log(`Valid simulator-only flights: ${validSimFlights.length}`);
  console.log(`Combined valid: ${validAircraftFlights.length + validSimFlights.length}`);
  
  // Check Dashboard expected
  console.log("\n📊 DASHBOARD RECONCILIATION:");
  console.log(`  Dashboard shows: 864 flights`);
  console.log(`  Raw data total: ${flights.length}`);
  console.log(`  Difference: ${flights.length - 864}`);
  
  // Sum up flights by aircraft type from Dashboard
  const dashboardAircraft = [
    { type: "C152", flights: 359 },
    { type: "C172", flights: 460 },
    { type: "PA34", flights: 2 },
    { type: "PA44", flights: 18 },
    { type: "Redbird FMX", flights: 16 },
    { type: "AL250", flights: 9 },
  ];
  const dashboardTotal = dashboardAircraft.reduce((sum, a) => sum + a.flights, 0);
  console.log(`  Sum of Dashboard aircraft: ${dashboardTotal}`);
  
  // Also check the Dashboard sheet if it exists
  if (workbook.SheetNames.includes("Dashboard")) {
    console.log("\n" + "=".repeat(60));
    console.log("DASHBOARD SHEET VALUES");
    console.log("=".repeat(60));
    
    const dashboardSheet = workbook.Sheets["Dashboard"];
    const dashboardData = XLSX.utils.sheet_to_json(dashboardSheet, {
      header: 1,
      raw: true,
    }) as unknown[][];
    
    console.log(`Dashboard rows: ${dashboardData.length}`);
    
    // Print first 20 rows for inspection
    for (let i = 0; i < Math.min(20, dashboardData.length); i++) {
      const row = dashboardData[i];
      if (row && row.length > 0) {
        console.log(`Row ${i + 1}:`, row.slice(0, 8));
      }
    }
  }
  
  console.log("\n✅ Verification complete!");
}

main().catch(console.error);
