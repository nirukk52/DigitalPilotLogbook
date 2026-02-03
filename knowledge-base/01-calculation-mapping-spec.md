# Calculation & Mapping Spec (Excel → PDF)

**Version:** 1.0  
**Date:** February 3, 2026  
**Purpose:** Define exact mapping from Excel logbook columns to PDF fields and calculation rules for TCCA-compliant pilot logbook system.

---

## 1. Source Structures

### 1.1 Excel Columns (TCCA-style log)

The source Excel file uses a multi-row header structure matching TCCA logbook format:

**Core Columns (by header row 3):**

| Col | Header Row 1 | Header Row 2 | Header Row 3 | Data Type |
|-----|--------------|--------------|--------------|-----------|
| 0 | - | - | DATE | Date |
| 1 | AIRCRAFT | - | MAKE / MODEL | Text |
| 2 | - | - | REGISTRATION | Text |
| 3 | - | - | PILOT IN COMMAND | Text |
| 4 | - | - | CO-PILOT, STUDENT OR PASSENGER | Text |
| 5 | ROUTE | - | FROM | ICAO Code |
| 6 | - | - | TO | ICAO Code |
| 7 | - | - | REMARKS | Text |
| 8 | SINGLE-ENGINE | DAY | DUAL | Decimal |
| 9 | - | - | PIC | Decimal |
| 10 | - | - | CO-PILOT | Decimal |
| 11 | - | NIGHT | DUAL | Decimal |
| 12 | - | - | PIC | Decimal |
| 13 | - | - | CO-PILOT | Decimal |
| 14 | MULTI-ENGINE | DAY | DUAL | Decimal |
| 15 | - | - | PIC | Decimal |
| 16 | - | - | CO-PILOT | Decimal |
| 17 | - | NIGHT | DUAL | Decimal |
| 18 | - | - | PIC | Decimal |
| 19 | - | - | CO-PILOT | Decimal |
| 20 | CROSS-COUNTRY | DAY | DUAL | Decimal |
| 21 | - | - | PIC | Decimal |
| 22 | - | - | CO-PILOT | Decimal |
| 23 | - | NIGHT | DUAL | Decimal |
| 24 | - | - | PIC | Decimal |
| 25 | - | - | CO-PILOT | Decimal |
| 26 | TAKE-OFFS / LANDINGS | - | DAY | Integer |
| 27 | - | - | NIGHT | Integer |
| 28 | INSTRUMENT | - | ACTUAL IMC | Decimal |
| 29 | - | - | HOOD | Decimal |
| 30 | - | - | SIMULATOR | Decimal |
| 31 | - | - | IFR APPROACHES | Integer |
| 32 | - | - | HOLDING | Integer |
| 33 | OTHER | - | AS FLIGHT INSTRUCTOR | Decimal |
| 34 | - | - | DUAL RECEIVED | Decimal |

**Additional Metadata Columns:**

- TIME ON (Time)
- TIME OFF (Time)
- TOTAL DUTY (Decimal)
- FlightHours (Computed decimal - sum of all time categories)
- DateIFR (Date - for IFR flights)

**Statistics from sample data:**
- Total flights: 869+
- SE Day Dual: 107 flights
- SE Day PIC: 679 flights
- XC Flights (Day): 49 flights
- Night Flights: 5 flights
- IFR Approaches: 17 flights
- Instructor Time: 624 flights

---

### 1.2 PDF Layout (TCCA Logbook Pages)

The TCCA physical/PDF logbook uses a two-page spread format:

**Left Page (Flight Details):**
- ~18 rows per page
- Columns: Date, Make/Model, Registration, Pilot in Command, Co-pilot/Student, Route (From/To), Remarks
- Single-engine day/night time columns
- Multi-engine day/night time columns

**Right Page (Additional Categories):**
- Cross-country day/night time columns
- Takeoffs/Landings (day/night counts)
- Instrument time (Actual IMC, Hood, Simulator)
- IFR approaches and holding procedures
- As flight instructor
- Dual received

**Bottom of Each Page:**
- Page totals (sum of each column for current page)
- Totals forwarded (cumulative from previous pages)
- Totals to date (page totals + totals forwarded)

---

## 2. Field-by-Field Mapping (Row Level)

For each flight row in database/Excel, populate one PDF entry row:

