/**
 * Advanced Portfolio Stats API Route
 * Uses advanced SQL queries to provide rich, aggregated flight data
 * Designed for the modern one-pager portfolio view
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { flights, userSettings } from "@/lib/db/schema";
import { eq, sql, desc, asc } from "drizzle-orm";
import { getSessionUserId } from "@/lib/session";
import { determineLogbookOwner } from "@/lib/flights/pilot-name";

/**
 * Response type for advanced portfolio stats
 * Contains pre-aggregated data for intuitive display
 */
interface AdvancedPortfolioStats {
  // Pilot info
  pilotName: string;
  
  // Core totals
  summary: {
    totalHours: number;
    totalFlights: number;
    firstFlightDate: string | null;
    lastFlightDate: string | null;
    uniqueAircraft: number;
    airportsVisited: number;
    averageFlightDuration: number;
  };
  
  // Time distribution (for visual breakdown)
  timeDistribution: {
    singleEngine: number;
    multiEngine: number;
    night: number;
    instrument: number;
    crossCountry: number;
    pic: number;
    dual: number;
    instructor: number;
  };
  
  // Monthly trend (last 12 months)
  monthlyTrend: Array<{
    month: string;
    hours: number;
    flights: number;
  }>;
  
  // Yearly progression
  yearlyProgression: Array<{
    year: number;
    totalHours: number;
    flights: number;
    picHours: number;
    dualHours: number;
  }>;
  
  // Top aircraft
  topAircraft: Array<{
    aircraft: string;
    flights: number;
    hours: number;
    avgDuration: number;
  }>;
  
  // Top airports
  topAirports: Array<{
    airport: string;
    departures: number;
    aircraftUsed: number;
  }>;
  
  // Counts (for quick stats)
  counts: {
    dayTakeoffsLandings: number;
    nightTakeoffsLandings: number;
    ifrApproaches: number;
    simulatorHours: number;
  };
}

/**
 * GET /api/portfolio/stats
 * Returns advanced portfolio statistics with SQL aggregations
 */
