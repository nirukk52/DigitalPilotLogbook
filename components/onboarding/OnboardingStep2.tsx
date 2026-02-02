"use client";

import { useState } from "react";

/**
 * Available languages for the application
 * Each language has a code, display name, and flag emoji
 */
const LANGUAGES = [
  { code: "en-GB", name: "English (UK)", flag: "🇬🇧" },
  { code: "en-US", name: "English (US)", flag: "🇺🇸" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "nl", name: "Nederlands", flag: "🇳🇱" },
];

/**
 * Available primary colors for the app theme
 * Purple is the default brand color
 */
const PRIMARY_COLORS = [
  { name: "Purple", value: "#9333ea" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#22c55e" },
  { name: "Orange", value: "#f97316" },
  { name: "Pink", value: "#ec4899" },
  { name: "Teal", value: "#14b8a6" },
];

/**
 * Available appearance modes
 */
const APPEARANCE_MODES = [
  { code: "dark", name: "Dark" },
  { code: "light", name: "Light" },
  { code: "system", name: "System" },
];

export interface PersonalizationData {
  language: string;
  languageName: string;
  primaryColor: string;
  appearance: string;
}

interface OnboardingStep2Props {
  formData: PersonalizationData;
  updateFormData: (updates: Partial<PersonalizationData>) => void;
  onContinue: () => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
}

/**
 * Onboarding step 2 - Personalize Your Experience
 * Allows users to select language, primary color, and appearance mode
 */
export function OnboardingStep2({
  formData,
  updateFormData,
  onContinue,
  onBack,
  currentStep,
  totalSteps,
}: OnboardingStep2Props) {
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showAppearanceSelector, setShowAppearanceSelector] = useState(false);

  const currentLanguage = LANGUAGES.find((l) => l.code === formData.language) || LANGUAGES[0];
  const currentAppearance = APPEARANCE_MODES.find((m) => m.code === formData.appearance) || APPEARANCE_MODES[0];

  const handleLanguageSelect = (code: string, name: string) => {
    updateFormData({ language: code, languageName: name });
    setShowLanguageSelector(false);
  };

  const handleColorSelect = (color: string) => {
    updateFormData({ primaryColor: color });
    setShowColorPicker(false);
  };

  const handleAppearanceSelect = (mode: string) => {
    updateFormData({ appearance: mode });
    setShowAppearanceSelector(false);
  };

  return (
    <>
      <div className="w-full max-w-md mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-white italic">
            Personalize Your Experience
          </h1>
          <p className="text-slate-400 text-base">
            Customize your preferences to make the app truly yours.
          </p>
        </div>

        {/* Settings List */}
        <div className="space-y-0">
          {/* Language Selector */}
          <button
            onClick={() => setShowLanguageSelector(true)}
            className="w-full flex items-center justify-between py-4 border-b border-[#2a2a2a] hover:bg-[#1a1a1a] transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{currentLanguage.flag}</span>
              <div className="text-left">
                <div className="text-white font-semibold">{currentLanguage.name}</div>
                <div className="text-slate-500 text-sm">Application language</div>
              </div>
            </div>
          </button>

          {/* Primary Color Selector */}
          <button
            onClick={() => setShowColorPicker(true)}
            className="w-full flex items-center justify-between py-4 border-b border-[#2a2a2a] hover:bg-[#1a1a1a] transition-colors"
          >
            <div className="text-left">
              <div className="text-white font-semibold">Primary color</div>
              <div className="text-slate-500 text-sm">Color scheme</div>
            </div>
            <div
              className="w-12 h-12 rounded-lg"
              style={{ backgroundColor: formData.primaryColor }}
            />
          </button>

          {/* Appearance Selector */}
          <button
            onClick={() => setShowAppearanceSelector(true)}
            className="w-full flex items-center justify-between py-4 hover:bg-[#1a1a1a] transition-colors"
          >
            <div className="text-left">
              <div className="text-white font-semibold">{currentAppearance.name}</div>
              <div className="text-slate-500 text-sm">Appearance</div>
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
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

      {/* Language Selector Modal */}
      {showLanguageSelector && (
        <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50">
          <div className="w-full max-w-md bg-[#1a1a1a] rounded-t-3xl p-6 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Select Language</h2>
              <button
                onClick={() => setShowLanguageSelector(false)}
                className="text-slate-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageSelect(lang.code, lang.name)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl transition-colors ${
                    formData.language === lang.code
                      ? "bg-[#9333ea] text-white"
                      : "bg-[#2a2a2a] text-white hover:bg-[#3a3a3a]"
                  }`}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="font-medium">{lang.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Color Picker Modal */}
      {showColorPicker && (
        <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50">
          <div className="w-full max-w-md bg-[#1a1a1a] rounded-t-3xl p-6 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Primary Color</h2>
              <button
                onClick={() => setShowColorPicker(false)}
                className="text-slate-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {PRIMARY_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => handleColorSelect(color.value)}
                  className={`aspect-square rounded-xl transition-all ${
                    formData.primaryColor === color.value
                      ? "ring-2 ring-white ring-offset-2 ring-offset-[#1a1a1a]"
                      : ""
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Appearance Selector Modal */}
      {showAppearanceSelector && (
        <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50">
          <div className="w-full max-w-md bg-[#1a1a1a] rounded-t-3xl p-6 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Appearance</h2>
              <button
                onClick={() => setShowAppearanceSelector(false)}
                className="text-slate-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-2">
              {APPEARANCE_MODES.map((mode) => (
                <button
                  key={mode.code}
                  onClick={() => handleAppearanceSelect(mode.code)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl transition-colors ${
                    formData.appearance === mode.code
                      ? "bg-[#9333ea] text-white"
                      : "bg-[#2a2a2a] text-white hover:bg-[#3a3a3a]"
                  }`}
                >
                  <span className="font-medium">{mode.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
