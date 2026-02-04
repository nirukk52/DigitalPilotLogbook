# Research: Quick Flight Entry

**Feature**: 002-quick-flight-entry  
**Date**: 2026-02-03

---

## 1. Time Bucket Calculation Rules

### Decision: Role-Based Primary Allocation

**Rationale**: The pilot's role on a flight determines which primary time bucket receives the flight time. This is the foundational rule from TCCA logbook requirements.

| Role | Primary Bucket | Secondary Effects |
|------|----------------|-------------------|
| **Student** | SE/ME Day/Night **Dual** | `dualReceived` = flight time |
| **PIC** | SE/ME Day/Night **PIC** | None |
| **Instructor** | SE/ME Day/Night **PIC** | `asFlightInstructor` = flight time |
| **Simulator** | `simulator` | SE/ME buckets = 0 |

**Alternatives Considered**:
- Ask user to specify bucket directly → Rejected: Too complex, defeats 6-7 field goal
- Infer role from remarks → Rejected: Unreliable, error-prone

---

### Decision: Aircraft Type Detection (SE/ME/SIM)

**Rationale**: Aircraft make/model determines which column group receives the time (single-engine vs multi-engine vs simulator).

**Detection Logic**:
```
IF aircraft contains "PA44" OR "BE76" OR "DA42" → Multi-Engine (ME)
ELSE IF aircraft contains "Redbird" OR "ALSIM" OR "AL250" OR "FMX" → Simulator
ELSE → Single-Engine (SE) [default]
```

**Alternatives Considered**:
- Separate aircraft database with type field → Deferred: Add if pattern list insufficient
- Ask user every time → Rejected: Adds friction, defeats fast entry goal

**Known Multi-Engine Patterns** (from Excel data):
- PA44 (Piper Seminole)
- BE76 (Beechcraft Duchess)
- DA42 (Diamond Twin Star)

**Known Simulator Patterns** (from Excel data):
- Redbird FMX
- ALSIM AL250
- Any aircraft with "SIM" in name

---

### Decision: Day vs Night Allocation

**Rationale**: Night time is tracked separately for currency and licence requirements. User explicitly tags night flights.

| Night Tag | Allocation |
|-----------|------------|
| **Not set** | All time → Day buckets |
| **Set** | All time → Night buckets |
| **Mixed** (future) | Advanced mode only |

**Alternatives Considered**:
- Calculate from sunrise/sunset → Rejected: Requires location API, adds complexity
- Split field for day/night hours → Rejected: Adds 2 fields, exceeds 7-field limit

---

### Decision: Cross-Country (XC) as Qualifier

**Rationale**: Per TCCA rules and constitution, XC time is NOT additive. It's a qualifier that marks which PIC/Dual time also counts as cross-country.

**Rule**: When XC tag is set:
```
xcDayPic = seDayPic OR meDayPic (whichever is non-zero)
xcNightPic = seNightPic OR meNightPic (whichever is non-zero)
```

**Validation**: `XC_total ≤ PIC_total + Dual_total`

**Alternatives Considered**:
- Add XC time separately → Rejected: Violates TCCA rules (double-counting)
- Auto-detect from route length → Deferred: Requires distance calculation API

---

### Decision: IFR/Instrument Time

**Rationale**: IFR tag indicates actual instrument conditions (IMC). Hood time requires advanced mode.

| Tag | Bucket |
|-----|--------|
| **IFR** | `actualImc` = flight time |
| **None** | `actualImc` = 0 |

**Hood Time**: Only available in advanced mode (manual override).

**Alternatives Considered**:
- Separate IFR and Hood tags → Rejected: Too granular for quick entry
- Ask for instrument breakdown → Rejected: Exceeds 7-field limit

---

### Decision: Takeoffs/Landings Default

**Rationale**: Most flights have 1 takeoff and 1 landing. Circuit training has multiple.

