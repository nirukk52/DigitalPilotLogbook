/**
 * Page totals calculator for TCCA PDF generation
 * Computes page totals, totals forwarded, and totals to date
 */

import type { ParsedFlight, PageTotals, RunningTotals } from '../import/types';
import { SUMMABLE_COLUMNS, ROWS_PER_PAGE } from './tcca-template';

/**
 * Calculate totals for a single page of flights
 */
export function calculatePageTotals(
  flights: ParsedFlight[],
  pageNumber: number
): PageTotals {
  const columnTotals: Record<string, number> = {};
  
  // Initialize all summable columns to 0
  for (const col of SUMMABLE_COLUMNS) {
    columnTotals[col] = 0;
  }
  
  // Sum each column
  for (const flight of flights) {
    for (const col of SUMMABLE_COLUMNS) {
      const value = flight[col as keyof ParsedFlight] as number | null;
      if (value !== null && value !== undefined) {
        columnTotals[col] += value;
      }
    }
  }
  
  return {
    pageNumber,
    flightCount: flights.length,
    columnTotals,
  };
}

/**
 * Calculate running totals for a page
 */
export function calculateRunningTotals(
  pageNumber: number,
  pageTotals: Record<string, number>,
  previousTotalsToDate: Record<string, number>
): RunningTotals {
  const totalsToDate: Record<string, number> = {};
  
  // Calculate totals to date = totals forwarded + page totals
  for (const col of SUMMABLE_COLUMNS) {
    const forwarded = previousTotalsToDate[col] ?? 0;
    const pageTotal = pageTotals[col] ?? 0;
    totalsToDate[col] = forwarded + pageTotal;
  }
  
  return {
    pageNumber,
    totalsForwarded: { ...previousTotalsToDate },
    pageTotals: { ...pageTotals },
    totalsToDate,
  };
}

/**
 * Initialize empty running totals (for page 1)
 */
export function initializeRunningTotals(): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const col of SUMMABLE_COLUMNS) {
    totals[col] = 0;
  }
  return totals;
}

/**
 * Chunk flights into pages
 */
export function chunkFlightsIntoPages(
  flights: ParsedFlight[],
  rowsPerPage: number = ROWS_PER_PAGE
): ParsedFlight[][] {
  const pages: ParsedFlight[][] = [];
  
  for (let i = 0; i < flights.length; i += rowsPerPage) {
    pages.push(flights.slice(i, i + rowsPerPage));
  }
  
  return pages;
}

/**
 * Calculate all page and running totals for a list of flights
 */
export function calculateAllTotals(
  flights: ParsedFlight[]
): { pageTotals: PageTotals[]; runningTotals: RunningTotals[] } {
  const pages = chunkFlightsIntoPages(flights);
  const allPageTotals: PageTotals[] = [];
  const allRunningTotals: RunningTotals[] = [];
  
  let previousTotalsToDate = initializeRunningTotals();
  
  for (let i = 0; i < pages.length; i++) {
    const pageNumber = i + 1;
    const pageFlights = pages[i];
    
    // Calculate page totals
    const pageTotals = calculatePageTotals(pageFlights, pageNumber);
    allPageTotals.push(pageTotals);
    
    // Calculate running totals
    const runningTotals = calculateRunningTotals(
      pageNumber,
      pageTotals.columnTotals,
      previousTotalsToDate
    );
    allRunningTotals.push(runningTotals);
    
    // Update previous totals for next page
    previousTotalsToDate = runningTotals.totalsToDate;
  }
  
  return {
    pageTotals: allPageTotals,
    runningTotals: allRunningTotals,
  };
}

/**
 * Calculate grand totals across all flights
 */
export function calculateGrandTotals(flights: ParsedFlight[]): Record<string, number> {
  const totals: Record<string, number> = {};
  
  for (const col of SUMMABLE_COLUMNS) {
    totals[col] = 0;
  }
  
  for (const flight of flights) {
    for (const col of SUMMABLE_COLUMNS) {
      const value = flight[col as keyof ParsedFlight] as number | null;
      if (value !== null && value !== undefined) {
        totals[col] += value;
      }
    }
  }
  
  return totals;
}

/**
 * Get the number of pages for a flight list
 */
export function getPageCount(
  flightCount: number,
  rowsPerPage: number = ROWS_PER_PAGE
): number {
  return Math.ceil(flightCount / rowsPerPage);
}

/**
 * Calculate totals forwarded for a given date range filter
 * Returns cumulative totals for all flights BEFORE the start date
 */
export function calculateTotalsForwardedFromDate(
  allFlights: ParsedFlight[],
  startDate: Date
): Record<string, number> {
  const flightsBefore = allFlights.filter(f => f.flightDate < startDate);
  return calculateGrandTotals(flightsBefore);
}
