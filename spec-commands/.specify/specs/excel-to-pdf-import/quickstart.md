# Quickstart: Excel to PDF Import

**Feature**: Excel to PDF Import  
**Date**: 2026-02-03

---

## Prerequisites

- Node.js 20+
- pnpm (or npm)
- Access to Neon PostgreSQL database

---

## 1. Install Dependencies

```bash
npm install xlsx pdf-lib
```

---

## 2. Run Database Migration

Add the flights table to the database:

```bash
npm run db:generate
npm run db:push
```

---

## 3. Create Feature Files

Create the following directory structure:

```bash
mkdir -p app/import/components
mkdir -p lib/import
mkdir -p lib/export
mkdir -p app/api/export/pdf
```

---

## 4. Key Implementation Files

### 4.1 Excel Parser (`lib/import/excel-parser.ts`)

Parses uploaded Excel file and extracts flight data.

```typescript
import * as XLSX from 'xlsx';

export function parseExcelFile(arrayBuffer: ArrayBuffer): ParsedFlight[] {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  
  // Skip header rows (0-2), data starts at row 3
  const dataRows = rows.slice(3);
  
  return dataRows.map((row, index) => mapRowToFlight(row, index + 4));
}
```

### 4.2 PDF Generator (`lib/export/pdf-generator.ts`)

Generates TCCA-compliant PDF from flight data.

```typescript
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function generateTCCAPdf(flights: Flight[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Courier);
  
  // Chunk flights into pages of 18
  const pages = chunkArray(flights, 18);
  
  let runningTotals = initializeRunningTotals();
  
  for (const pageFlights of pages) {
    const page = pdfDoc.addPage([792, 612]); // Landscape letter
    
    // Draw flights
    drawFlightRows(page, pageFlights, font);
    
    // Calculate and draw page totals
    const pageTotals = calculatePageTotals(pageFlights);
    drawPageTotals(page, pageTotals, runningTotals, font);
    
    // Update running totals
    runningTotals = addTotals(runningTotals, pageTotals);
  }
  
  return pdfDoc.save();
}
```

### 4.3 Import Page (`app/import/page.tsx`)

Main import wizard UI.

```typescript
'use client';

import { useState } from 'react';
import { FileUploader } from './components/FileUploader';
import { PreviewTable } from './components/PreviewTable';
import { ValidationBanner } from './components/ValidationBanner';

export default function ImportPage() {
  const [importJob, setImportJob] = useState<ImportJob | null>(null);
  
  const handleFileUpload = async (file: File) => {
    // Parse Excel client-side
    const buffer = await file.arrayBuffer();
    const flights = parseExcelFile(buffer);
    const validation = validateFlights(flights);
    
    setImportJob({
      id: crypto.randomUUID(),
      status: 'ready',
      fileName: file.name,
      fileSize: file.size,
      flights,
      totalRows: flights.length,
      validation,
      startedAt: new Date(),
      completedAt: new Date(),
    });
  };
  
  const handleGeneratePdf = async () => {
    // Call API to generate PDF
    const response = await fetch('/api/export/pdf', {
      method: 'POST',
      body: JSON.stringify({ flights: importJob.flights }),
    });
    
    const blob = await response.blob();
    downloadBlob(blob, 'logbook.pdf');
  };
  
  return (
    <div>
      {!importJob && <FileUploader onUpload={handleFileUpload} />}
      {importJob && (
        <>
          <ValidationBanner validation={importJob.validation} />
          <PreviewTable flights={importJob.flights} />
          <button onClick={handleGeneratePdf}>Generate PDF</button>
        </>
      )}
    </div>
  );
}
```

---

## 5. Test with Sample Data

Use the included `Excel Log Canada.xlsx` file for testing:

1. Navigate to `/import`
2. Upload `Excel Log Canada.xlsx`
3. Verify 869 flights appear in preview
4. Click "Generate PDF"
5. Verify PDF downloads with correct format

---

## 6. Verification Checklist

- [ ] Excel file uploads without error
- [ ] Preview shows correct flight count (869)
- [ ] All columns mapped correctly
- [ ] Validation shows any warnings/errors
- [ ] PDF generates successfully
- [ ] PDF has 18 rows per page
- [ ] Page totals calculate correctly
- [ ] Running totals (totals to date) are accurate
- [ ] PDF matches TCCA logbook format visually

---

## Common Issues

### "Cannot read Excel file"
- Ensure file is `.xlsx` format (not `.xls`)
- Check file is not password protected

### "Validation errors: FlightHours mismatch"
- Source Excel may have formula errors
- Check individual rows for calculation discrepancies

### "PDF generation timeout"
- For large logbooks (5000+ flights), consider pagination
- Check server memory limits

---

## References

- [Specification](../excel-to-pdf-import.md)
- [Data Model](./data-model.md)
- [Research](./research.md)
- [Calculation Mapping Spec](../../../../knowledge-base/01-calculation-mapping-spec.md)
