
***

## 2. Minimal-UI entry spec

```markdown
# Minimal-UI Entry Spec

Goal: pilot can add a log entry in ~20–30 seconds, touching at most 5–8 inputs; everything else is auto-filled or inferred. [file:2]

## 1. Core UX constraints

- Single-row quick entry form, optimized for keyboard.
- Mobile-friendly: fields stack vertically, but same logical order.
- Existing data imported from Excel becomes read-only history and auto-complete source. [file:2]

---

## 2. Required user inputs per new flight

**Minimal necessary inputs (core 6–7 fields):**

1. **Date**
   - Default: today.
   - Type: date picker + keyboard entry.

2. **Aircraft (make/model)**
   - Combobox with autocomplete from previous entries (C172, PA44, Redbird FMX, etc.). [file:2]
   - Default: last used type.

3. **Registration**
   - Autocomplete conditioned on aircraft type (C-GHFH, C-GCZN, etc.). [file:2]
   - Default: last registration used for this type.

4. **Role / context**
   - Enum: `Student`, `PIC`, `Instructor`, `Simulator`.
   - Drives default allocation of PIC vs dual vs instructor vs simulator time.

5. **Route**
   - Single string field with smart parsing: `CZBB-CYCW-CYXX-CZBB`.
   - Internally converted to `from`, `to`, and list of legs.
   - Default `from` = last destination; when missing, use home base.

6. **Flight time (hours)**
   - Single numeric input (e.g., `1.3`).
   - Must equal sum of allocated time buckets.

7. **Tags / type-of-flight**
   - Multi-select chips:
     - `XC` (cross-country)
     - `Night`
     - `IFR`
     - `Sim only`
     - `Checkride / test`
     - `Instructor` (if not already defined by ‘role’)
   - Drives XC, night, IMC/hood, simulator allocations.

Optional free text:

- Remarks: default templates based on tags (e.g., “Night Solo – Circuits”). [file:2]

---

## 3. Auto-calculated / auto-filled fields

**Auto-filled from history**

- Pilot in command:
  - If role = `PIC` or `Instructor`, default PIC = account holder’s name.
  - If role = `Student`, PIC = instructor name (selected from list / remembered per student). [file:2]
- Co-pilot / student:
  - If role = `Instructor`, default to student name.
  - If role = `Student`, co-pilot is the instructor.
- From / To:
  - Parse first and last ICAO codes from route string.
  - Default first leg FROM = last known base or previous TO. [file:2]

**Auto-calculated time buckets**

Given:

- `flightTime` (required)
- `role`
- `tags`
- `aircraftType` (single vs multi-engine, or simulator)
- `route legs` (for XC detection)

Engine populates:

- SE/ME vs simulator:
  - If aircraft in “sim” list (Redbird, ALSIM, AL250), allocate full time to `simulator` and 0 to SE/ME. [file:2]
- PIC vs dual vs instructor vs dual received:
  - If role = `PIC` and not `Instructor`: all time to PIC (SE or ME, day or night).
  - If role = `Student`: all time to DUAL (SE/ME) and optionally `dualReceived`. [file:2]
  - If role = `Instructor`: all time to `asFlightInstructor` + appropriate SE/ME bucket; PIC vs dual semantics follow local rules (your client uses instructor time heavily). [file:2]
- Day vs night:
  - If `Night` tag present → allocate time to night buckets.
  - If mixed day/night is needed in future, allow manual override of day/night proportions.
- XC:
  - If `XC` tag set:
    - If route includes more than 1 distinct airport and total distance ≥ regulatory threshold (TCCA), mark time as XC PIC/dual. For MVP, rely on tag instead of distance. [file:2]
  - Allocate XC PIC (or dual) = `flightTime` by default for simple flights.

**Takeoffs/landings**

- Default:
  - If remarks contain “Circuits” or tag `Circuits`: estimate day or night landings (e.g., 4); allow manual edit.
  - Otherwise default to 1 day landing if day, 1 night landing if night.

---

## 4. Minimal UI layout

### 4.1 Quick entry row

Order:

1. Date
2. Aircraft (type)
3. Registration
4. Role
5. Route
6. Flight time
7. Tags
8. [Optional] Remarks

Everything else is calculated and shown as **read-only chips** under the form:

- `SE Day PIC: 1.5`
- `XC Day PIC: 1.5`
- `Landings: Day 1`
- `IMC: 0.2, Hood: 0.0`
- `Instructor: 1.5` etc.

User can expand “Advanced” to tweak any bucket if needed (power users, edge cases).

---

## 5. Edit & import

- Existing Excel rows map 1:1 to backend `Flight` records and are displayed in a table similar to PDF layout. [file:2]
- Editing a record opens the same minimal form with calculated values as defaults.
- Export to Excel/PDF reconstructs the full TCCA format.