| Excel/DB Field | PDF Row Field | Type | Mapping Rule |
|----------------|---------------|------|--------------|
| DATE | Date | Date | Direct copy |
| MAKE / MODEL | Make/Model | Text | Direct copy |
| REGISTRATION | Registration | Text | Direct copy (e.g., C-GHFH) |
| PILOT IN COMMAND | Pilot in command | Text | Direct copy |
| CO-PILOT, STUDENT OR PASSENGER | Co-pilot/student/passenger | Text | Direct copy |
| FROM | From | ICAO | Direct copy (e.g., CZBB) |
| TO | To | ICAO | Direct copy (e.g., CYCW) |
| REMARKS | Remarks | Text | Direct copy (e.g., "Attitudes and Movement") |
| SE DAY DUAL (col 8) | Single-engine Day Dual | Decimal | Direct copy |
| SE DAY PIC (col 9) | Single-engine Day PIC | Decimal | Direct copy |
| SE DAY CO-PILOT (col 10) | Single-engine Day Co-pilot | Decimal | Direct copy |
| SE NIGHT DUAL (col 11) | Single-engine Night Dual | Decimal | Direct copy |
| SE NIGHT PIC (col 12) | Single-engine Night PIC | Decimal | Direct copy |
| SE NIGHT CO-PILOT (col 13) | Single-engine Night Co-pilot | Decimal | Direct copy |
| ME DAY DUAL (col 14) | Multi-engine Day Dual | Decimal | Direct copy |
| ME DAY PIC (col 15) | Multi-engine Day PIC | Decimal | Direct copy |
| ME DAY CO-PILOT (col 16) | Multi-engine Day Co-pilot | Decimal | Direct copy |
| ME NIGHT DUAL (col 17) | Multi-engine Night Dual | Decimal | Direct copy |
| ME NIGHT PIC (col 18) | Multi-engine Night PIC | Decimal | Direct copy |
| ME NIGHT CO-PILOT (col 19) | Multi-engine Night Co-pilot | Decimal | Direct copy |
| XC DAY DUAL (col 20) | Cross-country Day Dual | Decimal | Direct copy |
| XC DAY PIC (col 21) | Cross-country Day PIC | Decimal | Direct copy |
| XC DAY CO-PILOT (col 22) | Cross-country Day Co-pilot | Decimal | Direct copy |
| XC NIGHT DUAL (col 23) | Cross-country Night Dual | Decimal | Direct copy |
| XC NIGHT PIC (col 24) | Cross-country Night PIC | Decimal | Direct copy |
| XC NIGHT CO-PILOT (col 25) | Cross-country Night Co-pilot | Decimal | Direct copy |
| DAY T/O (col 26) | Takeoffs/Landings Day | Integer | Direct copy |
| NIGHT T/O (col 27) | Takeoffs/Landings Night | Integer | Direct copy |
| ACTUAL IMC (col 28) | Instrument – Actual IMC | Decimal | Direct copy |
| HOOD (col 29) | Instrument – Hood | Decimal | Direct copy |
| SIMULATOR (col 30) | Instrument – Simulator | Decimal | Direct copy |
| IFR APPROACHES (col 31) | Instrument – IFR approaches | Integer | Direct copy |
| HOLDING (col 32) | Instrument – Holding | Integer | Direct copy |
| AS FLIGHT INSTRUCTOR (col 33) | Other – As flight instructor | Decimal | Direct copy |
| DUAL RECEIVED (col 34) | Other – Dual received | Decimal | Direct copy |

**Important Note:** `FlightHours` is NOT a separate PDF column; it is the computed sum of all time categories for that row.

---

## 3. Calculation Rules (Per-Row)

### 3.1 Total Time for Row

**Definition:**

```
T_row = Σ(all time columns in that row)
```

Where time columns include:
- All SE/ME time (Day/Night, Dual/PIC/Co-pilot)
- All XC time (subset of SE/ME)
- Actual IMC, Hood, Simulator
- As Flight Instructor
- Dual Received

**Current Excel Implementation:**

The `FlightHours` column always equals this sum for each row.

**Engine Requirements:**

1. Accept user's single "Flight time (hours)" input
2. Allocate into one or more time buckets (PIC, dual, instructor, simulator, etc.)
3. Enforce: `sum(allocated buckets) = input flight time` (within 0.01 hour tolerance)

