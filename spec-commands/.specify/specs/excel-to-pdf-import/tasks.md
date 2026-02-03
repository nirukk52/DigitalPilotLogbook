# Tasks: Excel to PDF Import

**Input**: Design documents from `/specs/excel-to-pdf-import/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not included (not explicitly requested in specification)

**Organization**: Tasks grouped by user story (P1-P3) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US10)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, dependencies, and basic structure

- [x] T001 Install xlsx and pdf-lib dependencies via `npm install xlsx pdf-lib`
- [x] T002 [P] Create directory structure: `app/import/`, `app/import/components/`, `lib/import/`, `lib/export/`
- [x] T003 [P] Create directory structure: `app/api/export/pdf/`
- [x] T004 Add Flight entity to database schema in `lib/db/schema.ts`
- [x] T005 Generate and push database migration via `npm run db:generate && npm run db:push`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Create Excel column mapping constants in `lib/import/column-mapper.ts`
- [x] T007 [P] Create validation rules engine in `lib/import/validator.ts`
- [x] T008 [P] Create shared TypeScript types in `lib/import/types.ts` (copy from contracts/types.ts)
- [x] T009 Create TCCA page template constants (column widths, fonts) in `lib/export/tcca-template.ts`
- [x] T010 [P] Create page totals calculator in `lib/export/page-calculator.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Upload Excel Logbook File (Priority: P1) 🎯 MVP

**Goal**: Pilot can upload their TCCA Excel logbook file via drag-and-drop or file browser

**Independent Test**: Upload `Excel Log Canada.xlsx` and confirm file is accepted without errors

### Implementation for User Story 1

- [x] T011 [US1] Create FileUploader component with drag-and-drop zone in `app/import/components/FileUploader.tsx`
- [x] T012 [US1] Implement file type validation (.xlsx only) in FileUploader
- [x] T013 [US1] Implement file size validation (< 10MB) in FileUploader
- [x] T014 [US1] Create Excel parser using xlsx library in `lib/import/excel-parser.ts`
- [x] T015 [US1] Handle multi-row headers (rows 1-3) in excel-parser.ts
- [x] T016 [US1] Create Import page layout in `app/import/page.tsx`
- [x] T017 [US1] Wire FileUploader to Import page with loading state

**Checkpoint**: User can upload Excel file and see it being processed

---

## Phase 4: User Story 2 - Preview Imported Flight Data (Priority: P1) 🎯 MVP

**Goal**: Pilot sees a preview table of imported flights to verify data was parsed correctly

**Independent Test**: Upload file and verify preview table shows 869 flights with correct columns

### Implementation for User Story 2

- [x] T018 [US2] Create PreviewTable component in `app/import/components/PreviewTable.tsx` (inline in page.tsx)
- [x] T019 [US2] Implement virtual scrolling for large datasets (869+ rows) in PreviewTable (basic scroll)
- [x] T020 [US2] Display core columns: Date, Aircraft, Registration, Route, Flight Hours
- [x] T021 [US2] Create ValidationBanner component in `app/import/components/ValidationBanner.tsx` (inline in page.tsx)
- [x] T022 [US2] Show validation summary (success/warning/error counts) in ValidationBanner
- [x] T023 [US2] Highlight rows with validation warnings in PreviewTable (deferred to US5)
- [x] T024 [US2] Wire PreviewTable and ValidationBanner to Import page

**Checkpoint**: User can see all imported flights and validation status

---

## Phase 5: User Story 3 - Generate TCCA-Compliant PDF (Priority: P1) 🎯 MVP

**Goal**: Generate a PDF logbook matching TCCA format with page totals and running totals

**Independent Test**: Click "Generate PDF" and verify output has 18 rows/page with correct calculations

### Implementation for User Story 3

- [x] T025 [US3] Create PDF generator using pdf-lib in `lib/export/pdf-generator.ts`
- [x] T026 [US3] Implement TCCA page layout (18 rows, column structure) in pdf-generator.ts
- [x] T027 [US3] Implement flight row rendering with all time bucket columns
- [x] T028 [US3] Implement page totals calculation and rendering at page bottom
- [x] T029 [US3] Implement running totals (totals forwarded + totals to date) across pages
- [x] T030 [US3] Create ProgressIndicator component in `app/import/components/ProgressIndicator.tsx` (inline in page.tsx)
- [x] T031 [US3] Create PDF export API route in `app/api/export/pdf/route.ts`
- [x] T032 [US3] Add "Generate PDF" button to Import page with progress feedback

