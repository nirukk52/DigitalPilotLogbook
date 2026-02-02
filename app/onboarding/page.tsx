"use client";

import { useState, useEffect, useTransition } from "react";
import { OnboardingSettings } from "@/components/onboarding/OnboardingSettings";
import { OnboardingStep2, type PersonalizationData } from "@/components/onboarding/OnboardingStep2";
import { OnboardingStep3, type LicenceFormData } from "@/components/onboarding/OnboardingStep3";
import { OnboardingStep4 } from "@/components/onboarding/OnboardingStep4";
import { OnboardingStep5 } from "@/components/onboarding/OnboardingStep5";
import { OnboardingStep6 } from "@/components/onboarding/OnboardingStep6";
import { OnboardingStep7 } from "@/components/onboarding/OnboardingStep7";
import { useRouter } from "next/navigation";
import type { Licence } from "@/lib/db/schema";
import {
  loadOnboardingData,
  updateOnboardingSettings,
  updatePersonalizationSettings,
  updateOnboardingProgress,
  loadLicences,
  addLicence,
  removeLicence,
  type OnboardingFormData,
} from "./actions";

/**
 * Multi-step onboarding flow for new users to configure their logbook
 * Handles aviation authority selection, duration format, timezone, and other initial settings
 * Persists data in Neon Postgres database
 */
export default function OnboardingPage() {
  const router = useRouter();
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
  const [licences, setLicences] = useState<Licence[]>([]);

  // Load saved data on mount
  useEffect(() => {
    Promise.all([loadOnboardingData(), loadLicences()]).then(([data, licencesData]) => {
      if (data.settings) {
        setFormData(data.settings);
      }
      if (data.personalization) {
        setPersonalizationData(data.personalization);
      }
      if (data.progress) {
        if (data.progress.isCompleted) {
          // Already completed, redirect to app
          router.push("/overview");
          return;
        }
        // Clamp step to valid range (0-6)
        const validStep = Math.min(Math.max(data.progress.currentStep, 0), 6);
        setCurrentStep(validStep);
      }
      setLicences(licencesData);
      setIsLoading(false);
    });
  }, [router]);

  const handleContinue = () => {
    if (currentStep < 6) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);

      // Save progress
      startTransition(() => {
        updateOnboardingProgress(nextStep, false);
      });
    } else {
      // Complete onboarding and redirect to home
      startTransition(() => {
        updateOnboardingProgress(6, true);
      });

      router.push("/overview");
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

  const handleAddLicence = async (licenceData: LicenceFormData) => {
    const newLicence = await addLicence(licenceData);
    setLicences([...licences, newLicence]);
  };

  const handleDeleteLicence = async (licenceId: number) => {
    await removeLicence(licenceId);
    setLicences(licences.filter((l) => l.id !== licenceId));
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
              totalSteps={7}
            />
          )}
          {currentStep === 1 && (
            <OnboardingStep2
              formData={personalizationData}
              updateFormData={updatePersonalization}
              onContinue={handleContinue}
              onBack={handleBack}
              currentStep={currentStep}
              totalSteps={7}
            />
          )}
          {currentStep === 2 && (
            <OnboardingStep3
              licences={licences}
              onContinue={handleContinue}
              onBack={handleBack}
              onAddLicence={handleAddLicence}
              onDeleteLicence={handleDeleteLicence}
              currentStep={currentStep}
              totalSteps={7}
            />
          )}
          {currentStep === 3 && (
            <OnboardingStep4
              onContinue={handleContinue}
              onBack={handleBack}
              currentStep={currentStep}
              totalSteps={7}
            />
          )}
          {currentStep === 4 && (
            <OnboardingStep5
              onContinue={handleContinue}
              onBack={handleBack}
              currentStep={currentStep}
              totalSteps={7}
            />
          )}
          {currentStep === 5 && (
            <OnboardingStep6
              onContinue={handleContinue}
              onBack={handleBack}
              currentStep={currentStep}
              totalSteps={7}
            />
          )}
          {currentStep === 6 && (
            <OnboardingStep7
              onContinue={handleContinue}
              onBack={handleBack}
              currentStep={currentStep}
              totalSteps={7}
            />
          )}
        </>
      )}
    </div>
  );
}
