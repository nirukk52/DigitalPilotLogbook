"use client";

import { useState } from "react";
import { AuthoritySelector } from "@/components/onboarding/AuthoritySelector";
import { OnboardingSettings } from "@/components/onboarding/OnboardingSettings";

/**
 * Multi-step onboarding flow for new users to configure their logbook
 * Handles aviation authority selection, duration format, timezone, and other initial settings
 */
export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    authority: "FAA",
    authorityName: "Federal Aviation Administration - USA",
    decimalFormat: true,
    timezone: "UTC",
  });

  const handleContinue = () => {
    if (currentStep < 8) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      console.log("Onboarding complete:", formData);
      // TODO: Save settings and redirect to dashboard
    }
  };

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData({ ...formData, ...updates });
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      {currentStep === 0 && (
        <OnboardingSettings
          formData={formData}
          updateFormData={updateFormData}
          onContinue={handleContinue}
          currentStep={currentStep}
          totalSteps={9}
        />
      )}
      {/* Additional steps will be rendered here */}
    </div>
  );
}
