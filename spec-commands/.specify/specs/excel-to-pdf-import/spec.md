# Feature Specification: Excel to PDF Import

**Feature Branch**: `001-excel-to-pdf-import`  
**Created**: 2026-02-03  
**Status**: Draft  
**Input**: Upload Excel logbook → Preview → Generate TCCA-compliant PDF

---

## User Scenarios & Testing

### User Story 1 - Upload Excel Logbook File (Priority: P1)

A pilot with an existing TCCA Excel logbook wants to upload their file to convert it to PDF format. They navigate to the Overview page and click "Import your data" to begin the process.

**Why this priority**: This is the entry point for the entire feature. Without file upload, nothing else works. This unlocks the MVP value proposition.

**Independent Test**: Can be fully tested by uploading a valid Excel file and confirming it is accepted and parsed without errors.

**Acceptance Scenarios**:

1. **Given** I am on the Overview page, **When** I click "Import your data", **Then** I see a file upload interface with drag-and-drop zone
2. **Given** I am on the upload interface, **When** I drag a `.xlsx` file into the drop zone, **Then** the file is accepted and processing begins
3. **Given** I am on the upload interface, **When** I click "Browse files", **Then** I can select an Excel file from my computer
4. **Given** I upload an invalid file type (e.g., `.pdf`), **When** upload completes, **Then** I see an error message "Please upload an Excel file (.xlsx)"
5. **Given** I upload the `Excel Log Canada.xlsx` file, **When** processing completes, **Then** the file is parsed with multi-row headers correctly identified

---

### User Story 2 - Preview Imported Flight Data (Priority: P1)

After uploading, the pilot wants to see a preview of their imported flights to verify the data was parsed correctly before generating the PDF.

**Why this priority**: Data verification builds trust. Pilots cannot accept a PDF without confirming their data is correct. This prevents costly errors.

**Independent Test**: Can be tested by uploading a file and verifying the preview table shows correct data matching the source Excel.

**Acceptance Scenarios**:

1. **Given** I have uploaded a valid Excel file, **When** parsing completes, **Then** I see a preview table showing imported flights
2. **Given** I am viewing the preview, **When** I scroll the table, **Then** I can see all 869+ flights from the Excel file
3. **Given** I am viewing the preview, **When** I look at any row, **Then** I see: Date, Aircraft, Registration, Route, Flight Hours
4. **Given** the Excel has multi-row headers (rows 1-3), **When** I view the preview, **Then** only data rows (row 4+) are shown as flights
5. **Given** the import has validation warnings, **When** I view the preview, **Then** I see a summary banner showing "869 flights imported, 3 warnings"
6. **Given** a flight has a validation warning, **When** I view that row, **Then** the row is highlighted with the warning message visible

---

### User Story 3 - Generate TCCA-Compliant PDF (Priority: P1)

The pilot wants to generate a PDF logbook that matches the official TCCA format with proper page layout, totals, and running totals.

**Why this priority**: This is the core deliverable - the actual PDF output. Without this, the feature has no value.

**Independent Test**: Can be tested by clicking "Generate PDF" and verifying the output matches TCCA format with correct calculations.

**Acceptance Scenarios**:

1. **Given** I have imported flights in preview, **When** I click "Generate PDF", **Then** PDF generation begins with a progress indicator
2. **Given** PDF generation is in progress, **When** I wait, **Then** I see progress updates (e.g., "Processing page 12 of 49...")
3. **Given** PDF generation completes, **When** I view the result, **Then** the PDF has 18 rows per page (TCCA standard)
4. **Given** the PDF is generated, **When** I view page 1, **Then** I see the correct columns: Date, Make/Model, Registration, PIC, Co-pilot, From, To, Remarks, SE Day/Night time buckets
5. **Given** the PDF is generated, **When** I view the bottom of any page, **Then** I see: Page Totals, Totals Forwarded, Totals to Date
6. **Given** the PDF is generated, **When** I check page 2 "Totals Forwarded", **Then** it equals page 1 "Totals to Date"
7. **Given** the source Excel has FlightHours totals, **When** I compare PDF totals, **Then** the values match within 0.01 hours

---

### User Story 4 - Download Generated PDF (Priority: P1)

The pilot wants to download the generated PDF to their device for printing or submission to examiners.

**Why this priority**: The download is how pilots actually get the value. No download = no usable output.