**Validation:**

```javascript
const totalTime = 
  seDayDual + seDayPic + seDayCopilot +
  seNightDual + seNightPic + seNightCopilot +
  meDayDual + meDayPic + meDayCopilot +
  meNightDual + meNightPic + meNightCopilot +
  actualIMC + hood + simulator +
  asFlightInstructor + dualReceived;

assert(Math.abs(totalTime - flightHours) < 0.01);
```

---

### 3.2 Cross-Country (XC) Rule

**Key Principle:** Cross-country time is a QUALIFIER, not additive time.

**In the Excel data:**
- XC is stored ONLY in XC columns (cols 20-25)
- XC is NOT added on top of total time
- For XC flights, XC PIC equals some or all of the PIC on that leg
- Total row time remains the same whether XC or not

**Examples from data:**

```
Flight 1 (Non-XC):
  SE Day PIC: 1.5
  XC Day PIC: 0.0
  FlightHours: 1.5

Flight 2 (XC):
  SE Day PIC: 1.5
  XC Day PIC: 1.5  ← Same value, qualifier
  FlightHours: 1.5  ← Still 1.5, not 3.0
```

**Multi-Leg Cross-Country:**

For multi-leg XC flights (e.g., CZBB-CYCW-CYPK-CZBB), each leg has separate row:

```
Leg 1: CZBB → CYCW  SE PIC: 1.2, XC PIC: 1.2
Leg 2: CYCW → CYPK  SE PIC: 0.4, XC PIC: 0.4
Leg 3: CYPK → CZBB  SE PIC: 0.7, XC PIC: 0.7
```

**Engine Rules:**

1. `XC Day PIC + XC Night PIC ≤ Total PIC (SE/ME day + night)` for that row
2. XC is NEVER added to `FlightHours`; it is a subset
3. For XC flights, typically `XC PIC = SE PIC` or `XC PIC = ME PIC` for that flight

**Validation:**

```javascript
const totalPIC = seDayPic + seNightPic + meDayPic + meNightPic;
const totalXCPIC = xcDayPic + xcNightPic;
assert(totalXCPIC <= totalPIC + 0.01);
```

---

### 3.3 Day vs Night

**Column Structure:**
- Day/night are separate columns for:
  - Single-engine time
  - Multi-engine time
  - Cross-country time
  - Takeoffs/landings

**Detection Rules:**

There is no explicit "total day" or "total night" time column. Day/night is inferred from:

1. **Which buckets are filled:**
   - If SE Night PIC has value → night flight
   - If SE Day PIC has value → day flight

2. **Remarks content:**
   - "Night Solo – Circuits" → night flight
   - "Night cross-country" → night flight

**Engine Logic:**

```javascript
function isNightFlight(flight) {
  // Check if any night buckets are non-zero
  const hasNightTime = 
    flight.seNightDual > 0 ||
    flight.seNightPic > 0 ||
    flight.seNightCopilot > 0 ||
    flight.meNightDual > 0 ||
    flight.meNightPic > 0 ||
    flight.meNightCopilot > 0 ||
    flight.xcNightDual > 0 ||
    flight.xcNightPic > 0 ||
    flight.xcNightCopilot > 0 ||
    flight.nightTakeoffsLandings > 0;
  
  return hasNightTime;
}

function isDayFlight(flight) {
  // Check if any day buckets are non-zero
  const hasDayTime = 
    flight.seDayDual > 0 ||
    flight.seDayPic > 0 ||
    // ... etc
    flight.dayTakeoffsLandings > 0;
  
  return hasDayTime;
}
```

**Mixed Day/Night Flights:**

Some flights may have both day and night time (e.g., flight starts in day, ends at night). Current data shows this is rare; most flights are purely day or night.

For MVP, engine should handle:
- Pure day flights
- Pure night flights
- Mixed flights (advanced mode: allow user to specify split)

---

### 3.4 Instrument Time

**Column Types:**
- **Actual IMC** - Actual instrument meteorological conditions
- **Hood** - Simulated instrument conditions (hood/foggles)
- **Simulator** - Simulator/FTD time

**Key Principle:** Instrument time qualifies existing flight time; it doesn't add to total.

