/**
 * Database queries for onboarding settings
 * Follows db-design-guidelines.md with audit trail logging
 */
import { eq, desc } from "drizzle-orm";
import { db } from "./index";
import {
  userSettings,
  userSettingsLog,
  onboardingProgress,
  personalizationSettings,
  type UserSettings,
  type OnboardingProgress,
  type PersonalizationSettings,
} from "./schema";

/**
 * Get current user settings (latest version)
 */
export async function getUserSettings(
  userId: string = "default"
): Promise<UserSettings | null> {
  const result = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .orderBy(desc(userSettings.version))
    .limit(1);

  return result[0] || null;
}

/**
 * Save user settings with version tracking and audit log
 */
export async function saveUserSettings(
  settings: {
    authority: string;
    authorityName: string;
    decimalFormat: boolean;
    timezone: string;
  },
  userId: string = "default"
): Promise<UserSettings> {
  const existing = await getUserSettings(userId);
  const now = new Date();

  if (existing) {
    // Log changes
    const changes: Array<{ field: string; oldVal: string; newVal: string }> = [];
    
    if (existing.authority !== settings.authority) {
      changes.push({
        field: "authority",
        oldVal: existing.authority,
        newVal: settings.authority,
      });
    }
    if (existing.authorityName !== settings.authorityName) {
      changes.push({
        field: "authority_name",
        oldVal: existing.authorityName,
        newVal: settings.authorityName,
      });
    }
    if (existing.decimalFormat !== settings.decimalFormat) {
      changes.push({
        field: "decimal_format",
        oldVal: String(existing.decimalFormat),
        newVal: String(settings.decimalFormat),
      });
    }
    if (existing.timezone !== settings.timezone) {
      changes.push({
        field: "timezone",
        oldVal: existing.timezone,
        newVal: settings.timezone,
      });
    }

    // Insert change logs
    if (changes.length > 0) {
      await db.insert(userSettingsLog).values(
        changes.map((c) => ({
          userId,
          fieldName: c.field,
          oldValue: c.oldVal,
          newValue: c.newVal,
          changedAt: now,
          changeReason: "onboarding_update",
        }))
      );
    }

    // Insert new version
    const newVersion = existing.version + 1;
    const [inserted] = await db
      .insert(userSettings)
      .values({
        userId,
        authority: settings.authority,
        authorityName: settings.authorityName,
        decimalFormat: settings.decimalFormat,
        timezone: settings.timezone,
        createdAt: now,
        updatedAt: now,
        version: newVersion,
      })
      .returning();

    return inserted;
  } else {
    // First time - insert initial record
    const [inserted] = await db
      .insert(userSettings)
      .values({
        userId,
        authority: settings.authority,
        authorityName: settings.authorityName,
        decimalFormat: settings.decimalFormat,
        timezone: settings.timezone,
        createdAt: now,
        updatedAt: now,
        version: 1,
      })
      .returning();

    return inserted;
  }
}

/**
 * Get onboarding progress
 */
export async function getOnboardingProgress(
  userId: string = "default"
): Promise<OnboardingProgress | null> {
  const result = await db
    .select()
    .from(onboardingProgress)
    .where(eq(onboardingProgress.userId, userId))
    .limit(1);

  return result[0] || null;
}

/**
 * Save onboarding progress (upsert)
 */
export async function saveOnboardingProgress(
  progress: {
    currentStep: number;
    totalSteps: number;
    isCompleted: boolean;
    completedAt?: Date;
  },
  userId: string = "default"
): Promise<OnboardingProgress> {
  const existing = await getOnboardingProgress(userId);

  if (existing) {
    const [updated] = await db
      .update(onboardingProgress)
      .set({
        currentStep: progress.currentStep,
        totalSteps: progress.totalSteps,
        isCompleted: progress.isCompleted,
        completedAt: progress.completedAt || null,
      })
      .where(eq(onboardingProgress.userId, userId))
      .returning();

    return updated;
  } else {
    const [inserted] = await db
      .insert(onboardingProgress)
      .values({
        userId,
        currentStep: progress.currentStep,
        totalSteps: progress.totalSteps,
        startedAt: new Date(),
        isCompleted: progress.isCompleted,
        completedAt: progress.completedAt || null,
      })
      .returning();

    return inserted;
  }
}

/**
 * Get personalization settings for a user
 */
export async function getPersonalizationSettings(
  userId: string = "default"
): Promise<PersonalizationSettings | null> {
  const result = await db
    .select()
    .from(personalizationSettings)
    .where(eq(personalizationSettings.userId, userId))
    .limit(1);

  return result[0] || null;
}

/**
 * Save personalization settings (upsert)
 */
export async function savePersonalizationSettings(
  settings: {
    language: string;
    languageName: string;
    primaryColor: string;
    appearance: string;
  },
  userId: string = "default"
): Promise<PersonalizationSettings> {
  const existing = await getPersonalizationSettings(userId);
  const now = new Date();

  if (existing) {
    const [updated] = await db
      .update(personalizationSettings)
      .set({
        language: settings.language,
        languageName: settings.languageName,
        primaryColor: settings.primaryColor,
        appearance: settings.appearance,
        updatedAt: now,
      })
      .where(eq(personalizationSettings.userId, userId))
      .returning();

    return updated;
  } else {
    const [inserted] = await db
      .insert(personalizationSettings)
      .values({
        userId,
        language: settings.language,
        languageName: settings.languageName,
        primaryColor: settings.primaryColor,
        appearance: settings.appearance,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return inserted;
  }
}