**Independent Test**: Can be tested by clicking download and verifying the file saves correctly and opens in a PDF reader.

**Acceptance Scenarios**:

1. **Given** PDF generation is complete, **When** I click "Download PDF", **Then** the PDF file downloads to my device
2. **Given** I download the PDF, **When** I check the filename, **Then** it is named `Logbook_[PilotName]_[Date].pdf`
3. **Given** I download the PDF, **When** I open it in a PDF reader, **Then** it renders correctly with all pages visible
4. **Given** I download the PDF, **When** I print it, **Then** it prints at correct scale to fit standard logbook dimensions

---

### User Story 5 - View Import Validation Report (Priority: P2)

The pilot wants to see detailed validation results to understand any issues with their data before generating the PDF.

**Why this priority**: Detailed validation helps pilots fix issues. Less critical than the happy path but important for data quality.

**Independent Test**: Can be tested by uploading a file with known issues and verifying the report shows correct warnings/errors.

**Acceptance Scenarios**:

1. **Given** import has completed, **When** I click "View validation report", **Then** I see a detailed breakdown of validation results
2. **Given** the validation report is open, **When** I view it, **Then** I see counts: Total flights, Successful, Warnings, Errors
3. **Given** a flight has `FlightHours ≠ Σ(time buckets)`, **When** I view the report, **Then** I see "Row 45: Flight time (1.5) doesn't match sum of time categories (1.4)"
4. **Given** a flight has `XC_PIC > Total_PIC`, **When** I view the report, **Then** I see "Row 123: Cross-country time exceeds total PIC time"
5. **Given** validation has errors, **When** I try to generate PDF, **Then** I see a confirmation dialog warning about errors

---

### User Story 6 - See Running Totals Summary (Priority: P2)

The pilot wants to see a summary of their total flight time across all categories before generating the PDF.

**Why this priority**: Summary totals help pilots verify overall accuracy. Useful but not blocking for PDF generation.

**Independent Test**: Can be tested by viewing summary and comparing values against Excel totals.

**Acceptance Scenarios**:

1. **Given** import preview is displayed, **When** I view the summary panel, **Then** I see total hours for: Total Time, PIC, Dual, XC, Night, Instrument, Instructor
2. **Given** I view the summary, **When** I compare to Excel `FlightHours` sum, **Then** the Total Time matches
3. **Given** I view the summary, **When** I compare to Excel instructor column sum, **Then** the Instructor time matches

---

### User Story 7 - Verify Page Totals Match Excel (Priority: P2)

The pilot wants to spot-check that specific page totals in the PDF match their expectations from the Excel data.

**Why this priority**: Builds confidence in accuracy. Important for audit trails but not required for basic functionality.

**Independent Test**: Can be tested by comparing a specific page's totals against manually calculated values from Excel.

**Acceptance Scenarios**:

1. **Given** PDF is generated, **When** I view page 10, **Then** the page total for SE Day PIC matches the sum of rows 163-180
2. **Given** PDF is generated, **When** I view the last page "Totals to Date", **Then** all columns match the Excel grand totals

---

### User Story 8 - Re-upload to Correct Errors (Priority: P3)

The pilot discovers issues in their Excel file and wants to fix them and re-upload without losing their place in the workflow.

**Why this priority**: Error recovery improves UX but isn't critical for MVP. Pilots can refresh and start over.

**Independent Test**: Can be tested by uploading, viewing errors, then uploading a corrected file.

**Acceptance Scenarios**:

1. **Given** I have uploaded a file with errors, **When** I click "Upload different file", **Then** I can select a new file
2. **Given** I upload a new file, **When** processing completes, **Then** the preview updates with the new data
3. **Given** I have started the workflow, **When** I navigate away and return, **Then** I must start fresh (no session persistence in MVP)

---

### User Story 9 - Select Date Range for PDF Export (Priority: P3)

