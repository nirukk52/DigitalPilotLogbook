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

// Type exports for use in application code
export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;
export type OnboardingProgress = typeof onboardingProgress.$inferSelect;
export type NewOnboardingProgress = typeof onboardingProgress.$inferInsert;
export type PersonalizationSettings = typeof personalizationSettings.$inferSelect;
export type NewPersonalizationSettings = typeof personalizationSettings.$inferInsert;
