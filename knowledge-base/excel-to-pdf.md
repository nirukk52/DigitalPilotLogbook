# Calculation & Mapping Spec (Excel → PDF)

## 1. Source structures

### 1.1 Excel columns (TCCA-style log)

Core columns (by header row 3). [file:2]

- DATE
- MAKE / MODEL
- REGISTRATION
- PILOT IN COMMAND
- CO-PILOT, STUDENT OR PASSENGER
- FROM
- TO
- REMARKS
- SINGLE-ENGINE
  - DAY: DUAL, PIC, CO-PILOT
  - NIGHT: DUAL, PIC, CO-PILOT
- MULTI-ENGINE
  - DAY: DUAL, PIC, CO-PILOT
  - NIGHT: DUAL, PIC, CO-PILOT
- CROSS-COUNTRY
  - DAY: DUAL, PIC, CO-PILOT
  - NIGHT: DUAL, PIC, CO-PILOT
- TAKE-OFFS / LANDINGS
  - DAY
  - NIGHT
- INSTRUMENT
  - ACTUAL IMC
  - HOOD
  - SIMULATOR
  - IFR APPROACHES
  - HOLDING
- OTHER
  - AS FLIGHT INSTRUCTOR
  - DUAL RECEIVED
- DUTY / META
  - TIME ON
  - TIME OFF
  - TOTAL DUTY
  - FlightHours
  - DateIFR [file:2]

### 1.2 PDF layout (TCCA logbook pages)

From the PDF: each left page has ~18 rows with columns for date, aircraft, route, and time categories; right page has instrument / other columns and page totals + running totals. [file:1]

Key PDF fields per row: [file:1]

- Date
- Make/Model
- Registration
- Pilot in command
- Co-pilot / student
- From
- To
- Remarks
- Single-engine day: Dual, PIC, Co-pilot
- Single-engine night: Dual, PIC, Co-pilot
- Multi-engine day: Dual, PIC, Co-pilot
- Multi-engine night: Dual, PIC, Co-pilot
- Cross-country day: Dual, PIC, Co-pilot
- Cross-country night: Dual, PIC, Co-pilot
- Takeoffs/Landings: Day, Night
- Instrument: Actual IMC, Hood, Simulator, IFR approaches, Holding
- As flight instructor
- Dual received

Plus per-page totals and totals-to-date at bottom. [file:1]

---

## 2. Field-by-field mapping (row level)

For each flight row in DB/Excel, populate one PDF entry row:

| Excel / DB field                    | PDF row field                          | Notes / rules |
|------------------------------------|----------------------------------------|---------------|
| DATE                               | Date                                   | Same value. [file:2] |
| MAKE / MODEL                       | Make/Model                             | Same value. [file:2] |
| REGISTRATION                       | Registration                           | Same value. [file:2] |
| PILOT IN COMMAND                   | Pilot in command                       | Same value. [file:2] |
| CO-PILOT, STUDENT OR PASSENGER    | Co-pilot / student / passenger         | Same value. [file:2] |
| FROM                               | From                                   | Same value. [file:2] |
| TO                                 | To                                     | Same value. [file:2] |
| REMARKS                            | Remarks                                | Same value. [file:2] |
| SE DAY DUAL                        | Single-engine Day Dual                 | Direct. [file:2] |
| SE DAY PIC                         | Single-engine Day PIC                  | Direct. [file:2] |
| SE DAY CO-PILOT                    | Single-engine Day Co-pilot             | Direct. [file:2] |
| SE NIGHT DUAL                      | Single-engine Night Dual               | Direct. [file:2] |
| SE NIGHT PIC                       | Single-engine Night PIC                | Direct. [file:2] |
| SE NIGHT CO-PILOT                  | Single-engine Night Co-pilot           | Direct. [file:2] |
| ME DAY DUAL                        | Multi-engine Day Dual                  | Direct. [file:2] |
| ME DAY PIC                         | Multi-engine Day PIC                   | Direct. [file:2] |
| ME DAY CO-PILOT                    | Multi-engine Day Co-pilot              | Direct. [file:2] |
| ME NIGHT DUAL                      | Multi-engine Night Dual                | Direct. [file:2] |
| ME NIGHT PIC                       | Multi-engine Night PIC                 | Direct. [file:2] |
| ME NIGHT CO-PILOT                  | Multi-engine Night Co-pilot            | Direct. [file:2] |
| XC DAY DUAL                        | Cross-country Day Dual                 | Direct. [file:2] |
| XC DAY PIC                         | Cross-country Day PIC                  | Direct. [file:2] |
| XC DAY CO-PILOT                    | Cross-country Day Co-pilot             | Direct. [file:2] |
| XC NIGHT DUAL                      | Cross-country Night Dual               | Direct. [file:2] |
| XC NIGHT PIC                       | Cross-country Night PIC                | Direct. [file:2] |
| XC NIGHT CO-PILOT                  | Cross-country Night Co-pilot           | Direct. [file:2] |
| DAY T/O                            | Takeoffs / Landings Day                | Direct integer. [file:2] |
| NIGHT T/O                          | Takeoffs / Landings Night              | Direct integer. [file:2] |
| ACTUAL IMC                         | Instrument – Actual IMC                | Direct. [file:2] |
| HOOD                               | Instrument – Hood                      | Direct. [file:2] |
| SIMULATOR                          | Instrument – Simulator                 | Direct. [file:2] |
| IFR APPROACHES                     | Instrument – IFR approaches            | Direct. [file:2] |
| HOLDING                            | Instrument – Holding                   | Direct. [file:2] |
| AS FLIGHT INSTRUCTOR               | Other – As flight instructor           | Direct. [file:2] |
| DUAL RECEIVED                      | Other – Dual received                  | Direct. [file:2] |

