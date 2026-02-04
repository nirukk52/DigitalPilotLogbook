# Data Model: Quick Flight Entry

**Feature**: 002-quick-flight-entry  
**Date**: 2026-02-03

---

## Schema Changes

### 1. Extend `user_settings` Table

Add pilot profile fields to existing `user_settings` table:

```sql
-- Migration: Add pilot profile fields
ALTER TABLE user_settings ADD COLUMN pilot_name TEXT;
ALTER TABLE user_settings ADD COLUMN home_base TEXT;
ALTER TABLE user_settings ADD COLUMN default_instructor TEXT;
```

**Drizzle Schema Update** (`lib/db/schema.ts`):

```typescript
export const userSettings = pgTable("user_settings", {
  // ... existing fields ...
  
  // Pilot profile fields (NEW)
  pilotName: text("pilot_name"),
  homeBase: text("home_base"),
  defaultInstructor: text("default_instructor"),
});
```

**Field Descriptions**:

| Field | Type | Description |
|-------|------|-------------|
| `pilot_name` | TEXT | Pilot's full name for auto-fill in PIC field |
| `home_base` | TEXT | ICAO code of home airport (e.g., "CZBB") |
| `default_instructor` | TEXT | Name of instructor for Student role flights |

---

### 2. Existing `flights` Table (No Changes)

The existing `flights` table already supports all required fields:

```typescript
// Existing schema - NO CHANGES NEEDED
export const flights = pgTable("flights", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().default("default"),
  
  // Basic flight info (used in quick entry)
  flightDate: date("flight_date").notNull(),
  aircraftMakeModel: text("aircraft_make_model").notNull(),
  registration: text("registration").notNull(),
  pilotInCommand: text("pilot_in_command"),
  copilotOrStudent: text("copilot_or_student"),
  departureAirport: text("departure_airport"),
  arrivalAirport: text("arrival_airport"),
  remarks: text("remarks"),
  
  // All 24 time buckets (auto-calculated)
  seDayDual: real("se_day_dual"),
  seDayPic: real("se_day_pic"),
  // ... (all existing buckets) ...
  
  flightHours: real("flight_hours").notNull(),
  
  // Metadata
  importedAt: timestamp("imported_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

---

## New Types

### QuickEntryInput

User-provided input from the 7-field form:

```typescript
/**
 * Input from the quick entry form
 * These 7 fields are all the user provides
 */
export interface QuickEntryInput {
  // Required fields
  flightDate: Date;
  aircraftMakeModel: string;
  registration: string;
  role: FlightRole;
  flightTime: number;  // Decimal hours (e.g., 1.5)
  
  // Optional fields
  route?: string;      // Smart-parsed: "CZBB-CYCW-CZBB"
  tags?: FlightTag[];  // Multi-select chips
  remarks?: string;    // Free text
  
  // Advanced overrides (optional)
  overrides?: Partial<TimeBuckets>;
}

export type FlightRole = 'Student' | 'PIC' | 'Instructor' | 'Simulator';

export type FlightTag = 'XC' | 'Night' | 'IFR' | 'Circuits' | 'Checkride';
```

### CalculatedFlight

Output from calculation engine:

```typescript
/**
 * Fully calculated flight ready for database insert
 * Includes all 24+ TCCA time buckets
 */
export interface CalculatedFlight {
  // From input
  flightDate: Date;
  aircraftMakeModel: string;
  registration: string;
  pilotInCommand: string | null;
  copilotOrStudent: string | null;
  departureAirport: string | null;
  arrivalAirport: string | null;
  remarks: string | null;
  
  // Calculated buckets
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
  
  actualImc: number | null;
  hood: number | null;
  simulator: number | null;
  ifrApproaches: number | null;
  holding: number | null;
  
  asFlightInstructor: number | null;
  dualReceived: number | null;
  
  flightHours: number;
}
```

### FlightDefaults

Smart defaults returned by API:

```typescript
/**
 * Smart defaults for pre-filling the quick entry form
 */
export interface FlightDefaults {
  // From last flight
  aircraft: string | null;
  registration: string | null;
  routePrefix: string | null;  // Last arrival + "-"
  role: FlightRole | null;
  
  // From profile
  pilotName: string | null;
  homeBase: string | null;
  defaultInstructor: string | null;
  
  // Autocomplete data
  aircraftOptions: string[];
  registrationsByAircraft: Record<string, string[]>;
}
```

---

## New Queries

### 1. Insert Single Flight

```typescript
/**
 * Insert a single flight (not replace all)
 * Used by quick entry - adds to existing flights
 */
