# Calculation Engine Outline

This is backend logic for transforming minimal user input into the full TCCA-style time grid and aggregates. [file:2]

## 1. Inputs vs outputs

### 1.1 Engine inputs (per flight)

- date
- aircraftMakeModel
- registration
- routeString
- role (Student | PIC | Instructor | Simulator)
- flightTimeHours
- tags: {XC, Night, IFR, SimOnly, Checkride, Instructor}
- remarks (optional override)
- overrides: explicit values for any time bucket (expert users)

### 1.2 Engine outputs (per flight)

- Full `Flight` object (all time buckets populated).
- Validation notes (warnings if inconsistencies found).

---

## 2. High-level flow

1. Normalize raw inputs (trim strings, canonicalize ICAO, upper-case, etc.).
2. Derive metadata:
   - Aircraft category (SE vs ME vs SIM).
   - Legs (parse route string).
3. Allocate base time:
   - Assign `flightHours`.
   - Map to SE/ME vs SIM depending on aircraft category.
4. Allocate role-based time:
   - Student vs PIC vs Instructor vs Simulator.
5. Allocate day vs night.
6. Allocate XC and instrument time.
7. Allocate instructor/dual fields.
8. Compute derived totals and validation checks.

---

## 3. Detailed per-column logic

### 3.1 Aircraft category detection

Maintain lookup:

- Single-engine: C152, C172, etc.
- Multi-engine: PA34, PA44, etc.
- Simulator: Redbird FMX, ALSIM ALX, AL250, etc. [file:2]

Rules:

- If category = SIM → all time goes to `simulator` + IFR stats if needed; SE/ME buckets remain zero. [file:2]
- If category = SE or ME → standard SE/ME paths.

### 3.2 Role-based allocation

Case 1: `role = PIC`

- If category = SE:
  - If Night tag:
    - `seNightPic = flightTime`
  - Else:
    - `seDayPic = flightTime`
- If category = ME:
  - Same pattern with `meDayPic` / `meNightPic`.
- `asFlightInstructor = 0`, `dual`/`dualReceived = 0` unless explicitly overridden. [file:2]

Case 2: `role = Student`

- If category = SE:
  - `seDayDual` or `seNightDual = flightTime` based on Night tag.
- Similarly for ME.
- Optionally `dualReceived = flightTime`. [file:2]

Case 3: `role = Instructor`

- If category is SE/ME:
  - For TCCA/this client, they often log instructor time plus PIC; safe default:
    - If Night: `seNightPic = flightTime`, `asFlightInstructor = flightTime`.
    - Else: `seDayPic = flightTime`, `asFlightInstructor = flightTime`.
- For SIM: `simulator = flightTime`, `asFlightInstructor = flightTime` if instructing. [file:2]

Case 4: `role = Simulator`

- `simulator = flightTime`.
- Other time buckets 0, except instrument tags (IFR/approaches). [file:2]

### 3.3 Day vs night

- If Night tag: allocate to night buckets and `nightTakeoffsLandings`.
- If both day and night: allow advanced mode to specify split ratios, e.g., 0.8 day, 0.5 night.

Engine:

- For MVP, assume all time is either day or night, not mixed, unless advanced overrides.

### 3.4 Cross-country allocation

Algorithm:

1. Determine `isXC`:
   - If `XC` tag set → true.
   - Optionally later: compute distance between route airports ≥ 25/50NM threshold (TCCA). [file:2]
2. Determine role and category:
   - If role = PIC or Instructor → mark XC PIC.
   - If role = Student → mark XC DUAL.
3. Allocation:
   - If `isXC` and not overridden:
     - XC PIC (or XC DUAL) = `flightTime`.
   - Ensure `xcDayPic`/`xcNightPic` ≤ underlying PIC bucket. [file:2]

### 3.5 Instrument (IMC, hood, simulator)

Input tags may include IFR and SimOnly.

- If `SimOnly` → `simulator = flightTime`, IFR approaches optionally set.
- If `IFR` tag but no detailed breakdown, simple heuristic:
  - `actualIMC = min(flightTime, 0.3 * flightTime)`, `hood = 0` (or the reverse, depending on local preference).
- For imported data from Excel, just read the actual columns. [file:2]

Validation:

- `actualIMC + hood + simulator <= flightHours + epsilon`.
- If not, raise warning.

### 3.6 Takeoffs/landings counts

Heuristics:

- If remarks or tags contain “Circuits”:
  - Default: 4 landings (or configurable).
- Else:
  - Default 1 day landing or 1 night landing.

Where to store:

- If Night tag: `nightTakeoffsLandings`.
- Else: `dayTakeoffsLandings`.

---

## 4. Derived and aggregate computations

### 4.1 Per-row totals

Compute:

- `flightHoursCalc = sum(all time buckets that represent real time)` and validate `≈ flightHours input`. [file:2]
- `totalPIC` (SE+ME day+night).
- `totalDual`.
- `totalXC`.
- `totalIMC`, `totalSim`, etc.

### 4.2 Per-page and overall totals (for PDF)

Given flights sorted by date, and chunked into pages:

- For each page and each time column C:
  - `pageTotal[C] = sum(C for flights on that page)`. [file:1]
- For running totals:
  - `totalsToDate[C, page_k] = totalsToDate[C, page_(k-1)] + pageTotal[C, page_k]`. [file:1]

These are rendered into PDF at page bottom.

---

## 5. Validation rules

- `flightHours > 0`.
- Exactly one of {PIC, Dual, Instructor, Simulator, DualReceived} is dominant; conflicting allocations flagged.
- XC and instrument time do not exceed flight time.
- SE vs ME vs SIM buckets consistent with aircraft type. [file:2]

The engine should emit a list of warnings the UI can surface inline.
