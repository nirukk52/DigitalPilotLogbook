# MVP Summary – Pilot Logbook (TCCA/EASA-style)

## 1. Problem

Professional pilots and instructors in Canada and Europe still use spreadsheet-based or expensive logbook tools (FlyLog, LogTen, LogAir) that are: [file:1][file:2]

- Slow to enter (12–20 fields per flight).
- Hard to keep compliant for TCCA/EASA.
- Expensive for students and instructors who are not airline-employed.

Your current client uses a TCCA spreadsheet and manually generates PDF pages that match the TCCA logbook format. [file:1][file:2]

---

## 2. Solution (MVP)

A web/mobile logbook that:

- Imports their existing TCCA Excel log (869+ flights) losslessly. [file:2]
- Presents a **minimal 6–7 field entry UI** (date, aircraft, registration, role, route, flight time, tags). [file:2]
- Auto-calculates all 40+ TCCA time buckets:
  - SE/ME, day/night, PIC/dual, XC, IMC/hood, simulator, instructor, etc.
- Exports to a **TCCA-compliant PDF** that visually mirrors their existing logbook pages with page totals and totals-to-date. [file:1]

Target: reduce time per entry from ~60–90s to ~20–30s while keeping full training/commercial log detail.

---

## 3. Core MVP features (v1)

1. **Data import**
   - Upload existing Excel (current layout).
   - Map columns automatically into normalized DB.
   - Show an import preview and error report. [file:2]

2. **Minimal quick-entry form**
   - Single line entry: date, aircraft, registration, route, flight time, role, tags.
   - Smart defaults for aircraft and registration based on last flights. [file:2]
   - Suggested remarks from templates.

3. **Calculation engine**
   - Role-based allocation (PIC vs dual vs instructor vs sim).
   - XC detection via tags and route string.
   - Day/night, IMC/hood/sim splits.
   - Validation of totals.

4. **PDF export**
   - Generate TCCA-style pages with:
     - Per-row entries.
     - Page totals.
     - Totals forwarded and totals to date per column. [file:1]
   - PDF visually matches physical logbook format.

5. **Basic analytics**
   - Totals card: total time, PIC, XC, night, instrument, instructor. [file:2]
   - Filters by date range, aircraft type, role, etc.

---

## 4. Why this wins vs FlyLog / LogTen / LogAir

- **Faster entry**: 6–7 required fields vs 12–20, with heavy auto-calculation of TCCA categories. [file:2]
- **Cheaper**: position at low annual subscription (e.g., $30–40/year) vs typical $60–80+.
- **Aligned with TCCA/EASA**:
  - Your model is grounded exactly in the TCCA spreadsheet and PDF this client already uses. [file:1][file:2]
- **Import-first**: no need to re-type existing 600–900+ hours.

---

## 5. Dev scope (first milestone)

1. Backend:
   - Data model (`Flight`, `Aircraft`, `User`).
   - Import pipeline from current Excel to DB.
   - Calculation engine implementing mapping + rules above.

2. Frontend:
   - Quick-entry form (desktop + mobile).
   - Flights table with sort/filter.
   - Simple “export as TCCA PDF” button.

3. Infra:
   - Auth, basic RBAC (owner vs read-only links for examiners).
   - Storage for original Excel and generated PDFs.

Deliverable: one real client (this student/instructor) fully migrated off Excel, using the new app for all new entries and able to produce TCCA-acceptable PDF logbook on demand.
