# Digital Pilot Logbook Constitution

## Core Principles

### I. TCCA Compliance First
All outputs (PDF, calculations, time buckets) must strictly adhere to Transport Canada Civil Aviation (TCCA) logbook format and requirements. The regulatory format is non-negotiable - the application exists to produce TCCA-acceptable documentation that pilots can present to examiners.

### II. Lossless Import
Existing pilot data (869+ flights in Excel) must import without any data loss. Every column, time bucket, and entry must map correctly to the normalized database. Import errors must surface clearly with actionable messages. Pilots trust their logbooks with their careers.

### III. Calculation Accuracy
All 40+ TCCA time buckets must calculate correctly using established rules:
- Cross-country (XC) is a qualifier, not additive time
- Instrument time (IMC/hood) is a subset of flight time
- Instructor and dual received are mutually exclusive roles
- Day/night allocation must be precise
- Page totals and running totals must match to 0.01 hours

### IV. Fast Entry (20-30 Second Target)
New flight entries require only 6-7 core fields: Date, Aircraft, Registration, Role, Route, Flight Time, Tags. All other fields (40+ time buckets) are auto-calculated from these inputs. The engine handles allocation; pilots should not manually calculate bucket distributions.

### V. PDF Visual Fidelity
Generated PDF must visually match the physical TCCA logbook format:
- 18 rows per page
- Page totals at bottom
- Totals forwarded from previous pages
- Totals to date (cumulative)
- Same column structure as physical logbook

## Technical Constraints

### Data Integrity
- All time values stored as decimals (hours) with 0.1 precision
- ICAO airport codes validated
- Aircraft registry format validated (C-XXXX for Canada)
- Date validations (no future flights)
- All calculations reproducible and auditable

### Calculation Rules
- `FlightHours = Σ(all time buckets)` - must balance within 0.01 hours
- `XC_PIC ≤ Total_PIC` - cross-country is subset of total
- `IMC + Hood ≤ FlightHours` - instrument is subset of flight
- Simulator flights: SE/ME buckets = 0, only simulator bucket filled
- Aircraft category (SE/ME/SIM) determines which buckets are available

### User Experience
- Keyboard-first entry on desktop
- Mobile-friendly stacked layout
- Smart defaults from flight history
- Read-only chips show calculated values
- Advanced mode available for power users/edge cases

## Governance

This constitution defines the immutable constraints for the Digital Pilot Logbook system. All features, implementations, and decisions must comply with these principles.

**Version**: 1.0 | **Ratified**: 2026-02-03
