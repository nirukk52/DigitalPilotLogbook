/**
 * Database queries for onboarding settings
 * Follows db-design-guidelines.md with audit trail logging
 */
import { eq, desc, asc } from "drizzle-orm";
import { db } from "./index";
import {
  userSettings,
  userSettingsLog,
  onboardingProgress,
  personalizationSettings,
  licences,
  flights,
  type UserSettings,
  type OnboardingProgress,
  type PersonalizationSettings,
  type Licence,
  type NewLicence,
  type Flight,
  type NewFlight,
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

/**
 * Get all licences for a user
 */
export async function getLicences(
  userId: string = "default"
): Promise<Licence[]> {
  const result = await db
    .select()
    .from(licences)
    .where(eq(licences.userId, userId))
    .orderBy(desc(licences.createdAt));

  return result;
}

/**
 * Save a new licence
 */
export async function saveLicence(
  licence: Omit<NewLicence, "userId" | "createdAt" | "updatedAt">,
  userId: string = "default"
): Promise<Licence> {
  const now = new Date();

  const [inserted] = await db
    .insert(licences)
    .values({
      ...licence,
      userId,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return inserted;
}

/**
 * Update an existing licence
 * Only updates if licence belongs to the specified user
 */
export async function updateLicence(
  licenceId: number,
  updates: Partial<Omit<NewLicence, "userId" | "createdAt">>,
  userId: string = "default"
): Promise<Licence> {
  // Security: only update if licence belongs to user
  const existing = await db
    .select()
    .from(licences)
    .where(eq(licences.id, licenceId))
    .limit(1);
  
  if (!existing[0] || existing[0].userId !== userId) {
    throw new Error("Licence not found or access denied");
  }
  
  const now = new Date();

  const [updated] = await db
    .update(licences)
    .set({
      ...updates,
      updatedAt: now,
    })
    .where(eq(licences.id, licenceId))
    .returning();

  return updated;
}

/**
 * Delete a licence
 * Only deletes if licence belongs to the specified user
 */
export async function deleteLicence(
  licenceId: number,
  userId: string = "default"
): Promise<void> {
  // Security: only delete if licence belongs to user
  const licence = await db
    .select()
    .from(licences)
    .where(eq(licences.id, licenceId))
    .limit(1);
  
  if (!licence[0] || licence[0].userId !== userId) {
    throw new Error("Licence not found or access denied");
  }
  
  await db
    .delete(licences)
    .where(eq(licences.id, licenceId));
}

// ============================================================================
// Flight Queries
// ============================================================================

/**
 * Get all flights for a user, sorted by date ascending
 */
export async function getFlights(
  userId: string = "default"
): Promise<Flight[]> {
  const result = await db
    .select()
    .from(flights)
    .where(eq(flights.userId, userId))
    .orderBy(asc(flights.flightDate));

  return result;
}

/**
 * Get flight count for a user
 */
export async function getFlightCount(
  userId: string = "default"
): Promise<number> {
  const result = await db
    .select()
    .from(flights)
    .where(eq(flights.userId, userId));

  return result.length;
}

/**
 * Save flights for a user - replaces all existing flights
 * Uses delete + batched insert strategy for Neon serverless compatibility
 * Batches inserts to avoid "value too large to transmit" errors
 */
export async function saveFlights(
  flightData: Omit<NewFlight, "userId" | "createdAt" | "updatedAt" | "importedAt">[],
  userId: string = "default"
): Promise<{ inserted: number; deleted: number }> {
  const now = new Date();
  const BATCH_SIZE = 50; // Neon has limits on query size

  // Delete existing flights for this user
  const existingFlights = await getFlights(userId);
  const deletedCount = existingFlights.length;

  if (deletedCount > 0) {
    await db
      .delete(flights)
      .where(eq(flights.userId, userId));
  }

  // Insert new flights in batches
  if (flightData.length > 0) {
    const flightsToInsert = flightData.map((flight) => ({
      ...flight,
      userId,
      importedAt: now,
      createdAt: now,
      updatedAt: now,
    }));

    // Split into batches and insert sequentially
    for (let i = 0; i < flightsToInsert.length; i += BATCH_SIZE) {
      const batch = flightsToInsert.slice(i, i + BATCH_SIZE);
      await db.insert(flights).values(batch);
    }
  }

  return {
    inserted: flightData.length,
    deleted: deletedCount,
  };
}

/**
 * Delete all flights for a user
 */
export async function deleteAllFlights(
  userId: string = "default"
): Promise<number> {
  const existingFlights = await getFlights(userId);
  const deletedCount = existingFlights.length;

  if (deletedCount > 0) {
    await db
      .delete(flights)
      .where(eq(flights.userId, userId));
  }

  return deletedCount;
}

// ============================================================================
// Quick Flight Entry Queries (T008-T011)
// ============================================================================

/**
 * Insert a single flight (not replace all)
 * Used by quick entry - adds to existing flights
 */
export async function insertFlight(
  flightData: Omit<NewFlight, "userId" | "createdAt" | "updatedAt">,
  userId: string = "default"
): Promise<Flight> {
  const now = new Date();
  
  const [inserted] = await db
    .insert(flights)
    .values({
      ...flightData,
      userId,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  
  return inserted;
}

/**
 * Update an existing flight
 * Used when editing a previously saved flight
 * Only updates if flight belongs to the specified user
 */
export async function updateFlight(
  flightId: number,
  flightData: Partial<Omit<NewFlight, "userId" | "createdAt">>,
  userId: string = "default"
): Promise<Flight> {
  // Security: only update if flight belongs to user
  const existing = await getFlightById(flightId, userId);
  if (!existing) {
    throw new Error("Flight not found or access denied");
  }
  
  const now = new Date();
  
  const [updated] = await db
    .update(flights)
    .set({
      ...flightData,
      updatedAt: now,
    })
    .where(eq(flights.id, flightId))
    .returning();
  
  return updated;
}

/**
 * Get a single flight by ID
 * Only returns the flight if it belongs to the specified user
 */
export async function getFlightById(
  flightId: number,
  userId: string = "default"
): Promise<Flight | null> {
  const result = await db
    .select()
    .from(flights)
    .where(eq(flights.id, flightId))
    .limit(1);
  
  const flight = result[0] || null;
  
  // Security check: only return if flight belongs to user
  if (flight && flight.userId !== userId) {
    return null;
  }
  
  return flight;
}

/**
 * Delete a single flight by ID
 * Only deletes if flight belongs to the specified user
 */
export async function deleteFlight(
  flightId: number,
  userId: string = "default"
): Promise<void> {
  // Security: only delete if flight belongs to user
  const flight = await getFlightById(flightId, userId);
  if (!flight) {
    throw new Error("Flight not found or access denied");
  }
  
  await db
    .delete(flights)
    .where(eq(flights.id, flightId));
}

/**
 * Get the most recent flight for smart defaults
 */
export async function getLastFlight(
  userId: string = "default"
): Promise<Flight | null> {
  const result = await db
    .select()
    .from(flights)
    .where(eq(flights.userId, userId))
    .orderBy(desc(flights.flightDate), desc(flights.createdAt))
    .limit(1);
  
  return result[0] || null;
}

/**
 * Get unique aircraft and registrations for autocomplete
 */
export async function getFlightAutocompleteData(
  userId: string = "default"
): Promise<{
  aircraft: string[];
  registrationsByAircraft: Record<string, string[]>;
}> {
  const allFlights = await db
    .select({
      aircraft: flights.aircraftMakeModel,
      registration: flights.registration,
    })
    .from(flights)
    .where(eq(flights.userId, userId));
  
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
    aircraft: Array.from(aircraftSet),
    registrationsByAircraft,
  };
}

/**
 * Save pilot profile fields to user settings
 * Used during first-time setup for quick flight entry
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
    // Update existing settings with profile fields
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
    // Create minimal settings with profile - requires authority from onboarding
    throw new Error("User settings must be created during onboarding before setting pilot profile");
  }
}

/**
 * Check if user has pilot profile set up
 */
export async function hasPilotProfile(
  userId: string = "default"
): Promise<boolean> {
  const settings = await getUserSettings(userId);
  return !!(settings?.pilotName && settings?.homeBase);
}