**Examples from Data:**

```
Flight 1 (IFR in actual aircraft):
  SE Day PIC: 1.5
  Actual IMC: 0.3  ← 0.3 hours of the 1.5 was IMC
  FlightHours: 1.5  ← Not 1.8

Flight 2 (Hood training):
  SE Day Dual: 1.2
  Hood: 0.8  ← 0.8 hours under hood
  FlightHours: 1.2  ← Not 2.0

Flight 3 (Simulator only):
  Simulator: 2.0
  SE/ME: 0.0
  FlightHours: 2.0  ← Simulator IS the flight time
```

**Engine Rules:**

1. For aircraft flights: `Actual IMC + Hood ≤ FlightHours`
2. For simulator sessions: `Simulator = FlightHours`, SE/ME buckets = 0
3. Multi-leg IFR flights may split IMC across legs

**Validation:**

```javascript
if (simulator > 0) {
  // Simulator-only flight
  assert(seDayPic === 0 && meDayPic === 0); // No real aircraft time
  assert(simulator === flightHours);
} else {
  // Aircraft flight
  assert(actualIMC + hood <= flightHours + 0.01);
}
```

---

### 3.5 Instructor vs Dual

**Two Distinct Categories:**

1. **"As Flight Instructor"** - Time the pilot WAS instructing (CFI/flight instructor time)
2. **"Dual Received"** - Time the pilot WAS receiving instruction (student time)

**Typical Patterns:**

**Student Phase:**
```
SE Day Dual: 1.2
Dual Received: 1.2
As Flight Instructor: 0.0
```

**Instructor Phase:**
```
SE Day PIC: 1.5
As Flight Instructor: 1.5
Dual Received: 0.0
```

**Product Rule:**

Normally, a row should have EITHER "as flight instructor" OR "dual received", not both (mutually exclusive roles).

**Client-Specific Pattern:**

This client is now an instructor, so later flights show heavy use of "As Flight Instructor" time. Earlier flights (2021-2022) show "Dual Received" during training phase.

**Engine Rules:**

1. **If role = "Instructor":**
   - Allocate time into `asFlightInstructor`
   - Also allocate into SE/ME PIC buckets (instructor acts as PIC)
   - `dualReceived = 0`

2. **If role = "Student":**
   - Allocate into `DUAL` buckets (SE/ME Day/Night Dual)
   - Optionally allocate into `dualReceived`
   - `asFlightInstructor = 0`

3. **If role = "PIC" (neither instructing nor receiving):**
   - Allocate into PIC buckets
   - Both `asFlightInstructor` and `dualReceived = 0`

**Validation:**

```javascript
// Warn if both are set (unusual but not invalid)
if (asFlightInstructor > 0 && dualReceived > 0) {
  warnings.push("Both instructor and dual received time logged - verify this is intentional");
}
```

---

## 4. Page-Level Calculations (PDF)

### 4.1 Per-Page Totals

**Process:**

For each page filled with N rows (typically N ≈ 18):

1. For each time column C (e.g., SE Day Dual, SE Day PIC, XC Day PIC, etc.):
   ```
   PageTotal[C] = Σ(C for all rows on this page)
   ```

2. Render page totals at bottom of each column

**Example:**

```
Page 1 (18 flights):
  SE Day Dual column: 1.2 + 0.9 + 1.0 + ... = 15.4 hours
  SE Day PIC column: 0.0 + 0.0 + 0.0 + ... = 2.0 hours
  XC Day PIC column: 0.0 + 0.0 + 1.6 + ... = 5.4 hours
```

**All Columns to Total:**

- Single-engine: Day (Dual, PIC, Co-pilot), Night (Dual, PIC, Co-pilot)
- Multi-engine: Day (Dual, PIC, Co-pilot), Night (Dual, PIC, Co-pilot)
- Cross-country: Day (Dual, PIC, Co-pilot), Night (Dual, PIC, Co-pilot)
- Takeoffs/Landings: Day, Night (counts, not hours)
- Instrument: Actual IMC, Hood, Simulator (hours)
- IFR Approaches, Holding (counts)
- As Flight Instructor (hours)
- Dual Received (hours)

---

### 4.2 Running Totals (Totals to Date)

**TCCA Logbook Structure:**

