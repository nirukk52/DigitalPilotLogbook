# Tasks: Quick Flight Entry

**Input**: Design documents from `/specs/002-quick-flight-entry/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.ts, quickstart.md

**Tests**: Not explicitly requested - test tasks omitted. Manual testing via quickstart.md.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1-US6) from spec.md

## Path Conventions

- **app/**: Next.js App Router pages and API routes
- **lib/**: Business logic, database, utilities
- **components/**: Reusable UI components (organized under app/components/)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, folder structure, and database migration

- [x] T001 Create `lib/flights/` folder structure for flight business logic
- [x] T002 [P] Create `app/components/flights/` folder for UI components
- [x] T003 Update `lib/db/schema.ts` - add pilotName, homeBase, defaultInstructor columns to userSettings table
- [x] T004 Generate Drizzle migration with `pnpm db:generate`
- [x] T005 Push migration to database with `pnpm db:push`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types and calculation engine that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Create `lib/flights/types.ts` with QuickEntryInput, CalculatedFlight, FlightRole, FlightTag, TimeBuckets types (copy from contracts/api.ts)
- [x] T007 Create `lib/flights/calculation-engine.ts` with calculateBuckets() function implementing role-based allocation rules from research.md
- [x] T008 [P] Add insertFlight() query to `lib/db/queries.ts` for single flight INSERT
- [x] T009 [P] Add updateFlight() query to `lib/db/queries.ts` for editing flights
- [x] T010 [P] Add getFlightDefaults() query to `lib/db/queries.ts` for smart defaults
- [x] T011 [P] Add savePilotProfile() query to `lib/db/queries.ts` for profile settings
- [x] T012 Add aircraft type detection logic to calculation-engine.ts (SE/ME/SIM patterns from research.md)
- [x] T013 Add validation helpers to calculation-engine.ts (sum check, XC subset check)

**Checkpoint**: Foundation ready - calculation engine tested manually, user story implementation can begin

---

## Phase 3: User Story 1 - Add Single Flight with Minimal Inputs (Priority: P1) 🎯 MVP

**Goal**: Pilot can add a flight in under 30 seconds using only 6-7 fields

**Independent Test**: Open form, fill 7 fields, save - verify flight appears in database with correct calculated buckets

### Implementation for User Story 1

- [x] T014 [US1] Create `app/components/flights/QuickEntryForm.tsx` with 7 input fields (Date, Aircraft, Registration, Role, Route, FlightTime, Tags)
- [x] T015 [US1] Create `app/components/flights/CalculatedBuckets.tsx` - read-only chips displaying calculated time buckets
- [x] T016 [US1] Create `app/api/flights/route.ts` - POST handler for creating single flight using insertFlight() and calculateBuckets()
- [x] T017 [US1] Add form state management in QuickEntryForm.tsx with useState hooks for all 7 fields
- [x] T018 [US1] Wire CalculatedBuckets to display real-time calculation preview as user fills form
- [x] T019 [US1] Add form submission handler that calls POST /api/flights and shows success/error feedback
- [x] T020 [US1] Update `app/overview/page.tsx` - add "Add Flight" button that opens QuickEntryForm in a modal
- [x] T021 [US1] Create modal wrapper component for QuickEntryForm with close button and backdrop

**Checkpoint**: User Story 1 complete - pilots can add individual flights via the Overview page

---

## Phase 4: User Story 2 - Smart Defaults from Flight History (Priority: P1)

**Goal**: Form pre-fills intelligent defaults from previous flights to speed up entry

**Independent Test**: Add 2+ flights with same aircraft, open form for 3rd - verify aircraft and registration pre-filled

### Implementation for User Story 2

- [x] T022 [US2] Create `app/api/flights/defaults/route.ts` - GET handler returning FlightDefaultsResponse
- [x] T023 [US2] Create `lib/flights/defaults.ts` with getSmartDefaults() logic (last flight, route prefix, autocomplete data)
- [x] T024 [US2] Create `app/components/flights/AircraftAutocomplete.tsx` - combobox with suggestions from flight history
- [x] T025 [US2] Create RegistrationAutocomplete component filtered by selected aircraft type
- [x] T026 [US2] Integrate defaults API call in QuickEntryForm.tsx on component mount
- [x] T027 [US2] Pre-fill form fields with defaults (date=today, aircraft=last, registration=last, routePrefix=lastArrival-)
- [x] T028 [US2] Add inferRoleFromFlight() helper to infer last role from bucket values

**Checkpoint**: User Story 2 complete - smart defaults reduce keystrokes for repeat aircraft types

---

## Phase 5: User Story 3 - First-Time User Setup (Priority: P2)

**Goal**: New users without flights complete one-time profile setup before adding first flight

**Independent Test**: New user with empty DB clicks "Add Flight" - sees setup modal, completes it, can then add flights with profile data

### Implementation for User Story 3

- [x] T029 [US3] Create `app/api/profile/route.ts` - POST handler for saving pilotName, homeBase, defaultInstructor
- [x] T030 [US3] Create `app/components/flights/PilotProfileSetup.tsx` - modal form for one-time setup
- [x] T031 [US3] Add profile existence check in QuickEntryForm.tsx - show PilotProfileSetup if missing
- [x] T032 [US3] Update defaults.ts to return hasProfile boolean in FlightDefaultsResponse
- [x] T033 [US3] Pre-fill PIC field with pilotName when role = PIC or Instructor
- [x] T034 [US3] Use homeBase as default route prefix when no previous flights exist

**Checkpoint**: User Story 3 complete - new users can onboard and start adding flights

---

## Phase 6: User Story 4 - Time Bucket Calculation Engine (Priority: P2)

**Goal**: Real-time calculation preview shows accurate TCCA-compliant time bucket allocations

**Independent Test**: Enter Role=Student, Aircraft=C172, Time=1.2 - verify SE Day Dual = 1.2, Dual Received = 1.2

### Implementation for User Story 4

- [x] T035 [US4] Create `app/api/flights/calculate/route.ts` - POST handler for calculation preview without saving
- [x] T036 [US4] Add real-time calculation call in QuickEntryForm.tsx on field change (debounced)
- [x] T037 [US4] Add validation display showing warnings (e.g., "XC time duplicated", "Future date")
- [x] T038 [US4] Add all calculation test cases from quickstart.md as manual verification checklist
- [x] T039 [US4] Handle IFR tag → actualImc allocation in calculation-engine.ts
- [x] T040 [US4] Handle Circuits tag → dayTakeoffsLandings = 4 default

**Checkpoint**: User Story 4 complete - calculation engine handles all standard flight types correctly

---

## Phase 7: User Story 5 - Edit Existing Flight (Priority: P3)

**Goal**: Pilots can correct errors in previously logged flights

**Independent Test**: Save a flight, click Edit, change role from PIC to Student - verify buckets recalculate and update saves

### Implementation for User Story 5

- [x] T041 [US5] Create `app/api/flights/[id]/route.ts` - PUT handler for updating existing flight
- [x] T042 [US5] Add DELETE handler to `app/api/flights/[id]/route.ts` for removing flights
- [x] T043 [US5] Add edit mode to QuickEntryForm.tsx - accept optional flightId prop to load existing data
- [x] T044 [US5] Create flight list display on Overview page showing recent flights
- [x] T045 [US5] Add Edit button to each flight row that opens QuickEntryForm with flightId
- [x] T046 [US5] Update form submission to call PUT when editing, POST when creating

**Checkpoint**: User Story 5 complete - pilots can correct flight data

---

## Phase 8: User Story 6 - Advanced Mode for Edge Cases (Priority: P3)

**Goal**: Power users can manually override calculated buckets for unusual flights

**Independent Test**: Toggle Advanced, manually change SE Day PIC from 1.5 to 1.0 and SE Night PIC to 0.5 - verify overrides save

### Implementation for User Story 6

- [x] T047 [US6] Add "Advanced" toggle button to QuickEntryForm.tsx
- [x] T048 [US6] Create `app/components/flights/AdvancedBucketEditor.tsx` - editable inputs for all 24 time buckets
- [x] T049 [US6] Add overrides parameter to calculateBuckets() that preserves manual values
- [x] T050 [US6] Add validation warning when sum(overrides) ≠ flightTime (allow save with warning)
- [x] T051 [US6] Store hasManualOverride flag to prevent recalculation on edit

**Checkpoint**: User Story 6 complete - edge cases handled via advanced mode

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: UX improvements, error handling, documentation

- [x] T052 [P] Add loading states to all API calls (spinner on buttons, form disabled while saving)
- [x] T053 [P] Add toast notifications for success/error feedback using existing UI patterns
- [x] T054 [P] Make QuickEntryForm mobile-responsive (stacked layout on small screens)
- [x] T055 [P] Add keyboard navigation support (Tab order, Enter to submit)
- [x] T056 [P] Add form validation error messages below invalid fields
- [x] T057 Update Overview page to show flight count and recent flights summary
- [x] T058 Run quickstart.md validation checklist to verify all calculation test cases pass

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) ──────────────────┐
                                  │
Phase 2 (Foundational) ───────────┤ ← BLOCKS ALL USER STORIES
                                  │
       ┌──────────────────────────┴──────────────────────────┐
       │                                                      │
       ▼                                                      ▼
Phase 3 (US1: P1)                                    Phase 4 (US2: P1)
Add Flight MVP                                       Smart Defaults
       │                                                      │
       └──────────────────────────┬──────────────────────────┘
                                  │
       ┌──────────────────────────┼──────────────────────────┐
       │                          │                          │
       ▼                          ▼                          ▼
Phase 5 (US3: P2)          Phase 6 (US4: P2)          Phase 7 (US5: P3)
First-Time Setup           Calculation Engine          Edit Flight
       │                          │                          │
       └──────────────────────────┼──────────────────────────┘
                                  │
                                  ▼
                          Phase 8 (US6: P3)
                          Advanced Mode
                                  │
                                  ▼
                          Phase 9 (Polish)
```

