# Feature Specification: Quick Flight Entry

**Feature Branch**: `002-quick-flight-entry`  
**Created**: 2026-02-03  
**Status**: Draft  
**Input**: Quick flight entry feature for pilots to add individual flights with minimal inputs (6-7 fields). Auto-calculates time buckets from role and tags. Supports users with existing flights in database.

---

## User Scenarios & Testing

### User Story 1 - Add Single Flight with Minimal Inputs (Priority: P1)

A pilot wants to log a flight they just completed. They should be able to add the flight in under 30 seconds by entering only 6-7 fields. The system auto-calculates all 24+ TCCA time bucket fields based on their inputs.

**Why this priority**: This is the core value proposition. Pilots currently spend 60-90 seconds per entry with 12-20 fields. Reducing this to 20-30 seconds with 6-7 fields is the primary competitive advantage.

**Independent Test**: Can be fully tested by opening the quick entry form, filling 7 fields, and verifying the flight is saved with all calculated time buckets correct.

**Acceptance Scenarios**:

1. **Given** I am on the Overview page with flights in my logbook, **When** I click "Add Flight", **Then** I see a quick entry form with 7 fields
2. **Given** the quick entry form is open, **When** I enter Date, Aircraft, Registration, Role, Route, Flight Time, and Tags, **Then** the system shows calculated time buckets as read-only chips below the form
3. **Given** I have filled all required fields, **When** I click "Save Flight", **Then** the flight is saved to my logbook with all calculated fields
4. **Given** I save a flight as Role="PIC" with 1.5 hours on a C172 (single-engine), **When** I view the saved flight, **Then** SE Day PIC = 1.5, all other buckets = 0 or null
5. **Given** I save a flight with Tags=[XC, Night] as Role="PIC", **When** I view the saved flight, **Then** SE Night PIC = flight time AND XC Night PIC = flight time

---

### User Story 2 - Smart Defaults from Flight History (Priority: P1)

A pilot adding a new flight should see intelligent defaults based on their previous flights. This reduces keystrokes and speeds up entry.

**Why this priority**: Smart defaults are essential to achieve the 20-30 second target. Without them, pilots would need to type everything from scratch.

**Independent Test**: Can be tested by adding multiple flights with the same aircraft, then verifying the next entry pre-fills that aircraft and registration.

**Acceptance Scenarios**:

1. **Given** I have previous flights in my logbook, **When** I open the quick entry form, **Then** Date defaults to today
2. **Given** my last flight was in C172 C-GHFH, **When** I open the quick entry form, **Then** Aircraft defaults to "C172" and Registration defaults to "C-GHFH"
3. **Given** I select a different Aircraft type (e.g., PA44), **When** I focus on Registration, **Then** autocomplete shows only registrations previously used with PA44
4. **Given** my last flight ended at CYCW, **When** I open the quick entry form, **Then** Route field shows "CYCW-" as the starting prefix
5. **Given** I have no previous flights, **When** I open the quick entry form, **Then** Aircraft and Registration are empty with no autocomplete suggestions

---

### User Story 3 - First-Time User Setup (Priority: P2)

A new user with no flights in the database needs to set up their profile before adding flights. The system should capture one-time settings (pilot name, home base) and use them for future entries.

**Why this priority**: Required for the system to auto-fill PIC name and default departure airport. Blocks smart defaults but not the core entry flow.

**Independent Test**: Can be tested by creating a new user, completing setup, and verifying subsequent flights use the profile data.

**Acceptance Scenarios**:

1. **Given** I have no flights and no profile settings, **When** I try to add a flight, **Then** I am prompted to complete one-time setup first
2. **Given** I am in one-time setup, **When** I enter my name and home base airport, **Then** these are saved to my profile
3. **Given** I have completed one-time setup with name "John Smith" and home base "CZBB", **When** I add a flight as Role="PIC", **Then** PIC field auto-fills with "John Smith"
4. **Given** my home base is CZBB, **When** I open quick entry with no previous flights, **Then** Route field shows "CZBB-" as the starting prefix

---

### User Story 4 - Time Bucket Calculation Engine (Priority: P2)

The system automatically calculates all 24+ TCCA time bucket fields based on the 7 inputs. Pilots see the calculated values before saving and can verify correctness.

**Why this priority**: Accuracy of time buckets is essential for licence applications and currency tracking. Incorrect calculations would make the tool unusable.

**Independent Test**: Can be tested by entering known flight combinations and verifying calculated buckets match expected TCCA rules.

**Acceptance Scenarios**:

1. **Given** Role="Student", Aircraft=C172, Time=1.2, **When** calculation runs, **Then** SE Day Dual=1.2, Dual Received=1.2, PIC fields=0
2. **Given** Role="Instructor", Aircraft=C172, Time=1.5, **When** calculation runs, **Then** SE Day PIC=1.5, As Flight Instructor=1.5
3. **Given** Role="PIC", Tags=[Night], Aircraft=C172, Time=1.0, **When** calculation runs, **Then** SE Night PIC=1.0, SE Day PIC=0
4. **Given** Role="PIC", Tags=[XC], Aircraft=PA44, Time=2.0, **When** calculation runs, **Then** ME Day PIC=2.0, XC Day PIC=2.0
5. **Given** Aircraft="Redbird FMX" (simulator), Time=0.5, **When** calculation runs, **Then** Simulator=0.5, all SE/ME fields=0
6. **Given** Tags=[Circuits], **When** calculation runs, **Then** Day Takeoffs/Landings defaults to 4 (editable)

---

### User Story 5 - Edit Existing Flight (Priority: P3)

A pilot notices an error in a previously logged flight and wants to correct it. They should be able to edit any field and have calculations update accordingly.

