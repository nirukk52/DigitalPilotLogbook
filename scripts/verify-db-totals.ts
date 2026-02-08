/**
 * Database Totals Verification Script
 * 
 * Purpose: Query DB totals and compare against Excel fixture.
 * This script verifies that imported data matches source Excel exactly.
 * 
 * Note: Uses the same rounding logic as lib/flights/aggregations.ts to ensure consistency.
 * 
 * Usage: npx dotenv -e .env.local -- npx tsx scripts/verify-db-totals.ts
 */

import "dotenv/config";
import { db } from "../lib/db";
import { flights } from "../lib/db/schema";
import { sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";
import { round1 } from "../lib/flights/aggregations";

interface ExpectedTotals {
  totalFlights: number;
  totalAircraftFlights: number;
  totalHours: number;
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
  dayTakeoffsLandings: number;
  nightTakeoffsLandings: number;
  ifrApproaches: number;
  holding: number;
}

interface VerificationResult {
  field: string;
  expected: number;
  actual: number;
  diff: number;
  status: "PASS" | "FAIL" | "WARN";
}

// round1 imported from lib/flights/aggregations.ts for consistency

async function getDbTotals(): Promise<ExpectedTotals> {
  // Query aggregated totals from DB
  const result = await db
    .select({
      totalFlights: sql<number>`COUNT(*)`,
      totalHours: sql<number>`ROUND(SUM(
        COALESCE(se_day_dual, 0) + COALESCE(se_day_pic, 0) + COALESCE(se_day_copilot, 0) +
        COALESCE(se_night_dual, 0) + COALESCE(se_night_pic, 0) + COALESCE(se_night_copilot, 0) +
        COALESCE(me_day_dual, 0) + COALESCE(me_day_pic, 0) + COALESCE(me_day_copilot, 0) +
        COALESCE(me_night_dual, 0) + COALESCE(me_night_pic, 0) + COALESCE(me_night_copilot, 0)
      )::numeric, 1)`,
      seDayDual: sql<number>`ROUND(SUM(COALESCE(se_day_dual, 0))::numeric, 1)`,
      seDayPic: sql<number>`ROUND(SUM(COALESCE(se_day_pic, 0))::numeric, 1)`,
      seDayCopilot: sql<number>`ROUND(SUM(COALESCE(se_day_copilot, 0))::numeric, 1)`,
      seNightDual: sql<number>`ROUND(SUM(COALESCE(se_night_dual, 0))::numeric, 1)`,
      seNightPic: sql<number>`ROUND(SUM(COALESCE(se_night_pic, 0))::numeric, 1)`,
      seNightCopilot: sql<number>`ROUND(SUM(COALESCE(se_night_copilot, 0))::numeric, 1)`,
      meDayDual: sql<number>`ROUND(SUM(COALESCE(me_day_dual, 0))::numeric, 1)`,
      meDayPic: sql<number>`ROUND(SUM(COALESCE(me_day_pic, 0))::numeric, 1)`,
      meDayCopilot: sql<number>`ROUND(SUM(COALESCE(me_day_copilot, 0))::numeric, 1)`,
      meNightDual: sql<number>`ROUND(SUM(COALESCE(me_night_dual, 0))::numeric, 1)`,
      meNightPic: sql<number>`ROUND(SUM(COALESCE(me_night_pic, 0))::numeric, 1)`,
      meNightCopilot: sql<number>`ROUND(SUM(COALESCE(me_night_copilot, 0))::numeric, 1)`,
      xcDayDual: sql<number>`ROUND(SUM(COALESCE(xc_day_dual, 0))::numeric, 1)`,
      xcDayPic: sql<number>`ROUND(SUM(COALESCE(xc_day_pic, 0))::numeric, 1)`,
      xcDayCopilot: sql<number>`ROUND(SUM(COALESCE(xc_day_copilot, 0))::numeric, 1)`,
      xcNightDual: sql<number>`ROUND(SUM(COALESCE(xc_night_dual, 0))::numeric, 1)`,
      xcNightPic: sql<number>`ROUND(SUM(COALESCE(xc_night_pic, 0))::numeric, 1)`,
      xcNightCopilot: sql<number>`ROUND(SUM(COALESCE(xc_night_copilot, 0))::numeric, 1)`,
      actualImc: sql<number>`ROUND(SUM(COALESCE(actual_imc, 0))::numeric, 1)`,
      hood: sql<number>`ROUND(SUM(COALESCE(hood, 0))::numeric, 1)`,
      simulator: sql<number>`ROUND(SUM(COALESCE(simulator, 0))::numeric, 1)`,
      asFlightInstructor: sql<number>`ROUND(SUM(COALESCE(as_flight_instructor, 0))::numeric, 1)`,
      dualReceived: sql<number>`ROUND(SUM(COALESCE(dual_received, 0))::numeric, 1)`,
      dayTakeoffsLandings: sql<number>`SUM(COALESCE(day_takeoffs_landings, 0))`,
      nightTakeoffsLandings: sql<number>`SUM(COALESCE(night_takeoffs_landings, 0))`,
      ifrApproaches: sql<number>`SUM(COALESCE(ifr_approaches, 0))`,
      holding: sql<number>`SUM(COALESCE(holding, 0))`,
    })
    .from(flights);

  const r = result[0];
  
  // Count aircraft flights (excluding simulator-only)
  const aircraftCount = await db
    .select({
      count: sql<number>`COUNT(*)`,
    })
    .from(flights)
    .where(sql`(
      COALESCE(se_day_dual, 0) + COALESCE(se_day_pic, 0) + COALESCE(se_day_copilot, 0) +
      COALESCE(se_night_dual, 0) + COALESCE(se_night_pic, 0) + COALESCE(se_night_copilot, 0) +
      COALESCE(me_day_dual, 0) + COALESCE(me_day_pic, 0) + COALESCE(me_day_copilot, 0) +
      COALESCE(me_night_dual, 0) + COALESCE(me_night_pic, 0) + COALESCE(me_night_copilot, 0)
    ) > 0`);

  return {
    totalFlights: Number(r.totalFlights),
    totalAircraftFlights: Number(aircraftCount[0].count),
    totalHours: Number(r.totalHours),
    seDayDual: Number(r.seDayDual),
    seDayPic: Number(r.seDayPic),
    seDayCopilot: Number(r.seDayCopilot),
    seNightDual: Number(r.seNightDual),
    seNightPic: Number(r.seNightPic),
    seNightCopilot: Number(r.seNightCopilot),
    meDayDual: Number(r.meDayDual),
    meDayPic: Number(r.meDayPic),
    meDayCopilot: Number(r.meDayCopilot),
    meNightDual: Number(r.meNightDual),
    meNightPic: Number(r.meNightPic),
    meNightCopilot: Number(r.meNightCopilot),
    xcDayDual: Number(r.xcDayDual),
    xcDayPic: Number(r.xcDayPic),
    xcDayCopilot: Number(r.xcDayCopilot),
    xcNightDual: Number(r.xcNightDual),
    xcNightPic: Number(r.xcNightPic),
    xcNightCopilot: Number(r.xcNightCopilot),
    actualImc: Number(r.actualImc),
    hood: Number(r.hood),
    simulator: Number(r.simulator),
    asFlightInstructor: Number(r.asFlightInstructor),
    dualReceived: Number(r.dualReceived),
    dayTakeoffsLandings: Number(r.dayTakeoffsLandings),
    nightTakeoffsLandings: Number(r.nightTakeoffsLandings),
    ifrApproaches: Number(r.ifrApproaches),
    holding: Number(r.holding),
  };
}

function compare(
  field: string, 
  expected: number, 
  actual: number,
  tolerance: number = 0.1
): VerificationResult {
  const diff = Math.abs(expected - actual);
  let status: "PASS" | "FAIL" | "WARN";
  
  if (diff === 0) {
    status = "PASS";
  } else if (diff <= tolerance) {
    status = "WARN"; // Within rounding tolerance
  } else {
    status = "FAIL";
  }
  
  return { field, expected, actual, diff: round1(diff), status };
}

async function main() {
  console.log("=".repeat(60));
  console.log("DATABASE VERIFICATION AGAINST EXCEL FIXTURE");
  console.log("=".repeat(60));
  
  // Load fixture
  const fixturePath = path.resolve(__dirname, "../test-fixtures/expected-excel-totals.json");
  
  if (!fs.existsSync(fixturePath)) {
    console.error("ERROR: Fixture file not found. Run verify-excel-import.ts first.");
    process.exit(1);
  }
  
  const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf-8"));
  const expected: ExpectedTotals = fixture.totals;
  
  console.log(`\nFixture generated: ${fixture.generatedAt}`);
  console.log(`Source: ${fixture.sourceFile}\n`);
  
  // Get DB totals
  console.log("Querying database...\n");
  const actual = await getDbTotals();
  
  // Compare all fields
  const results: VerificationResult[] = [
    compare("totalFlights", expected.totalFlights, actual.totalFlights, 0),
    compare("totalAircraftFlights", expected.totalAircraftFlights, actual.totalAircraftFlights, 0),
    compare("totalHours", expected.totalHours, actual.totalHours),
    compare("seDayDual", expected.seDayDual, actual.seDayDual),
    compare("seDayPic", expected.seDayPic, actual.seDayPic),
    compare("seDayCopilot", expected.seDayCopilot, actual.seDayCopilot),
    compare("seNightDual", expected.seNightDual, actual.seNightDual),
    compare("seNightPic", expected.seNightPic, actual.seNightPic),
    compare("seNightCopilot", expected.seNightCopilot, actual.seNightCopilot),
    compare("meDayDual", expected.meDayDual, actual.meDayDual),
    compare("meDayPic", expected.meDayPic, actual.meDayPic),
    compare("meDayCopilot", expected.meDayCopilot, actual.meDayCopilot),
    compare("meNightDual", expected.meNightDual, actual.meNightDual),
    compare("meNightPic", expected.meNightPic, actual.meNightPic),
    compare("meNightCopilot", expected.meNightCopilot, actual.meNightCopilot),
    compare("xcDayDual", expected.xcDayDual, actual.xcDayDual),
    compare("xcDayPic", expected.xcDayPic, actual.xcDayPic),
    compare("xcDayCopilot", expected.xcDayCopilot, actual.xcDayCopilot),
    compare("xcNightDual", expected.xcNightDual, actual.xcNightDual),
    compare("xcNightPic", expected.xcNightPic, actual.xcNightPic),
    compare("xcNightCopilot", expected.xcNightCopilot, actual.xcNightCopilot),
    compare("actualImc", expected.actualImc, actual.actualImc),
    compare("hood", expected.hood, actual.hood),
    compare("simulator", expected.simulator, actual.simulator),
    compare("asFlightInstructor", expected.asFlightInstructor, actual.asFlightInstructor),
    compare("dualReceived", expected.dualReceived, actual.dualReceived),
    compare("dayTakeoffsLandings", expected.dayTakeoffsLandings, actual.dayTakeoffsLandings, 0),
    compare("nightTakeoffsLandings", expected.nightTakeoffsLandings, actual.nightTakeoffsLandings, 0),
    compare("ifrApproaches", expected.ifrApproaches, actual.ifrApproaches, 0),
    compare("holding", expected.holding, actual.holding, 0),
  ];
  
  // Print results
  console.log("VERIFICATION RESULTS:");
  console.log("-".repeat(60));
  console.log("Field".padEnd(25) + "Expected".padStart(12) + "Actual".padStart(12) + "Diff".padStart(8) + "Status".padStart(8));
  console.log("-".repeat(60));
  
  let passCount = 0;
  let warnCount = 0;
  let failCount = 0;
  
  for (const r of results) {
    const statusIcon = r.status === "PASS" ? "✅" : r.status === "WARN" ? "⚠️" : "❌";
    console.log(
      r.field.padEnd(25) +
      String(r.expected).padStart(12) +
      String(r.actual).padStart(12) +
      String(r.diff).padStart(8) +
      `${statusIcon} ${r.status}`.padStart(10)
    );
    
    if (r.status === "PASS") passCount++;
    else if (r.status === "WARN") warnCount++;
    else failCount++;
  }
  
  console.log("-".repeat(60));
  console.log(`\n📊 SUMMARY: ${passCount} PASS, ${warnCount} WARN, ${failCount} FAIL`);
  
  if (failCount > 0) {
    console.log("\n❌ VERIFICATION FAILED - Fix the issues above");
    process.exit(1);
  } else if (warnCount > 0) {
    console.log("\n⚠️ VERIFICATION PASSED WITH WARNINGS (within rounding tolerance)");
  } else {
    console.log("\n✅ VERIFICATION PASSED - All values match!");
  }
  
  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
