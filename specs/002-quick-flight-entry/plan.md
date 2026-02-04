# Implementation Plan: Quick Flight Entry

**Branch**: `002-quick-flight-entry` | **Date**: 2026-02-03 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/002-quick-flight-entry/spec.md`

---

## Summary

Implement a quick flight entry system that allows pilots to add individual flights in under 30 seconds using only 6-7 input fields. The system auto-calculates all 24+ TCCA time bucket fields based on role, tags, and aircraft type. Supports smart defaults from flight history and one-time profile settings.

---

## Technical Context

**Language/Version**: TypeScript 5.x  
**Primary Dependencies**: Next.js 16.1.6, React 19, Drizzle ORM 0.45.1, Tailwind CSS 4  
**Storage**: PostgreSQL via Neon serverless  
**Testing**: Manual testing (no test framework currently configured)  
**Target Platform**: Web (Vercel serverless)  
**Project Type**: Web application (Next.js App Router)  
**Performance Goals**: Form load <1s, calculation <100ms, autocomplete <200ms  
**Constraints**: Neon query size limits (batch 50 records), serverless cold starts  
**Scale/Scope**: Single user per instance, 1000+ flights supported

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. TCCA Compliance First** | ✅ Pass | All 24 time buckets calculated per TCCA rules |
| **II. Lossless Import** | ✅ Pass | Feature adds flights, doesn't modify import |
| **III. Calculation Accuracy** | ✅ Pass | XC as qualifier, IMC as subset, roles exclusive |
| **IV. Fast Entry (20-30s)** | ✅ Pass | Core feature - 6-7 fields with auto-calculation |
| **V. PDF Visual Fidelity** | N/A | Not affected by this feature |

**Technical Constraints Check**:
- ✅ Time values as decimals with 0.1 precision
- ✅ FlightHours = Σ(buckets) validation
- ✅ Keyboard-first entry design
- ✅ Smart defaults from history

---

## Project Structure

### Documentation (this feature)

```text
specs/002-quick-flight-entry/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api.ts           # API type definitions
└── checklists/
    └── requirements.md  # Spec validation checklist
```

### Source Code (repository root)

```text
app/
├── api/
│   └── flights/
│       ├── import/route.ts    # Existing - bulk import
│       ├── route.ts           # NEW - single flight CRUD
│       └── defaults/route.ts  # NEW - smart defaults
├── overview/
│   └── page.tsx               # MODIFY - add "Add Flight" button
└── components/                # NEW folder
    └── flights/
        ├── QuickEntryForm.tsx # NEW - 7-field form
        ├── CalculatedBuckets.tsx # NEW - read-only chips
        └── AircraftAutocomplete.tsx # NEW - smart autocomplete

lib/
├── db/
│   ├── schema.ts              # MODIFY - add pilotProfile, aircraftTypes
│   └── queries.ts             # MODIFY - add flight insert, defaults
├── flights/                   # NEW folder
│   ├── calculation-engine.ts  # NEW - time bucket calculator
│   ├── types.ts               # NEW - QuickEntryInput, CalculatedFlight
│   └── defaults.ts            # NEW - smart default logic
└── import/
    └── types.ts               # EXISTING - ParsedFlight type
```

**Structure Decision**: Follows existing Next.js App Router structure. New flight-specific logic goes in `lib/flights/`. UI components go in `app/components/flights/`.

---

## Implementation Phases

### Phase 1: Data Model & API Contracts

**Deliverables**:
- `data-model.md` - Schema changes for pilotProfile, aircraftTypes
- `contracts/api.ts` - TypeScript types for API endpoints
- `quickstart.md` - Developer setup guide

**Schema Changes**:
1. Add `pilotProfile` table (or extend `userSettings` with pilotName, homeBase)
2. Add `aircraftTypes` lookup table (makeModel → engineType: SE/ME/SIM)
3. Add single-flight insert query (not replace)

**API Endpoints**:
- `GET /api/flights/defaults` - Returns smart defaults for new flight
- `POST /api/flights` - Creates single flight with calculated buckets
- `PUT /api/flights/[id]` - Updates existing flight
- `GET /api/flights/autocomplete?type=aircraft&q=C17` - Autocomplete suggestions

### Phase 2: Calculation Engine

**Deliverables**:
- `lib/flights/calculation-engine.ts` - Core bucket allocation logic

**Calculation Rules** (from constitution):
1. Role → Primary bucket allocation (PIC/Dual/Instructor/Sim)
2. Aircraft type → SE/ME/SIM routing
3. Night tag → Night buckets instead of day
4. XC tag → Duplicate to XC buckets (qualifier, not additive)
5. IFR tag → Actual IMC bucket
6. Circuits tag → Default T/O landings = 4

### Phase 3: UI Components

**Deliverables**:
- `QuickEntryForm.tsx` - 7-field form with smart defaults
- `CalculatedBuckets.tsx` - Read-only chips showing calculated values
- `AircraftAutocomplete.tsx` - Conditional autocomplete

**Form Fields**:
1. Date (date picker, default: today)
2. Aircraft (combobox with autocomplete)
3. Registration (combobox filtered by aircraft)
4. Role (select: Student/PIC/Instructor/Simulator)
5. Route (text with smart prefix)
6. Flight Time (number, decimal)
7. Tags (multi-select chips)

### Phase 4: Integration

**Deliverables**:
- Update Overview page with "Add Flight" trigger
- Connect form to API
- Wire up smart defaults
- Add edit mode for existing flights

---

## Complexity Tracking

> No Constitution violations requiring justification.

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Profile storage | Extend `userSettings` | Avoid new table for 2 fields |
| Aircraft lookup | Inline logic + optional table | Start simple, add table if needed |
| Form location | Modal on Overview | Matches existing UX patterns |

---

## Dependencies

**Existing**:
- Drizzle ORM (schema, queries)
- Neon serverless (database)
- React (UI components)
- Next.js App Router (API routes)

**No New Dependencies Required**

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Calculation errors | Medium | High | Extensive test cases from spec |
| Neon query limits | Low | Medium | Single-row inserts (not batch) |
| Cold start delays | Low | Low | Serverless is acceptable for form load |

---

## Next Steps

1. Generate `research.md` with calculation rule details
2. Generate `data-model.md` with schema changes
3. Generate `contracts/api.ts` with type definitions
4. Generate `quickstart.md` with setup instructions
5. Run `/speckit.tasks` to break into implementable tasks