Each page bottom shows three rows:
1. **Page Totals** - Sum for current page
2. **Totals Forwarded** - Cumulative from all previous pages
3. **Totals to Date** - Page totals + Totals forwarded

**Calculation Formula:**

For each column C:

```
TotalsToDate[C, page_k] = TotalsToDate[C, page_(k-1)] + PageTotal[C, page_k]
```

Where:
- `TotalsToDate[C, page_0] = 0` (first page starts at zero)
- `TotalsForwarded[C, page_k] = TotalsToDate[C, page_(k-1)]`

**Example:**

```
Page 1:
  SE Day PIC - Page Total: 20.0
  SE Day PIC - Totals Forwarded: 0.0
  SE Day PIC - Totals to Date: 20.0

Page 2:
  SE Day PIC - Page Total: 15.4
  SE Day PIC - Totals Forwarded: 20.0
  SE Day PIC - Totals to Date: 35.4

Page 3:
  SE Day PIC - Page Total: 14.6
  SE Day PIC - Totals Forwarded: 35.4
  SE Day PIC - Totals to Date: 50.0
```

**Implementation:**

Backend should:
1. Sort flights by date
2. Chunk into pages of 18 rows each
3. For each page, compute page totals
4. Compute running totals using formula above
5. Render all three rows into PDF fields

---

## 5. Data Model for Application (Normalized)

### 5.1 Flight Entity

Recommended database schema (single source of truth):

```typescript
interface Flight {
  // Identifiers
  id: string;                          // UUID
  userId: string;                      // Owner
  
  // Basic flight info
  date: Date;                          // Flight date
  aircraftMakeModel: string;           // e.g., "C172"
  registration: string;                // e.g., "C-GHFH"
  pilotInCommand: string | null;       // PIC name
  copilotOrStudent: string | null;     // Co-pilot/student name
  from: string | null;                 // ICAO code (e.g., "CZBB")
  to: string | null;                   // ICAO code (e.g., "CYCW")
  remarks: string | null;              // Free text
  
  // Single-engine time (hours)
  seDayDual: number | null;
  seDayPic: number | null;
  seDayCopilot: number | null;
  seNightDual: number | null;
  seNightPic: number | null;
  seNightCopilot: number | null;
  
  // Multi-engine time (hours)
  meDayDual: number | null;
  meDayPic: number | null;
  meDayCopilot: number | null;
  meNightDual: number | null;
  meNightPic: number | null;
  meNightCopilot: number | null;
  
  // Cross-country time (hours, subset of SE/ME)
  xcDayDual: number | null;
  xcDayPic: number | null;
  xcDayCopilot: number | null;
  xcNightDual: number | null;
  xcNightPic: number | null;
  xcNightCopilot: number | null;
  
  // Takeoffs/Landings (counts)
  dayTakeoffsLandings: number | null;
  nightTakeoffsLandings: number | null;
  
  // Instrument time (hours)
  actualIMC: number | null;            // Actual IMC
  hood: number | null;                 // Simulated instrument
  simulator: number | null;            // FTD/sim time
  ifrApproaches: number | null;        // Count
  holding: number | null;              // Count
  
  // Instructor/Dual
  asFlightInstructor: number | null;   // Hours as CFI
  dualReceived: number | null;         // Hours receiving instruction
  
  // Duty time (optional)
  timeOn: string | null;               // HH:MM format
  timeOff: string | null;              // HH:MM format
  totalDuty: number | null;            // Hours
  
  // Computed fields
  flightHours: number;                 // Sum of all time buckets
  dateIFR: Date | null;                // IFR flight date (if applicable)
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}
```

### 5.2 Import Flow

**Excel → Database:**

1. Parse Excel file (handle multi-row headers)
2. For each data row (starting row 4):
   - Map columns to Flight fields using mapping table from Section 2
   - Validate data types
   - Compute `flightHours` and validate against source
3. Bulk insert into database
4. Generate import report (success count, warnings, errors)

**Database → PDF:**

1. Query flights for user, sorted by date
2. Chunk into pages of 18 rows
3. For each page:
   - Render row data
   - Calculate page totals
   - Calculate running totals
4. Generate PDF using template matching TCCA logbook format

---

## 6. Validation Rules Summary

### 6.1 Per-Flight Validations