| Condition | Default |
|-----------|---------|
| **Normal flight** | dayTakeoffsLandings = 1 |
| **Night tag** | nightTakeoffsLandings = 1, dayTakeoffsLandings = 0 |
| **Circuits tag** | dayTakeoffsLandings = 4 (editable) |
| **Circuits + Night** | nightTakeoffsLandings = 4 |

**Alternatives Considered**:
- Always ask for T/O count → Rejected: Adds friction for 95% of flights
- Parse from remarks → Rejected: Unreliable

---

## 2. Smart Defaults Logic

### Decision: Last Flight Defaults

**Rationale**: Pilots often fly the same aircraft type repeatedly. Defaulting to last-used values reduces keystrokes.

| Field | Default Source |
|-------|----------------|
| **Date** | Today |
| **Aircraft** | Last flight's aircraft make/model |
| **Registration** | Last flight's registration (for same aircraft type) |
| **Route prefix** | Last flight's arrival airport + "-" |
| **Role** | Last flight's role (inferred from buckets) |

**Query**: `SELECT * FROM flights WHERE userId = ? ORDER BY flightDate DESC, createdAt DESC LIMIT 1`

---

### Decision: Profile-Based Defaults

**Rationale**: Some defaults come from one-time profile settings, not flight history.

| Scenario | Default |
|----------|---------|
| **Role = PIC/Instructor** | PIC name = pilot profile name |
| **Role = Student** | PIC name = default instructor (from profile) |
| **No flights** | Route prefix = home base airport |

---

## 3. Profile Storage

### Decision: Extend `userSettings` Table

**Rationale**: Adding 2 fields (pilotName, homeBase) is simpler than creating a new table. Follows YAGNI principle.

**New Fields**:
```sql
ALTER TABLE user_settings ADD COLUMN pilot_name TEXT;
ALTER TABLE user_settings ADD COLUMN home_base TEXT;
ALTER TABLE user_settings ADD COLUMN default_instructor TEXT;
```

**Alternatives Considered**:
- New `pilot_profile` table → Rejected: Overkill for 3 fields
- Store in localStorage → Rejected: Not persistent across devices

---

## 4. Aircraft Type Lookup

### Decision: Start with Pattern Matching, Add Table Later

**Rationale**: Pattern matching handles known cases. Table can be added if users need custom aircraft types.

**Phase 1**: Hardcoded patterns in `calculation-engine.ts`
**Phase 2** (if needed): `aircraft_types` table with user overrides

**Pattern List**:
```typescript
const MULTI_ENGINE_PATTERNS = ['PA44', 'BE76', 'DA42', 'PA34', 'C310', 'BE58'];
const SIMULATOR_PATTERNS = ['Redbird', 'ALSIM', 'AL250', 'FMX', 'SIM', 'FRASCA'];
```

---

## 5. Form Validation

### Decision: Client-Side + Server-Side Validation

**Client-side** (immediate feedback):
- Flight time > 0
- Date not in far future (warn only)
- Required fields filled

**Server-side** (before save):
- `FlightHours = Σ(buckets)` within 0.01 tolerance
- `XC ≤ PIC + Dual` validation
- User owns the flight (for edits)

---

## 6. Autocomplete Implementation

### Decision: Database-Backed with Client Caching

**Rationale**: Autocomplete data comes from user's flight history. Cache in React state for performance.

**Flow**:
1. On form mount: `GET /api/flights/autocomplete?type=aircraft`
2. Store in React state: `aircraftOptions`, `registrationsByAircraft`
3. Filter locally as user types
4. Refresh on flight save

**API Response Shape**:
```typescript
{
  aircraft: ["C172", "PA44", "Redbird FMX"],
  registrations: {
    "C172": ["C-GHFH", "C-GCZN"],
    "PA44": ["C-FQNC"]
  },
  lastFlight: { aircraft: "C172", registration: "C-GHFH", arrivalAirport: "CZBB" }
}
```

---

## Summary

All clarifications resolved. Ready for Phase 1 (data-model.md, contracts/).