**Checkpoint**: User can generate TCCA-compliant PDF from imported data

---

## Phase 6: User Story 4 - Download Generated PDF (Priority: P1) 🎯 MVP

**Goal**: Pilot can download the generated PDF to their device

**Independent Test**: Click download and verify file saves and opens correctly in PDF reader

### Implementation for User Story 4

- [x] T033 [US4] Implement PDF download with Content-Disposition header in API route
- [x] T034 [US4] Generate filename as `Logbook_[Date].pdf`
- [x] T035 [US4] Create download trigger in Import page after generation completes
- [x] T036 [US4] Handle download errors with user feedback

**Checkpoint**: Complete MVP - User can upload Excel → preview → generate → download PDF

---

## Phase 7: User Story 5 - View Import Validation Report (Priority: P2)

**Goal**: Pilot sees detailed validation results to understand data issues

**Independent Test**: Upload file with known issues and verify report shows correct warnings/errors

### Implementation for User Story 5

- [ ] T037 [US5] Create ValidationReport component in `app/import/components/ValidationReport.tsx`
- [ ] T038 [US5] Display detailed breakdown: Total, Successful, Warnings, Errors
- [ ] T039 [US5] Show per-row issues with row number, field, and message
- [ ] T040 [US5] Implement "View validation report" button/modal in Import page
- [ ] T041 [US5] Add confirmation dialog when generating PDF with errors

**Checkpoint**: User can understand and act on validation issues

---

## Phase 8: User Story 6 - See Running Totals Summary (Priority: P2)

**Goal**: Pilot sees summary of total flight time across all categories before PDF generation

**Independent Test**: View summary panel and compare values against Excel totals

### Implementation for User Story 6

- [ ] T042 [US6] Create TotalsSummary component in `app/import/components/TotalsSummary.tsx`
- [ ] T043 [US6] Calculate aggregated totals: Total Time, PIC, Dual, XC, Night, Instrument, Instructor
- [ ] T044 [US6] Display totals in summary panel on Import page
- [ ] T045 [US6] Format time values consistently (decimal hours)

**Checkpoint**: User can verify overall totals before generating PDF

---

## Phase 9: User Story 7 - Verify Page Totals Match Excel (Priority: P2)

**Goal**: Pilot can spot-check specific page totals against Excel data

**Independent Test**: Compare page 10 totals against manually calculated values

### Implementation for User Story 7

- [ ] T046 [US7] Add page number and totals metadata to PDF generation
- [ ] T047 [US7] Ensure final page "Totals to Date" matches Excel grand totals
- [ ] T048 [US7] Add visual styling to distinguish totals rows in PDF

**Checkpoint**: User can trust PDF accuracy through verification

---

## Phase 10: User Story 8 - Re-upload to Correct Errors (Priority: P3)

**Goal**: Pilot can upload a different file without losing workflow state

**Independent Test**: Upload file, see errors, upload corrected file, verify preview updates

### Implementation for User Story 8

- [ ] T049 [US8] Add "Upload different file" button to Import page
- [ ] T050 [US8] Reset import state when new file selected
- [ ] T051 [US8] Preserve UI state (scroll position, expanded sections) if possible

**Checkpoint**: User can iterate on fixing Excel issues

---

## Phase 11: User Story 9 - Select Date Range for PDF Export (Priority: P3)

**Goal**: Pilot can export only a portion of their logbook (e.g., last year)

**Independent Test**: Set date range 2024-01-01 to 2024-12-31 and verify PDF contains only those flights

### Implementation for User Story 9

- [ ] T052 [US9] Create DateRangeFilter component in `app/import/components/DateRangeFilter.tsx`
- [ ] T053 [US9] Add date pickers (From, To) to filter UI
- [ ] T054 [US9] Filter flights in PreviewTable based on date range
- [ ] T055 [US9] Pass filtered flights to PDF generation
- [ ] T056 [US9] Calculate "Totals Forwarded" from flights BEFORE filter start date

