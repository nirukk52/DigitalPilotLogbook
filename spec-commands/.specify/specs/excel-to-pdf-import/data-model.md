# Data Model: Excel to PDF Import

**Feature**: Excel to PDF Import  
**Date**: 2026-02-03

---

## Entities

### 1. Flight

The core entity representing a single flight log entry. Maps directly to TCCA logbook row format.

```typescript
/**
 * Flight entity - represents a single flight log entry
 * Maps all 35+ TCCA time bucket columns for complete logbook fidelity
 */
interface Flight {
  // Identifiers
  id: string;                          // UUID
  userId: string;                      // Owner (default: "default" for MVP)
  
  // Basic flight info
  date: Date;                          // Flight date
  aircraftMakeModel: string;           // e.g., "C172"
  registration: string;                // e.g., "C-GHFH"
  pilotInCommand: string | null;       // PIC name
  copilotOrStudent: string | null;     // Co-pilot/student name
  departureAirport: string | null;     // ICAO code (e.g., "CZBB")
  arrivalAirport: string | null;       // ICAO code (e.g., "CYCW")
  remarks: string | null;              // Free text remarks
  
  // Single-engine time (decimal hours)
  seDayDual: number | null;
  seDayPic: number | null;
  seDayCopilot: number | null;
  seNightDual: number | null;
  seNightPic: number | null;
  seNightCopilot: number | null;
  
  // Multi-engine time (decimal hours)
  meDayDual: number | null;
  meDayPic: number | null;
  meDayCopilot: number | null;
  meNightDual: number | null;
  meNightPic: number | null;
  meNightCopilot: number | null;
  
  // Cross-country time (decimal hours, subset of SE/ME)
  xcDayDual: number | null;
  xcDayPic: number | null;
  xcDayCopilot: number | null;
  xcNightDual: number | null;
  xcNightPic: number | null;
  xcNightCopilot: number | null;
  
  // Takeoffs/Landings (integer counts)
  dayTakeoffsLandings: number | null;
  nightTakeoffsLandings: number | null;
  
  // Instrument time (decimal hours)
  actualImc: number | null;            // Actual IMC
  hood: number | null;                 // Simulated instrument (hood)
  simulator: number | null;            // FTD/sim time
  ifrApproaches: number | null;        // Count
  holding: number | null;              // Count
  
  // Instructor/Dual (decimal hours)
  asFlightInstructor: number | null;   // Hours as CFI
  dualReceived: number | null;         // Hours receiving instruction
  
  // Duty time (optional)
  timeOn: string | null;               // HH:MM format
  timeOff: string | null;              // HH:MM format
  totalDuty: number | null;            // Decimal hours
  
  // Computed fields
  flightHours: number;                 // Sum of all time buckets
  
  // Metadata
  importedAt: Date | null;             // When imported from Excel
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. ImportJob (Transient)

Tracks the state of an import session. Not persisted to database in MVP - held in React state.

```typescript
/**
 * ImportJob - tracks upload session state
 * Transient: lives in React state, not persisted
 */
interface ImportJob {
  id: string;                          // Session UUID
  status: 'uploading' | 'parsing' | 'validating' | 'ready' | 'error';
  fileName: string;
  fileSize: number;
  
  // Parse results
  flights: ParsedFlight[];             // Parsed flight data
  totalRows: number;
  
  // Validation results
  validation: ValidationResult;
  
  // Timestamps
  startedAt: Date;
  completedAt: Date | null;
}

interface ValidationResult {
  isValid: boolean;
  successCount: number;
  warningCount: number;
  errorCount: number;
  issues: ValidationIssue[];
}

interface ValidationIssue {
  rowNumber: number;                   // Excel row (1-indexed)
  field: string;                       // Field name with issue
  severity: 'error' | 'warning';
  message: string;
  actualValue: unknown;
  expectedValue?: unknown;
}
```

### 3. PDFExportJob (Transient)

Tracks PDF generation progress. Transient - held in React state.

```typescript
/**
 * PDFExportJob - tracks PDF generation state
 * Transient: lives in React state
 */
interface PDFExportJob {
  id: string;
  status: 'pending' | 'generating' | 'complete' | 'error';
  
  // Progress tracking
  totalPages: number;
  currentPage: number;
  progressPercent: number;
  
  // Result
  downloadUrl: string | null;          // Blob URL for download
  fileName: string;
  
  // Error handling
  error: string | null;
}
```

---

## Drizzle Schema Addition

Add to `lib/db/schema.ts`:

```typescript
/**
 * Flights table - stores individual flight log entries
 * Core entity for pilot logbook with all TCCA time bucket columns
 */