**Why this priority**: Data correction is important but less frequent than new entries. Most pilots enter correctly the first time.

**Independent Test**: Can be tested by saving a flight, editing it, and verifying both the changed input and recalculated buckets are saved.

**Acceptance Scenarios**:

1. **Given** I have a saved flight, **When** I click "Edit" on that flight, **Then** the quick entry form opens with all fields populated
2. **Given** I am editing a flight, **When** I change Role from "PIC" to "Student", **Then** calculated buckets update in real-time
3. **Given** I have edited a flight, **When** I click "Save", **Then** the flight is updated with new values and a timestamp

---

### User Story 6 - Advanced Mode for Edge Cases (Priority: P3)

A pilot has an unusual flight that doesn't fit the standard calculation rules (e.g., mixed day/night, partial XC). They need to manually adjust specific time buckets.

**Why this priority**: Edge cases are rare (<5% of flights). Standard calculations handle 95%+ of entries correctly.

**Independent Test**: Can be tested by expanding advanced mode and manually overriding a calculated bucket.

**Acceptance Scenarios**:

1. **Given** I am in quick entry form, **When** I click "Advanced", **Then** I see all 24 time bucket fields as editable inputs
2. **Given** I am in advanced mode, **When** I manually change SE Day PIC from 1.5 to 1.0 and SE Night PIC from 0 to 0.5, **Then** the system accepts the override
3. **Given** I have made manual overrides, **When** I save the flight, **Then** my overrides are preserved (not recalculated)
4. **Given** total of my overrides doesn't equal Flight Time, **When** I try to save, **Then** I see a validation warning (but can still save)

---

### Edge Cases

- **Empty Route**: User can leave route empty; FROM and TO are null
- **Multi-leg Route**: Route string "CZBB-CYCW-CYPK-CZBB" creates single flight entry with FROM=CZBB, TO=CZBB (legs are for remarks/XC detection)
- **Unknown Aircraft**: User can type a new aircraft type not in history; system accepts it and adds to autocomplete
- **Duplicate Flight**: Same date + aircraft + route is allowed (e.g., multiple training flights same day)
- **Future Date**: Allowed with warning (for pre-logging scheduled flights)
- **Zero Flight Time**: Rejected with error "Flight time must be greater than 0"
- **Negative Values**: Rejected for all numeric fields

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST provide a quick entry form with 7 primary fields: Date, Aircraft, Registration, Role, Route, Flight Time, Tags
- **FR-002**: System MUST auto-calculate all 24 TCCA time bucket fields from the 7 inputs
- **FR-003**: System MUST show calculated time buckets as read-only display before save
- **FR-004**: System MUST support 4 roles: Student, PIC, Instructor, Simulator
- **FR-005**: System MUST support tags: XC, Night, IFR, Circuits, Checkride
- **FR-006**: System MUST default Date to today
- **FR-007**: System MUST autocomplete Aircraft and Registration from flight history
- **FR-008**: System MUST default Route FROM to last flight's TO or home base
- **FR-009**: System MUST store one-time profile settings: Pilot Name, Home Base Airport
- **FR-010**: System MUST auto-fill PIC field based on Role and profile
- **FR-011**: System MUST identify simulator aircraft types (Redbird, ALSIM, AL250) and route time to simulator bucket
- **FR-012**: System MUST validate that total time buckets equal Flight Time input (within 0.01 tolerance)
- **FR-013**: System MUST persist new flights to database with INSERT (not replace)
- **FR-014**: System MUST allow editing existing flights
- **FR-015**: System MUST provide Advanced mode for manual bucket overrides

### Non-Functional Requirements

- **NFR-001**: Quick entry form MUST load in under 1 second
- **NFR-002**: Time bucket calculation MUST complete in under 100ms
- **NFR-003**: Autocomplete suggestions MUST appear within 200ms of typing

### Key Entities

- **Flight**: Individual flight record with all 35+ fields (existing entity, extended with source tracking)
- **PilotProfile**: One-time settings (name, home base, medical expiry, default instructor)
- **AircraftType**: Known aircraft with engine type (SE/ME/SIM) for calculation routing

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Pilot can add a new flight in under 30 seconds (from form open to save complete)
- **SC-002**: 95% of flights are entered using only the 7 primary fields (no advanced mode)
- **SC-003**: Calculated time buckets match manual calculation within 0.01 hours for all test cases
- **SC-004**: System correctly handles users with 0, 1-10, 100+, and 1000+ existing flights without performance degradation
- **SC-005**: Autocomplete shows relevant suggestions for aircraft and registration within 200ms
- **SC-006**: First-time user completes setup and adds first flight in under 2 minutes

---

## UI Location

This feature will be accessed from the Overview page:
- **Trigger**: "Add Flight" button (new primary action)
- **Form**: Modal or inline expansion in the Overview page
- **Quick entry follows the Overview → Add Flight → Save flow**

---

## Assumptions

- Pilot name is stored once in profile; same pilot logs all flights in their logbook
- Aircraft engine type (SE/ME/SIM) can be inferred from make/model or stored in a lookup table
- Tags are mutually non-exclusive (a flight can be both XC and Night)
- Default takeoffs/landings = 1 unless "Circuits" tag is set (then default = 4)
- IFR tag allocates time to Actual IMC bucket; Hood time requires advanced mode
- Instructor time is logged when Role=Instructor; the instructor is always PIC on those flights

---

## References

- `knowledge-base/excel-to-fill-db.md` - Minimal-UI entry specification
- `knowledge-base/01-calculation-mapping-spec.md` - Time bucket calculation rules
- `knowledge-base/v0-mvp.md` - MVP scope and target metrics
- `lib/db/schema.ts` - Existing Flight entity schema