export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "No session found" }, { status: 401 });
    }

    // Get pilot name from user settings
    const settings = await db
      .select({ pilotName: userSettings.pilotName })
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .orderBy(desc(userSettings.version))
      .limit(1);
    
    let pilotName = settings[0]?.pilotName || null;
    
    // If no pilot name in settings, determine from flight data using shared utility
    if (!pilotName) {
      const userFlights = await db
        .select()
        .from(flights)
        .where(eq(flights.userId, userId));
      
      pilotName = determineLogbookOwner(userFlights);
    }

    // Core summary query
    const summaryResult = await db
      .select({
        totalFlights: sql<number>`COUNT(*)`,
        totalHours: sql<number>`ROUND(COALESCE(SUM(${flights.flightHours}), 0)::numeric, 1)`,
        firstFlightDate: sql<string>`MIN(${flights.flightDate})`,
        lastFlightDate: sql<string>`MAX(${flights.flightDate})`,
        uniqueAircraft: sql<number>`COUNT(DISTINCT ${flights.registration})`,
        airportsVisited: sql<number>`COUNT(DISTINCT ${flights.departureAirport})`,
        avgDuration: sql<number>`ROUND(AVG(${flights.flightHours})::numeric, 2)`,
      })
      .from(flights)
      .where(eq(flights.userId, userId));

    const summary = summaryResult[0] || {
      totalFlights: 0,
      totalHours: 0,
      firstFlightDate: null,
      lastFlightDate: null,
      uniqueAircraft: 0,
      airportsVisited: 0,
      avgDuration: 0,
    };

    // If no flights, return empty stats
    if (summary.totalFlights === 0) {
      return NextResponse.json({
        pilotName,
        summary: {
          totalHours: 0,
          totalFlights: 0,
          firstFlightDate: null,
          lastFlightDate: null,
          uniqueAircraft: 0,
          airportsVisited: 0,
          averageFlightDuration: 0,
        },
        timeDistribution: {
          singleEngine: 0, multiEngine: 0, night: 0, instrument: 0,
          crossCountry: 0, pic: 0, dual: 0, instructor: 0,
        },
        monthlyTrend: [],
        yearlyProgression: [],
        topAircraft: [],
        topAirports: [],
        counts: {
          dayTakeoffsLandings: 0,
          nightTakeoffsLandings: 0,
          ifrApproaches: 0,
          simulatorHours: 0,
        },
      });
    }

    // Time distribution query
    const timeDistResult = await db
      .select({
        singleEngine: sql<number>`ROUND(COALESCE(SUM(
          COALESCE(${flights.seDayDual}, 0) + COALESCE(${flights.seDayPic}, 0) + COALESCE(${flights.seDayCopilot}, 0) +
          COALESCE(${flights.seNightDual}, 0) + COALESCE(${flights.seNightPic}, 0) + COALESCE(${flights.seNightCopilot}, 0)
        ), 0)::numeric, 1)`,
        multiEngine: sql<number>`ROUND(COALESCE(SUM(
          COALESCE(${flights.meDayDual}, 0) + COALESCE(${flights.meDayPic}, 0) + COALESCE(${flights.meDayCopilot}, 0) +
          COALESCE(${flights.meNightDual}, 0) + COALESCE(${flights.meNightPic}, 0) + COALESCE(${flights.meNightCopilot}, 0)
        ), 0)::numeric, 1)`,
        night: sql<number>`ROUND(COALESCE(SUM(
          COALESCE(${flights.seNightDual}, 0) + COALESCE(${flights.seNightPic}, 0) + COALESCE(${flights.seNightCopilot}, 0) +
          COALESCE(${flights.meNightDual}, 0) + COALESCE(${flights.meNightPic}, 0) + COALESCE(${flights.meNightCopilot}, 0)
        ), 0)::numeric, 1)`,
        instrument: sql<number>`ROUND(COALESCE(SUM(COALESCE(${flights.actualImc}, 0) + COALESCE(${flights.hood}, 0)), 0)::numeric, 1)`,
        crossCountry: sql<number>`ROUND(COALESCE(SUM(
          COALESCE(${flights.xcDayDual}, 0) + COALESCE(${flights.xcDayPic}, 0) + COALESCE(${flights.xcDayCopilot}, 0) +
          COALESCE(${flights.xcNightDual}, 0) + COALESCE(${flights.xcNightPic}, 0) + COALESCE(${flights.xcNightCopilot}, 0)
        ), 0)::numeric, 1)`,
        pic: sql<number>`ROUND(COALESCE(SUM(
          COALESCE(${flights.seDayPic}, 0) + COALESCE(${flights.seNightPic}, 0) +
          COALESCE(${flights.meDayPic}, 0) + COALESCE(${flights.meNightPic}, 0) +
          COALESCE(${flights.xcDayPic}, 0) + COALESCE(${flights.xcNightPic}, 0)
        ), 0)::numeric, 1)`,
        dual: sql<number>`ROUND(COALESCE(SUM(COALESCE(${flights.dualReceived}, 0)), 0)::numeric, 1)`,
        instructor: sql<number>`ROUND(COALESCE(SUM(COALESCE(${flights.asFlightInstructor}, 0)), 0)::numeric, 1)`,
      })
      .from(flights)
      .where(eq(flights.userId, userId));

    const timeDistribution = timeDistResult[0] || {
      singleEngine: 0, multiEngine: 0, night: 0, instrument: 0,
      crossCountry: 0, pic: 0, dual: 0, instructor: 0,
    };

    // Monthly trend (last 12 months)
    const monthlyTrend = await db
      .select({
        month: sql<string>`to_char(DATE_TRUNC('month', ${flights.flightDate}), 'Mon YYYY')`,
        monthSort: sql<string>`DATE_TRUNC('month', ${flights.flightDate})`,
        hours: sql<number>`ROUND(SUM(${flights.flightHours})::numeric, 1)`,
        flights: sql<number>`COUNT(*)`,
      })
      .from(flights)
      .where(eq(flights.userId, userId))
      .groupBy(sql`DATE_TRUNC('month', ${flights.flightDate})`)
      .orderBy(sql`DATE_TRUNC('month', ${flights.flightDate}) DESC`)
      .limit(12);

    // Yearly progression
    const yearlyProgression = await db
      .select({
        year: sql<number>`EXTRACT(YEAR FROM ${flights.flightDate})::int`,
        totalHours: sql<number>`ROUND(SUM(${flights.flightHours})::numeric, 1)`,
        flights: sql<number>`COUNT(*)`,
        picHours: sql<number>`ROUND(COALESCE(SUM(
          COALESCE(${flights.seDayPic}, 0) + COALESCE(${flights.seNightPic}, 0) +
          COALESCE(${flights.meDayPic}, 0) + COALESCE(${flights.meNightPic}, 0) +
          COALESCE(${flights.xcDayPic}, 0) + COALESCE(${flights.xcNightPic}, 0)
        ), 0)::numeric, 1)`,
        dualHours: sql<number>`ROUND(COALESCE(SUM(
          COALESCE(${flights.seDayDual}, 0) + COALESCE(${flights.seNightDual}, 0) +
          COALESCE(${flights.meDayDual}, 0) + COALESCE(${flights.meNightDual}, 0)
        ), 0)::numeric, 1)`,
      })
      .from(flights)
      .where(eq(flights.userId, userId))
      .groupBy(sql`EXTRACT(YEAR FROM ${flights.flightDate})`)
      .orderBy(asc(sql`EXTRACT(YEAR FROM ${flights.flightDate})`));

    // Top aircraft
    const topAircraft = await db
      .select({
        aircraft: flights.aircraftMakeModel,
        flights: sql<number>`COUNT(*)`,
        hours: sql<number>`ROUND(SUM(${flights.flightHours})::numeric, 1)`,
        avgDuration: sql<number>`ROUND(AVG(${flights.flightHours})::numeric, 2)`,
      })
      .from(flights)
      .where(eq(flights.userId, userId))
      .groupBy(flights.aircraftMakeModel)
      .orderBy(sql`SUM(${flights.flightHours}) DESC`)
      .limit(6);

    // Top airports
    const topAirports = await db
      .select({
        airport: flights.departureAirport,
        departures: sql<number>`COUNT(*)`,
        aircraftUsed: sql<number>`COUNT(DISTINCT ${flights.aircraftMakeModel})`,
      })
      .from(flights)
      .where(eq(flights.userId, userId))
      .groupBy(flights.departureAirport)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(5);

    // Counts
    const countsResult = await db
      .select({
        dayTakeoffsLandings: sql<number>`COALESCE(SUM(COALESCE(${flights.dayTakeoffsLandings}, 0)), 0)`,
        nightTakeoffsLandings: sql<number>`COALESCE(SUM(COALESCE(${flights.nightTakeoffsLandings}, 0)), 0)`,
        ifrApproaches: sql<number>`COALESCE(SUM(COALESCE(${flights.ifrApproaches}, 0)), 0)`,
        simulatorHours: sql<number>`ROUND(COALESCE(SUM(COALESCE(${flights.simulator}, 0)), 0)::numeric, 1)`,
      })
      .from(flights)
      .where(eq(flights.userId, userId));

    const counts = countsResult[0] || {
      dayTakeoffsLandings: 0,
      nightTakeoffsLandings: 0,
      ifrApproaches: 0,
      simulatorHours: 0,
    };

    const response: AdvancedPortfolioStats = {
      pilotName,
      summary: {
        totalHours: Number(summary.totalHours) || 0,
        totalFlights: Number(summary.totalFlights) || 0,
        firstFlightDate: summary.firstFlightDate,
        lastFlightDate: summary.lastFlightDate,
        uniqueAircraft: Number(summary.uniqueAircraft) || 0,
        airportsVisited: Number(summary.airportsVisited) || 0,
        averageFlightDuration: Number(summary.avgDuration) || 0,
      },
      timeDistribution: {
        singleEngine: Number(timeDistribution.singleEngine) || 0,
        multiEngine: Number(timeDistribution.multiEngine) || 0,
        night: Number(timeDistribution.night) || 0,
        instrument: Number(timeDistribution.instrument) || 0,
        crossCountry: Number(timeDistribution.crossCountry) || 0,
        pic: Number(timeDistribution.pic) || 0,
        dual: Number(timeDistribution.dual) || 0,
        instructor: Number(timeDistribution.instructor) || 0,
      },
      monthlyTrend: monthlyTrend.reverse().map(m => ({
        month: m.month,
        hours: Number(m.hours) || 0,
        flights: Number(m.flights) || 0,
      })),
      yearlyProgression: yearlyProgression.map(y => ({
        year: Number(y.year),
        totalHours: Number(y.totalHours) || 0,
        flights: Number(y.flights) || 0,
        picHours: Number(y.picHours) || 0,
        dualHours: Number(y.dualHours) || 0,
      })),
      topAircraft: topAircraft.map(a => ({
        aircraft: a.aircraft,
        flights: Number(a.flights) || 0,
        hours: Number(a.hours) || 0,
        avgDuration: Number(a.avgDuration) || 0,
      })),
      topAirports: topAirports
        .filter(a => a.airport)
        .map(a => ({
          airport: a.airport!,
          departures: Number(a.departures) || 0,
          aircraftUsed: Number(a.aircraftUsed) || 0,
        })),
      counts: {
        dayTakeoffsLandings: Number(counts.dayTakeoffsLandings) || 0,
        nightTakeoffsLandings: Number(counts.nightTakeoffsLandings) || 0,
        ifrApproaches: Number(counts.ifrApproaches) || 0,
        simulatorHours: Number(counts.simulatorHours) || 0,
      },
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error("Advanced portfolio stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch portfolio stats" },
      { status: 500 }
    );
  }
}
