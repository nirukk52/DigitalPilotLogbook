"use server";

/**
 * Server actions for onboarding flow
 * Handles database operations for user settings and progress
 */
import {
  getUserSettings,
  saveUserSettings,
  getPersonalizationSettings,
  savePersonalizationSettings,
  getOnboardingProgress,
  saveOnboardingProgress,
  getLicences,
  saveLicence,
  deleteLicence,
} from "@/lib/db/queries";
import type { Licence } from "@/lib/db/schema";

export interface OnboardingFormData {
  authority: string;
  authorityName: string;
  decimalFormat: boolean;
  timezone: string;
}

export interface PersonalizationFormData {
  language: string;
  languageName: string;
  primaryColor: string;
  appearance: string;
}

/**
 * Load saved onboarding data from database
 */
export async function loadOnboardingData(): Promise<{
  settings: OnboardingFormData | null;
  personalization: PersonalizationFormData | null;
  progress: { currentStep: number; isCompleted: boolean } | null;
}> {
  const [settings, personalization, progress] = await Promise.all([
    getUserSettings(),
    getPersonalizationSettings(),
    getOnboardingProgress(),
  ]);

  return {
    settings: settings
      ? {
          authority: settings.authority,
          authorityName: settings.authorityName,
          decimalFormat: settings.decimalFormat,
          timezone: settings.timezone,
        }
      : null,
    personalization: personalization
      ? {
          language: personalization.language,
          languageName: personalization.languageName,
          primaryColor: personalization.primaryColor,
          appearance: personalization.appearance,
        }
      : null,
    progress: progress
      ? {
          currentStep: progress.currentStep,
          isCompleted: progress.isCompleted,
        }
      : null,
  };
}

/**
 * Save onboarding settings to database
 */
export async function updateOnboardingSettings(
  settings: OnboardingFormData
): Promise<void> {
  await saveUserSettings(settings);
}

/**
 * Save personalization settings to database
 */
export async function updatePersonalizationSettings(
  settings: PersonalizationFormData
): Promise<void> {
  await savePersonalizationSettings(settings);
}

/**
 * Save onboarding progress (current step)
 */
export async function updateOnboardingProgress(
  currentStep: number,
  isCompleted: boolean = false
): Promise<void> {
  await saveOnboardingProgress({
    currentStep,
    totalSteps: 7,
    isCompleted,
    completedAt: isCompleted ? new Date() : undefined,
  });
}

/**
 * Load licences for the user
 */
export async function loadLicences(): Promise<Licence[]> {
  return await getLicences();
}

/**
 * Helper function to parse time in HH:MM format to minutes
 */
function parseTimeToMinutes(timeStr: string): number | null {
  if (!timeStr) return null;
  const parts = timeStr.split(":");
  if (parts.length !== 2) return null;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

/**
 * Add a new licence
 */
export async function addLicence(data: {
  licenceType: string;
  licenceCategory: string;
  authority: string;
  licenceNumber: string;
  dateOfIssue: string;
  validUntil: string;
  totalHours: string;
  totalLandings: string;
  picHours: string;
  instructorHours: string;
  recencyMonths: string;
  recencyStartDate: string;
  recencyEndDate: string;
}): Promise<Licence> {
  return await saveLicence({
    licenceType: data.licenceType,
    licenceCategory: data.licenceCategory,
    authority: data.authority,
    licenceNumber: data.licenceNumber || null,
    dateOfIssue: data.dateOfIssue ? new Date(data.dateOfIssue) : null,
    validUntil: data.validUntil ? new Date(data.validUntil) : null,
    totalHours: parseTimeToMinutes(data.totalHours),
    totalLandings: data.totalLandings ? parseInt(data.totalLandings, 10) : null,
    picHours: parseTimeToMinutes(data.picHours),
    instructorHours: parseTimeToMinutes(data.instructorHours),
    recencyMonths: data.recencyMonths ? parseInt(data.recencyMonths, 10) : null,
    recencyStartDate: data.recencyStartDate ? new Date(data.recencyStartDate) : null,
    recencyEndDate: data.recencyEndDate ? new Date(data.recencyEndDate) : null,
    isActive: true,
  });
}

/**
 * Remove a licence
 */
export async function removeLicence(licenceId: number): Promise<void> {
  await deleteLicence(licenceId);
}