| Rule | Formula | Severity | Message |
|------|---------|----------|---------|
| Total time matches | `abs(flightHours - Σ(time buckets)) < 0.01` | Error | "Flight time doesn't match sum of time categories" |
| XC subset of total | `xcDayPic + xcNightPic <= totalPIC + 0.01` | Error | "Cross-country time exceeds total PIC time" |
| IMC subset | `actualIMC + hood <= flightHours + 0.01` (if not sim) | Error | "Instrument time exceeds flight time" |
| Role consistency | Only one primary role active | Warning | "Multiple roles detected (PIC + Instructor + Dual)" |
| Aircraft category | SE vs ME vs SIM buckets match aircraft type | Error | "Single-engine time logged for multi-engine aircraft" |
| Date validity | `date <= today` | Warning | "Future flight date" |
| Route validity | FROM and TO are valid ICAO codes | Warning | "Invalid airport code" |

### 6.2 Cross-Flight Validations

| Rule | Description | Severity |
|------|-------------|----------|
| Currency | Night currency, IFR currency calculations | Info |
| Duplicate detection | Same date + aircraft + from/to | Warning |
| Sequential dates | Large gaps in flight dates | Info |

---

## 7. Implementation Checklist

### Phase 1: Import
- [ ] Parse multi-row Excel headers correctly
- [ ] Map all 35+ columns to Flight schema
- [ ] Validate data types and ranges
- [ ] Handle null/empty cells appropriately
- [ ] Generate import preview and error report
- [ ] Bulk insert with transaction support

### Phase 2: Calculations
- [ ] Implement FlightHours summation
- [ ] Validate XC as subset of PIC/Dual
- [ ] Validate instrument time constraints
- [ ] Implement day/night detection
- [ ] Implement role-based allocation
- [ ] Add all validation rules

### Phase 3: Export
- [ ] Sort flights by date
- [ ] Chunk into 18-row pages
- [ ] Calculate page totals (all columns)
- [ ] Calculate running totals (all columns)
- [ ] Render PDF matching TCCA layout
- [ ] Include pilot signature area

### Phase 4: Testing
- [ ] Test with sample 869-flight dataset
- [ ] Verify totals match source Excel
- [ ] Verify PDF matches physical logbook format
- [ ] Test edge cases (multi-leg XC, night flights, sim, etc.)
- [ ] Validate all error messages trigger correctly

---

## Appendix A: Common Flight Patterns

### Pattern 1: Student Training (Early Phase)
```
Date: 2021-07-17
Aircraft: C172 C-GHFH
Route: CZBB → CZBB
Remarks: "Attitudes and Movement"
SE Day Dual: 1.2
Dual Received: 1.2
FlightHours: 1.2
```

### Pattern 2: Solo Flight
```
Date: 2021-10-07
Aircraft: C172 C-GHFH
Route: CZBB → CZBB
Remarks: "First Solo"
SE Day PIC: 0.2
FlightHours: 0.2
```

### Pattern 3: Cross-Country (Multi-Leg)
```
Leg 1:
  Date: 2022-03-06
  Route: CZBB → CYCW
  SE Day PIC: 1.2
  XC Day PIC: 1.2
  FlightHours: 1.2

Leg 2:
  Date: 2022-03-06
  Route: CYCW → CYPK
  SE Day PIC: 0.4
  XC Day PIC: 0.4
  FlightHours: 0.4

Leg 3:
  Date: 2022-03-06
  Route: CYPK → CZBB
  SE Day PIC: 0.7
  XC Day PIC: 0.7
  FlightHours: 0.7
```

### Pattern 4: Simulator Session
```
Date: 2021-11-17
Aircraft: Redbird FMX TC-0078
Route: CZBB → CZBB
Remarks: "SIM Instrument Full panel"
Simulator: 0.5
Hood: 0.5
FlightHours: 0.5
```

### Pattern 5: Instructor Flight (Current Phase)
```
Date: 2024-10-03
Aircraft: C172 C-FQNC
Route: CZBB → CZBB
Remarks: "X/C - CZBB-CYPK-CZBB"
SE Day PIC: 2.0
XC Day PIC: 2.0
As Flight Instructor: 2.0
FlightHours: 2.0
```

---

**End of Specification**

*This document should be updated as new edge cases are discovered during implementation.*