### User Story Dependencies

| Story | Can Start After | Notes |
|-------|-----------------|-------|
| US1 (P1) | Phase 2 | MVP - no dependencies on other stories |
| US2 (P1) | Phase 2 | Enhances US1 form, can develop in parallel |
| US3 (P2) | Phase 2 | Independent - handles empty DB case |
| US4 (P2) | Phase 2 | Calculation logic already in Phase 2, this adds preview |
| US5 (P3) | US1 | Needs flights to exist before editing |
| US6 (P3) | US4 | Needs calculation engine with override support |

### Parallel Opportunities

**Within Phase 2 (Foundational)**:
```bash
# Run in parallel:
T008 insertFlight() query
T009 updateFlight() query
T010 getFlightDefaults() query
T011 savePilotProfile() query
```

**After Phase 2 Completes**:
```bash
# US1 and US2 can proceed in parallel:
Developer A: Phase 3 (US1 - QuickEntryForm, API route)
Developer B: Phase 4 (US2 - Defaults API, Autocomplete)
```

**Within Phase 9 (Polish)**:
```bash
# All polish tasks can run in parallel:
T052, T053, T054, T055, T056
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T013) **← CRITICAL**
3. Complete Phase 3: User Story 1 (T014-T021)
4. **STOP and VALIDATE**: Test via Overview page - add 3 flights manually
5. Deploy if ready - pilots can now add individual flights!

### Recommended Incremental Delivery

| Milestone | Phases | Deliverable |
|-----------|--------|-------------|
| **MVP** | 1, 2, 3 | Add single flight with 7 fields |
| **v1.1** | + 4 | Smart defaults from history |
| **v1.2** | + 5, 6 | Profile setup + calculation preview |
| **v1.3** | + 7 | Edit existing flights |
| **v1.4** | + 8 | Advanced mode for edge cases |
| **v1.5** | + 9 | Polish and mobile support |

---

## Summary

| Metric | Value |
|--------|-------|
| **Total Tasks** | 58 |
| **Phase 1 (Setup)** | 5 tasks |
| **Phase 2 (Foundational)** | 8 tasks |
| **Phase 3 (US1: P1)** | 8 tasks |
| **Phase 4 (US2: P1)** | 7 tasks |
| **Phase 5 (US3: P2)** | 6 tasks |
| **Phase 6 (US4: P2)** | 6 tasks |
| **Phase 7 (US5: P3)** | 6 tasks |
| **Phase 8 (US6: P3)** | 5 tasks |
| **Phase 9 (Polish)** | 7 tasks |
| **Parallel Opportunities** | 15+ tasks marked [P] |
| **MVP Scope** | 21 tasks (Phases 1-3) |

---

## Notes

- All paths are relative to repository root
- [P] tasks can run in parallel within their phase
- [USn] label maps task to user story for traceability
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Run quickstart.md test cases after each user story completion