The pilot wants to export only a portion of their logbook (e.g., last year's flights) rather than the entire history.

**Why this priority**: Nice-to-have for large logbooks but full export works for MVP. Can be added later.

**Independent Test**: Can be tested by setting date range and verifying PDF only contains flights within that range.

**Acceptance Scenarios**:

1. **Given** I am in the preview screen, **When** I click "Filter by date", **Then** I see date range pickers (From, To)
2. **Given** I set date range 2024-01-01 to 2024-12-31, **When** I apply the filter, **Then** the preview shows only flights in that range
3. **Given** I have filtered by date, **When** I generate PDF, **Then** the PDF contains only the filtered flights
4. **Given** I have filtered by date, **When** I view page 1 "Totals Forwarded", **Then** it shows cumulative totals from flights BEFORE the filter start date

---

### User Story 10 - View Before/After Comparison (Priority: P3)

The pilot wants to compare the generated PDF against their original Excel to verify accuracy visually.

**Why this priority**: Advanced verification for meticulous users. Not required for MVP.

**Independent Test**: Can be tested by viewing side-by-side and confirming visual match.

**Acceptance Scenarios**:

1. **Given** PDF is generated, **When** I click "Compare with Excel", **Then** I see a side-by-side view
2. **Given** I am in comparison view, **When** I select a page, **Then** I see PDF page alongside corresponding Excel rows

---

## Edge Cases

- **Empty Excel file**: Show error "No flight data found in file"
- **Corrupted Excel file**: Show error "Unable to read file. Please check the file is a valid Excel document"
- **Missing required columns**: Show error listing which columns are missing
- **Date format variations**: Handle common formats (YYYY-MM-DD, MM/DD/YYYY, DD-MMM-YYYY)
- **Negative time values**: Flag as validation error
- **Time values > 24 hours**: Flag as warning (possible but unusual)
- **Non-numeric time values**: Flag as error with row number
- **Duplicate flights (same date/aircraft/route)**: Flag as warning
- **Future dates**: Flag as warning "Flight dated in the future"
- **Very large files (5000+ flights)**: Show progress indicator, process in chunks

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST accept `.xlsx` file uploads via drag-and-drop or file browser
- **FR-002**: System MUST parse Excel files with multi-row headers (rows 1-3 are headers, row 4+ is data)
- **FR-003**: System MUST map all 35 Excel columns to Flight entity fields per mapping spec
- **FR-004**: System MUST validate each flight row against calculation rules
- **FR-005**: System MUST display imported flights in a preview table
- **FR-006**: System MUST show validation summary (counts of success/warning/error)
- **FR-007**: System MUST generate PDF with 18 rows per page
- **FR-008**: System MUST calculate page totals for all time columns
- **FR-009**: System MUST calculate running totals (totals forwarded + page totals = totals to date)
- **FR-010**: System MUST render PDF matching TCCA logbook visual format
- **FR-011**: System MUST allow PDF download with appropriate filename
- **FR-012**: System MUST preserve decimal precision (0.1 hours) throughout calculations

### Non-Functional Requirements

- **NFR-001**: File upload MUST support files up to 10MB
- **NFR-002**: Import of 869 flights MUST complete within 30 seconds
- **NFR-003**: PDF generation of 49 pages MUST complete within 60 seconds
- **NFR-004**: UI MUST remain responsive during processing (non-blocking)

### Key Entities

- **Flight**: Individual flight record with all 35+ time bucket fields (see knowledge-base/01-calculation-mapping-spec.md)
- **ImportJob**: Tracks upload session with status, file reference, validation results
- **PDFExport**: Generated PDF reference with metadata (date range, page count, file path)

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: User can upload Excel file and see preview in under 30 seconds
- **SC-002**: All 869 flights from sample Excel import without data loss
- **SC-003**: PDF totals match Excel totals within 0.01 hours for all columns
- **SC-004**: Generated PDF passes visual comparison with physical TCCA logbook format
- **SC-005**: User can complete full workflow (upload → preview → download PDF) in under 3 minutes
- **SC-006**: Client can present generated PDF to TCCA examiner as acceptable logbook documentation

---

## UI Location

This feature will be implemented in the Overview page component at:
- **DOM Path**: `div.min-h-screen > main.flex-1 > div.flex-1.items-center.justify-center`
- **React Component**: `OverviewPage` (`app/overview/page.tsx`)
- **Trigger Element**: "Import your data" button

---

## References

- `knowledge-base/01-calculation-mapping-spec.md` - Complete field mapping and calculation rules
- `knowledge-base/calculation-engine.md` - Time bucket allocation logic
- `knowledge-base/excel-to-fill-db.md` - Minimal UI entry specification
- `knowledge-base/excel-to-pdf.md` - PDF layout and page-level calculations
- `knowledge-base/v0-mvp.md` - MVP scope and deliverable definition
- `Excel Log Canada.xlsx` - Source test file (869+ flights)
- `Logbook.pdf` - Target PDF format reference
