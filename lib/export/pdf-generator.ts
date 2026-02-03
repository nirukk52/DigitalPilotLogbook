/**
 * PDF Generator for TCCA-compliant logbook
 * Uses pdf-lib to create PDF matching TCCA format
 */

import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from "pdf-lib";
import type { ParsedFlight } from "../import/types";
import {
  PAGE,
  ROWS_PER_PAGE,
  ROW_HEIGHT,
  FONT_SIZE,
  ALL_COLUMNS,
  SUMMABLE_COLUMNS,
  TOTALS_LABELS,
  formatTime,
  formatCount,
  formatDate,
} from "./tcca-template";
import {
  chunkFlightsIntoPages,
  calculatePageTotals,
  calculateRunningTotals,
  initializeRunningTotals,
} from "./page-calculator";

/**
 * Generate a TCCA-compliant PDF from flight data
 */
export async function generateTCCAPdf(flights: ParsedFlight[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  
  // Embed fonts
  const font = await pdfDoc.embedFont(StandardFonts.Courier);
  const fontBold = await pdfDoc.embedFont(StandardFonts.CourierBold);
  
  // Sort flights by date
  const sortedFlights = [...flights].sort(
    (a, b) => a.flightDate.getTime() - b.flightDate.getTime()
  );
  
  // Chunk into pages
  const pages = chunkFlightsIntoPages(sortedFlights, ROWS_PER_PAGE);
  
  // Track running totals
  let previousTotalsToDate = initializeRunningTotals();
  
  // Generate each page
  for (let i = 0; i < pages.length; i++) {
    const pageNumber = i + 1;
    const pageFlights = pages[i];
    
    // Calculate totals for this page
    const pageTotals = calculatePageTotals(pageFlights, pageNumber);
    const runningTotals = calculateRunningTotals(
      pageNumber,
      pageTotals.columnTotals,
      previousTotalsToDate
    );
    
    // Create page
    const page = pdfDoc.addPage([PAGE.WIDTH, PAGE.HEIGHT]);
    
    // Draw page content
    drawPageHeader(page, fontBold, pageNumber, pages.length);
    drawColumnHeaders(page, fontBold);
    drawFlightRows(page, pageFlights, font);
    drawTotalsRows(page, runningTotals, font, fontBold);
    
    // Update running totals for next page
    previousTotalsToDate = runningTotals.totalsToDate;
  }
  
  return pdfDoc.save();
}

/**
 * Draw page header with title and page number
 */
function drawPageHeader(
  page: PDFPage,
  font: PDFFont,
  pageNumber: number,
  totalPages: number
): void {
  const { width } = page.getSize();
  
  // Title
  page.drawText("PILOT LOGBOOK - TCCA FORMAT", {
    x: PAGE.MARGIN_LEFT,
    y: PAGE.HEIGHT - PAGE.MARGIN_TOP + 10,
    size: 10,
    font,
    color: rgb(0, 0, 0),
  });
  
  // Page number
  page.drawText(`Page ${pageNumber} of ${totalPages}`, {
    x: width - PAGE.MARGIN_RIGHT - 80,
    y: PAGE.HEIGHT - PAGE.MARGIN_TOP + 10,
    size: FONT_SIZE.PAGE_NUMBER,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });
}

/**
 * Draw column headers
 */
function drawColumnHeaders(page: PDFPage, font: PDFFont): void {
  const availableWidth = PAGE.WIDTH - PAGE.MARGIN_LEFT - PAGE.MARGIN_RIGHT;
  const startY = PAGE.HEIGHT - PAGE.MARGIN_TOP - ROW_HEIGHT.HEADER;
  
  let x = PAGE.MARGIN_LEFT;
  
  for (const col of ALL_COLUMNS) {
    const colWidth = (col.width / 100) * availableWidth;
    
    // Draw header text
    page.drawText(col.header, {
      x: x + 2,
      y: startY + 8,
      size: FONT_SIZE.HEADER,
      font,
      color: rgb(0, 0, 0),
    });
    
    // Draw column border
    page.drawLine({
      start: { x, y: startY },
      end: { x, y: startY + ROW_HEIGHT.HEADER },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });
    
    x += colWidth;
  }
  
  // Draw header bottom border
  page.drawLine({
    start: { x: PAGE.MARGIN_LEFT, y: startY },
    end: { x: PAGE.WIDTH - PAGE.MARGIN_RIGHT, y: startY },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
}

/**
 * Draw flight data rows
 */
function drawFlightRows(
  page: PDFPage,
  flights: ParsedFlight[],
  font: PDFFont
): void {
  const availableWidth = PAGE.WIDTH - PAGE.MARGIN_LEFT - PAGE.MARGIN_RIGHT;
  const startY = PAGE.HEIGHT - PAGE.MARGIN_TOP - ROW_HEIGHT.HEADER - ROW_HEIGHT.DATA;
  
  for (let rowIndex = 0; rowIndex < flights.length; rowIndex++) {
    const flight = flights[rowIndex];
    const y = startY - rowIndex * ROW_HEIGHT.DATA;
    let x = PAGE.MARGIN_LEFT;
    
    for (const col of ALL_COLUMNS) {
      const colWidth = (col.width / 100) * availableWidth;
      const value = getFlightValue(flight, col.key);
      
      // Calculate text position based on alignment
      let textX = x + 2;
      if (col.align === "right") {
        const textWidth = font.widthOfTextAtSize(value, FONT_SIZE.DATA);
        textX = x + colWidth - textWidth - 2;
      } else if (col.align === "center") {
        const textWidth = font.widthOfTextAtSize(value, FONT_SIZE.DATA);
        textX = x + (colWidth - textWidth) / 2;
      }
      
      // Draw cell text
      page.drawText(value, {
        x: textX,
        y: y + 6,
        size: FONT_SIZE.DATA,
        font,
        color: rgb(0, 0, 0),
      });
      
      x += colWidth;
    }
    
    // Draw row border
    page.drawLine({
      start: { x: PAGE.MARGIN_LEFT, y },
      end: { x: PAGE.WIDTH - PAGE.MARGIN_RIGHT, y },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });
  }
}

/**
 * Draw totals rows (page totals, totals forwarded, totals to date)
 */
function drawTotalsRows(
  page: PDFPage,
  runningTotals: {
    totalsForwarded: Record<string, number>;
    pageTotals: Record<string, number>;
    totalsToDate: Record<string, number>;
  },
  font: PDFFont,
  fontBold: PDFFont
): void {
  const availableWidth = PAGE.WIDTH - PAGE.MARGIN_LEFT - PAGE.MARGIN_RIGHT;
  const dataEndY = PAGE.HEIGHT - PAGE.MARGIN_TOP - ROW_HEIGHT.HEADER - (ROWS_PER_PAGE + 1) * ROW_HEIGHT.DATA;
  
  const totalsRows = [
    { label: TOTALS_LABELS.PAGE_TOTALS, data: runningTotals.pageTotals },
    { label: TOTALS_LABELS.TOTALS_FORWARDED, data: runningTotals.totalsForwarded },
    { label: TOTALS_LABELS.TOTALS_TO_DATE, data: runningTotals.totalsToDate },
  ];
  
  for (let i = 0; i < totalsRows.length; i++) {
    const { label, data } = totalsRows[i];
    const y = dataEndY - i * ROW_HEIGHT.TOTALS;
    const isToDate = label === TOTALS_LABELS.TOTALS_TO_DATE;
    const useFont = isToDate ? fontBold : font;
    
    // Draw label in first column
    page.drawText(label, {
      x: PAGE.MARGIN_LEFT + 2,
      y: y + 6,
      size: FONT_SIZE.TOTALS,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    
    // Draw totals for each column
    let x = PAGE.MARGIN_LEFT;
    for (const col of ALL_COLUMNS) {
      const colWidth = (col.width / 100) * availableWidth;
      
      if (SUMMABLE_COLUMNS.includes(col.key)) {
        const value = data[col.key] ?? 0;
        const formatted = col.key.includes("Landings") || 
                         col.key === "ifrApproaches" || 
                         col.key === "holding"
          ? formatCount(value)
          : formatTime(value);
        
        if (formatted) {
          const textWidth = useFont.widthOfTextAtSize(formatted, FONT_SIZE.TOTALS);
          page.drawText(formatted, {
            x: x + colWidth - textWidth - 2,
            y: y + 6,
            size: FONT_SIZE.TOTALS,
            font: useFont,
            color: rgb(0, 0, 0),
          });
        }
      }
      
      x += colWidth;
    }
    
    // Draw row border
    page.drawLine({
      start: { x: PAGE.MARGIN_LEFT, y },
      end: { x: PAGE.WIDTH - PAGE.MARGIN_RIGHT, y },
      thickness: isToDate ? 1 : 0.5,
      color: rgb(0, 0, 0),
    });
  }
}

/**
 * Get formatted value for a flight field
 */
function getFlightValue(flight: ParsedFlight, key: string): string {
  const value = flight[key as keyof ParsedFlight];
  
  if (key === "flightDate" && value instanceof Date) {
    return formatDate(value);
  }
  
  if (typeof value === "string") {
    // Truncate long strings
    return value.length > 12 ? value.slice(0, 10) + ".." : value;
  }
  
  if (typeof value === "number") {
    // Format based on column type
    if (key.includes("Landings") || key === "ifrApproaches" || key === "holding") {
      return formatCount(value);
    }
    return formatTime(value);
  }
  
  return "";
}

/**
 * Get total page count for a flight list
 */
export function getPdfPageCount(flightCount: number): number {
  return Math.ceil(flightCount / ROWS_PER_PAGE);
}
