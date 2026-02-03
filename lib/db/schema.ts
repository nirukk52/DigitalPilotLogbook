/**
 * Database schema following db-design-guidelines.md
 * Core entities for pilot logbook with audit trail support
 */
import {
  pgTable,
  serial,
  text,
  boolean,
  integer,
  timestamp,
  real,
  date,
} from "drizzle-orm/pg-core";

/**
 * User settings table - stores onboarding and preference data
 * Follows guideline: separate "what happened" from "how it's counted"
 * Settings are versioned for audit compliance
 */
export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().default("default"),
  authority: text("authority").notNull(),
  authorityName: text("authority_name").notNull(),
  decimalFormat: boolean("decimal_format").notNull().default(true),
  timezone: text("timezone").notNull().default("UTC"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  version: integer("version").notNull().default(1),
});

/**
 * Settings change log for audit trail
 * Follows guideline: FlightChangeLog pattern for tracking who/when/what changed
 */
export const userSettingsLog = pgTable("user_settings_log", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  fieldName: text("field_name").notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  changedAt: timestamp("changed_at").notNull().defaultNow(),
  changeReason: text("change_reason"),
});

/**
 * Onboarding progress tracking
 * Tracks user's position in the multi-step onboarding flow
 */
export const onboardingProgress = pgTable("onboarding_progress", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().default("default").unique(),
  currentStep: integer("current_step").notNull().default(0),
  totalSteps: integer("total_steps").notNull().default(9),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  isCompleted: boolean("is_completed").notNull().default(false),
});

/**
 * Personalization settings table - stores user UI preferences
 * Language, color scheme, and appearance mode preferences
 */
export const personalizationSettings = pgTable("personalization_settings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().default("default").unique(),
  language: text("language").notNull().default("en-GB"),
  languageName: text("language_name").notNull().default("English (UK)"),
  primaryColor: text("primary_color").notNull().default("#9333ea"),
  appearance: text("appearance").notNull().default("dark"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Licences and ratings table - stores pilot certifications
 * Follows guideline: Certificates & Expirations pattern
 * Tracks validity, flight time limits, and recency requirements
 */
export const licences = pgTable("licences", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().default("default"),
  
  // Licence identification
  licenceType: text("licence_type").notNull(), // e.g., "CLASS_RATING", "FLIGHT_CREW_LICENCE", "MEDICAL", "RADIO"
  licenceCategory: text("licence_category").notNull(), // e.g., "SEP LAND", "PPL A", "CLASS 2"
  authority: text("authority").notNull(), // e.g., "EASA", "FAA", "ICAO"
  licenceNumber: text("licence_number"), // e.g., "D:FCL.PPL(A)112233"
  
  // Validity dates
  dateOfIssue: timestamp("date_of_issue"),
  validUntil: timestamp("valid_until"),
  
  // Requirements and restrictions
  totalHours: integer("total_hours"), // e.g., 1200 hours as 1200 minutes
  totalLandings: integer("total_landings"), // e.g., 12 landings
  picHours: integer("pic_hours"), // e.g., 600 hours as PIC (14:26 format)
  instructorHours: integer("instructor_hours"), // e.g., 100 hours with FI
  
  // Recency requirements
  recencyMonths: integer("recency_months"), // e.g., 12 months validity required
  recencyStartDate: timestamp("recency_start_date"), // e.g., last 12 months from Oct 2024
  recencyEndDate: timestamp("recency_end_date"), // e.g., to 31 Oct 2025
  
  // Status
  isActive: boolean("is_active").notNull().default(true),
  
  // Audit trail
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Flights table - stores individual flight log entries
 * Core entity for pilot logbook with all TCCA time bucket columns
 * Supports import from Excel and export to TCCA-compliant PDF
 */
export const flights = pgTable("flights", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().default("default"),
  
  // Basic flight info
  flightDate: date("flight_date").notNull(),
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
  
  // Cross-country time (subset of SE/ME)
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

// Type exports for use in application code
export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;
export type OnboardingProgress = typeof onboardingProgress.$inferSelect;
export type NewOnboardingProgress = typeof onboardingProgress.$inferInsert;
export type PersonalizationSettings = typeof personalizationSettings.$inferSelect;
export type NewPersonalizationSettings = typeof personalizationSettings.$inferInsert;
export type Licence = typeof licences.$inferSelect;
export type NewLicence = typeof licences.$inferInsert;
export type Flight = typeof flights.$inferSelect;
export type NewFlight = typeof flights.$inferInsert;