export async function insertFlight(
  flight: CalculatedFlight,
  userId: string = "default"
): Promise<Flight> {
  const now = new Date();
  
  const [inserted] = await db
    .insert(flights)
    .values({
      ...flight,
      userId,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  
  return inserted;
}
```

### 2. Update Existing Flight

```typescript
/**
 * Update an existing flight
 * Used when editing a previously saved flight
 */
export async function updateFlight(
  flightId: number,
  flight: CalculatedFlight,
  userId: string = "default"
): Promise<Flight> {
  const now = new Date();
  
  const [updated] = await db
    .update(flights)
    .set({
      ...flight,
      updatedAt: now,
    })
    .where(eq(flights.id, flightId))
    .returning();
  
  return updated;
}
```

### 3. Get Flight Defaults

```typescript
/**
 * Get smart defaults for quick entry form
 */
export async function getFlightDefaults(
  userId: string = "default"
): Promise<FlightDefaults> {
  // Get last flight
  const lastFlight = await db
    .select()
    .from(flights)
    .where(eq(flights.userId, userId))
    .orderBy(desc(flights.flightDate), desc(flights.createdAt))
    .limit(1);
  
  // Get all unique aircraft and registrations
  const allFlights = await db
    .select({
      aircraft: flights.aircraftMakeModel,
      registration: flights.registration,
    })
    .from(flights)
    .where(eq(flights.userId, userId));
  
  // Get profile settings
  const settings = await getUserSettings(userId);
  
  // Build autocomplete data
  const aircraftSet = new Set<string>();
  const registrationsByAircraft: Record<string, string[]> = {};
  
  for (const f of allFlights) {
    aircraftSet.add(f.aircraft);
    if (!registrationsByAircraft[f.aircraft]) {
      registrationsByAircraft[f.aircraft] = [];
    }
    if (!registrationsByAircraft[f.aircraft].includes(f.registration)) {
      registrationsByAircraft[f.aircraft].push(f.registration);
    }
  }
  
  return {
    aircraft: lastFlight[0]?.aircraftMakeModel ?? null,
    registration: lastFlight[0]?.registration ?? null,
    routePrefix: lastFlight[0]?.arrivalAirport 
      ? `${lastFlight[0].arrivalAirport}-` 
      : settings?.homeBase 
        ? `${settings.homeBase}-`
        : null,
    role: inferRoleFromFlight(lastFlight[0]) ?? null,
    pilotName: settings?.pilotName ?? null,
    homeBase: settings?.homeBase ?? null,
    defaultInstructor: settings?.defaultInstructor ?? null,
    aircraftOptions: Array.from(aircraftSet),
    registrationsByAircraft,
  };
}
```

### 4. Save Pilot Profile

```typescript
/**
 * Save pilot profile fields
 * Used during first-time setup
 */
export async function savePilotProfile(
  profile: {
    pilotName: string;
    homeBase: string;
    defaultInstructor?: string;
  },
  userId: string = "default"
): Promise<UserSettings> {
  const existing = await getUserSettings(userId);
  const now = new Date();
  
  if (existing) {
    // Update existing settings
    const [updated] = await db
      .update(userSettings)
      .set({
        pilotName: profile.pilotName,
        homeBase: profile.homeBase,
        defaultInstructor: profile.defaultInstructor ?? null,
        updatedAt: now,
      })
      .where(eq(userSettings.id, existing.id))
      .returning();
    
    return updated;
  } else {
    // Create with minimal required fields
    throw new Error("User settings must be created during onboarding first");
  }
}
```

---

## Entity Relationships

```
┌─────────────────┐     ┌─────────────────┐
│  user_settings  │     │     flights     │
├─────────────────┤     ├─────────────────┤
│ id              │     │ id              │
│ userId ─────────┼─────┤ userId          │
│ authority       │     │ flightDate      │
│ timezone        │     │ aircraftMakeModel│
│ pilotName (NEW) │     │ registration    │
│ homeBase (NEW)  │     │ ...24 buckets   │
│ defaultInstr(NEW)│    │ flightHours     │
└─────────────────┘     └─────────────────┘
        │
        │ 1:1
        ▼
┌─────────────────┐
│ onboarding_     │
│ progress        │
└─────────────────┘
```

---

## Migration Plan

1. **Add columns to user_settings** (Drizzle migration)
2. **Backfill pilotName** from existing flights via `determineLogbookOwner()`
3. **Backfill homeBase** from most common departure airport
4. **No data migration needed for flights table**

---

## Validation Rules

| Rule | Error Type | Message |
|------|------------|---------|
| `flightTime > 0` | Error | "Flight time must be greater than 0" |
| `flightDate <= today + 7 days` | Warning | "Flight date is in the future" |
| `sum(buckets) ≈ flightHours` | Error | "Calculated time doesn't match flight time" |
| `XC ≤ PIC + Dual` | Error | "Cross-country time exceeds total time" |
| `aircraftMakeModel required` | Error | "Aircraft is required" |
| `registration required` | Error | "Registration is required" |
