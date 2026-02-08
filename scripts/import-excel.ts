/**
 * Direct Excel Import Script
 * 
 * Purpose: Import Excel file directly to database, bypassing the API.
 * This ensures a clean import for testing.
 * 
 * Usage: npx dotenv -e .env.local -- npx tsx scripts/import-excel.ts
 */

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { parseExcelFile } from "../lib/import/excel-parser";
import { saveFlights } from "../lib/db/queries";

const USER_ID = "default";

async function main() {
  const excelPath = path.resolve(__dirname, "../Excel Log Canada.xlsx");
  
  console.log("=".repeat(60));
  console.log("EXCEL IMPORT SCRIPT");
  console.log("=".repeat(60));
  console.log(`Reading: ${excelPath}\n`);
  
  if (!fs.existsSync(excelPath)) {
    console.error("ERROR: Excel file not found!");
    process.exit(1);
  }
  
  // Read and parse Excel file
  const buffer = fs.readFileSync(excelPath);
  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  );
  
  console.log("Parsing Excel file...");
  const flights = parseExcelFile(arrayBuffer as ArrayBuffer);
  
  console.log(`Parsed ${flights.length} flights\n`);
  
  // Show sample of first 5 flights
  console.log("Sample flights:");
  for (const f of flights.slice(0, 5)) {
    console.log(`  Row ${f.rowNumber}: ${f.flightDate.toISOString().split('T')[0]} - ${f.aircraftMakeModel} (${f.registration}) - ${f.flightHours}h`);
  }
  
  // Transform to DB format
  const flightData = flights.map((flight) => ({
    flightDate: flight.flightDate.toISOString().split("T")[0],
    aircraftMakeModel: flight.aircraftMakeModel,
    registration: flight.registration,
    pilotInCommand: flight.pilotInCommand,
    copilotOrStudent: flight.copilotOrStudent,
    departureAirport: flight.departureAirport,
    arrivalAirport: flight.arrivalAirport,
    remarks: flight.remarks,
    seDayDual: flight.seDayDual,
    seDayPic: flight.seDayPic,
    seDayCopilot: flight.seDayCopilot,
    seNightDual: flight.seNightDual,
    seNightPic: flight.seNightPic,
    seNightCopilot: flight.seNightCopilot,
    meDayDual: flight.meDayDual,
    meDayPic: flight.meDayPic,
    meDayCopilot: flight.meDayCopilot,
    meNightDual: flight.meNightDual,
    meNightPic: flight.meNightPic,
    meNightCopilot: flight.meNightCopilot,
    xcDayDual: flight.xcDayDual,
    xcDayPic: flight.xcDayPic,
    xcDayCopilot: flight.xcDayCopilot,
    xcNightDual: flight.xcNightDual,
    xcNightPic: flight.xcNightPic,
    xcNightCopilot: flight.xcNightCopilot,
    dayTakeoffsLandings: flight.dayTakeoffsLandings,
    nightTakeoffsLandings: flight.nightTakeoffsLandings,
    actualImc: flight.actualImc,
    hood: flight.hood,
    simulator: flight.simulator,
    ifrApproaches: flight.ifrApproaches,
    holding: flight.holding,
    asFlightInstructor: flight.asFlightInstructor,
    dualReceived: flight.dualReceived,
    timeOn: flight.timeOn,
    timeOff: flight.timeOff,
    totalDuty: flight.totalDuty,
    flightHours: flight.flightHours,
  }));
  
  console.log(`\nImporting ${flightData.length} flights to database...`);
  
  const result = await saveFlights(flightData, USER_ID);
  
  console.log(`\n✅ Import complete!`);
  console.log(`  Deleted: ${result.deleted} existing flights`);
  console.log(`  Inserted: ${result.inserted} new flights`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