`FlightHours` is not a separate column on the PDF row; it is implied by the sum of all time categories for that row. [file:1][file:2]

---

## 3. Calculation rules (per-row)

### 3.1 Total time for row

Define:

- \( T_{\text{row}} = \sum\_\text{all time columns in that row} \) (all SE/ME/XC, IMC, hood, simulator, instructor, dual received, etc., expressed in hours). [file:2]

In the current Excel, `FlightHours` always equals this sum for that row. [file:2]

Your engine should:

1. Take the user’s single “Flight time (hours)” input.
2. Allocate it into one or more time buckets (PIC, dual, instructor, simulator, etc.).
3. Enforce that the sum of allocated buckets equals the input flight time within rounding tolerance. [file:2]

### 3.2 Cross-country (XC) rule

In this user’s sheet, cross-country is stored ONLY in XC columns and is *not* added on top of total time; it is a qualifier. [file:2]

- For an XC flight, XC PIC equals some or all of the PIC on that leg; total row time remains the same. [file:2]
- For multi-leg XC days, each leg has its own XC PIC entry. [file:2]

Your rule:

- `XC Day PIC + XC Night PIC <= Total PIC (SE/ME day + night)` for that row.
- XC is **never** added again to `FlightHours`; it is a subset. [file:2]

### 3.3 Day vs night

- Day/night are separate columns for takeoffs/landings and XC (and via SE/ME night vs day). [file:2]
- There is no explicit “total day” or “total night” time column; they are inferred from which bucket is filled (day vs night columns) and from remarks (e.g., “Night Solo”). [file:2][file:1]

For this client:

- If any of the “night” SE/ME/XC/TO-LDG buckets are non-zero, consider the flight night or mixed.
- If only day buckets are set, it is a day flight.

You can optionally infer day/night from remarks like “Night Solo – Circuits”, but the sheet already uses the requested buckets explicitly. [file:2]

### 3.4 Instrument time

- Actual IMC and hood are logged separately. [file:2]
- On some flights, actual IMC appears with SE PIC filled, and FlightHours is roughly PIC time; IMC is again a qualifier, not additive. [file:2]

Rules:

- `Actual IMC + Hood + Simulator <= FlightHours` per row.
- For multi-leg IFR flights, IMC may be split per leg; totals are summed at page level. [file:2][file:1]

### 3.5 Instructor vs dual

- “As flight instructor” is time the pilot was instructing (CFI time).
- “Dual received” is time the pilot was receiving instruction. [file:2]

Product rule:

- Normally, a row should have either “as flight instructor” or “dual received”, not both.
- For this client, “As flight instructor” is heavily used because they are now an instructor; earlier rows use “dual received”. [file:2]

Engine rule:

- If role is “Instructor”, allocate time into `As flight instructor` and into the relevant SE/ME buckets (PIC, etc.).
- If role is “Student”, allocate into `Dual`/`Dual received` as appropriate. [file:2]

---

## 4. Page-level calculations (PDF)

### 4.1 Per-page totals

For each page filled with N rows (N≈18):

- For each time column C (SE Day Dual, SE Day PIC, … Simulator, etc.), compute:
  - Page total: sum of C over the page rows. [file:1]
- Render page totals at the bottom of each column. [file:1]

### 4.2 Running totals

The TCCA log shows “Totals forwarded” (previous pages) + “Page totals” = “Totals to date”. [file:1]

For each column C:

- `Totals to date (page k) = Totals to date (page k-1) + Page total (page k)`. [file:1]
- Page 1 uses `Totals forwarded = 0`. [file:1]

You should compute running totals in the backend and only render the resulting numbers into the PDF fields.

---

## 5. Data model for your app (normalized)

Recommended DB representation (single source of truth):

```ts
Flight {
  id: string;
  date: Date;
  aircraftMakeModel: string;
  registration: string;
  pilotInCommand: string | null;
  copilotOrStudent: string | null;
  from: string | null;          // ICAO
  to: string | null;            // ICAO
  remarks: string | null;

  // Time buckets (hours)
  seDayDual: number | null;
  seDayPic: number | null;
  seDayCopilot: number | null;
  seNightDual: number | null;
  seNightPic: number | null;
  seNightCopilot: number | null;

  meDayDual: number | null;
  meDayPic: number | null;
  meDayCopilot: number | null;
  meNightDual: number | null;
  meNightPic: number | null;
  meNightCopilot: number | null;

  xcDayDual: number | null;
  xcDayPic: number | null;
  xcDayCopilot: number | null;
  xcNightDual: number | null;
  xcNightPic: number | null;
  xcNightCopilot: number | null;

  dayTakeoffsLandings: number | null;
  nightTakeoffsLandings: number | null;

  actualIMC: number | null;
  hood: number | null;
  simulator: number | null;
  ifrApproaches: number | null;
  holding: number | null;

  asFlightInstructor: number | null;
  dualReceived: number | null;

  timeOn: string | null;
  timeOff: string | null;
  totalDuty: number | null;

  flightHours: number;          // computed
  dateIFR: Date | null;
}
