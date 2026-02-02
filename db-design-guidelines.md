DB design guidelines for a pilot logbook app (LogTen / FlyLog-style)
1) Start from compliance, then product

Make “Flight” the immutable source-of-truth: every edit creates a new version (or an event) so reports can be reproduced exactly for audits and applications.

Separate “what happened” from “how it’s counted”: store raw facts (times, landings, crew role) and compute totals/currency from rules so you can support different authorities and changing requirements.

2) Core entities (keep them boring and stable)

User

Aircraft (tail, type, category/class, engine type, gear, seats, capabilities like IFR)

Airport (ICAO/IATA, lat/lon, timezone)

Flight (one logical flight record)

If multi-leg: add FlightSegment (dep/arr, off/on, takeoff/landing, route)

CrewAssignment (who, role: PIC/SIC/Dual/Instructor, seat, signatures)

TimeBreakdown (per flight/segment: total, PIC, SIC, dual, instructor, night, actual/sim instrument, XC, turbine, etc.)

Approach / Landing / Hold / NVG / SimSession as separate child tables (counts matter for currency and reports)

Certificates & Expirations (medical, ratings, license docs, expiry dates)

Endorsements (text, signer, date, attachment of signature)

Rule: store durations as integer minutes (or seconds), never floats; store timestamps in UTC plus local timezone/offset for display.

3) Duty/rest and limits (LogTen-like “dynamic time loop”)

Model duty as first-class:

DutyPeriod (start/end, duty type: FDP/RAP/reserve/training/deadhead, operator)

RestPeriod (start/end, rest kind)

LimitRuleDefinition (authority + rule metadata) and LimitEvaluationResult (computed, per user, per time window)

This lets you support schedules + “will I bust a limit” projections tied to regulations like Part 117 and EASA FTL.

4) Imports (CSV/Excel, airline schedules, ADS-B) — design for mess

Use a 3-layer import pipeline:

ImportJob (source, time, mapping version)

ImportRawRow (raw payload stored verbatim)

ImportNormalization (field-level parse results + warnings) → links to created/updated Flight/Segment

Rule: never discard raw input; normalized data can change as parsers improve.

5) Reporting architecture (authority-ready exports, 8710/CV)

Generate reports from a snapshot view: a point-in-time “effective” version of each Flight + its children.

Keep a ReportTemplate concept (columns, grouping, filtering) and a SavedFilter (your “Smart Groups” equivalent) stored as a filter AST.

This gives you fast “one tap analytics” without baking logic into the schema.

6) Sync, backups, and conflict rules (multi-device)

Two solid approaches:

Relational + audit tables: Flight tables + FlightChangeLog (who/when/what changed) and optimistic concurrency (row version).

Event-sourced ledger: append-only events (CreateFlight, UpdateTime, AddApproach) + derived read models for queries.

Pick relational if you want simplicity; pick event sourcing if offline-first + conflict-free merges are priority.

7) Indexing rules that matter

Index: (user_id, flight_date), (user_id, aircraft_id, flight_date), (user_id, airport_id, flight_date)

Precompute: rolling totals (7/28/90/365 days), landings recency, instrument approaches, night, PIC/SIC buckets.

8) Multi-authority support (don’t hardcode one worldview)

Add AuthorityProfile (FAA/EASA/etc.) and tie rule sets + report templates to it.

Keep definitions aligned with primary sources for logging and duty/rest regimes.
(Federal Aviation Administration, European Union Aviation Safety Agency, International Civil Aviation Organization)