"use client";

import { useState, useEffect, useTransition } from "react";
import { OnboardingSettings } from "@/components/onboarding/OnboardingSettings";
import { OnboardingStep2, type PersonalizationData } from "@/components/onboarding/OnboardingStep2";
import {
  loadOnboardingData,
  updateOnboardingSettings,
  updatePersonalizationSettings,
  updateOnboardingProgress,
  type OnboardingFormData,
} from "./actions";

/**
 * Multi-step onboarding flow for new users to configure their logbook
 * Handles aviation authority selection, duration format, timezone, and other initial settings
 * Persists data in Neon Postgres database
 */
export default function OnboardingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<OnboardingFormData>({
    authority: "FAA",
    authorityName: "Federal Aviation Administration - USA",
    decimalFormat: true,
    timezone: "UTC",
  });
  const [personalizationData, setPersonalizationData] = useState<PersonalizationData>({
    language: "en-GB",
    languageName: "English (UK)",
    primaryColor: "#9333ea",
    appearance: "dark",
  });

  // Load saved data on mount
  useEffect(() => {
    loadOnboardingData().then((data) => {
      if (data.settings) {
        setFormData(data.settings);
      }
      if (data.personalization) {
        setPersonalizationData(data.personalization);
      }
      if (data.progress && !data.progress.isCompleted) {
        setCurrentStep(data.progress.currentStep);
      }
      setIsLoading(false);
    });
  }, []);

  const handleContinue = () => {
    if (currentStep < 8) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);

      // Save progress
      startTransition(() => {
        updateOnboardingProgress(nextStep, false);
      });
    } else {
      // Complete onboarding
      console.log("Onboarding complete:", formData);

      startTransition(() => {
        updateOnboardingProgress(8, true);
      });

      // TODO: Redirect to dashboard
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);

      // Save progress
      startTransition(() => {
        updateOnboardingProgress(prevStep, false);
      });
    }
  };

  const updateFormData = (updates: Partial<OnboardingFormData>) => {
    const newFormData = { ...formData, ...updates };
    setFormData(newFormData);

    // Save to database
    startTransition(() => {
      updateOnboardingSettings(newFormData);
    });
  };

  const updatePersonalization = (updates: Partial<PersonalizationData>) => {
    const newData = { ...personalizationData, ...updates };
    setPersonalizationData(newData);

    // Save to database
    startTransition(() => {
      updatePersonalizationSettings(newData);
    });
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      {isLoading ? (
        <div className="text-white">Loading...</div>
      ) : (
        <>
          {currentStep === 0 && (
            <OnboardingSettings
              formData={formData}
              updateFormData={updateFormData}
              onContinue={handleContinue}
              currentStep={currentStep}
              totalSteps={9}
            />
          )}
          {currentStep === 1 && (
            <OnboardingStep2
              formData={personalizationData}
              updateFormData={updatePersonalization}
              onContinue={handleContinue}
              onBack={handleBack}
              currentStep={currentStep}
              totalSteps={9}
            />
          )}
        </>
      )}
    </div>
  );
}
