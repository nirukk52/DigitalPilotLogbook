# Research: Excel to PDF Import

**Feature**: Excel to PDF Import  
**Date**: 2026-02-03

---

## 1. Excel Parsing Library

### Decision: SheetJS (xlsx)

**Rationale**: 
- Most widely used Excel parsing library for JavaScript
- Works in both browser and Node.js
- Handles .xlsx files with multi-row headers
- No server roundtrip needed for initial parsing (client-side)
- MIT licensed, actively maintained

**Alternatives Considered**:

| Library | Rejected Because |
|---------|------------------|
| ExcelJS | Slower parsing, larger bundle size |
| node-xlsx | Less feature-complete, no streaming support |
| XLSX-populate | More suited for writing than reading |

**Implementation Notes**:
- Parse file client-side to show immediate preview
- Use `read()` with `type: 'array'` for drag-and-drop File objects
- Handle multi-row headers (rows 1-3) by reading raw rows and mapping manually

```typescript
import * as XLSX from 'xlsx';

const workbook = XLSX.read(arrayBuffer, { type: 'array' });
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
// rows[0-2] are headers, rows[3+] are data
```

---

## 2. PDF Generation Library

### Decision: pdf-lib

**Rationale**:
- Pure JavaScript, works in Node.js and browser
- No external dependencies (no Puppeteer/Chrome needed)
- Direct control over PDF layout (required for TCCA format matching)
- Can embed fonts for consistent rendering
- MIT licensed

**Alternatives Considered**:

| Library | Rejected Because |
|---------|------------------|
| Puppeteer + HTML | Heavy dependency, slower, harder to match exact format |
| pdfmake | Less control over precise positioning |
| jsPDF | Limited table support, harder layout control |
| React-PDF (@react-pdf/renderer) | Good but more complex setup for server-side |

**Implementation Notes**:
- Generate server-side in API route
- Pre-define TCCA page template with exact column widths
- Use monospace font for consistent number alignment
- Stream PDF to client, don't store permanently (MVP)

```typescript
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const pdfDoc = await PDFDocument.create();
const font = await pdfDoc.embedFont(StandardFonts.Courier);
const page = pdfDoc.addPage([612, 792]); // Letter size

// Draw TCCA template structure
page.drawText('Date', { x: 20, y: 750, size: 8, font });
// ... more column headers
```

---

## 3. File Storage Strategy

### Decision: In-Memory + Direct Download (MVP)

**Rationale**:
- MVP scope: generate PDF on-demand, stream directly to client
- No need to persist generated PDFs
- Simpler architecture, faster implementation
- Can add Vercel Blob storage later for "email PDF" feature

**Alternatives Considered**:

| Approach | Rejected Because |
|----------|------------------|
| Vercel Blob | Over-engineering for MVP, adds complexity |
| S3 | Same as above, plus AWS setup overhead |
| Database BLOB | PostgreSQL not ideal for large binary storage |

**Implementation Notes**:
- API route generates PDF in memory
- Returns `application/pdf` with `Content-Disposition: attachment`
- For large logbooks (5000+ flights), consider chunked generation with progress

```typescript
// app/api/export/pdf/route.ts
export async function POST(request: Request) {
  const { flights } = await request.json();
  const pdfBytes = await generateTCCAPdf(flights);
  
  return new Response(pdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="logbook.pdf"',
    },
  });
}
```

---

## 4. Import Workflow Architecture

### Decision: Client-Side Parse + Server-Side Store

**Rationale**:
- Client parses Excel → shows immediate preview (fast UX)
- Server validates and stores to database (data integrity)
- PDF generated server-side (CPU-intensive, better on server)

**Flow**:
```
[User] → [Upload .xlsx] → [Client: Parse with xlsx] → [Preview Table]
                                                           ↓
                                                    [User: Confirm]
                                                           ↓
                                    [Server: Validate + Store Flights]
                                                           ↓
                                    [User: Click "Generate PDF"]
                                                           ↓
                                    [Server: Generate PDF with pdf-lib]
                                                           ↓
                                    [Download PDF]
```

---

## 5. Validation Strategy

### Decision: Two-Phase Validation

**Phase 1 (Client-Side)**:
- File type check (.xlsx only)
- File size check (< 10MB)
- Basic structure check (required columns exist)
- Row count estimate

**Phase 2 (Server-Side)**:
- Per-row validation against calculation rules
- FlightHours = Σ(time buckets)
- XC_PIC ≤ Total_PIC
- Instrument time constraints
- Date validity
- Generate validation report

**Implementation Notes**:
```typescript
interface ValidationResult {
  isValid: boolean;
  totalFlights: number;
  successCount: number;
  warningCount: number;
  errorCount: number;
  issues: ValidationIssue[];
}

interface ValidationIssue {
  rowNumber: number;
  field: string;
  severity: 'error' | 'warning';
  message: string;
}
```

---

## 6. TCCA PDF Layout Specifications

### Decision: Match Physical Logbook Format

**Page Dimensions**: Letter (8.5" x 11") landscape for two-page spread effect

**Rows Per Page**: 18 data rows + 3 total rows (page total, forwarded, to date)

**Column Widths** (proportional):
- Date: 8%
- Aircraft: 8%
- Registration: 7%
- PIC Name: 10%
- Co-pilot: 10%
- From/To: 5% each
- Remarks: 12%
- Time buckets: ~2% each (many columns)

**Fonts**:
- Headers: Helvetica Bold 8pt
- Data: Courier 7pt (monospace for number alignment)
- Totals: Courier Bold 7pt

---

## Open Questions (Resolved)

| Question | Resolution |
|----------|------------|
| Where to store uploaded Excel? | Don't store - parse client-side only |
| Where to store generated PDF? | Direct download, no storage (MVP) |
| Multi-user support? | Single user MVP, userId = "default" |
| Authentication? | Not in MVP scope, add later |

---

## Dependencies to Add

```json
{
  "dependencies": {
    "xlsx": "^0.18.5",
    "pdf-lib": "^1.17.1"
  }
}
```

---

## References

- [SheetJS Documentation](https://docs.sheetjs.com/)
- [pdf-lib Documentation](https://pdf-lib.js.org/)
- [TCCA Logbook Format](knowledge-base/01-calculation-mapping-spec.md)
