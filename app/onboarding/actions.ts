"use server";

/**
 * Server actions for onboarding flow
 * Handles database operations for user settings and progress
 */
import {
  getUserSettings,
  saveUserSettings,
  getOnboardingProgress,
  saveOnboardingProgress,
} from "@/lib/db/queries";

export interface OnboardingFormData {
  authority: string;
  authorityName: string;
  decimalFormat: boolean;
  timezone: string;
}

/**
 * Load saved onboarding data from database
 */
export async function loadOnboardingData(): Promise<{
  settings: OnboardingFormData | null;
  progress: { currentStep: number; isCompleted: boolean } | null;
}> {
  const [settings, progress] = await Promise.all([
    getUserSettings(),
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
 * Save onboarding progress (current step)
 */
export async function updateOnboardingProgress(
  currentStep: number,
  isCompleted: boolean = false
): Promise<void> {
  await saveOnboardingProgress({
    currentStep,
    totalSteps: 9,
    isCompleted,
    completedAt: isCompleted ? new Date() : undefined,
  });
}