**Checkpoint**: User can generate partial logbook with correct running totals

---

## Phase 12: User Story 10 - View Before/After Comparison (Priority: P3)

**Goal**: Pilot can compare generated PDF against original Excel visually

**Independent Test**: View side-by-side and confirm visual match

### Implementation for User Story 10

- [ ] T057 [US10] Create ComparisonView component in `app/import/components/ComparisonView.tsx`
- [ ] T058 [US10] Display PDF preview alongside corresponding Excel rows
- [ ] T059 [US10] Implement page selection to navigate comparison
- [ ] T060 [US10] Add "Compare with Excel" button to Import page

**Checkpoint**: User has full confidence in PDF accuracy

---

## Phase 13: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T061 [P] Add loading skeletons during file parsing
- [ ] T062 [P] Add keyboard shortcuts for common actions
- [ ] T063 [P] Ensure mobile responsive layout for Import page
- [ ] T064 Code cleanup: extract shared utilities
- [ ] T065 Performance optimization: memoize heavy calculations
- [ ] T066 Add error boundary for crash recovery
- [x] T067 Update sidebar Import link to route to `/import`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on T004-T005 (database schema)
- **User Stories (Phase 3-12)**: All depend on Phase 2 completion
- **Polish (Phase 13)**: Depends on at least US1-US4 being complete

### User Story Dependencies

| Story | Depends On | Can Start After |
|-------|------------|-----------------|
| US1 (Upload) | Phase 2 | T010 complete |
| US2 (Preview) | US1 | T017 complete |
| US3 (Generate PDF) | US2 | T024 complete |
| US4 (Download) | US3 | T032 complete |
| US5 (Validation Report) | US2 | T024 complete |
| US6 (Totals Summary) | US2 | T024 complete |
| US7 (Page Totals) | US3 | T032 complete |
| US8 (Re-upload) | US2 | T024 complete |
| US9 (Date Range) | US3 | T032 complete |
| US10 (Comparison) | US3 | T032 complete |

### Parallel Opportunities

**Within Phase 1:**
- T002, T003 can run in parallel

**Within Phase 2:**
- T007, T008 can run in parallel
- T009, T010 can run in parallel

**After MVP (US1-US4) complete:**
- US5, US6, US8 can all start in parallel
- US7, US9, US10 can all start in parallel (depend on US3)

---

## Parallel Example: Phase 2 (Foundational)

```bash
# After T006 (column mapper):
Task: "Create validation rules engine in lib/import/validator.ts"
Task: "Create shared TypeScript types in lib/import/types.ts"

# After column mapper complete:
Task: "Create TCCA page template constants in lib/export/tcca-template.ts"
Task: "Create page totals calculator in lib/export/page-calculator.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1-4 Only)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T010)
3. Complete Phase 3: US1 - Upload (T011-T017)
4. Complete Phase 4: US2 - Preview (T018-T024)
5. Complete Phase 5: US3 - Generate PDF (T025-T032)
6. Complete Phase 6: US4 - Download (T033-T036)
7. **STOP and VALIDATE**: Test full workflow with `Excel Log Canada.xlsx`
8. Deploy if ready - client can use the app!

### Incremental Delivery

After MVP:
- Add US5 (Validation Report) → Better error handling
- Add US6 (Totals Summary) → Better UX
- Add US7-US10 → Power user features

### Task Count Summary

| Phase | Task Count |
|-------|------------|
| Setup | 5 |
| Foundational | 5 |
| US1 (Upload) | 7 |
| US2 (Preview) | 7 |
| US3 (Generate PDF) | 8 |
| US4 (Download) | 4 |
| US5 (Validation Report) | 5 |
| US6 (Totals Summary) | 4 |
| US7 (Page Totals) | 3 |
| US8 (Re-upload) | 3 |
| US9 (Date Range) | 5 |
| US10 (Comparison) | 4 |
| Polish | 7 |
| **Total** | **67** |

---

## Notes

- MVP scope: Phase 1-6 (T001-T036) = 36 tasks
- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
