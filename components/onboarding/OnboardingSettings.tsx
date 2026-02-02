"use client";

import { useState } from "react";
import { AuthoritySelector } from "./AuthoritySelector";

interface OnboardingSettingsProps {
  formData: {
    authority: string;
    authorityName: string;
    decimalFormat: boolean;
    timezone: string;
  };
  updateFormData: (updates: Partial<OnboardingSettingsProps["formData"]>) => void;
  onContinue: () => void;
  currentStep: number;
  totalSteps: number;
}

/**
 * Initial onboarding screen for logbook configuration
 * Allows users to select aviation authority, duration format, and timezone
 */
export function OnboardingSettings({
  formData,
  updateFormData,
  onContinue,
  currentStep,
  totalSteps,
}: OnboardingSettingsProps) {
  const [showAuthoritySelector, setShowAuthoritySelector] = useState(false);

  const handleAuthoritySelect = (code: string, name: string) => {
    updateFormData({ authority: code, authorityName: name });
    setShowAuthoritySelector(false);
  };

  return (
    <>
      <div className="w-full max-w-md mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-white">Set Up Your Logbook</h1>
          <p className="text-slate-400 text-base">
            Start by customizing your logbook to match your needs.
          </p>
        </div>

        {/* Settings Card */}
        <div className="space-y-6">
          {/* Aviation Authority Selector */}
          <button
            onClick={() => setShowAuthoritySelector(true)}
            className="w-full flex items-center justify-between p-4 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                <span className="text-2xl font-bold text-slate-800">
                  {formData.authority}
                </span>
              </div>
              <div className="text-left">
                <div className="text-white font-semibold">{formData.authority}</div>
                <div className="text-slate-400 text-sm">{formData.authorityName}</div>
              </div>
            </div>
            <svg
              className="w-5 h-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Decimal Duration Format Toggle */}
          <div className="p-4 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-semibold">Decimal duration format</div>
                <div className="text-slate-400 text-sm">
                  Use decimal duration format (1.5 vs 1:30)
                </div>
              </div>
              <button
                onClick={() => updateFormData({ decimalFormat: !formData.decimalFormat })}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  formData.decimalFormat ? "bg-green-500" : "bg-[#2a2a2a]"
                }`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    formData.decimalFormat ? "right-1" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Timezone Selector */}
          <div className="p-4 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-semibold">Timezone</div>
                <div className="text-slate-400 text-sm">Default timezone</div>
              </div>
              <div className="text-white font-mono">{formData.timezone}</div>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={onContinue}
          className="w-full bg-[#e4b5ff] hover:bg-[#d9a3f5] text-black font-semibold py-4 rounded-full transition-colors flex items-center justify-center gap-2"
        >
          Continue
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </button>

        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentStep ? "bg-white" : "bg-[#2a2a2a]"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Authority Selector Modal */}
      {showAuthoritySelector && (
        <AuthoritySelector
          onSelect={handleAuthoritySelect}
          onClose={() => setShowAuthoritySelector(false)}
          currentAuthority={formData.authority}
        />
      )}
    </>
  );
}
