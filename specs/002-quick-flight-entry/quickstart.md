# Quickstart: Quick Flight Entry

**Feature**: 002-quick-flight-entry  
**Date**: 2026-02-03

---

## Prerequisites

1. **Database**: Neon PostgreSQL with existing schema
2. **Environment**: `.env.local` with `DATABASE_URL`
3. **Node.js**: v18+ with pnpm

---

## Setup Steps

### 1. Pull Latest and Switch Branch

```bash
git checkout 002-quick-flight-entry
pnpm install
```

### 2. Run Database Migration

Add new columns to `user_settings`:

```bash
# Generate migration
pnpm db:generate

# Push to database
pnpm db:push
```

Or manually add columns:

```sql
ALTER TABLE user_settings ADD COLUMN pilot_name TEXT;
ALTER TABLE user_settings ADD COLUMN home_base TEXT;
ALTER TABLE user_settings ADD COLUMN default_instructor TEXT;
```

### 3. Start Development Server

```bash
pnpm dev
```

---

## File Structure to Create

```
lib/
├── flights/
│   ├── types.ts           # QuickEntryInput, CalculatedFlight types
│   ├── calculation-engine.ts  # Time bucket calculation logic
│   └── defaults.ts        # Smart default logic

app/
├── api/
│   └── flights/
│       ├── route.ts       # POST (create), GET (list)
│       ├── [id]/route.ts  # PUT (update), DELETE
│       ├── defaults/route.ts  # GET smart defaults
│       └── calculate/route.ts # POST preview calculation
├── components/
│   └── flights/
│       ├── QuickEntryForm.tsx
│       ├── CalculatedBuckets.tsx
│       └── AircraftAutocomplete.tsx
```

---

## Implementation Order

### Phase 1: Core Engine (No UI)

1. **Create types** (`lib/flights/types.ts`)
   - Copy from `specs/002-quick-flight-entry/contracts/api.ts`

2. **Create calculation engine** (`lib/flights/calculation-engine.ts`)
   ```typescript
   export function calculateBuckets(input: QuickEntryInput): TimeBuckets
   ```

3. **Add database queries** (`lib/db/queries.ts`)
   - `insertFlight()`
   - `updateFlight()`
   - `getFlightDefaults()`

4. **Create API routes**
   - `POST /api/flights` - Create flight
   - `GET /api/flights/defaults` - Get smart defaults

### Phase 2: UI Components

5. **Create QuickEntryForm** (`app/components/flights/QuickEntryForm.tsx`)
   - 7-field form with controlled inputs
   - Calls calculation API on change

6. **Create CalculatedBuckets** (`app/components/flights/CalculatedBuckets.tsx`)
   - Read-only chips showing calculated values

7. **Update Overview page**
   - Add "Add Flight" button
   - Open modal with QuickEntryForm

### Phase 3: Polish

8. **Add autocomplete** for aircraft and registration
9. **Add edit mode** for existing flights
10. **Add advanced mode** toggle

---

## Testing Checklist

### Calculation Engine Tests

| Input | Expected Output |
|-------|-----------------|
| Role=PIC, Aircraft=C172, Time=1.5, Tags=[] | seDayPic=1.5, flightHours=1.5 |
| Role=Student, Aircraft=C172, Time=1.2, Tags=[] | seDayDual=1.2, dualReceived=1.2 |
| Role=PIC, Aircraft=C172, Time=1.0, Tags=[Night] | seNightPic=1.0 |
| Role=PIC, Aircraft=PA44, Time=2.0, Tags=[XC] | meDayPic=2.0, xcDayPic=2.0 |
| Role=Simulator, Aircraft=Redbird, Time=0.5, Tags=[] | simulator=0.5, SE/ME=0 |
| Role=Instructor, Aircraft=C172, Time=1.5, Tags=[] | seDayPic=1.5, asFlightInstructor=1.5 |

### API Tests

```bash
# Get defaults
curl http://localhost:3000/api/flights/defaults

# Create flight
curl -X POST http://localhost:3000/api/flights \
  -H "Content-Type: application/json" \
  -d '{
    "flightDate": "2026-02-03",
    "aircraftMakeModel": "C172",
    "registration": "C-GHFH",
    "role": "PIC",
    "flightTime": 1.5,
    "route": "CZBB-CYCW",
    "tags": ["XC"]
  }'
```

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `specs/002-quick-flight-entry/spec.md` | Feature requirements |
| `specs/002-quick-flight-entry/research.md` | Calculation rules |
| `specs/002-quick-flight-entry/data-model.md` | Schema changes |
| `specs/002-quick-flight-entry/contracts/api.ts` | API type definitions |
| `knowledge-base/01-calculation-mapping-spec.md` | TCCA rules reference |
| `lib/db/schema.ts` | Existing database schema |

---

## Common Issues

### "FlightHours doesn't match bucket sum"

The calculation engine must ensure `sum(buckets) = flightTime`. Check:
- Role is correctly determining primary bucket
- XC is not being added (it's a qualifier)
- Simulator flights have SE/ME = 0

### "Aircraft type not detected"

Add pattern to `calculation-engine.ts`:
```typescript
const MULTI_ENGINE_PATTERNS = ['PA44', 'BE76', ...];
const SIMULATOR_PATTERNS = ['Redbird', 'ALSIM', ...];
```

### "Profile not found"

User must complete onboarding first. Check `user_settings` table has entry for user.