export const flights = pgTable("flights", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().default("default"),
  
  // Basic flight info
  date: timestamp("date").notNull(),
  aircraftMakeModel: text("aircraft_make_model").notNull(),
  registration: text("registration").notNull(),
  pilotInCommand: text("pilot_in_command"),
  copilotOrStudent: text("copilot_or_student"),
  departureAirport: text("departure_airport"),
  arrivalAirport: text("arrival_airport"),
  remarks: text("remarks"),
  
  // Single-engine time (stored as decimal hours)
  seDayDual: real("se_day_dual"),
  seDayPic: real("se_day_pic"),
  seDayCopilot: real("se_day_copilot"),
  seNightDual: real("se_night_dual"),
  seNightPic: real("se_night_pic"),
  seNightCopilot: real("se_night_copilot"),
  
  // Multi-engine time
  meDayDual: real("me_day_dual"),
  meDayPic: real("me_day_pic"),
  meDayCopilot: real("me_day_copilot"),
  meNightDual: real("me_night_dual"),
  meNightPic: real("me_night_pic"),
  meNightCopilot: real("me_night_copilot"),
  
  // Cross-country time
  xcDayDual: real("xc_day_dual"),
  xcDayPic: real("xc_day_pic"),
  xcDayCopilot: real("xc_day_copilot"),
  xcNightDual: real("xc_night_dual"),
  xcNightPic: real("xc_night_pic"),
  xcNightCopilot: real("xc_night_copilot"),
  
  // Takeoffs/Landings (integer counts)
  dayTakeoffsLandings: integer("day_takeoffs_landings"),
  nightTakeoffsLandings: integer("night_takeoffs_landings"),
  
  // Instrument time
  actualImc: real("actual_imc"),
  hood: real("hood"),
  simulator: real("simulator"),
  ifrApproaches: integer("ifr_approaches"),
  holding: integer("holding"),
  
  // Instructor/Dual
  asFlightInstructor: real("as_flight_instructor"),
  dualReceived: real("dual_received"),
  
  // Duty time
  timeOn: text("time_on"),
  timeOff: text("time_off"),
  totalDuty: real("total_duty"),
  
  // Computed
  flightHours: real("flight_hours").notNull(),
  
  // Metadata
  importedAt: timestamp("imported_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Type exports
export type Flight = typeof flights.$inferSelect;
export type NewFlight = typeof flights.$inferInsert;
```

---

## Column Mapping (Excel → Database)

| Excel Column Index | Excel Header | Database Field |
|-------------------|--------------|----------------|
| 0 | DATE | date |
| 1 | MAKE / MODEL | aircraftMakeModel |
| 2 | REGISTRATION | registration |
| 3 | PILOT IN COMMAND | pilotInCommand |
| 4 | CO-PILOT, STUDENT OR PASSENGER | copilotOrStudent |
| 5 | FROM | departureAirport |
| 6 | TO | arrivalAirport |
| 7 | REMARKS | remarks |
| 8 | SE DAY DUAL | seDayDual |
| 9 | SE DAY PIC | seDayPic |
| 10 | SE DAY CO-PILOT | seDayCopilot |
| 11 | SE NIGHT DUAL | seNightDual |
| 12 | SE NIGHT PIC | seNightPic |
| 13 | SE NIGHT CO-PILOT | seNightCopilot |
| 14 | ME DAY DUAL | meDayDual |
| 15 | ME DAY PIC | meDayPic |
| 16 | ME DAY CO-PILOT | meDayCopilot |
| 17 | ME NIGHT DUAL | meNightDual |
| 18 | ME NIGHT PIC | meNightPic |
| 19 | ME NIGHT CO-PILOT | meNightCopilot |
| 20 | XC DAY DUAL | xcDayDual |
| 21 | XC DAY PIC | xcDayPic |
| 22 | XC DAY CO-PILOT | xcDayCopilot |
| 23 | XC NIGHT DUAL | xcNightDual |
| 24 | XC NIGHT PIC | xcNightPic |
| 25 | XC NIGHT CO-PILOT | xcNightCopilot |
| 26 | DAY T/O | dayTakeoffsLandings |
| 27 | NIGHT T/O | nightTakeoffsLandings |
| 28 | ACTUAL IMC | actualImc |
| 29 | HOOD | hood |
| 30 | SIMULATOR | simulator |
| 31 | IFR APPROACHES | ifrApproaches |
| 32 | HOLDING | holding |
| 33 | AS FLIGHT INSTRUCTOR | asFlightInstructor |
| 34 | DUAL RECEIVED | dualReceived |

---

## Validation Rules

### Per-Flight Validation

```typescript
const validationRules: ValidationRule[] = [
  {
    name: 'flightHoursMatch',
    severity: 'error',
    validate: (flight) => {
      const sum = sumTimeBuckets(flight);
      return Math.abs(flight.flightHours - sum) < 0.01;
    },
    message: 'Flight time does not match sum of time categories',
  },
  {
    name: 'xcSubsetOfTotal',
    severity: 'error',
    validate: (flight) => {
      const totalPic = (flight.seDayPic || 0) + (flight.seNightPic || 0) +
                       (flight.meDayPic || 0) + (flight.meNightPic || 0);
      const xcPic = (flight.xcDayPic || 0) + (flight.xcNightPic || 0);
      return xcPic <= totalPic + 0.01;
    },
    message: 'Cross-country PIC time exceeds total PIC time',
  },
  {
    name: 'instrumentSubset',
    severity: 'error',
    validate: (flight) => {
      if (flight.simulator && flight.simulator > 0) return true; // Sim-only flight
      const imcTime = (flight.actualImc || 0) + (flight.hood || 0);
      return imcTime <= flight.flightHours + 0.01;
    },
    message: 'Instrument time exceeds flight time',
  },
  {
    name: 'dateNotFuture',
    severity: 'warning',
    validate: (flight) => flight.date <= new Date(),
    message: 'Flight dated in the future',
  },
];
```

---

## State Transitions

### ImportJob States

```
[uploading] → [parsing] → [validating] → [ready]
     ↓            ↓            ↓
  [error]     [error]      [error]
```

### PDFExportJob States

```
[pending] → [generating] → [complete]
     ↓            ↓
  [error]     [error]
```
